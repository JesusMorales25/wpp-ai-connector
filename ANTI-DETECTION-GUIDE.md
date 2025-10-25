# 🎭 Guía Anti-Detección WhatsApp Web

## 🚨 Problema Original

WhatsApp Web estaba detectando la automatización y haciendo **LOGOUT automático** con los siguientes síntomas:

```
⚠️ [2025-10-25T10:29:58.375Z] WhatsApp Client DESCONECTADO
📋 Razón: LOGOUT
⚠️ WARNING: La sesión NO se guardó en disco
```

## 🔍 Causa Raíz

WhatsApp Web detecta bots a través de múltiples señales:

1. **`navigator.webdriver`** = `true` (Puppeteer/Selenium)
2. **`navigator.plugins`** vacío o falso
3. **`navigator.languages`** sospechoso
4. **WebGL vendor/renderer** genéricos
5. **Chrome runtime** expuesto
6. **Permissions API** inconsistente
7. **User agent** no coincide con comportamiento

## ✅ Solución Implementada

### 1. Puppeteer-Extra con Stealth Plugin

Instalamos `puppeteer-extra` y `puppeteer-extra-plugin-stealth`:

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

### 2. Monkey Patch de whatsapp-web.js

Interceptamos las importaciones internas de `puppeteer-core` para inyectar `puppeteer-extra`:

```javascript
// 🎭 STEALTH MODE: Puppeteer Extra con plugin anti-detección
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// 🔧 MONKEY PATCH: Forzar whatsapp-web.js a usar puppeteer-extra
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
    if (id === 'puppeteer' || id === 'puppeteer-core') {
        console.log('🎭 Interceptando require de puppeteer - usando puppeteer-extra con stealth');
        return puppeteer;
    }
    return originalRequire.apply(this, arguments);
};
```

### 3. Configuración Puppeteer Optimizada

Eliminamos flags redundantes que el stealth plugin ya maneja:

```javascript
const puppeteerConfig = {
    headless: true,
    timeout: 180000,
    args: [
        // Seguridad (Railway/Docker)
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        
        // NOTA: NO incluir --disable-blink-features=AutomationControlled
        // El stealth plugin lo maneja mejor
        
        // Optimización
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        // ... más flags de optimización
    ]
};
```

### 4. Reconexión Automática Habilitada

Con stealth activo, podemos habilitar reconexión automática sin loops infinitos:

```javascript
// auth_failure handler
console.log('⏸️ Esperando 10 segundos antes de limpiar sesión (con stealth plugin)...');
setTimeout(async () => {
    await initializeWhatsAppClient(); // Con stealth activo
}, 10000);

// disconnected handler  
console.log('🔄 Programando reconexión en 10 segundos (con stealth plugin)...');
setTimeout(async () => {
    await initializeWhatsAppClient(); // Con stealth activo
}, 10000);
```

## 🎯 ¿Qué hace el Stealth Plugin?

El stealth plugin modifica **más de 20 señales de detección**:

### Navegador
- ✅ `navigator.webdriver` → `undefined` (no `true`)
- ✅ `navigator.plugins` → Array realista con plugins falsos
- ✅ `navigator.languages` → Basado en user agent
- ✅ `navigator.permissions.query()` → Comportamiento realista

### WebGL
- ✅ `UNMASKED_VENDOR_WEBGL` → GPU realista
- ✅ `UNMASKED_RENDERER_WEBGL` → Renderer realista
- ✅ Canvas fingerprinting → Consistente

### Chrome Runtime
- ✅ `window.chrome.runtime` → Oculto
- ✅ `chrome.app` → Oculto
- ✅ `chrome.loadTimes` → Función falsa realista

### Otros
- ✅ User agent coincide con comportamiento
- ✅ Timezone offsets correctos
- ✅ Screen resolution consistente
- ✅ Media devices realistas

## 📊 Monitoreo y Logs

### Logs de Inicio (Railway)

Deberías ver:

