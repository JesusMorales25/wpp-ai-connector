# 🚀 GUÍA DE DEPLOY EN RENDER.COM

## 📋 Requisitos Previos

1. **Cuenta en Render.com** → https://render.com
2. **GitHub conectado** (o ZIP del proyecto)
3. **Variables de entorno configuradas**
4. **Bot IA backend funcionando** (Spring Boot o similar)

---

## 🔧 PASO 1: CREAR SERVICE EN RENDER

### Opción A: Deploy automático desde GitHub

1. Ve a **Render Dashboard** → https://dashboard.render.com
2. Click en **+ New** → **Web Service**
3. Selecciona tu repositorio: `JesusMorales25/wpp-ai-connector`
4. Configura:
   - **Name**: `wpp-ai-connector` (o el que prefieras)
   - **Environment**: `Docker`
   - **Region**: `Oregon` (cerca de US, mejor latencia)
   - **Plan**: `Free` (0.5GB RAM, suficiente)
   - **Dockerfile**: `./server/Dockerfile`
   - **Build Command**: Dejar vacío (el Dockerfile lo maneja)
   - **Start Command**: `node whatsapp-qr-server.js`

---

## 🔐 PASO 2: AGREGAR VARIABLES DE ENTORNO

En Render Dashboard, ve a **Environment** y agrega estas variables:

```
NODE_ENV = production
PORT = 3001
USE_LOCAL_AUTH = true
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = false
PUPPETEER_EXECUTABLE_PATH = /usr/bin/google-chrome-stable
WWEBJS_CACHE_DIR = /tmp/.wwebjs_cache
WWEBJS_USE_LOGGER = false
BOT_IA_ENDPOINT = https://tu-backend.com/api/chat (reemplazar con tu endpoint real)
```

### Descripción de Variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Modo producción (optimizaciones) |
| `PORT` | `3001` | Puerto que escucha el servicio |
| `USE_LOCAL_AUTH` | `true` | Guardar sesión en localStorage (persistencia) |
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | `false` | Descargar Chromium en build |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/google-chrome-stable` | Ruta de Chrome en Render |
| `WWEBJS_CACHE_DIR` | `/tmp/.wwebjs_cache` | Cache de whatsapp-web.js |
| `WWEBJS_USE_LOGGER` | `false` | Logs internos (false = menos spam) |
| `BOT_IA_ENDPOINT` | `https://...` | Tu backend de IA |

---

## ⚙️ PASO 3: CONFIGURAR LIMITES DE RECURSOS

En la misma pantalla de Render, busca **Resources**:

- **Memory**: `512 MB` (Render free = máximo)
- **CPU**: Shared (default)

**Nota**: Render free tiene:
- ✅ 0.5GB RAM (suficiente para Chrome + Node)
- ✅ Mejor estabilidad que Railway
- ✅ Mejor networking
- ❌ Se duerme después de 15 min sin actividad (problema potencial)

---

## 🚀 PASO 4: DEPLOY

1. Click **Deploy** en la esquina inferior derecha
2. Render comenzará a:
   - Clonar repositorio
   - Construir Docker image
   - Instalar dependencias
   - Iniciar servicio

El build tardará **5-10 minutos** (descargando Chromium es lento).

---

## ✅ PASO 5: VERIFICAR DEPLOY

### Verificar que el servicio está corriendo:

```bash
curl https://tu-servicio.onrender.com/api/whatsapp/status
```

Deberías recibir:
```json
{
  "status": "qr_needed",
  "isReady": false,
  "qrCode": "data:image/png;base64,...",
  "hasSession": false,
  "autoBotEnabled": false,
  "stats": {...}
}
```

### Ver Logs en vivo:

En Render Dashboard → Tu servicio → **Logs**

Busca estos mensajes:
```
🤖 Bot automático: ACTIVADO ✅
✅ Chrome detectado en: /usr/bin/google-chrome-stable
✅ Puppeteer iniciado con CONFIG MINIMALISTA
📱 QR RECIBIDO - Listo para escanear
```

---

## 🔗 PASO 6: CONECTAR CON TU FRONTEND

Tu frontend (React) debe llamar a:

```javascript
const API_BASE = "https://tu-servicio.onrender.com";

// Obtener QR
const response = await fetch(`${API_BASE}/api/whatsapp/status`);
const data = await response.json();
if (data.qrCode) {
  // Mostrar QR al usuario
  displayQR(data.qrCode);
}

// Enviar mensaje
await fetch(`${API_BASE}/api/whatsapp/send-message`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phone: "34634123456",
    message: "Hola desde bot"
  })
});
```

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### 1️⃣ Servicio se duerme después de 15 min
**Problema**: Render free duerme servicios inactivos  
**Solución**: 
- Agregar heartbeat externo (Uptimerobot)
- O usar Render Pro (pago)

### 2️⃣ LOGOUT después de 60 segundos
**Problema**: Chrome se cae por falta de memory  
**Solución**:
- Ya está optimizado en el código
- Si persiste: aumentar a plan pagado (1GB RAM)

### 3️⃣ Chrome no se encuentra
**Problema**: `PUPPETEER_EXECUTABLE_PATH` incorrecta  
**Solución**: 
- Esto ya está en el Dockerfile
- Verificar logs en Render

### 4️⃣ QR no aparece
**Problema**: Problema de CORS o networking  
**Solución**:
```
// En tu backend, permite CORS:
app.use(cors());
```

---

## 📊 MONITOREO RECOMENDADO

### Uptimerobot (gratis)

Para evitar que Render duerma el servicio:

1. Ve a https://uptimerobot.com
2. Crea monitor HTTP
3. URL: `https://tu-servicio.onrender.com/api/whatsapp/status`
4. Intervalo: 30 minutos
5. Esto hará ping cada 30 min → Render no duerme

---

## 🎯 PRÓXIMOS PASOS

1. **Después de deploy**: Escanea QR con WhatsApp
2. **Prueba mensaje**: Envía un mensaje a la cuenta conectada
3. **Verifica logs**: Busca `💓 Heartbeat` cada 10s
4. **Monitorea memory**: Si ves `Memory: >400MB` → Problema

---

## 📞 SOPORTE RENDER

- **Docs**: https://render.com/docs
- **Status**: https://status.render.com
- **Support**: https://support.render.com

---

## 💡 OPTIMIZACIONES FUTURAS

Si quieres mejor rendimiento:

1. **Render Pro**: $7/mes → 1GB RAM + siempre activo
2. **AWS Lambda**: Deploy serverless (más complejo)
3. **DigitalOcean**: $5/mes → droplet dedicado
