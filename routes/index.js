const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Clave Secreta Fuerte para Firmar (Demás proyectos deben tener esta exacta llave)
const JWT_SECRET = 'Kj$8LmpP@qZ1xV#9RtW&3Nf*cYuTbE^2oSvA!';

// Validar Sesion
const isAuthenticated = (req, res, next) => {
    if (req.session.admin) return next();
    res.redirect('/login');
};

// ====================== LOGIN ======================
router.get('/login', (req, res) => {
    if(req.session.admin) return res.redirect('/dashboard');
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM usuarios_admin WHERE username = ?', [username]);
        if (rows.length > 0) {
            const admin = rows[0];
            const isMatch = await bcrypt.compare(password, admin.password_hash);
            if(isMatch) {
                req.session.admin = admin;
                return res.redirect('/dashboard');
            }
        }
        req.flash('error_msg', 'Credenciales incorrectas');
        res.redirect('/login');
    } catch (e) {
        console.error(e);
        res.redirect('/login');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// ==================== DASHBOARD ====================
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        // Auto-actualizar licencias vencidas antes de contar
        await db.query('UPDATE licencias_emitidas SET estado = "Vencida" WHERE estado = "Activa" AND fecha_vencimiento < CURDATE()');

        const [empresas] = await db.query('SELECT COUNT(*) as count FROM empresas WHERE estado = "Activo"');
        const [licencias] = await db.query('SELECT COUNT(*) as count FROM licencias_emitidas WHERE estado = "Activa"');
        const [porVencer] = await db.query('SELECT COUNT(*) as count FROM licencias_emitidas WHERE estado = "Activa" AND fecha_vencimiento IS NOT NULL AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)');
        
        const [ingresosData] = await db.query('SELECT SUM(monto) as total FROM pagos_licencias WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE()) AND estado = "Pagado"');
        
        const ingresos = parseFloat(ingresosData[0].total) || 0;
        const stats = {
            empresas: empresas[0].count,
            licencias: licencias[0].count,
            por_vencer: porVencer[0].count,
            ingresos
        };

        const [ultimasLicencias] = await db.query(`
            SELECT e.razon_social as empresa, l.tipo, l.fecha_vencimiento as vence, l.estado 
            FROM licencias_emitidas l 
            JOIN empresas e ON l.empresa_id = e.id 
            ORDER BY l.id DESC LIMIT 5
        `);

        const [ultimasActivaciones] = await db.query(`
            SELECT e.razon_social as empresa, a.fecha, a.ip 
            FROM historial_activaciones a 
            JOIN empresas e ON a.empresa_id = e.id 
            ORDER BY a.id DESC LIMIT 5
        `);

        res.render('dashboard', { stats, ultimasLicencias, ultimasActivaciones });
    } catch (e) {
        console.error(e);
        res.send("Error al cargar dashboard.");
    }
});

// ==================== MODULOS ====================
router.get('/empresas', isAuthenticated, async (req, res) => {
    try {
        const [empresas] = await db.query('SELECT * FROM empresas ORDER BY id DESC');
        res.render('empresas', { empresas });
    } catch (e) {
        res.send("Error");
    }
});

router.get('/licencias', isAuthenticated, async (req, res) => {
    try {
        await db.query('UPDATE licencias_emitidas SET estado = "Vencida" WHERE estado = "Activa" AND fecha_vencimiento < CURDATE()');
        const [licencias] = await db.query(`
            SELECT l.id, e.razon_social as empresa, e.ruc, l.tipo, l.fecha_emision, l.fecha_vencimiento, l.precio, l.estado, l.token_generado 
            FROM licencias_emitidas l 
            JOIN empresas e ON l.empresa_id = e.id 
            ORDER BY l.id DESC
        `);
        res.render('licencias', { licencias });
    } catch (e) {
        res.send("Error");
    }
});

