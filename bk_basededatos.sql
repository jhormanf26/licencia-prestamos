-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         8.4.3 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para licencia_prestamos_db
CREATE DATABASE IF NOT EXISTS `licencia_prestamos_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `licencia_prestamos_db`;

-- Volcando estructura para tabla licencia_prestamos_db.empresas
CREATE TABLE IF NOT EXISTS `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `razon_social` varchar(255) NOT NULL,
  `ruc` varchar(20) NOT NULL,
  `responsable` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `estado` enum('Activo','Inactivo') DEFAULT 'Activo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ruc` (`ruc`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla licencia_prestamos_db.empresas: ~1 rows (aproximadamente)
DELETE FROM `empresas`;
INSERT INTO `empresas` (`id`, `razon_social`, `ruc`, `responsable`, `email`, `estado`, `created_at`) VALUES
	(1, 'EMPRESA 1', '20202020201', 'MARIO', 'empresa1@correo.com', 'Activo', '2026-04-02 06:02:22'),
	(2, 'EMPRESA 2', '20000000001', 'JULIO', 'empresa2@correo.com', 'Activo', '2026-04-02 06:19:32');

-- Volcando estructura para tabla licencia_prestamos_db.historial_activaciones
CREATE TABLE IF NOT EXISTS `historial_activaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `licencia_id` int NOT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(45) DEFAULT NULL,
  `servidor` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  KEY `licencia_id` (`licencia_id`),
  CONSTRAINT `historial_activaciones_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `historial_activaciones_ibfk_2` FOREIGN KEY (`licencia_id`) REFERENCES `licencias_emitidas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla licencia_prestamos_db.historial_activaciones: ~0 rows (aproximadamente)
DELETE FROM `historial_activaciones`;

-- Volcando estructura para tabla licencia_prestamos_db.licencias_emitidas
CREATE TABLE IF NOT EXISTS `licencias_emitidas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `fecha_emision` date NOT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT '0.00',
  `estado` enum('Activa','Suspendida','Vencida') DEFAULT 'Activa',
  `notas` text,
  `token_generado` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `licencias_emitidas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla licencia_prestamos_db.licencias_emitidas: ~0 rows (aproximadamente)
DELETE FROM `licencias_emitidas`;
INSERT INTO `licencias_emitidas` (`id`, `empresa_id`, `tipo`, `fecha_emision`, `fecha_vencimiento`, `precio`, `estado`, `notas`, `token_generado`, `created_at`) VALUES
	(1, 1, 'Demo / Prueba (Días)', '2026-04-01', '2026-04-06', 0.00, 'Activa', '', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbXByZXNhX2lkIjoiMSIsInJ1YyI6IjIwMjAyMDIwMjAxIiwidGlwbyI6IkRlbW8gLyBQcnVlYmEgKETDrWFzKSIsImV4cCI6MTc3NTUyMDAwMCwiaWF0IjoxNzc1MTExMzI3fQ.yJBbSxLr9UHo_MTrG90FVe6RDv1FhH8l8jmxn8ua4b0', '2026-04-02 06:28:47');

-- Volcando estructura para tabla licencia_prestamos_db.pagos_licencias
CREATE TABLE IF NOT EXISTS `pagos_licencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `licencia_id` int NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(100) DEFAULT NULL,
  `referencia` varchar(255) DEFAULT NULL,
  `fecha_pago` date DEFAULT NULL,
  `estado` enum('Pendiente','Pagado','Anulado') DEFAULT 'Pendiente',
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  KEY `licencia_id` (`licencia_id`),
  CONSTRAINT `pagos_licencias_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pagos_licencias_ibfk_2` FOREIGN KEY (`licencia_id`) REFERENCES `licencias_emitidas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla licencia_prestamos_db.pagos_licencias: ~0 rows (aproximadamente)
DELETE FROM `pagos_licencias`;

-- Volcando estructura para tabla licencia_prestamos_db.usuarios_admin
CREATE TABLE IF NOT EXISTS `usuarios_admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla licencia_prestamos_db.usuarios_admin: ~0 rows (aproximadamente)
DELETE FROM `usuarios_admin`;
INSERT INTO `usuarios_admin` (`id`, `username`, `password_hash`, `created_at`) VALUES
	(1, 'admin', '$2b$10$Wx48ZMxoOuUP9VdxlhkO5O9naEV99g/1XjXjHlUAubGr0NcRNdzb6', '2026-04-02 06:02:22');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
