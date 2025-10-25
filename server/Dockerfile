# Dockerfile optimizado para Railway
FROM node:18-bullseye-slim

# Configurar variables de entorno antes de instalar
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    NODE_ENV=production \
    npm_config_cache=/tmp/.npm

# Instalar dependencias básicas y Chrome en una sola capa
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates \
    fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
    libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libnss3 \
    --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Crear directorio de trabajo
WORKDIR /app/server

# Copiar package.json primero para aprovechar cache de Docker
COPY server/package*.json ./

# Instalar solo las dependencias necesarias más rápido
RUN npm ci --only=production --silent --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /tmp/.npm

# Copiar el resto del código del servidor
COPY server/ ./

# Exponer puerto
EXPOSE 3001

# Comando para ejecutar
CMD ["node", "whatsapp-qr-server.js"]