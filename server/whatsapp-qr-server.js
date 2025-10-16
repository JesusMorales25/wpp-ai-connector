const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración específica para Railway
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());

// Estado de la aplicación - Solo para conexión QR
let whatsappClient = null;
let qrCodeData = null;
let isClientReady = false;
let connectionStatus = 'disconnected'; // 'disconnected', 'qr_received', 'authenticating', 'connected'
let initializationInProgress = false;

// Configuración del bot automático
let autoBotEnabled = true; // Por defecto activado
let processedMessages = new Set(); // Para evitar procesar el mismo mensaje múltiples veces
let botStats = {
    messagesReceived: 0,
    messagesSentToAI: 0,
    errors: 0,
    startTime: new Date()
};

// Función para limpiar recursos
const cleanupClient = async () => {
    if (whatsappClient) {
        try {
            await whatsappClient.destroy();
            whatsappClient = null;
        } catch (error) {
            console.error('Error cleaning up client:', error);
        }
    }
    isClientReady = false;
    connectionStatus = 'disconnected';
    qrCodeData = null;
    initializationInProgress = false;
};

// Configurar cliente de WhatsApp - Solo para mostrar QR y mantener conexión
const initializeWhatsAppClient = async () => {
    if (initializationInProgress) {
        console.log('Initialization already in progress');
        return;
    }

    initializationInProgress = true;
    
    try {
        // Limpiar cliente anterior si existe
        await cleanupClient();

        console.log('Initializing WhatsApp client for QR display...');
        
        whatsappClient = new Client({
            authStrategy: new LocalAuth({
                dataPath: './session_data'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-features=TranslateUI',
                    '--disable-web-security',
                    '--disable-extensions'
                ],
                timeout: 60000,
                handleSIGINT: false,
                handleSIGTERM: false,
                handleSIGHUP: false
            }
        });

        // Evento: QR recibido
        whatsappClient.on('qr', (qr) => {
            console.log('QR RECEIVED - Ready for scanning');
            qrCodeData = qr;
            connectionStatus = 'qr_received';
            
            // Mostrar QR en consola
            console.log('Scan this QR code with your WhatsApp:');
            qrcode.generate(qr, { small: true });
        });

        // Evento: Cliente listo
        whatsappClient.on('ready', () => {
            console.log('WhatsApp Client is connected and ready!');
            isClientReady = true;
            connectionStatus = 'connected';
            qrCodeData = null;
            initializationInProgress = false;
        });

        // Evento: Cliente autenticado
        whatsappClient.on('authenticated', () => {
            console.log('WhatsApp Client authenticated successfully!');
            connectionStatus = 'authenticating';
        });

        // Evento: Fallo de autenticación
        whatsappClient.on('auth_failure', (msg) => {
            console.error('Authentication failure:', msg);
            connectionStatus = 'disconnected';
            qrCodeData = null;
            initializationInProgress = false;
        });

        // Evento: Cliente desconectado
        whatsappClient.on('disconnected', (reason) => {
            console.log('WhatsApp Client disconnected:', reason);
            isClientReady = false;
            connectionStatus = 'disconnected';
            qrCodeData = null;
            initializationInProgress = false;
        });

        // Evento: Mensaje recibido - AQUÍ MANEJAMOS LA LÓGICA DEL BOT
        whatsappClient.on('message', async (message) => {
            try {
                // Verificar si el bot automático está habilitado
                if (!autoBotEnabled) {
                    console.log('🔇 Bot automático deshabilitado, ignorando mensaje');
                    return;
                }

                // Ignorar mensajes enviados por nosotros mismos
                if (message.fromMe) {
                    return;
                }

                // Ignorar mensajes de grupos (opcional)
                if (message.from.includes('@g.us')) {
                    console.log('👥 Mensaje de grupo ignorado:', message.from);
                    return;
                }

                // Evitar procesar el mismo mensaje múltiples veces
                if (processedMessages.has(message.id._serialized)) {
                    console.log('� Mensaje ya procesado, ignorando');
                    return;
                }
                processedMessages.add(message.id._serialized);

                // Actualizar estadísticas
                botStats.messagesReceived++;

                console.log('�📨 Nuevo mensaje recibido:');
                console.log('De:', message.from);
                console.log('Mensaje:', message.body);
                console.log('ID:', message.id._serialized);

                // Extraer el número de teléfono (sin @c.us)
                const phoneNumber = message.from.replace('@c.us', '');
                
                // Enviar mensaje al bot de IA
                console.log('🤖 Enviando a bot de IA...');

                const response = await fetch('https://ianeg-bot-backend-up.onrender.com/api/chat/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        numero: phoneNumber,
                        mensaje: message.body
                    })
                });

                // Leer el cuerpo de la respuesta como texto para manejar JSON y texto plano
                const raw = await response.text();
                let botReply = null;

                if (response.ok) {
                    botStats.messagesSentToAI++;
                    console.log('✅ Mensaje enviado al bot de IA correctamente');

                    // Intentar parsear JSON y extraer el texto de respuesta en varios campos comunes
                    try {
                        const json = JSON.parse(raw);
                        botReply = json.respuesta || json.respuesta_bot || json.message || json.answer || (json.data && (json.data.message || json.data.text)) || (json.choices && json.choices[0] && json.choices[0].text) || null;
                    } catch (e) {
                        // No es JSON, usar texto plano
                        botReply = raw && raw.trim() ? raw.trim() : null;
                    }

                    if (botReply) {
                        console.log('📱 Enviando respuesta del bot al usuario por WhatsApp:');
                        console.log(botReply);
                        try {
                            // Usar message.reply para mantener el hilo
                            await message.reply(botReply);
                        } catch (replyError) {
                            console.error('Error enviando la respuesta al usuario:', replyError);
                        }
                    } else {
                        console.log('⚠️ La respuesta del backend no contenía texto reconocible. Raw response:');
                        console.log(raw);
                    }
                } else {
                    botStats.errors++;
                    console.error('❌ Error al enviar al bot de IA:', response.status, response.statusText);
                    
                    // Opcional: enviar mensaje de error
                    await message.reply('Lo siento, hay un problema técnico. Intenta más tarde.');
                }

            } catch (error) {
                botStats.errors++;
                console.error('❌ Error procesando mensaje:', error);
                
                try {
                    // Opcional: enviar mensaje de error al usuario
                    await message.reply('Disculpa, ocurrió un error. Por favor intenta nuevamente.');
                } catch (replyError) {
                    console.error('Error enviando mensaje de error:', replyError);
                }
            }
        });

        // Manejo de errores
        whatsappClient.on('error', (error) => {
            console.error('WhatsApp Client Error:', error.message);
            
            if (error.message.includes('Target closed') || 
                error.message.includes('Protocol error') ||
                error.message.includes('Session closed')) {
                console.log('Session lost, cleaning up...');
                setTimeout(async () => {
                    await cleanupClient();
                }, 3000);
            }
        });

        // Inicializar cliente
        console.log('Starting WhatsApp client initialization...');
        await whatsappClient.initialize();
        
    } catch (error) {
        console.error('Error initializing WhatsApp client:', error);
        await cleanupClient();
        throw error;
    }
};

