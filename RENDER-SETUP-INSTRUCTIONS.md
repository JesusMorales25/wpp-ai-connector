# 🚀 INSTRUCCIONES FINALES - RENDER.COM DEPLOYMENT

## 📊 RESUMEN DE ESTADO

| Aspecto | Estado |
|---------|--------|
| Código | ✅ Optimizado para Render |
| Docker | ✅ Dockerfile listo |
| Variables | ✅ Configuradas |
| Documentación | ✅ Completa |
| Memory management | ✅ Optimizado |
| Heartbeat | ✅ Cada 10s |
| Auth strategy | ✅ Configurable (LocalAuth/NoAuth) |

---

## 🎯 VARIABLES DE ENTORNO A USAR EN RENDER

### Copia estas exactamente:

```
NODE_ENV=production
PORT=3001
USE_LOCAL_AUTH=true
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
WWEBJS_CACHE_DIR=/tmp/.wwebjs_cache
WWEBJS_USE_LOGGER=false
BOT_IA_ENDPOINT=https://tu-backend-api.com/api/chat
```

### IMPORTANTE: Reemplazar estos valores

| Variable | Cambiar a |
|----------|-----------|
| `https://tu-backend-api.com/api/chat` | Tu endpoint de IA/backend real |
| `USE_LOCAL_AUTH=true` | Cambiar a `false` si no quieres guardar sesión |
| `WWEBJS_USE_LOGGER=false` | Cambiar a `true` solo para debugging |

---

## 📋 PASO A PASO: DEPLOY EN RENDER (10 MINUTOS)

### Paso 1: Crear Cuenta Render
```
1. Ve a https://render.com
2. Click "Sign up"
3. Conecta con GitHub (recomendado)
4. Verifica email
```

### Paso 2: Crear Web Service
```
1. En Dashboard, click "+ New"
2. Selecciona "Web Service"
3. Conecta repositorio "wpp-ai-connector"
   - O usa "Public Git Repository" si no está conectado
   - URL: https://github.com/JesusMorales25/wpp-ai-connector
```

### Paso 3: Configurar Servicio
```
Nombre: wpp-ai-connector
Region: Oregon (mejor latencia para América)
Plan: Free (gratuito)
Environment: Docker
Dockerfile: ./server/Dockerfile
Build Command: [dejar vacío]
Start Command: node whatsapp-qr-server.js
```

### Paso 4: Agregar Variables de Entorno
```
1. En la misma pantalla, ve a "Advanced"
2. En "Environment Variables", pega cada variable
3. Reemplaza "tu-backend-api.com" con tu endpoint real
```

**Tabla de variables (copiar exacto):**

```
NODE_ENV                              production
PORT                                  3001
USE_LOCAL_AUTH                        true
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD     false
PUPPETEER_EXECUTABLE_PATH            /usr/bin/google-chrome-stable
WWEBJS_CACHE_DIR                     /tmp/.wwebjs_cache
WWEBJS_USE_LOGGER                    false
BOT_IA_ENDPOINT                      https://tu-api.com/endpoint
```

### Paso 5: Deploy
```
1. Click "Create Web Service" (botón azul abajo)
2. Espera a que dice "Building..." → "Deploying..." → "Live"
3. Build tardará 5-10 minutos (descargando Chrome)
```

### Paso 6: Verificar Deploy
```
1. Una vez dice "Live", click en la URL del servicio
2. Deberías ver un error 404 (normal, no hay HTML en root)
3. Ve a: https://tu-servicio.onrender.com/api/whatsapp/status
4. Deberías ver JSON con estado
```

### Paso 7: Ver Logs
```
1. En tu servicio Render, click "Logs"
2. Busca estos mensajes (aparecen en orden):
   ✅ Chrome detectado
   ✅ Puppeteer iniciado
   📁 Directorio de sesión
   📱 QR RECIBIDO
3. Si ves estos = DEPLOY EXITOSO ✅
```

---

## 🔗 URL DE TU SERVICIO

Una vez en vivo, será:
```
https://wpp-ai-connector.onrender.com
```

Úsala en tu frontend para todas las llamadas API.

