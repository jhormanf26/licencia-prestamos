# 🔐 LicenciaControl - Enterprise Licensing & Subscription Engine

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.x-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-orange.svg)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/Security-JWT%20%2F%20HMAC--SHA256-red.svg)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-ISC-brightgreen.svg)](LICENSE)

**LicenciaControl** es una solución Full Stack y motor de seguridad diseñado para la **gestión, emisión y validación de licencias de software empresarial**. Permite a proveedores de software (SaaS o de escritorio) controlar clientes, suscripciones, pagos y validaciones criptográficas **100% offline y online**, con notificaciones automatizadas y auditoría de accesos.

---

## 🌟 Módulos y Arquitectura del Sistema

### 🖥️ 1. ERP Panel Administrativo (Backoffice)
- **Dashboard en Tiempo Real:** KPI de ingresos mensuales, empresas registradas, licencias activas y alertas de próximos vencimientos.
- **Gestión de Empresas/Clientes:** Administración completa de clientes por RUC, razón social y datos de contacto.
- **Generador Criptográfico de Licencias:** Emisión de tokens firmados que incluyen RUC, tipo de plan (Demo, Mensual, Anual) y fecha de expiración.
- **Suscripciones y Estados:** Control automático de estados (`Activa`, `Vencida`, `Suspendida`) y revocación instantánea.

### 🔐 2. Core Criptográfico Dual (Offline & Online)
- **Validación Offline Criptográfica:** Firma de tokens mediante HMAC-SHA256/JWT que permite al cliente verificar su licencia localmente sin depender de internet.
- **Gateway API REST:** Endpoints de autenticación y verificación en vivo desde aplicaciones clientes.

### ⏰ 3. Motor Autónomo de Notificaciones & Tareas Cron
- **Cron Jobs Programados:** Evaluación diaria a las 8:00 AM (zona horaria configurable) para auto-vencer licencias caducadas.
- **Alertas Automatizadas por Correo:** Envío preventivo de correos HTML a los clientes 7, 3 y 1 días antes de la fecha límite usando `Nodemailer`.

### 💳 4. Control Financiero & Facturación
- **Gestión de Pagos:** Registro detallado de abonos, saldos pendientes y pagos completados.
- **Formateo Monetario:** Soporte para moneda local (Pesos Colombianos / Soles) con separadores de miles.

---

## 📂 Estructura del Proyecto

```text
licencia-prestamos/
├── 📁 config/              # Configuración y conexión a MySQL
├── 📁 public/              # Archivos estáticos (CSS, JS, imágenes)
├── 📁 routes/
│   ├── index.js            # Rutas del Panel Administrativo (Vistas EJS)
│   └── api.js              # API REST pública para clientes
├── 📁 services/
│   └── notificaciones.js   # Cron Job y motor de correo (Nodemailer + node-cron)
├── 📁 views/               # Plantillas EJS (Dashboard, Licencias, Empresas, Pagos)
├── app.js                  # Servidor principal Express
├── db_setup.sql            # Script de inicialización de Base de Datos
└── README.md               # Documentación oficial
```

---

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js (v18+) / Express 5.x
- **Base de Datos:** MySQL 8.x
- **Criptografía & Seguridad:** JWT (`jsonwebtoken`), `bcryptjs`, HMAC-SHA256
- **Motor de Plantillas:** EJS (Embedded JavaScript)
- **Automatización & Notificaciones:** `node-cron`, `nodemailer`

---

## 📦 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/jhormanf26/licencia-prestamos.git
cd licencia-prestamos
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Base de Datos
1. Crea la base de datos en MySQL: `licencia_prestamos_db`.
2. Importa el archivo `db_setup.sql` para generar las tablas e índices iniciales.

### 4. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura:

```env
PORT=4000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=licencia_prestamos_db

# Configuración de Correo (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password
EMAIL_FROM="Panel Licencias" <tu_correo@gmail.com>
```

---

## 🚦 Ejecución

- **Modo Desarrollo (con auto-reload):**
  ```bash
  npm run dev
  ```
- **Modo Producción:**
  ```bash
  npm start
  ```
  Accede al panel desde: `http://localhost:4000`

---

## 📡 API REST para Sistemas Clientes

### 1. Registro de Activación / Validar Licencia
El software cliente invoca este endpoint en cada inicio para validar la licencia y registrar su auditoría.

- **Endpoint:** `POST /api/activacion`
- **Headers:** `Content-Type: application/json`
- **Body JSON:**
  ```json
  {
    "token": "TOKEN_JWT_GENERADO_EN_EL_PANEL",
    "servidor": "servidor-cliente-01"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "ok": true,
    "mensaje": "Activación registrada y licencia válida."
  }
  ```

### 2. Health Check
- **Endpoint:** `GET /api/status`
- **Respuesta (200 OK):**
  ```json
  {
    "ok": true,
    "panel": "Panel de Licencias",
    "version": "1.0.0"
  }
  ```

---

## 🔐 Ejemplo de Validación Offline en Cliente

El cliente puede validar el token sin conectarse al servidor utilizando la misma clave secreta compartida (`JWT_SECRET`):

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'TU_CLAVE_SECRETA_COMPARTIDA';
const token = 'TOKEN_DE_LICENCIA';

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Licencia válida para la Empresa ID:', decoded.empresa_id);
  console.log('📄 Tipo de licencia:', decoded.tipo);
} catch (error) {
  console.error('❌ Licencia inválida o expirada:', error.message);
}
```

---

## ✒️ Créditos y Licencia

Desarrollado por **Jhorman** para la gestión profesional y distribución segura de licencias de software empresarial.  
Licencia bajo términos **ISC**.