// Rutas de la API

// Obtener estado de conexión y QR
app.get('/api/whatsapp/status', (req, res) => {
    res.json({
        status: connectionStatus,
        isReady: isClientReady,
        qrCode: qrCodeData,
        hasSession: fs.existsSync('./session_data'),
        autoBotEnabled: autoBotEnabled,
        stats: botStats,
        message: 'WhatsApp Auto-Bot Service'
    });
});

// Activar/Desactivar bot automático
app.post('/api/whatsapp/toggle-autobot', (req, res) => {
    const { enabled } = req.body;
    
    if (typeof enabled === 'boolean') {
        autoBotEnabled = enabled;
        console.log(`🤖 Bot automático ${enabled ? 'ACTIVADO' : 'DESACTIVADO'}`);
        
        res.json({
            success: true,
            message: `Bot automático ${enabled ? 'activado' : 'desactivado'}`,
            autoBotEnabled: autoBotEnabled
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'El parámetro "enabled" debe ser boolean'
        });
    }
});

// Obtener estadísticas del bot
app.get('/api/whatsapp/stats', (req, res) => {
    const uptime = new Date() - botStats.startTime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    res.json({
        success: true,
        stats: {
            ...botStats,
            uptime: `${uptimeHours}h ${uptimeMinutes}m`,
            uptimeMs: uptime,
            messagesPerHour: uptimeHours > 0 ? Math.round(botStats.messagesReceived / uptimeHours) : 0
        },
        autoBotEnabled: autoBotEnabled,
        status: connectionStatus
    });
});

// Reiniciar estadísticas
app.post('/api/whatsapp/reset-stats', (req, res) => {
    botStats = {
        messagesReceived: 0,
        messagesSentToAI: 0,
        errors: 0,
        startTime: new Date()
    };
    processedMessages.clear();
    
    res.json({
        success: true,
        message: 'Estadísticas reiniciadas',
        stats: botStats
    });
});

// Inicializar conexión
app.post('/api/whatsapp/initialize', async (req, res) => {
    try {
        if (initializationInProgress) {
            return res.json({ 
                success: false, 
                message: 'Initialization already in progress',
                status: connectionStatus 
            });
        }

        if (isClientReady && connectionStatus === 'connected') {
            return res.json({ 
                success: true, 
                message: 'Client already connected',
                status: connectionStatus 
            });
        }
        
        console.log('Starting WhatsApp QR connection...');
        await initializeWhatsAppClient();
        
        res.json({ 
            success: true, 
            message: 'WhatsApp QR connection started',
            status: connectionStatus 
        });
    } catch (error) {
        console.error('Error initializing WhatsApp client:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error starting WhatsApp connection',
            error: error.message 
        });
    }
});

