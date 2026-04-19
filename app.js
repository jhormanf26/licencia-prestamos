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

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.admin = req.session.admin || null;
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
