# URLs de Railway

Para completar la configuración, necesitas actualizar la URL de Railway en:

`src/lib/api-config.ts`

Línea 6: Reemplaza `'https://wpp-ai-connector-backend-production.up.railway.app'` con tu URL real de Railway.

## Cómo obtener tu URL de Railway:

1. Ve a railway.app
2. Selecciona tu proyecto
3. Ve a Settings > Domains
4. Copia la URL (será algo como: https://web-production-xxxx.up.railway.app)

## Una vez tengas la URL:

1. Actualiza `src/lib/api-config.ts` 
2. Haz commit y push
3. Vercel redesplegará automáticamente
4. ¡Funcionará correctamente!

## Variables de entorno alternativa:

También puedes usar variables de entorno en Vercel:
- Variable: `VITE_RAILWAY_URL`
- Valor: Tu URL de Railway

Y en `api-config.ts` usar:
```typescript
: import.meta.env.VITE_RAILWAY_URL || 'https://tu-url-de-railway.up.railway.app'
```