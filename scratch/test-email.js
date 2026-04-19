require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('--- Iniciando prueba de envío de email ---');
    console.log('Configuración:', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER
    });

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 465,
        secure: true, // true para 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter.verify();
        console.log('✅ Conexión con el servidor SMTP establecida correctamente.');

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: 'jhormanfelipef@gmail.com',
            subject: 'Prueba de Diagnóstico - Sistema Licencias',
            text: 'Si recibes esto, la configuración es correcta.',
            html: '<b>Prueba de Diagnóstico</b><p>Si recibes esto, la configuración es correcta.</p>'
        });

        console.log('✅ Email enviado con éxito:', info.messageId);
    } catch (error) {
        console.error('❌ Error detectado:', error);
    }
}

testEmail();