---

## 📲 USAR EN FRONTEND REACT

### Obtener QR:
```javascript
const API_BASE = "https://wpp-ai-connector.onrender.com";

async function getQR() {
  const res = await fetch(`${API_BASE}/api/whatsapp/status`);
  const data = await res.json();
  
  if (data.qrCode) {
    // Mostrar QR
    const qrImage = document.getElementById("qr-image");
    qrImage.src = data.qrCode;
  }
}

// Llamar al cargar página
getQR();
```

### Enviar Mensaje:
```javascript
async function sendMessage(phone, message) {
  const res = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: phone,        // "34634123456"
      message: message     // "Hola desde bot"
    })
  });
  
  return res.json();
}
```

---

## ⚠️ PROBLEMAS COMUNES

### 1. "Build failed" o "Dockerfile not found"
**Causa**: Ruta incorrecta  
**Solución**: Verificar que especificaste `./server/Dockerfile`

### 2. "Chrome not found" en logs
**Causa**: Variable PUPPETEER_EXECUTABLE_PATH incorrecta  
**Solución**: Asegurar que es `/usr/bin/google-chrome-stable` (exacto)

### 3. LOGOUT después de 60 segundos
**Causa**: Memory limit o CDP timeout  
**Solución**:
- Ver logs: busca "Memory:" en cada heartbeat
- Si memory > 400MB → problema Chrome
- Si memory < 300MB → problema WhatsApp/networking

### 4. Servicio se duerme
**Causa**: Render free duerme después de 15 min sin actividad  
**Solución**: 
- Usar Uptimerobot (gratis) para hacer ping cada 30 min
- O upgrade a Render Pro ($7/mes)

### 5. CORS error desde frontend
**Causa**: No hay CORS en API  
**Solución**: Verificar que en backend hay `app.use(cors())`

---

## 📊 MONITOREO

### Uptimerobot (Recomendado - Gratis)

```
1. Ve a https://uptimerobot.com
2. Sign up gratis
3. Crear monitor:
   - Type: HTTP(s)
   - URL: https://wpp-ai-connector.onrender.com/api/whatsapp/status
   - Interval: 30 minutes
   - Friendly Name: WPP Bot Render
4. Salvar
```

Esto hace que Render NO duerma tu servicio (ping cada 30 min).

### Ver Metrics en Render

En tu servicio → "Metrics" puedes ver:
- CPU usage
- Memory usage
- Network I/O

**Ideal**: Memory < 300MB, CPU < 20%

---

## 💰 COSTO

| Plan | Precio | RAM | CPU | Uptime |
|------|--------|-----|-----|--------|
| Free | Gratis | 512MB | Shared | 99% |
| Standard | $7/mes | 1GB | 0.5 vCPU | 99.99% |
| Pro | $20/mes | 4GB | 2 vCPU | 99.99% |

**Recomendación**: Empezar con Free, upgrade a Standard si necesitas persistencia.

---

## 🎉 CHECKLIST FINAL

- [ ] Crear cuenta Render
- [ ] Conectar GitHub
- [ ] Crear Web Service
- [ ] Seleccionar Dockerfile: `./server/Dockerfile`
- [ ] Agregar 8 variables de entorno
- [ ] Reemplazar BOT_IA_ENDPOINT con tu backend
- [ ] Click Deploy
- [ ] Esperar 5-10 minutos
- [ ] Ver logs, buscar "QR RECIBIDO"
- [ ] Probar `/api/whatsapp/status`
- [ ] Configurar Uptimerobot
- [ ] ¡Listo! 🚀

---

## 🆘 SOPORTE

- **Docs Render**: https://render.com/docs
- **Status**: https://status.render.com
- **Discord**: https://render.com/discord

---

## 📞 NEXT STEPS DESPUÉS DE DEPLOY

1. **Conectar WhatsApp**: Escanea QR
2. **Test**: Envía mensaje desde tu número
3. **Monitor**: Observa logs cada 10 segundos (heartbeat)
4. **Integrate**: Usa URL en tu frontend
5. **Scale**: Si funciona bien 48h, upgrade a plan pagado