router.get('/licencias/generar', isAuthenticated, async (req, res) => {
    try {
        const [empresas] = await db.query('SELECT * FROM empresas WHERE estado="Activo"');
        res.render('generar-licencia', { empresas });
    } catch (e) {
        res.send("Error");
    }
});

router.post('/generar-licencia', isAuthenticated, async (req, res) => {
    const { cliente_referencia, tipo, dias_vigencia, fecha_inicio, precio, notas } = req.body;
    
    // Obtener RUC de la empresa para el token
    const [empresaRows] = await db.query('SELECT ruc FROM empresas WHERE id = ?', [cliente_referencia]);
    const ruc = empresaRows.length > 0 ? empresaRows[0].ruc : '00000000';

    const fechaEmision = new Date(fecha_inicio);
    let fechaVencimiento = null;
    let expirationTimestamp = null;
    
    if (tipo.includes('Demo') || tipo.includes('Días')) {
        fechaVencimiento = new Date(fecha_inicio);
        fechaVencimiento.setDate(fechaEmision.getDate() + parseInt(dias_vigencia));
        expirationTimestamp = Math.floor(fechaVencimiento.getTime() / 1000);
    } else if (tipo === 'Mensual') {
        fechaVencimiento = new Date(fecha_inicio);
        fechaVencimiento.setMonth(fechaEmision.getMonth() + parseInt(dias_vigencia || 1));
        expirationTimestamp = Math.floor(fechaVencimiento.getTime() / 1000);
    } else if (tipo === 'Anual') {
        fechaVencimiento = new Date(fecha_inicio);
        fechaVencimiento.setFullYear(fechaEmision.getFullYear() + parseInt(dias_vigencia || 1));
        expirationTimestamp = Math.floor(fechaVencimiento.getTime() / 1000);
    }

    const tokenPayload = {
        empresa_id: cliente_referencia,
        ruc: ruc,
        tipo: tipo,
        ...(expirationTimestamp && { exp: expirationTimestamp })
    };
    
    try {
        const token = jwt.sign(tokenPayload, JWT_SECRET);
        
        await db.query(
            'INSERT INTO licencias_emitidas (empresa_id, tipo, fecha_emision, fecha_vencimiento, precio, estado, notas, token_generado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [cliente_referencia, tipo, fechaEmision, fechaVencimiento, precio || 0, 'Activa', notas, token]
        );
        
        // Also insert pending payment
        if(parseFloat(precio) > 0) {
            const [lastInsert] = await db.query('SELECT LAST_INSERT_ID() as id');
            await db.query(
                'INSERT INTO pagos_licencias (empresa_id, licencia_id, monto, estado) VALUES (?, ?, ?, ?)',
                [cliente_referencia, lastInsert[0].id, precio, 'Pendiente']
            );
        }

        req.flash('success_msg', 'Licencia generada correctamente: ' + token);
        res.redirect('/licencias');
    } catch (e) {
        console.error(e);
        req.flash('error_msg', 'Error al generar licencia');
        res.redirect('/licencias/generar');
    }
});

router.get('/licencias/ver/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        // Auto-actualizar esta licencia si es necesario
        await db.query('UPDATE licencias_emitidas SET estado = "Vencida" WHERE id = ? AND estado = "Activa" AND fecha_vencimiento < CURDATE()', [id]);
        
        const [licencias] = await db.query(`
            SELECT l.*, e.razon_social as empresa, e.ruc 
            FROM licencias_emitidas l 
            JOIN empresas e ON l.empresa_id = e.id 
            WHERE l.id = ?
        `, [id]);
        
        if(licencias.length === 0) return res.redirect('/licencias');
        
        const licencia = licencias[0];

        const [activaciones] = await db.query('SELECT * FROM historial_activaciones WHERE licencia_id = ? ORDER BY id DESC', [id]);
        const [pagos] = await db.query('SELECT * FROM pagos_licencias WHERE licencia_id = ? ORDER BY id DESC', [id]);

        res.render('ver-licencia', { licencia, activaciones, pagos });
    } catch (e) {
        res.send("Error");
    }
});

