require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

const app = express();
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
    secret: 'secret_key_license_panel',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

app.use(async (req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.admin = req.session.admin || null;
    
    // Cargar Configuración Global
    try {
        const db = require('./config/db');
        const [config] = await db.query('SELECT * FROM configuracion_general WHERE id = 1');
        res.locals.globalConfig = config[0] || { nombre_proveedor: 'Sistema Préstamos Pro', moneda: 'S/', dias_alerta: 30, precio_demo: 0 };
    } catch (e) {
        res.locals.globalConfig = { nombre_proveedor: 'Sistema Préstamos Pro', moneda: 'S/', dias_alerta: 30, precio_demo: 0 };
    }
    
    // Función global para formatear moneda
    res.locals.formatMoney = (amount) => {
        return (res.locals.globalConfig.moneda || '$') + ' ' + 
               Number(amount || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Función para formatear números con puntos de miles
    res.locals.formatNumber = (num) => {
        return Number(num || 0).toLocaleString('es-CO');
    };
    
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', require('./routes/index'));

// ─── API pública para activaciones desde sistemas cliente ────────────────────
app.use('/api', require('./routes/api'));

app.listen(app.get('port'), () => {
    console.log(`✅ Panel Administrativo de Licencias en Puerto ${app.get('port')}`);
    console.log(`💻 Entrar: http://localhost:${app.get('port')}`);

    // Iniciar Cron de Notificaciones de Vencimiento
    const { iniciarCronNotificaciones } = require('./services/notificaciones');
    iniciarCronNotificaciones();
});
