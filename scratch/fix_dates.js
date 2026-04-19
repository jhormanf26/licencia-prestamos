const db = require('../config/db');
async function run() {
    try {
        await db.query("UPDATE pagos_licencias SET fecha_pago = CURDATE() WHERE fecha_pago IS NULL");
        console.log('✅ Fechas corregidas');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
