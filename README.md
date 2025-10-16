# WhatsApp AI Bot Connector

Un conector que combina la autenticación real de WhatsApp Web con un bot de IA especializado. Usa conexión QR real para validar tu WhatsApp y envía mensajes a un bot de IA inteligente.

## Características

- ✅ **Conexión QR real de WhatsApp** para autenticación
- ✅ **Bot de IA especializado** para respuestas inteligentes  
- ✅ **Interfaz moderna** con shadcn/ui
- ✅ **Validación de formularios** con Zod
- ✅ **Notificaciones toast** en tiempo real
- ✅ **TypeScript + React** para desarrollo robusto

## Arquitectura

### Frontend
- React 18 con TypeScript
- Vite para desarrollo rápido
- Tailwind CSS + shadcn/ui para UI moderna
- Zod para validación de formularios

### Backend híbrido
- **Servidor QR local**: Maneja la autenticación de WhatsApp (puerto 3001)
- **Bot de IA remoto**: Procesa y responde mensajes (https://ianeg-bot-backend-up.onrender.com)

## Cómo funciona

1. **Autenticación WhatsApp**: El servidor local genera un QR real de WhatsApp Web
2. **Validación**: Escaneas el QR con tu WhatsApp para autenticarte
3. **Envío de mensajes**: Los mensajes se envían al bot de IA especializado
4. **Respuesta inteligente**: El bot procesa con OpenAI y responde automáticamente

## API Endpoints

El servidor backend expone los siguientes endpoints:

- `GET /api/whatsapp/status` - Obtener estado de conexión y QR
- `POST /api/whatsapp/initialize` - Inicializar cliente de WhatsApp
- `POST /api/whatsapp/send` - Enviar mensaje
- `POST /api/whatsapp/disconnect` - Desconectar cliente
- `GET /api/whatsapp/info` - Obtener información del cliente
- `POST /api/whatsapp/clear-session` - Limpiar sesión guardada

## Estructura del Proyecto

```
wpp-ai-connector/
├── src/
│   ├── components/
│   │   ├── QRConnection.tsx      # Componente de conexión QR
│   │   ├── ChatInterface.tsx     # Interfaz de chat
│   │   └── ui/                   # Componentes de shadcn/ui
│   ├── hooks/
│   │   └── use-whatsapp.ts       # Hook para manejar WhatsApp
│   ├── lib/
│   │   └── whatsapp-api.ts       # Servicio API
│   └── pages/
│       └── Index.tsx             # Página principal
├── server/
│   ├── whatsapp-server.js        # Servidor backend
│   └── package.json
└── package.json
```

## Configuración

### Variables de entorno (opcional)

Puedes crear un archivo `.env` en la raíz del proyecto:

```env
# Puerto del servidor backend (default: 3001)
PORT=3001

# URL del frontend (para CORS - default: http://localhost:8080)
FRONTEND_URL=http://localhost:8080
```

### Configuración del servidor

El servidor se ejecuta por defecto en el puerto 3001. Si necesitas cambiarlo, modifica el archivo `server/whatsapp-server.js`:

```javascript
const PORT = process.env.PORT || 3001;
```

## Características Técnicas

### Gestión de Sesión
- Las sesiones se guardan automáticamente en `server/session_data/`
- Al reconectar, no necesitas escanear el QR nuevamente
- Puedes limpiar la sesión desde la interfaz

### Validación de Números
- Solo acepta números con dígitos
- Mínimo 9 dígitos, máximo 15
- Automáticamente agrega el código de país (51 para Perú)
- Verifica que el número esté registrado en WhatsApp

### Manejo de Errores
- Conexión perdida se detecta automáticamente
- Mensajes de error claros en la interfaz
- Reintento automático de conexión

## Troubleshooting

### Error: "WhatsApp client is not ready"
- Asegúrate de que el servidor backend esté ejecutándose
- Verifica que hayas escaneado el código QR
- Intenta limpiar la sesión y reconectar

### Error: "El número no está registrado en WhatsApp"
- Verifica que el número tenga el formato correcto (solo dígitos)
- Asegúrate de que el número esté registrado en WhatsApp
- Prueba con el código de país completo

### Problemas de conexión
- Verifica que el puerto 3001 esté disponible
- Asegúrate de que no haya firewall bloqueando la conexión
- Revisa los logs del servidor en la consola

## Desarrollo

### Scripts disponibles

```bash
# Desarrollo
npm run dev                 # Solo frontend
npm run server             # Solo backend  
npm run server:dev         # Backend con nodemon
npm run full:dev           # Frontend + Backend

# Producción
npm run build              # Build del frontend
npm run preview            # Preview del build
```

### Agregar nuevas características

1. **Nuevos endpoints**: Agregar en `server/whatsapp-server.js`
2. **Nuevos hooks**: Crear en `src/hooks/`
3. **Nuevos componentes**: Agregar en `src/components/`

## Licencia

MIT License

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Soporte

Si tienes problemas o preguntas:

1. Revisa la sección de Troubleshooting
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

---

**Nota**: Este proyecto utiliza WhatsApp Web de forma no oficial. Asegúrate de cumplir con los términos de servicio de WhatsApp.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/dc21cdba-bf77-47ab-ad78-b68b87d63a1e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
