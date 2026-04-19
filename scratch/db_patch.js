const mysql = require('../config/db');

async function setup() {
    try {
        await mysql.query(`
            CREATE TABLE IF NOT EXISTS configuracion_general (
                id INT PRIMARY KEY DEFAULT 1,
                nombre_proveedor VARCHAR(255) DEFAULT 'Sistema Préstamos Pro',
                moneda VARCHAR(50) DEFAULT 'S/',
                dias_alerta INT DEFAULT 30,
                precio_demo DECIMAL(10,2) DEFAULT 0.00
            )
        `);
        
        const [rows] = await mysql.query('SELECT * FROM configuracion_general WHERE id = 1');
        if (rows.length === 0) {
            await mysql.query('INSERT INTO configuracion_general (id) VALUES (1)');
        }
        
        console.log('✅ Tabla configuracion_general creada y poblada');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating table:', err.message);
        process.exit(1);
    }
}

setup();
