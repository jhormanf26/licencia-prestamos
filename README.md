# 🔐 Panel de Gestión de Licencias (Offline)

Este proyecto es un sistema robusto de gestión de licencias diseñado para software de escritorio o web. Permite generar claves de licencia firmadas criptográficamente que pueden validarse de forma **100% offline**, además de gestionar empresas, pagos y notificaciones por correo electrónico.

---

## 🚀 Características Principales

- **Generación de Claves Offline**: Utiliza HMAC-SHA256 para crear tokens de licencia seguros que contienen el RUC de la empresa y la fecha de vencimiento. No requiere internet para ser validado por el cliente final.
- **Vencimiento Automático**: El sistema sincroniza automáticamente el estado de las licencias a "Vencida" si la fecha límite ha pasado.
- **Control de Pagos**: Registro detallado de abonos por licencia, con soporte para moneda local (Pesos Colombianos) y separadores de miles para mayor claridad.
- **Notificaciones Automáticas**: Cron Job integrado que envía alertas por correo electrónico a los clientes 7, 3 y 1 día antes de que su licencia expire.
- **Dashboard en Tiempo Real**: Resumen visual de ingresos del mes, licencias activas y alertas próximas.
- **Historial de Activaciones**: Registro de IPs y servidores desde donde los sistemas clientes validan sus licencias.

---

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js v18+ / Express.
- **Base de Datos**: MySQL.
- **Motor de Plantillas**: EJS (Embedded JavaScript).
- **Estándares de Seguridad**: JWT / bcryptjs / HMAC-SHA256.
- **Notificaciones**: Nodemailer / Node-cron.

---

## 📦 Instalación y Configuración

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/jhormanf26/licencia-prestamos.git
   cd licencia-prestamos
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar base de datos**:
   - Crea una base de datos en MySQL llamada `licencia_prestamos_db`.
   - Importa el archivo `db_setup.sql` para crear la estructura necesaria.

4. **Variables de Entorno**:
   Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
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
   EMAIL_FROM= "Nombre del Sistema" <tu_correo@gmail.com>
   ```

---

## 🚦 Ejecución

- **Modo Desarrollo (con recarga automática)**:
  ```bash
  npm run dev
  ```
- **Modo Producción**:
  ```bash
  npm start
  ```

---

## 📡 API para Sistemas Clientes

Para validar una licencia desde tu software, envía una petición POST al endpoint de activación:

**Endpoint**: `POST /api/activar`
**Cuerpo (JSON)**:
```json
{
  "ruc": "20202020201",
  "token": "KEY_GENERADA_EN_EL_PANEL"
}
```

---

## ✒️ Créditos
Desarrollado con ❤️ para la gestión profesional de licencias de software.
