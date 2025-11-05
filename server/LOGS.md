# 📊 Sistema de Logs Optimizado

## 🎯 Reducir Costos en Render/Railway

Los servicios cloud cobran por almacenamiento de logs. Este sistema te permite controlar cuánto se registra.

## 🔧 Configuración

Agrega en tus **variables de entorno** (Render/Railway):

```bash
APP_LOG_LEVEL=ERROR
```

## 📋 Niveles Disponibles

### `ERROR` - Mínimo (Recomendado para producción con presupuesto bajo)
✅ **Solo errores críticos**
- ❌ Errores de conexión
- ❌ Fallos al enviar mensajes
- ❌ Problemas de sesión

**Logs por hora**: ~10-50 líneas
**Ahorro**: 95% menos logs

---

### `WARN` - Advertencias (Producción equilibrada)
✅ Todo lo de ERROR +
- ⚠️ QR código regenerado
- ⚠️ Reconexiones
- ⚠️ Límites alcanzados

**Logs por hora**: ~50-100 líneas
**Ahorro**: 80% menos logs

---

### `INFO` - Información Importante (Default producción)
✅ Todo lo de WARN +
- ℹ️ Mensajes enviados exitosamente
- ℹ️ Grupos de mensajes procesados
- ℹ️ Conexión establecida/cerrada
- ℹ️ Máximo de mensajes alcanzado

**Logs por hora**: ~200-500 líneas
**Ahorro**: 50% menos logs

---

### `DEBUG` - Desarrollo (Default en local)
✅ Todo lo de INFO +
- 🔍 Cada mensaje agrupado
- 🔍 Timeouts configurados
- 🔍 Contexto de mensajes
- 🔍 Detalles de envío

**Logs por hora**: ~500-1000 líneas
**Recomendado**: Solo en desarrollo

---

### `VERBOSE` - Todo (Solo para debugging)
✅ **ABSOLUTAMENTE TODO**
- 📝 Cada actualización de conexión
- 📝 Cada request HTTP
- 📝 Todos los detalles internos

**Logs por hora**: 2000+ líneas
**⚠️ ADVERTENCIA**: Solo usar temporalmente para resolver problemas complejos

---

## 💰 Ejemplo de Ahorro

### Escenario: 100 mensajes/día

| Nivel | Líneas/día | Costo mensual estimado* |
|-------|------------|-------------------------|
| VERBOSE | ~60,000 | $15-20 |
| DEBUG | ~30,000 | $8-12 |
| INFO | ~15,000 | $4-6 |
| WARN | ~6,000 | $2-3 |
| ERROR | ~3,000 | $1-2 |

*Basado en precios de Render (aprox. $0.00033 por MB de logs)

---

## 🚀 Cómo Cambiar el Nivel

### En Render:
1. Dashboard → Tu servicio
2. Environment → Edit
3. Agregar/editar: `APP_LOG_LEVEL=ERROR`
4. Save Changes (auto-redeploy)

### En Railway:
1. Dashboard → Tu proyecto
2. Variables → New Variable
3. `APP_LOG_LEVEL` = `ERROR`
4. Guardar (auto-redeploy)

### En Local (.env):
```bash
APP_LOG_LEVEL=DEBUG
```

---

## 📈 Monitorear en Tiempo Real

```bash
# Render
render logs --tail

# Railway
railway logs --follow
```

---

## 🎯 Recomendaciones

**Producción estable**: `WARN` o `INFO`
**Producción con bajo presupuesto**: `ERROR`
**Desarrollo local**: `DEBUG`
**Debugging problemas**: `VERBOSE` (temporal)

---

## 🔄 Sin Configurar

Si no estableces `APP_LOG_LEVEL`:
- **Producción** (`NODE_ENV=production`): `INFO`
- **Desarrollo**: `DEBUG`
