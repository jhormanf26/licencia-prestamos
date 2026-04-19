const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'Kj$8LmpP@qZ1xV#9RtW&3Nf*cYuTbE^2oSvA!';

/**
 * POST /api/activacion
 * Llamado por el sistema cliente cada vez que arranca con una licencia válida.
 * Registra la IP, servidor y empresa en historial_activaciones.
 */
router.post('/activacion', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ ok: false, mensaje: 'Token requerido.' });
        }

        // 1. Verificar el token JWT
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch(e) {
            return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado.' });
        }

        const empresa_id = decoded.empresa_id;
        if (!empresa_id) {
            return res.status(400).json({ ok: false, mensaje: 'Token sin empresa_id.' });
        }

        // 2. Capturar datos de origen
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'desconocida';
        const servidor = req.body.servidor || req.hostname;

        // 3. Buscar la licencia más reciente ACTIVA para esta empresa
        const [lics] = await db.query(
            "SELECT id FROM licencias_emitidas WHERE empresa_id = ? AND estado = 'Activa' ORDER BY id DESC LIMIT 1",
            [empresa_id]
        );
        const licencia_id = lics.length > 0 ? lics[0].id : null;

        // 4. Registrar siempre la activación en el historial (para auditoría)
        await db.query(
            'INSERT INTO historial_activaciones (empresa_id, licencia_id, ip, servidor, fecha) VALUES (?, ?, ?, ?, NOW())',
            [empresa_id, licencia_id, ip, servidor]
        );

        // 5. Validar si se encontró una licencia activa
        if (!licencia_id) {
            return res.status(403).json({ 
                ok: false, 
                mensaje: 'La licencia para esta empresa se encuentra suspendida, vencida o no existe en el panel.' 
            });
        }

        res.json({ ok: true, mensaje: 'Activación registrada y licencia válida.' });

    } catch(e) {
        console.error('[API Activacion Error]', e.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
});

/**
 * GET /api/status
 * Verificar que el panel está activo (para health-check del cliente)
 */
router.get('/status', (req, res) => {
    res.json({ ok: true, panel: 'Panel de Licencias', version: '1.0.0' });
});

module.exports = router;
