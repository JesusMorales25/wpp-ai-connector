# 🚀 Guía de Despliegue - IA CRM

## ❌ PROBLEMA ACTUAL: Error 405 y JSON Inválido

**Síntomas:**
```
index-dnPDzPvg.js:430 Error checking WhatsApp status: SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
wpp-ai-connector-production-3929.up.railway.app/api/whatsapp/initialize:1 Failed to load resource: the server responded with a status of 405
```

**Causa:** Tu frontend en Vercel está intentando conectarse a `localhost:3001` en lugar de Railway.

**Solución:** Configurar variables de entorno correctamente (ver abajo ⬇️).

---

## 📋 Arquitectura de Despliegue

- **Frontend (React)**: Vercel ⭐ **RECOMENDADO**
- **Backend WhatsApp**: Railway ✅ **YA DESPLEGADO**
  - URL: `https://wpp-ai-connector-production-3929.up.railway.app`
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

2. **⚠️ CRÍTICO - Configurar Variables de Entorno**:
   
   **Ve a:** Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
   
   **Agrega estas variables para PRODUCTION:**
   
   ```bash
   # ⚠️ IMPORTANTE: Cambiar localhost por Railway URL
   VITE_WHATSAPP_API_URL=https://wpp-ai-connector-production-3929.up.railway.app
   
   # Backend Spring Boot (cambiar por tu URL real)
   VITE_BACKEND_API_URL=https://tu-backend-springboot.com
   VITE_AI_BOT_URL=https://tu-backend-springboot.com/api/chat/send
   
   # API Key segura (genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   VITE_BOT_API_KEY=tu_api_key_segura_64_caracteres
   
   # Branding opcional
   VITE_APP_NAME=IA CRM
   VITE_APP_DESCRIPTION=Panel Corporativo
   VITE_COMPANY_NAME=IA CRM
   VITE_APP_LOGO_URL=/logo.png
   
   ```

3. **🔄 Redeploy Obligatorio**:
   - Ve a: Deployments → Latest Deployment
   - Click en "..." → **Redeploy**
   - ⚠️ **Sin redeploy las variables NO toman efecto**

4. **✅ Verificar después del deploy**:
   ```bash
   # Abrir consola del navegador en tu Vercel URL
   # NO debe mostrar errores de localhost:3001
   # Debe conectar con Railway correctamente
   ```

---

### 2. 🚂 Backend WhatsApp en Railway

**✅ YA ESTÁ DESPLEGADO:** `https://wpp-ai-connector-production-3929.up.railway.app`

**⚠️ Configurar Variables de Entorno:**

Ve a: Railway Dashboard → Tu Proyecto → Variables

```bash
# API Key (DEBE SER LA MISMA que en Vercel)
BOT_API_KEY=tu_api_key_segura_64_caracteres

# CORS - Agregar tu URL de Vercel
ALLOWED_ORIGINS=https://tu-frontend.vercel.app,http://localhost:8080

# Bot IA backend
BOT_API_URL=https://tu-backend-springboot.com/api/chat/send

# Modo producción
NODE_ENV=production

# Puerto (Railway lo configura automático)
PORT=3001
```

**🧪 Testing Railway:**
```bash
# Debe retornar JSON
curl https://wpp-ai-connector-production-3929.up.railway.app/api/whatsapp/status

# Health check
curl https://wpp-ai-connector-production-3929.up.railway.app/api/health
```

---

### 3. 🔑 Generar API Key Segura

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

**⚠️ IMPORTANTE:** Usar la MISMA key en Railway (`BOT_API_KEY`) y Vercel (`VITE_BOT_API_KEY`)

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