CREATE DATABASE IF NOT EXISTS licencia_prestamos_db;
USE licencia_prestamos_db;

-- Drop old tables if running reset
DROP TABLE IF EXISTS historial_activaciones;
DROP TABLE IF EXISTS pagos_licencias;
DROP TABLE IF EXISTS licencias_emitidas;
DROP TABLE IF EXISTS empresas;
DROP TABLE IF EXISTS usuarios_admin;

CREATE TABLE usuarios_admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(150) DEFAULT 'Super Administrador',
    rol VARCHAR(50) DEFAULT 'Admin',
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    ruc VARCHAR(20) NOT NULL UNIQUE,
    responsable VARCHAR(150),
    email VARCHAR(150),
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE licencias_emitidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    precio DECIMAL(10,2) DEFAULT 0.00,
    estado ENUM('Activa', 'Suspendida', 'Vencida') DEFAULT 'Activa',
    notas TEXT,
    token_generado VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE pagos_licencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    licencia_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(100),
    referencia VARCHAR(255),
    fecha_pago DATE,
    estado ENUM('Pendiente', 'Pagado', 'Anulado') DEFAULT 'Pendiente',
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (licencia_id) REFERENCES licencias_emitidas(id) ON DELETE CASCADE
);

CREATE TABLE historial_activaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    licencia_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(45),
    servidor VARCHAR(100),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (licencia_id) REFERENCES licencias_emitidas(id) ON DELETE SET NULL
);

-- Usuario por defecto (admin / admin123)
INSERT INTO usuarios_admin (username, password_hash) 
VALUES ('admin', '$2b$10$PCLCE68Tworas8acqbiKHe1eaKd4jLs/xbjVJWoOenXVV8aKVbFNu');

-- Insertar empresa de prueba
INSERT INTO empresas (razon_social, ruc, responsable, email) 
VALUES ('EMPRESA 1', '20202020201', 'JULIO', 'empresa1@correo.com');

