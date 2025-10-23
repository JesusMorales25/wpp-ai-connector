# 🚀 Guía de Despliegue - IA CRM

Esta guía te ayudará a desplegar el sistema completo en la nube.

## 📋 Arquitectura de Despliegue

- **Frontend (React)**: Vercel
- **Backend WhatsApp**: Railway  
- **Backend Principal**: Render (ya desplegado)

## 🔧 Variables de Entorno

⚠️ **Importante**: Las variables de entorno se configuran directamente en los servidores (Vercel, Railway), NO en archivos locales.

### Para Vercel (Frontend)
Configura estas variables en el dashboard de Vercel:
```bash
VITE_BACKEND_API_URL=https://tu-backend.onrender.com
VITE_WHATSAPP_API_URL=https://tu-whatsapp.railway.app
VITE_AI_BOT_URL=https://tu-backend.onrender.com/api/chat/send
VITE_BOT_API_KEY=tu-api-key-secreta
VITE_REQUEST_TIMEOUT=30000
VITE_POLLING_INTERVAL=15000
```

### Para Railway (WhatsApp Server)
Configura estas variables en el dashboard de Railway:
```bash
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://tu-app.vercel.app,http://localhost:8080
WHATSAPP_SESSION_PATH=/tmp/session_data
BOT_API_KEY=tu-api-key-secreta
FRONTEND_URL=https://tu-app.vercel.app
```

## 📱 Paso a Paso

### 1. Desplegar Frontend en Vercel

1. Conecta tu repositorio GitHub a Vercel
2. Selecciona la rama `main`
3. Configura las variables de entorno en el dashboard
4. Deploy automático

### 2. Desplegar WhatsApp Server en Railway

1. Conecta la carpeta `/server` a Railway
2. Configura las variables de entorno en el dashboard
3. Deploy automático desde la carpeta server

### 3. Verificar URLs

- Frontend: `https://tu-app.vercel.app`
- WhatsApp Server: `https://tu-whatsapp.railway.app`
- Backend Principal: `https://tu-backend.onrender.com`

## ✅ Funcionalidades Implementadas

- ✅ **Redirección automática**: Después del login va al dashboard
- ✅ **Confirmación de logout**: Popup de confirmación antes de cerrar sesión
- ✅ **Sesiones de 12 horas**: Con notificaciones automáticas
- ✅ **Variables de entorno**: Configuradas para producción
- ✅ **Logs limpios**: Sin información sensible
- ✅ **CORS seguro**: Configurado con variables de entorno
- ✅ **Archivos locales ignorados**: .env* protegidos por gitignore

## 🔐 Seguridad

- ✅ API Keys solo en variables de entorno del servidor
- ✅ CORS configurado correctamente
- ✅ HTTPS en todas las conexiones
- ✅ Logs sin información sensible
- ✅ Archivos .env* ignorados por Git

## 🧪 Testing

Después del despliegue, verifica:
1. ✅ Login funciona y redirecciona al dashboard
2. ✅ Logout muestra confirmación antes de cerrar sesión
3. ✅ WhatsApp se conecta correctamente
4. ✅ Bot responde a mensajes
4. ✅ Métricas se cargan
5. ✅ Sesión expira a las 12 horas

## 📞 Soporte

Si encuentras problemas, revisa:
1. Variables de entorno en dashboards
2. URLs en network tab del navegador
3. Logs de Railway y Vercel
4. Estado de los servicios en Render