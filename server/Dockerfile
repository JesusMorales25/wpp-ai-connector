# Dockerfile para WhatsApp Bot con Baileys (sin Chromium/Puppeteer)
# Mucho más ligero - solo necesita Node.js
FROM node:18-bullseye-slim

# Configurar variables de entorno
ENV NODE_ENV=production \
    npm_config_cache=/tmp/.npm

# Instalar solo certificados CA (requeridos para HTTPS)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Crear directorio de trabajo
WORKDIR /app/server


# Copiar package.json primero para aprovechar cache de Docker
COPY package*.json ./


# Instalar solo las dependencias necesarias
RUN npm ci --only=production --silent --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /tmp/.npm


# Copiar el resto del código del servidor
COPY . .

# Exponer puerto
EXPOSE 3001

# Comando para ejecutar el NUEVO servidor con Baileys
CMD ["node", "whatsapp-baileys-server.js"]