```
🎭 Interceptando require de puppeteer - usando puppeteer-extra con stealth
🎭 Inicializando WhatsApp con STEALTH MODE...
✅ Puppeteer iniciado con STEALTH PLUGIN (anti-detección avanzada)
```

### Logs de Conexión Exitosa

```
📱 QR RECIBIDO - Listo para escanear
⏳ Cargando sesión: 100% - authenticated
✅ Cliente WhatsApp conectado y listo!
🤖 Bot listo para procesar mensajes desde: [timestamp]
```

### Logs de Reconexión (si ocurre)

```
⚠️ WhatsApp Client DESCONECTADO
🔄 Programando reconexión en 10 segundos (con stealth plugin)...
🔄 Iniciando reconexión automática...
```

## ⚠️ Troubleshooting

### Problema: Sigue desconectándose

1. **Verificar instalación de puppeteer-extra:**
   ```bash
   cd server
   npm list puppeteer-extra puppeteer-extra-plugin-stealth
   ```

2. **Verificar logs de Railway:**
   - Buscar "🎭 Interceptando require" → Debe aparecer
   - Buscar "STEALTH PLUGIN" → Debe aparecer
   - Si no aparecen, el monkey patch falló

3. **Railway cache:**
   ```bash
   # Limpiar cache de Railway
   railway run npm clean-install
   ```

### Problema: Error "Cannot find module puppeteer-extra"

1. **Verificar package.json en server/:**
   ```json
   {
     "dependencies": {
       "puppeteer-extra": "^3.3.6",
       "puppeteer-extra-plugin-stealth": "^2.11.2"
     }
   }
   ```

2. **Reinstalar:**
   ```bash
   cd server
   rm -rf node_modules package-lock.json
   npm install
   ```

### Problema: WhatsApp detecta DESPUÉS de X mensajes

Esto indica **rate limiting** o **patrón de comportamiento sospechoso**:

1. **Aumentar delays entre mensajes:**
   ```javascript
   // En BOT_CONFIG
   COOLDOWN_SECONDS: 2, // Aumentar de 0 a 2 segundos
   MAX_MESSAGES_PER_MINUTE: 5, // Reducir de 10 a 5
   TYPING_DURATION: 2000 // Aumentar de 1000 a 2000ms
   ```

2. **Agregar delays aleatorios:**
   ```javascript
   const randomDelay = Math.random() * 1000 + 500; // 500-1500ms
   await new Promise(resolve => setTimeout(resolve, randomDelay));
   ```

## 🔬 Verificación Manual

Para verificar que stealth funciona, abre DevTools en Chrome y ejecuta:

```javascript
// ANTES del stealth (detecta bot)
console.log(navigator.webdriver); // true ❌

// DESPUÉS del stealth (parece humano)
console.log(navigator.webdriver); // undefined ✅
console.log(navigator.plugins.length); // > 0 ✅
console.log(navigator.languages); // ['es-ES', 'es'] ✅
```

## 📚 Referencias

- [puppeteer-extra](https://github.com/berstend/puppeteer-extra)
- [puppeteer-extra-plugin-stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth)
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)

## 🎯 Resultado Esperado

Después de este deploy:

- ✅ WhatsApp NO hace LOGOUT automático
- ✅ Sesión persiste entre reinicios
- ✅ Bot responde sin desconexiones
- ✅ Logs muestran "STEALTH PLUGIN" activo
- ✅ Reconexión automática funciona si hay problemas de red

## 📝 Próximos Pasos

1. **Escanear QR** en Railway
2. **Monitorear logs** por 5-10 minutos
3. **Enviar mensajes de prueba** al bot
4. **Verificar persistencia** de sesión
5. Si sigue desconectando → Ver "Troubleshooting"

## ⚙️ Variables de Entorno (Railway)

No se requieren variables adicionales para stealth. Mantener:

```env
PORT=3001
NODE_ENV=production
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
BACKEND_URL=https://tu-backend.render.com
API_KEY_HEADER=tu-api-key-aqui
```
