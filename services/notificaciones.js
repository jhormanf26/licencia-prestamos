const nodemailer = require('nodemailer');
const cron = require('node-cron');
const db = require('../config/db');

// ─── Configuración del transportador de email ─────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ─── Función para enviar email de alerta ─────────────────────────────────────
async function enviarAlertaVencimiento(empresa, licencia, diasRestantes) {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'tu_correo@gmail.com') {
        console.log(`[NOTIF] Sin email configurado. Licencia #${licencia.id} de ${empresa.razon_social} vence en ${diasRestantes} días.`);
        return;
    }

    const emailDestino = empresa.email;
    if (!emailDestino) {
        console.log(`[NOTIF] Empresa ${empresa.razon_social} no tiene email registrado.`);
        return;
    }

    const asunto = `⚠️ Tu licencia vence en ${diasRestantes} día(s) — Sistema de Préstamos Pro`;

    const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">⚠️ Aviso de Vencimiento de Licencia</h1>
            <p style="color: #94a3b8; margin: 8px 0 0;">Sistema de Préstamos y Cobranza</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 16px; color: #334155;">Estimado/a <strong>${empresa.razon_social}</strong>,</p>
            <div style="background: ${diasRestantes <= 3 ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${diasRestantes <= 3 ? '#ef4444' : '#f59e0b'}; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-size: 15px; color: #1e293b;">
                    Su licencia <strong>${licencia.tipo}</strong> vence el 
                    <strong>${new Date(licencia.fecha_vencimiento).toLocaleDateString('es-PE')}</strong>.<br>
                    Le quedan <strong style="font-size: 20px; color: ${diasRestantes <= 3 ? '#dc2626' : '#d97706'};">${diasRestantes} día(s)</strong>.
                </p>
            </div>
            <p style="color: #64748b; font-size: 14px;">Para renovar su licencia contáctese con su proveedor y solicite un nuevo token de activación.</p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">Este es un mensaje automático del Panel de Licencias. Por favor no responda este correo.</p>
        </div>
    </div>`;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Panel Licencias" <notificaciones@sistema.com>',
            to: emailDestino,
            subject: asunto,
            html: htmlBody
        });
        console.log(`[NOTIF ✅] Email enviado a ${emailDestino} — Licencia #${licencia.id} vence en ${diasRestantes} días`);
    } catch (err) {
        console.error(`[NOTIF ❌] Error enviando a ${emailDestino}:`, err.message);
    }
}

// ─── Cron: revisar licencias diariamente a las 8:00 AM ───────────────────────
function iniciarCronNotificaciones() {
    cron.schedule('0 8 * * *', async () => {
        console.log('[CRON] Sincronizando estados y revisando vencimientos...');

        try {
            // 1. Marcar como Vencidas las que ya pasaron la fecha
            await db.query('UPDATE licencias_emitidas SET estado = "Vencida" WHERE estado = "Activa" AND fecha_vencimiento < CURDATE()');
            // Buscar licencias con 1, 3 o 7 días de vencimiento
            const [licencias] = await db.query(`
                SELECT l.id, l.tipo, l.fecha_vencimiento, l.empresa_id,
                       e.razon_social, e.email,
                       DATEDIFF(l.fecha_vencimiento, CURDATE()) as dias_restantes
                FROM licencias_emitidas l
                JOIN empresas e ON l.empresa_id = e.id
                WHERE l.estado = 'Activa'
                  AND l.fecha_vencimiento IS NOT NULL
                  AND DATEDIFF(l.fecha_vencimiento, CURDATE()) IN (7, 3, 1)
            `);

            if (licencias.length === 0) {
                console.log('[CRON] Sin licencias próximas a vencer hoy.');
                return;
            }

            for (const lic of licencias) {
                const empresa = { razon_social: lic.razon_social, email: lic.email };
                await enviarAlertaVencimiento(empresa, lic, lic.dias_restantes);
            }

            console.log(`[CRON] Revisión completada. ${licencias.length} alertas procesadas.`);
        } catch (err) {
            console.error('[CRON ❌] Error en revisión de licencias:', err.message);
        }
    }, { timezone: 'America/Lima' });

    console.log('[CRON ✅] Notificaciones programadas: diariamente 8:00 AM (Lima)');
}

module.exports = { iniciarCronNotificaciones, enviarAlertaVencimiento };
