# Despliegue en Vercel - WhatsApp AI Connector

## ⚠️ IMPORTANTE: Limitaciones del Frontend en Vercel

Este proyecto tiene dos partes:

### 🎨 **Frontend (Se despliega en Vercel)**
- Interfaz web React con Vite
- Funciona perfectamente en Vercel
- URL: `https://tu-proyecto.vercel.app`

### 🤖 **Backend WhatsApp (Requiere servidor dedicado)**
- **NO se puede desplegar en Vercel** porque:
  - Requiere Puppeteer/Chrome para WhatsApp Web.js
  - Necesita almacenamiento persistente para sesiones
  - Vercel no soporta aplicaciones con estado persistente

## 📋 Pasos para despliegue completo:

### 1. **Frontend en Vercel** ✅
1. Conecta tu repo GitHub con Vercel
2. Vercel detectará automáticamente el proyecto Vite
3. Build automático con `npm run build`

### 2. **Backend en servidor externo** 🖥️
Necesitas desplegar el backend en:
- **Railway.app** (recomendado)
- **Render.com** 
- **DigitalOcean App Platform**
- **Heroku** (con buildpack de Puppeteer)
- **VPS propio**

### 3. **Configuración de URLs**
Una vez tengas ambos desplegados, actualiza en el frontend:
```javascript
// En src/components/ChatInterface.tsx y src/lib/whatsapp-api.ts
const API_URL = "https://tu-backend-railway.up.railway.app"
```

## 🚀 Despliegue del Backend (Recomendado: Railway)

1. Crea cuenta en Railway.app
2. Conecta tu repo GitHub
3. Selecciona la carpeta `server/`
4. Railway detectará automáticamente Node.js
5. Instala buildpack de Puppeteer automáticamente

## 📱 Variables de entorno para el backend:
```bash
PORT=3001
NODE_ENV=production
```

## ⚡ Una vez desplegado:
1. Frontend: Funciona inmediatamente
2. Backend: Genera QR para autenticación WhatsApp
3. ¡Bot automático funcionando! 🎉

---
**Nota**: El frontend en Vercel mostrará mensajes de conexión hasta que configures la URL del backend desplegado.