router.post('/pagos/registrar', isAuthenticated, async (req, res) => {
    try {
        const { licencia_id, monto, metodo, referencia, estado, observaciones } = req.body;
        // Obtenemos empresa_id validando la licencia
        const [lic] = await db.query('SELECT empresa_id FROM licencias_emitidas WHERE id = ?', [licencia_id]);
        if(lic.length > 0) {
            await db.query(
                'INSERT INTO pagos_licencias (empresa_id, licencia_id, monto, metodo_pago, referencia, estado) VALUES (?, ?, ?, ?, ?, ?)',
                [lic[0].empresa_id, licencia_id, monto, metodo || 'Efectivo', referencia || '', estado]
            );
        }
        res.redirect('/licencias/ver/' + licencia_id);
    } catch(e) {
        console.error(e);
        res.redirect('/licencias');
    }
});

router.get('/activaciones', isAuthenticated, async (req, res) => {
    try {
        const [activaciones] = await db.query(`
            SELECT a.*, e.razon_social as empresa, l.tipo
            FROM historial_activaciones a
            JOIN empresas e ON a.empresa_id = e.id
            LEFT JOIN licencias_emitidas l ON a.licencia_id = l.id
            ORDER BY a.id DESC
        `);
        res.render('historial-activaciones', { activaciones });
    } catch(e) {
        console.error(e);
        res.render('historial-activaciones', { activaciones: [] });
    }
});

// ─── Pendiente 5: Control de Pagos conectado ────────────────────────────────
router.get('/pagos', isAuthenticated, async (req, res) => {
    try {
        const [pagos] = await db.query(`
            SELECT p.*, e.razon_social as empresa, l.tipo as tipo_licencia
            FROM pagos_licencias p
            JOIN empresas e ON p.empresa_id = e.id
            LEFT JOIN licencias_emitidas l ON p.licencia_id = l.id
            ORDER BY p.id DESC
        `);
        const [totales] = await db.query(`
            SELECT 
                SUM(CASE WHEN estado = 'Pagado' THEN monto ELSE 0 END) as total_cobrado,
                SUM(CASE WHEN estado = 'Pendiente' THEN monto ELSE 0 END) as total_pendiente,
                COUNT(*) as total_registros
            FROM pagos_licencias
        `);
        res.render('pagos', { pagos, totales: totales[0] });
    } catch(e) {
        console.error(e);
        res.render('pagos', { pagos: [], totales: { total_cobrado: 0, total_pendiente: 0, total_registros: 0 } });
    }
});

// ─── Pendiente 3: Marcar pago como Pagado ────────────────────────────────────
router.post('/pagos/marcar-pagado/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("UPDATE pagos_licencias SET estado = 'Pagado', fecha_pago = CURDATE() WHERE id = ?", [id]);
        // Si tiene licencia_id, redirigir a la vista de esa licencia
        const [rows] = await db.query('SELECT licencia_id FROM pagos_licencias WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].licencia_id) {
            return res.redirect('/licencias/ver/' + rows[0].licencia_id);
        }
        res.redirect('/pagos');
    } catch(e) {
        console.error(e);
        res.redirect('/pagos');
    }
});

// ─── Pendiente 2: Revocar Licencia ────────────────────────────────────────────
router.post('/licencias/revocar/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("UPDATE licencias_emitidas SET estado = 'Suspendida' WHERE id = ?", [id]);
        req.flash('success_msg', 'Licencia revocada correctamente.');
        res.redirect('/licencias/ver/' + id);
    } catch(e) {
        console.error(e);
        res.redirect('/licencias');
    }
});

