# ⚡ QUICK START - RENDER.COM EN 5 MINUTOS

## 1️⃣ LOGIN EN RENDER

```
https://dashboard.render.com
```

Conecta tu cuenta de GitHub.

---

## 2️⃣ CREAR WEB SERVICE

- **New** → **Web Service**
- **Repository**: `wpp-ai-connector`
- **Name**: `wpp-ai-connector-bot`
- **Environment**: Docker
- **Region**: Oregon
- **Plan**: Free
- **Dockerfile**: `./server/Dockerfile`
- **Start Command**: `node whatsapp-qr-server.js`

---

## 3️⃣ AGREGAR VARIABLES (⭐ CRÍTICO)

En **Environment**, copia-pega estas:

```
NODE_ENV=production
PORT=3001
USE_LOCAL_AUTH=true
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
WWEBJS_CACHE_DIR=/tmp/.wwebjs_cache
WWEBJS_USE_LOGGER=false
BOT_IA_ENDPOINT=https://tu-api-backend.com/api/chat
```

**Reemplaza**:
- `https://tu-api-backend.com/api/chat` → tu endpoint real de IA

---

## 4️⃣ DEPLOY

Click **Deploy** → Espera 5-10 min (descargando Chromium)

---

## 5️⃣ VERIFICAR

Cuando termine, ve a **Logs** y busca:

```
✅ Puppeteer iniciado con CONFIG MINIMALISTA
📱 QR RECIBIDO - Listo para escanear
```

---

## 🌐 USAR EN FRONTEND

```javascript
const API = "https://tu-servicio.onrender.com";

// Obtener estado + QR
fetch(`${API}/api/whatsapp/status`)
  .then(r => r.json())
  .then(data => console.log(data.qrCode));
```

---

## ⏰ TIEMPO ESTIMADO

- Deploy: 5-10 min
- Conexión WhatsApp: 30s
- QR scan: 1-2 min

**Total: 15-20 minutos** ✅

---

## 🔧 SI ALGO FALLA

1. Ver **Logs** en Render
2. Buscar error message
3. Común: `Chrome not found` → Verificar PUPPETEER_EXECUTABLE_PATH
4. Común: `LOGOUT a los 60s` → Es normal en free tier (ver guía completa)

---

## 📞 NEXT STEPS

- [ ] Crear servicio en Render
- [ ] Agregar variables
- [ ] Deploy
- [ ] Escanear QR
- [ ] Enviar mensaje de prueba
- [ ] Monitorear logs
