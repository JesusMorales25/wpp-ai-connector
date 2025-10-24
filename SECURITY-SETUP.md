# 🔒 Guía de Configuración de Seguridad

## ⚠️ IMPORTANTE: Configuración de API Key

Este proyecto requiere una **API Key segura** para proteger los endpoints críticos del servidor WhatsApp.

### 1. Generar una API Key Segura

Genera una clave aleatoria y segura usando uno de estos métodos:

**Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

**Online (cuidado con sitios no confiables):**
- https://www.random.org/strings/
- Usar: Length=64, Characters=Alphanumeric

### 2. Configurar Variables de Entorno

#### **Desarrollo Local (.env.local)**

Crea/edita el archivo `.env.local` en la raíz del proyecto:

```bash
# ⚠️ NUNCA SUBIR ESTE ARCHIVO A GIT
# API Key para proteger endpoints del servidor WhatsApp
VITE_BOT_API_KEY=tu_api_key_generada_aqui_64_caracteres_minimo
```

#### **Producción (Railway/Vercel)**

**Railway:**
1. Ve a tu proyecto → Variables
2. Agrega: `BOT_API_KEY` = `tu_api_key_segura`
3. Redeploy automático

**Vercel:**
1. Settings → Environment Variables
2. Agrega: `VITE_BOT_API_KEY` = `tu_api_key_segura`
3. Redeploy

### 3. Verificar Configuración

```bash
# Desarrollo - verificar que la variable está cargada
npm run dev

# El servidor debe mostrar:
# ✅ API Key validation enabled
```

---

## 🛡️ Medidas de Seguridad Implementadas

### 1. **Rate Limiting**
- **Límite:** 100 peticiones por minuto por IP
- **Acción:** Retorna `429 Too Many Requests` al exceder
- **Protege contra:** Ataques de fuerza bruta y DoS

### 2. **Validación de API Key**
- **Endpoints protegidos:**
  - `POST /api/whatsapp/send` - Enviar mensajes
  - `POST /api/whatsapp/disconnect` - Desconectar sesión
  - `POST /api/whatsapp/clear-session` - Limpiar sesión
- **Header requerido:** `X-API-Key: tu_api_key`
- **Acción:** Retorna `401 Unauthorized` si falta o es inválida

### 3. **Sanitización de Inputs**
- **Límite de tamaño:** 10KB por request body
- **Protección XSS:** Elimina caracteres `<` y `>`
- **Límite por campo:** 5000 caracteres máximo
- **Acción:** Retorna `400 Bad Request` si excede límites

### 4. **Security Headers**
```http
X-Frame-Options: DENY               # Prevenir clickjacking
X-Content-Type-Options: nosniff     # Prevenir MIME sniffing
X-XSS-Protection: 1; mode=block     # Protección XSS nativa
Content-Security-Policy: ...        # Políticas de contenido
Strict-Transport-Security: ...      # HTTPS obligatorio (producción)
```

### 5. **CORS Configurado**
- Solo permite orígenes específicos desde `ALLOWED_ORIGINS`
- Bloquea peticiones no autorizadas

---

## 🚫 Nunca Hacer

❌ **NO** subir archivos `.env*` a Git (ya están en `.gitignore`)  
❌ **NO** hacer commit de API keys en el código  
❌ **NO** compartir tu `.env.local` con nadie  
❌ **NO** usar la misma API key en desarrollo y producción  
❌ **NO** exponer logs con información sensible  

---

## ✅ Testing de Seguridad

### Test 1: Rate Limiting
```bash
# Enviar 101 peticiones rápidas
for i in {1..101}; do curl http://localhost:3001/api/whatsapp/status & done
# La petición #101 debe retornar 429
```

### Test 2: API Key Validation
```bash
# Sin API Key - debe retornar 401
curl -X POST http://localhost:3001/api/whatsapp/disconnect

# Con API Key válida - debe funcionar
curl -X POST http://localhost:3001/api/whatsapp/disconnect \
  -H "X-API-Key: tu_api_key_aqui"
```

### Test 3: Input Sanitization
```bash
# XSS attempt - debe sanitizar
curl -X POST http://localhost:3001/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tu_api_key" \
  -d '{"to": "123", "message": "<script>alert(1)</script>"}'
# El mensaje debe llegar sin los caracteres < >
```

---

## 🔄 Rotación de API Keys

Si crees que tu API Key fue comprometida:

1. **Genera una nueva clave** (ver paso 1)
2. **Actualiza en variables de entorno:**
   - Local: `.env.local`
   - Producción: Railway/Vercel
3. **Redeploy** el servidor
4. **Invalida la clave anterior** (no es necesario si no la guardaste en otro lado)

---

## 📞 Soporte

Si encuentras problemas de seguridad, reporta de inmediato:
- **NO** abras issues públicos con detalles de vulnerabilidades
- Contacta directamente al equipo de desarrollo

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
