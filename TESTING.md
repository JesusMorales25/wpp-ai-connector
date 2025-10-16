# Guía de Pruebas - WhatsApp AI Connector

## Pruebas paso a paso

### 1. Verificar que el servidor backend esté funcionando

1. Abre una terminal y ejecuta:
   ```bash
   cd e:\wpp-ai-connector
   npm run server
   ```

2. Deberías ver:
   ```
   WhatsApp Server running on port 3001
   Available endpoints:
     GET  /api/whatsapp/status - Get connection status
     POST /api/whatsapp/initialize - Initialize WhatsApp client
     POST /api/whatsapp/send - Send message
     POST /api/whatsapp/disconnect - Disconnect client
     GET  /api/whatsapp/info - Get client info
     POST /api/whatsapp/clear-session - Clear session data
   ```

### 2. Verificar que el frontend esté funcionando

1. Abre otra terminal y ejecuta:
   ```bash
   cd e:\wpp-ai-connector
   npm run dev
   ```

2. Deberías ver:
   ```
   VITE v5.4.19  ready in 435 ms
   ➜  Local:   http://localhost:8080/
   ```

3. Abre tu navegador en `http://localhost:8080`

### 3. Probar la conexión con WhatsApp

1. En la interfaz web, deberías ver dos paneles:
   - **Izquierda**: "Conexión WhatsApp Web"
   - **Derecha**: "Enviar Mensaje WhatsApp"

2. En el panel izquierdo:
   - Haz clic en el botón "Conectar"
   - Deberías ver "Cargando..." y luego un código QR

3. **IMPORTANTE**: Para probar con WhatsApp real:
   - Abre WhatsApp en tu teléfono
   - Ve a Configuración → Dispositivos vinculados
   - Toca "Vincular un dispositivo"
   - Escanea el código QR que aparece en la aplicación web

4. Una vez escaneado:
   - El estado debería cambiar a "¡Conectado!"
   - Aparecerá tu nombre y número de teléfono

### 4. Probar el envío de mensajes

1. En el panel derecho:
   - Ingresa un número de teléfono (solo dígitos, ej: 977292965)
   - Escribe un mensaje de prueba
   - Haz clic en el botón de enviar

2. Si todo funciona correctamente:
   - Verás una notificación de "Mensaje enviado correctamente por WhatsApp"
   - El mensaje aparecerá en la lista con estado "Enviado"

### 5. Verificar logs en la consola

1. **Backend**: En la terminal del servidor, deberías ver:
   ```
   QR RECEIVED [código QR]
   WhatsApp Client authenticated!
   WhatsApp Client is ready!
   ```

2. **Frontend**: En las herramientas de desarrollador del navegador (F12):
   - No deberían aparecer errores en la consola
   - Las llamadas a la API deberían ser exitosas (Network tab)

### 6. Probar funcionalidades adicionales

#### Desconectar
- Haz clic en "Desconectar" para cerrar la sesión

#### Limpiar sesión
- Usa "Limpiar Sesión" para forzar un nuevo QR en la próxima conexión

#### Reconexión automática
- Si cierras y reinicias el servidor, la sesión debería mantenerse (no necesitas escanear el QR nuevamente)

## Solución de problemas

### Error: "WhatsApp client is not ready"
- Verifica que el servidor backend esté ejecutándose
- Asegúrate de haber escaneado el código QR
- Intenta limpiar la sesión y reconectar

### Error: "El número no está registrado en WhatsApp"
- Verifica que el número esté correcto (solo dígitos)
- Asegúrate de que el número esté registrado en WhatsApp
- Prueba con tu propio número para verificar

### Error de conexión
- Verifica que ambos servidores estén ejecutándose:
  - Backend en puerto 3001
  - Frontend en puerto 8080
- Revisa la consola del navegador para errores de red

### QR no aparece
- Verifica que el servidor backend esté funcionando
- Revisa los logs del servidor para errores
- Intenta refrescar la página

## Archivos importantes para debugging

1. **Logs del servidor**: Terminal donde ejecutas `npm run server`
2. **Consola del navegador**: F12 → Console tab
3. **Network tab**: F12 → Network tab (para ver llamadas a la API)
4. **Session data**: Carpeta `server/session_data/` (se crea automáticamente)

## Estructura de archivos de sesión

Cuando te conectes por primera vez, se creará automáticamente:
```
server/
└── session_data/
    └── [archivos de sesión de WhatsApp]
```

Estos archivos permiten que la sesión se mantenga entre reinicios del servidor.

## Comandos útiles

```bash
# Ejecutar solo el backend
npm run server

# Ejecutar solo el frontend  
npm run dev

# Ejecutar ambos simultáneamente
npm run full:dev

# Limpiar node_modules y reinstalar
rm -rf node_modules server/node_modules
npm install
cd server && npm install
```

¡Esto completa la configuración de tu WhatsApp AI Connector con conexión real!