# Configuración de Variables de Entorno

## 🔧 Variables de Entorno Requeridas

### Para Vercel (Frontend):
```bash
VITE_RAILWAY_URL=wpp-ai-connector-production.up.railway.app
VITE_AI_BOT_URL=https://ianeg-bot-backend-up.onrender.com/api/chat/send
VITE_REQUEST_TIMEOUT=10000
VITE_POLLING_INTERVAL=5000
```

### Para Railway (Backend):
```bash
NODE_ENV=production
PORT=3001
```

## 📋 Configuración paso a paso:

### 1. **En Vercel:**
1. Ve a tu proyecto en vercel.com
2. Settings → Environment Variables
3. Agrega cada variable:
   - **Name**: `VITE_RAILWAY_URL`
   - **Value**: `wpp-ai-connector-production.up.railway.app`
   - **Environment**: All (Production, Preview, Development)

### 2. **En Railway:**
1. Ve a tu proyecto en railway.app
2. Variables tab
3. Agrega:
   - `NODE_ENV` = `production`
   - `PORT` = `3001` (se configura automáticamente)

### 3. **Para desarrollo local:**
1. Copia `.env.example` a `.env.local`
2. Ajusta los valores según tu entorno local

## 🚀 URLs de servicios:

- **Frontend (Vercel)**: https://tu-proyecto.vercel.app
- **Backend WhatsApp (Railway)**: https://wpp-ai-connector-production.up.railway.app
- **Backend IA (Render)**: https://ianeg-bot-backend-up.onrender.com

## ✅ Verificación:

Una vez configuradas las variables:
1. Vercel redesplegará automáticamente
2. El frontend conectará con Railway
3. Railway ya está corriendo con el backend
4. ¡Todo funcionará en producción!

## 🔄 Cambiar URLs:

Si cambias de servicio o URLs:
1. Actualiza las variables de entorno en Vercel
2. El frontend se actualizará sin necesidad de cambiar código