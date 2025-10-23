# 🚀 Guía de Despliegue - IA CRM

Esta guía te ayudará a desplegar el sistema completo en la nube con el nuevo sistema de branding.

## 📋 Arquitectura de Despliegue

- **Frontend (React)**: Vercel ⭐ **RECOMENDADO**
- **Backend WhatsApp**: Railway  
- **Backend Principal**: Render (ya desplegado)

## 🎨 Sistema de Branding Configurabile

El proyecto ahora incluye un sistema de branding completamente configurabile via variables de entorno.

### Variables de Branding (Frontend)
```bash
# Personalización de marca
VITE_APP_NAME=IA CRM
VITE_APP_DESCRIPTION=Panel Corporativo
VITE_COMPANY_NAME=IA CRM
VITE_APP_LOGO_URL=/logo.png

# APIs del sistema
VITE_BACKEND_API_URL=https://tu-backend.onrender.com
VITE_WHATSAPP_API_URL=https://tu-whatsapp.railway.app
VITE_AI_BOT_URL=https://tu-backend.onrender.com/api/chat/send
VITE_BOT_API_KEY=tu-api-key-secreta
VITE_REQUEST_TIMEOUT=30000
VITE_POLLING_INTERVAL=15000
```

## 🚀 Despliegue Paso a Paso

### 1. 📱 Frontend en Vercel (PRIORITARIO)

**Repositorio actualizado y listo para deploy**

1. **Conectar GitHub**:
   - Ve a [vercel.com](https://vercel.com)
   - Conecta con tu cuenta de GitHub
   - Selecciona el repositorio `wpp-ai-connector`

2. **Configurar Variables de Entorno**:
   ```bash
   # En Vercel Dashboard → Settings → Environment Variables
   VITE_APP_NAME=Mi Empresa CRM
   VITE_APP_DESCRIPTION=Sistema de Gestión Empresarial
   VITE_COMPANY_NAME=Mi Empresa
   VITE_APP_LOGO_URL=https://mi-empresa.com/logo.png
   
   # URLs de APIs (configura según tus backends)
   VITE_BACKEND_API_URL=https://wpp-ai-connector-backend.onrender.com
   VITE_WHATSAPP_API_URL=https://tu-whatsapp.railway.app
   VITE_AI_BOT_URL=https://wpp-ai-connector-backend.onrender.com/api/chat/send
   VITE_BOT_API_KEY=tu-api-key-secreta
   ```

3. **Deploy**:
   - Vercel detectará automáticamente que es un proyecto Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - ✅ **Deploy automático desde `main` branch**

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