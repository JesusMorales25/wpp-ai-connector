const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Estado de la aplicación
let whatsappClient = null;
let qrCodeData = null;
let isClientReady = false;
let connectionStatus = 'disconnected'; // 'disconnected', 'qr_received', 'authenticating', 'connected'
let initializationInProgress = false;

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

// Configurar cliente de WhatsApp con mejor manejo de errores
const initializeWhatsAppClient = async () => {
    if (initializationInProgress) {
        console.log('Initialization already in progress');
        return;
    }

    initializationInProgress = true;
    
    try {
        // Limpiar cliente anterior si existe
        await cleanupClient();

        console.log('Initializing WhatsApp client...');
        
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
            console.log('QR RECEIVED');
            qrCodeData = qr;
            connectionStatus = 'qr_received';
            
            // Mostrar QR en consola para debugging
            console.log('Scan this QR code with your phone:');
            qrcode.generate(qr, { small: true });
        });

        // Evento: Cliente listo
        whatsappClient.on('ready', () => {
            console.log('WhatsApp Client is ready!');
            isClientReady = true;
            connectionStatus = 'connected';
            qrCodeData = null;
            initializationInProgress = false;
        });

        // Evento: Cliente autenticado
        whatsappClient.on('authenticated', () => {
            console.log('WhatsApp Client authenticated!');
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
            console.log('WhatsApp Client was disconnected:', reason);
            isClientReady = false;
            connectionStatus = 'disconnected';
            qrCodeData = null;
            initializationInProgress = false;
        });

        // Evento: Mensaje recibido
        whatsappClient.on('message', async (message) => {
            console.log('Mensaje recibido de', message.from, ':', message.body);
        });

        // Manejo de errores
        whatsappClient.on('error', (error) => {
            console.error('WhatsApp Client Error:', error.message);
            
            // Si es un error de Puppeteer, reintentar después de un delay
            if (error.message.includes('Target closed') || 
                error.message.includes('Protocol error') ||
                error.message.includes('Session closed')) {
                console.log('Puppeteer session lost, will retry initialization...');
                setTimeout(async () => {
                    await cleanupClient();
                    connectionStatus = 'disconnected';
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
        hasSession: fs.existsSync('./session_data')
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
        
        console.log('Initializing WhatsApp client from API call...');
        await initializeWhatsAppClient();
        
        res.json({ 
            success: true, 
            message: 'WhatsApp client initialization started',
            status: connectionStatus 
        });
    } catch (error) {
        console.error('Error initializing WhatsApp client:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error initializing WhatsApp client',
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
            message: 'WhatsApp client disconnected successfully' 
        });
    } catch (error) {
        console.error('Error disconnecting WhatsApp client:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error disconnecting WhatsApp client',
            error: error.message 
        });
    }
});

// Enviar mensaje
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

        // Formatear número (agregar código de país si no lo tiene)
        let formattedNumber = numero.replace(/\D/g, ''); // Solo dígitos
        if (!formattedNumber.startsWith('51') && formattedNumber.length === 9) {
            formattedNumber = '51' + formattedNumber; // Agregar código de país para Perú
        }
        formattedNumber = formattedNumber + '@c.us';

        // Verificar si el número existe en WhatsApp
        const numberId = await whatsappClient.getNumberId(formattedNumber);
        if (!numberId) {
            return res.status(400).json({
                success: false,
                message: 'El número no está registrado en WhatsApp'
            });
        }

        // Enviar mensaje
        const sentMessage = await whatsappClient.sendMessage(numberId._serialized, mensaje);
        
        res.json({
            success: true,
            message: 'Mensaje enviado correctamente',
            messageId: sentMessage.id._serialized,
            to: numero
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar mensaje',
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
                message: 'Cliente no está listo'
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
            message: 'Error obteniendo información del cliente',
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
            message: 'Sesión limpiada correctamente'
        });
    } catch (error) {
        console.error('Error clearing session:', error);
        res.status(500).json({
            success: false,
            message: 'Error limpiando sesión',
            error: error.message
        });
    }
});

// Middleware para manejo de errores
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`WhatsApp Server running on port ${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  GET  /api/whatsapp/status - Get connection status`);
    console.log(`  POST /api/whatsapp/initialize - Initialize WhatsApp client`);
    console.log(`  POST /api/whatsapp/send - Send message`);
    console.log(`  POST /api/whatsapp/disconnect - Disconnect client`);
    console.log(`  GET  /api/whatsapp/info - Get client info`);
    console.log(`  POST /api/whatsapp/clear-session - Clear session data`);
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
    // No salir del proceso, solo limpiar el cliente si es necesario
});