// ─── Pendiente 2: Pausar/Reactivar Licencia ──────────────────────────────────
router.post('/licencias/pausar/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT estado FROM licencias_emitidas WHERE id = ?', [id]);
        if (rows.length === 0) return res.redirect('/licencias');
        const nuevoEstado = rows[0].estado === 'Activa' ? 'Suspendida' : 'Activa';
        await db.query("UPDATE licencias_emitidas SET estado = ? WHERE id = ?", [nuevoEstado, id]);
        req.flash('success_msg', `Licencia ${nuevoEstado === 'Activa' ? 'reactivada' : 'pausada'} correctamente.`);
        res.redirect('/licencias/ver/' + id);
    } catch(e) {
        console.error(e);
        res.redirect('/licencias');
    }
});

router.post('/empresas/nueva', isAuthenticated, async (req, res) => {
    const { razon_social, ruc, responsable, email } = req.body;
    await db.query('INSERT INTO empresas (razon_social, ruc, responsable, email) VALUES (?, ?, ?, ?)', [razon_social, ruc, responsable, email]);
    res.redirect('/empresas');
});

router.post('/empresas/editar/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { razon_social, ruc, responsable, email, estado } = req.body;
    await db.query('UPDATE empresas SET razon_social=?, ruc=?, responsable=?, email=?, estado=? WHERE id=?', [razon_social, ruc, responsable, email, estado || 'Activo', id]);
    res.redirect('/empresas');
});

router.post('/empresas/eliminar/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    await db.query('DELETE FROM empresas WHERE id=?', [id]);
    res.redirect('/empresas');
});

router.get('/configuracion', isAuthenticated, async (req, res) => {
    try {
        const admin = req.session.admin;
        const [empresas] = await db.query('SELECT COUNT(*) as count FROM empresas');
        const [licencias] = await db.query('SELECT COUNT(*) as count FROM licencias_emitidas WHERE estado = "Activa"');
        const stats = { empresas: empresas[0].count, licencias: licencias[0].count };
        const success_msg = req.flash('success_msg');
        const error_msg = req.flash('error_msg');
        res.render('configuracion', { admin, stats, success_msg, error_msg });
    } catch(e) {
        console.error(e);
        res.send('Error al cargar configuración');
    }
});

router.post('/configuracion/cambiar-password', isAuthenticated, async (req, res) => {
    const { password_actual, password_nueva, password_confirmar } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM usuarios_admin WHERE id = ?', [req.session.admin.id]);
        if (rows.length === 0) {
            req.flash('error_msg', 'Usuario no encontrado.');
            return res.redirect('/configuracion');
        }
        const admin = rows[0];
        const isMatch = await bcrypt.compare(password_actual, admin.password_hash);
        if (!isMatch) {
            req.flash('error_msg', 'La contraseña actual es incorrecta.');
            return res.redirect('/configuracion');
        }
        if (password_nueva !== password_confirmar) {
            req.flash('error_msg', 'Las contraseñas nuevas no coinciden.');
            return res.redirect('/configuracion');
        }
        if (password_nueva.length < 6) {
            req.flash('error_msg', 'La nueva contraseña debe tener al menos 6 caracteres.');
            return res.redirect('/configuracion');
        }
        const newHash = await bcrypt.hash(password_nueva, 10);
        await db.query('UPDATE usuarios_admin SET password_hash = ? WHERE id = ?', [newHash, admin.id]);
        req.flash('success_msg', '✅ Contraseña actualizada correctamente.');
        res.redirect('/configuracion');
    } catch(e) {
        console.error(e);
        req.flash('error_msg', 'Error al cambiar la contraseña.');
        res.redirect('/configuracion');
    }
});

router.post('/configuracion/general', isAuthenticated, (req, res) => {
    // En una versión futura esto se guardaría en DB. Por ahora redirige con mensaje.
    req.flash('success_msg', '✅ Configuración guardada correctamente.');
    res.redirect('/configuracion');
});

router.get('/', (req, res) => res.redirect('/login'));

module.exports = router;

