const db = require('../config/db');
async function run() {
    try {
        await db.query("UPDATE configuracion_general SET moneda = '$' WHERE id = 1");
        console.log('✅ Moneda actualizada a Pesos ($)');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