// Desconectar cliente
app.post('/api/whatsapp/disconnect', async (req, res) => {
    try {
        await cleanupClient();
        
        res.json({ 
            success: true, 
            message: 'WhatsApp connection closed successfully' 
        });
    } catch (error) {
        console.error('Error disconnecting WhatsApp client:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error closing WhatsApp connection',
            error: error.message 
        });
    }
});

// Obtener información de la sesión
app.get('/api/whatsapp/info', async (req, res) => {
    try {
        if (!isClientReady) {
            return res.status(400).json({
                success: false,
                message: 'WhatsApp client not connected'
            });
        }

        const info = whatsappClient.info;
        res.json({
            success: true,
            info: {
                wid: info.wid,
                pushname: info.pushname,
                phone: info.wid.user
            }
        });
    } catch (error) {
        console.error('Error getting client info:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting client information',
            error: error.message
        });
    }
});

// Enviar mensaje manual (para comunicación directa cuando el bot está desactivado)
app.post('/api/whatsapp/send', async (req, res) => {
    try {
        const { numero, mensaje } = req.body;
        
        if (!isClientReady) {
            return res.status(400).json({
                success: false,
                message: 'WhatsApp client is not ready. Please scan QR code first.'
            });
        }

        if (!numero || !mensaje) {
            return res.status(400).json({
                success: false,
                message: 'Número y mensaje son requeridos'
            });
        }

        console.log('📤 Enviando mensaje manual:');
        console.log('📱 Al número:', numero);
        console.log('💬 Mensaje:', mensaje);

        // Formatear número (agregar código de país si no lo tiene)
        let formattedNumber = numero.replace(/\D/g, ''); // Solo dígitos
        
        // Si el número tiene 9 dígitos y no empieza con código de país, agregar 51 (Perú)
        if (!formattedNumber.startsWith('51') && formattedNumber.length === 9) {
            formattedNumber = '51' + formattedNumber;
        }
        
        // Agregar sufijo de WhatsApp
        formattedNumber = formattedNumber + '@c.us';

        console.log('📞 Número formateado:', formattedNumber);

        // Verificar si el número existe en WhatsApp
        const numberId = await whatsappClient.getNumberId(formattedNumber);
        if (!numberId) {
            return res.status(400).json({
                success: false,
                message: 'El número no está registrado en WhatsApp'
            });
        }

        // Enviar mensaje desde tu cuenta autenticada
        const sentMessage = await whatsappClient.sendMessage(numberId._serialized, mensaje);
        
        console.log('✅ Mensaje enviado correctamente');
        console.log('🆔 ID del mensaje:', sentMessage.id._serialized);
        
        res.json({
            success: true,
            message: 'Mensaje enviado correctamente',
            messageId: sentMessage.id._serialized,
            to: numero,
            formattedTo: formattedNumber,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error sending manual message:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar mensaje',
            error: error.message
        });
    }
});

// Limpiar sesión (forzar nuevo QR)
app.post('/api/whatsapp/clear-session', async (req, res) => {
    try {
        // Desconectar cliente primero
        await cleanupClient();
        
        // Limpiar archivos de sesión
        const sessionPath = './session_data';
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log('Session data cleared');
        }
        
        res.json({
            success: true,
            message: 'Session cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing session:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing session',
            error: error.message
        });
    }
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'WhatsApp QR Connection Service',
        timestamp: new Date().toISOString(),
        connection: {
            status: connectionStatus,
            ready: isClientReady,
            hasQR: !!qrCodeData
        }
    });
});

// Middleware para manejo de errores
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 WhatsApp Auto-Bot Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📱 Status endpoint: http://localhost:${PORT}/api/whatsapp/status`);
    console.log(`📈 Stats endpoint: http://localhost:${PORT}/api/whatsapp/stats`);
    console.log('');
    console.log('🔄 FUNCIONAMIENTO:');
    console.log('1. Escanea QR con tu WhatsApp');
    console.log('2. Los mensajes que recibas se enviarán automáticamente a tu bot IA');
    console.log('3. Tu bot IA responderá automáticamente por WhatsApp');
    console.log('');
    console.log(`🤖 Bot automático: ${autoBotEnabled ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'}`);
    console.log(`🎯 Bot IA endpoint: https://ianeg-bot-backend-up.onrender.com/api/chat/send`);
    
    if (isProduction) {
        console.log('🚂 Running on Railway - Check logs for QR code');
    }
});

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await cleanupClient();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await cleanupClient();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    cleanupClient().then(() => {
        process.exit(1);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});