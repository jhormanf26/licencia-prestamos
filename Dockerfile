# Usar una imagen ligera de Node.js
FROM node:18-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (solo producción para menor peso)
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer el puerto que configuraste en app.js (4000)
EXPOSE 4000

# Comando para iniciar la aplicación
CMD ["node", "app.js"]
