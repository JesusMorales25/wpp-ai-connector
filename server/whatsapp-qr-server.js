const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración específica para Railway/Producción
const isProduction = process.env.NODE_ENV === 'production';

// Middleware de seguridad - Headers HTTP
app.use((req, res, next) => {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevenir MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Habilitar XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Strict Transport Security (solo en producción con HTTPS)
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Ocultar información del servidor
  res.removeHeader('X-Powered-By');
  
  next();
});

// Configuración de CORS con variables de entorno
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:8080', 'http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está en la lista permitida
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log(`⚠️ CORS blocked origin: ${origin}`);
      console.log(`Allowed origins:`, allowedOrigins);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  optionsSuccessStatus: 200
};

// Middleware de seguridad - Rate limiting por IP
const requestCounts = new Map();
const RATE_LIMIT = {
  windowMs: 60000, // 1 minuto
  maxRequests: 100 // 100 requests por minuto por IP
};

const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
  } else {
    const data = requestCounts.get(ip);
    
    if (now > data.resetTime) {
      data.count = 1;
      data.resetTime = now + RATE_LIMIT.windowMs;
    } else {
      data.count++;
      
      if (data.count > RATE_LIMIT.maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.'
        });
      }
    }
  }
  
  next();
};

// Middleware de validación de API key (opcional, para endpoints sensibles)
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.BOT_API_KEY;
  
  // Si no hay API key configurada, permitir acceso (para desarrollo)
  if (!expectedKey) {
    return next();
  }
  
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid API key'
    });
  }
  
  next();
};

// Middleware de sanitización de inputs
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    // Limitar tamaño del body
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > 10000) { // 10KB max
      return res.status(413).json({
        success: false,
        error: 'Request body too large'
      });
    }
    
    // Sanitizar campos de texto
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remover caracteres peligrosos
        req.body[key] = req.body[key]
          .replace(/[<>]/g, '') // Prevenir XSS
          .trim()
          .substring(0, 5000); // Limitar longitud
      }
    });
  }
  
  next();
};

// Aplicar middleware
app.use(cors(corsOptions));
// Manejar preflight requests explícitamente
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Limitar tamaño de JSON
app.use(rateLimitMiddleware);
app.use(sanitizeInput);

// Estado de la aplicación - Solo para conexión QR
let whatsappClient = null;
let qrCodeData = null;
let isClientReady = false;
let connectionStatus = 'disconnected'; // 'disconnected', 'qr_received', 'authenticating', 'connected'
let initializationInProgress = false;
let botReadyTime = null; // Timestamp de cuando el bot estuvo listo para contar mensajes

// Configuración del bot automático
let autoBotEnabled = true; // Por defecto activado
let processedMessages = new Set(); // Para evitar procesar el mismo mensaje múltiples veces
let botStats = {
    messagesReceived: 0,
    messagesSentToAI: 0,
    errors: 0,
    spamBlocked: 0,
    rateLimited: 0,        // Mensajes bloqueados por rate limiting
    mediaIgnored: 0,       // Mensajes multimedia ignorados
    systemIgnored: 0,      // Mensajes del sistema ignorados
    uniqueUsers: new Set(), // Usuarios únicos que han enviado mensajes
    startTime: new Date()
};

// CONFIGURACIONES ULTRA-OPTIMIZADAS PARA REDUCIR COSTOS
const BOT_CONFIG = {
    MAX_MESSAGE_LENGTH: 800,         // REDUCIDO: Máximo 800 caracteres
    MAX_MESSAGES_PER_MINUTE: 10,     // Aumentado: 10 mensajes por minuto (más conversacional)
    COOLDOWN_SECONDS: 0,             // ELIMINADO: Sin cooldown (respuestas inmediatas)
    BLOCKED_WORDS: ['spam', 'publicidad', 'oferta', 'promocion', 'descuento', 'gratis', 'premio', 'marketing'],
    ENABLE_TYPING_INDICATOR: true,   // Mostrar "escribiendo..." (opcional)
    TYPING_DURATION: 1000,           // Solo 1 segundo de "escribiendo..." (rápido)
    TYPING_SPEED: 50,                // Milisegundos por carácter (velocidad de escritura humana)
    MIN_TYPING_TIME: 2000,           // Mínimo 2 segundos mostrando "escribiendo..."
    MAX_TYPING_TIME: 8000,           // Máximo 8 segundos para no hacer esperar mucho
    RATE_LIMIT_WINDOW: 60000,        // 1 minuto en milisegundos
    MAX_PROCESSED_MESSAGES: 500,     // REDUCIDO: Límite de caché más pequeño
    ENABLE_LOGS: false,              // NUEVO: Deshabilitar logs para SPAM
    MEMORY_CLEANUP_INTERVAL: 15 * 60 * 1000  // Limpiar memoria cada 15 minutos
};

// Rate limiting por usuario
let userLastMessage = new Map(); // userId -> timestamp
let userMessageCount = new Map(); // userId -> {count, windowStart}

// LIMPIEZA PERIÓDICA DE MEMORIA ULTRA-OPTIMIZADA
setInterval(() => {
    const now = Date.now();
    const thirtyMinutesAgo = now - (30 * 60 * 1000); // REDUCIDO: 30 minutos
    
    // Limpiar mensajes viejos de caché MÁS FRECUENTEMENTE
    if (processedMessages.size > BOT_CONFIG.MAX_PROCESSED_MESSAGES) {
        processedMessages.clear();
        // Solo log si no es modo silencioso
        if (BOT_CONFIG.ENABLE_LOGS) console.log('🧹 Caché limpiado');
    }
    
    // Limpiar rate limiting viejo MÁS AGRESIVAMENTE
    for (const [userId, timestamp] of userLastMessage.entries()) {
        if (timestamp < thirtyMinutesAgo) { // 30 min en lugar de 1 hora
            userLastMessage.delete(userId);
        }
    }
    
    for (const [userId, stats] of userMessageCount.entries()) {
        if (stats.windowStart < thirtyMinutesAgo) { // 30 min en lugar de 1 hora
            userMessageCount.delete(userId);
        }
    }
    
    // Log solo en modo debug
    if (BOT_CONFIG.ENABLE_LOGS) console.log('🧹 Memoria optimizada');
}, BOT_CONFIG.MEMORY_CLEANUP_INTERVAL); // Cada 15 minutos

// WATCHDOG: Monitorear y reiniciar conexión si se queda colgada
let lastHealthCheck = Date.now();
setInterval(async () => {
    // Si el cliente dice estar listo pero no responde, reiniciar
    if (isClientReady && whatsappClient) {
        try {
            // Intentar verificar estado (con timeout)
            const healthCheck = Promise.race([
                whatsappClient.getState().then(() => true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 10000))
            ]);
            
            await healthCheck;
            lastHealthCheck = Date.now();
            
        } catch (error) {
            console.error('⚠️ Watchdog: Cliente no responde, reiniciando...', error.message);
            
            // Marcar como desconectado
            isClientReady = false;
            connectionStatus = 'reconnecting';
            
            // Reiniciar cliente
            try {
                await whatsappClient.destroy();
                await initializeWhatsAppClient();
            } catch (restartError) {
                console.error('❌ Watchdog: Error reiniciando cliente:', restartError.message);
            }
        }
    }
}, 60000); // Cada 1 minuto

// SISTEMA DE LOGS ULTRA-SILENCIOSO
const LOG_CONFIG = {
    ENABLE_SPAM_LOGS: false,     // NUNCA loggear SPAM (ahorra I/O masivo)
    ENABLE_DEBUG_LOGS: false,    // NO loggear debug en producción
    LOG_REAL_MESSAGES: true,     // SÍ loggear mensajes reales
    LOG_ERRORS: true             // SÍ loggear errores
};

const smartLog = (type, message, data = null) => {
    if (type === 'spam' && !LOG_CONFIG.ENABLE_SPAM_LOGS) return;
    if (type === 'debug' && !LOG_CONFIG.ENABLE_DEBUG_LOGS) return;
    if (type === 'real' && LOG_CONFIG.LOG_REAL_MESSAGES) {
        console.log(message, data || '');
    }
    if (type === 'error' && LOG_CONFIG.LOG_ERRORS) {
        console.error(message, data || '');
    }
};

// Función para limpiar recursos
const cleanupClient = async () => {
    if (whatsappClient) {
        try {
            // Verificar si el cliente está inicializado antes de destruir
            if (whatsappClient.pupPage) {
                await whatsappClient.destroy();
            }
        } catch (error) {
            console.error('Error cleaning up client:', error);
        } finally {
            whatsappClient = null;
        }
    }
    isClientReady = false;
    connectionStatus = 'disconnected';
    qrCodeData = null;
    initializationInProgress = false;
    botReadyTime = null; // Limpiar timestamp del bot
    // Limpiar también los mensajes procesados al reinicializar
    processedMessages.clear();
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
        
        // Configuración específica para Railway/Docker
        const puppeteerConfig = {
            headless: true,
            timeout: 180000, // 3 minutos de timeout (aumentado para conexiones lentas)
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-features=VizDisplayCompositor,TranslateUI',
                '--disable-web-security',
                '--disable-extensions',
                '--disable-default-apps',
                '--mute-audio',
                '--disable-client-side-phishing-detection',
                '--disable-sync',
                '--disable-background-networking',
                '--disable-component-update',
                '--disable-domain-reliability',
                '--disable-features=AudioServiceOutOfProcess',
                '--run-all-compositor-stages-before-draw',
                '--disable-ipc-flooding-protection',
                '--memory-pressure-off',
                '--max_old_space_size=4096',
                '--disable-software-rasterizer', // Mejora estabilidad
                '--disable-blink-features=AutomationControlled' // Evita detección
            ],
            handleSIGINT: false,
            handleSIGTERM: false,
            handleSIGHUP: false
        };

        // En Railway/Docker, usar Chrome del sistema
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        whatsappClient = new Client({
            authStrategy: new LocalAuth({
                dataPath: './session_data'
            }),
            puppeteer: puppeteerConfig
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
            // Marcar el momento cuando el bot está listo para procesar mensajes nuevos
            botReadyTime = new Date();
            console.log('🤖 Bot listo para procesar mensajes nuevos desde:', botReadyTime.toISOString());
        });

        // Evento: Cliente autenticado
        whatsappClient.on('authenticated', () => {
            console.log('WhatsApp Client authenticated successfully!');
            connectionStatus = 'authenticating';
        });

        // Evento: Fallo de autenticación
        whatsappClient.on('auth_failure', async (msg) => {
            console.error('❌ Authentication failure:', msg);
            connectionStatus = 'disconnected';
            qrCodeData = null;
            initializationInProgress = false;
            
            // Limpiar sesión corrupta y reintentar
            console.log('🗑️ Limpiando sesión corrupta...');
            try {
                await whatsappClient.destroy();
                // Dar tiempo para limpiar
                setTimeout(async () => {
                    console.log('🔄 Reiniciando cliente para generar nuevo QR...');
                    await initializeWhatsAppClient();
                }, 3000);
            } catch (error) {
                console.error('Error limpiando sesión:', error.message);
            }
        });

        // Evento: Cliente desconectado
        whatsappClient.on('disconnected', async (reason) => {
            console.log('⚠️ WhatsApp Client disconnected:', reason);
            isClientReady = false;
            connectionStatus = 'disconnected';
            qrCodeData = null;
            initializationInProgress = false;
            
            // Intentar reconectar automáticamente después de 5 segundos
            console.log('🔄 Intentando reconectar en 5 segundos...');
            setTimeout(async () => {
                try {
                    console.log('🔄 Iniciando reconexión automática...');
                    await whatsappClient.destroy();
                    await initializeWhatsAppClient();
                } catch (error) {
                    console.error('❌ Error en reconexión automática:', error.message);
                    console.log('💡 Requiere reconexión manual - escanear QR nuevamente');
                }
            }, 5000);
        });

        // Evento: Mensaje recibido - FILTROS ULTRA-TEMPRANOS ANTI-SPAM (SILENCIOSOS)
        whatsappClient.on('message', async (message) => {
            try {
                // ===== FILTROS CRÍTICOS ULTRA-TEMPRANOS (CERO LOGS PARA SPAM) =====
                
                // 1. SPAM DETECTION SILENCIOSO - PRIMERA LÍNEA DE DEFENSA
                if (message.from === 'status@broadcast' || 
                    message.from.includes('@broadcast') || 
                    message.from.includes('status@') ||
                    message.from.includes('@newsletter') || 
                    message.from.includes('@list') ||
                    message.from.includes('broadcast') ||
                    message.from.includes('@status') ||
                    message.from.includes('newsletter@') ||
                    message.from.includes('updates@')) {
                    
                    // SOLO incrementar contador, SIN LOGS para ahorrar I/O
                    botStats.spamBlocked++;
                    return; // SALIR INMEDIATAMENTE - CERO PROCESAMIENTO
                }

                // 2. MENSAJES PROPIOS - SEGUNDA LÍNEA (SILENCIOSO)
                if (message.fromMe) {
                    return; // SALIR INMEDIATAMENTE - SIN LOG
                }

                // 3. GRUPOS - TERCERA LÍNEA (SILENCIOSO)
                if (message.from.includes('@g.us')) {
                    return; // SALIR INMEDIATAMENTE - SIN LOG
                }

                // ===== VERIFICACIONES DE SISTEMA (SOLO PARA MENSAJES REALES) =====

                // Verificar si el bot automático está habilitado
                if (!autoBotEnabled) {
                    return; // Sin log para ahorrar I/O
                }

                // Mensajes históricos (validar solo para mensajes reales)
                if (!botReadyTime || message.timestamp * 1000 < botReadyTime.getTime()) {
                    return; // Sin log para mensajes históricos
                }

                // Tipos de mensajes del sistema (SILENCIOSO)
                if (message.type === 'system' || message.type === 'reaction' || 
                    message.type === 'revoked' || message.type === 'call_log') {
                    botStats.systemIgnored++;
                    return; // Sin log
                }

                // Multimedia sin texto (OPTIMIZADO)
                if ((message.type === 'image' || message.type === 'video' || 
                     message.type === 'audio' || message.type === 'document' || 
                     message.type === 'sticker' || message.type === 'location' || 
                     message.type === 'vcard') && !message.body) {
                    botStats.mediaIgnored++;
                    return; // Sin log
                }

                // ===== VALIDACIONES DE MENSAJES REALES =====

                const userId = message.from;
                const now = Date.now();

                // Anti-loop detector
                if (message.body && ['bot', 'automatico', 'inteligencia artificial', 'asistente virtual']
                    .some(keyword => message.body.toLowerCase().includes(keyword))) {
                    return;
                }

                // Validar longitud del mensaje
                if (message.body && message.body.length > BOT_CONFIG.MAX_MESSAGE_LENGTH) {
                    await message.reply('⚠️ Tu mensaje es demasiado largo. Por favor, envía mensajes más cortos.');
                    return;
                }

                // Rate limiting solo por minuto (sin cooldown entre mensajes)
                // Esto permite conversaciones fluidas
                let userStats = userMessageCount.get(userId) || {count: 0, windowStart: now};
                
                // Resetear ventana más frecuentemente
                if (now - userStats.windowStart > BOT_CONFIG.RATE_LIMIT_WINDOW) {
                    userStats = {count: 0, windowStart: now};
                }
                
                userStats.count++;
                userMessageCount.set(userId, userStats);
                
                // Rate limit más estricto
                if (userStats.count > BOT_CONFIG.MAX_MESSAGES_PER_MINUTE) {
                    botStats.rateLimited++;
                    // SOLO responder UNA VEZ y luego silencioso
                    if (userStats.count === BOT_CONFIG.MAX_MESSAGES_PER_MINUTE + 1) {
                        await message.reply('⚠️ Límite alcanzado. Espera 1 minuto.');
                    }
                    return; // Silencioso después del primer aviso
                }

                // Filtro de palabras prohibidas (SILENCIOSO)
                if (message.body && BOT_CONFIG.BLOCKED_WORDS.some(word => 
                    message.body.toLowerCase().includes(word.toLowerCase()))) {
                    botStats.spamBlocked++;
                    return; // Sin respuesta para palabras prohibidas
                    return;
                }

                // Evitar mensajes duplicados
                if (processedMessages.has(message.id._serialized)) {
                    return;
                }
                processedMessages.add(message.id._serialized);

                // ===== PROCESAR MENSAJE REAL =====
                userLastMessage.set(userId, now);
                botStats.messagesReceived++;
                botStats.uniqueUsers.add(userId);

                // Log SOLO para mensajes reales y solo si está habilitado
                if (BOT_CONFIG.ENABLE_LOGS) {
                    console.log('📨 REAL:', message.from.replace('@c.us', ''), '-', message.body?.substring(0, 50));
                }

                // Extraer el número de teléfono (sin @c.us)
                const phoneNumber = message.from.replace('@c.us', '');

                // URL del bot desde variable de entorno o fallback
                const botApiUrl = process.env.BOT_API_URL || 'https://iacrm-backend.onrender.com/api/chat/send';
                
                // Headers de autenticación
                const headers = {
                    'Content-Type': 'application/json',
                };
                
                // Agregar autenticación según lo configurado
                // Opción 1: JWT Token (si existe BOT_JWT_TOKEN)
                if (process.env.BOT_JWT_TOKEN) {
                    headers['Authorization'] = `Bearer ${process.env.BOT_JWT_TOKEN}`;
                }
                // Opción 2: API Key (si existe BOT_BACKEND_API_KEY)
                else if (process.env.BOT_BACKEND_API_KEY) {
                    headers['X-API-KEY'] = process.env.BOT_BACKEND_API_KEY; // Uppercase KEY
                }
                // Opción 3: Basic Auth (si existen BOT_USERNAME y BOT_PASSWORD)
                else if (process.env.BOT_USERNAME && process.env.BOT_PASSWORD) {
                    const credentials = Buffer.from(`${process.env.BOT_USERNAME}:${process.env.BOT_PASSWORD}`).toString('base64');
                    headers['Authorization'] = `Basic ${credentials}`;
                }
                
                // Log headers en desarrollo (sin exponer la key completa)
                if (!isProduction && process.env.BOT_BACKEND_API_KEY) {
                    console.log('🔑 Enviando con X-API-KEY:', process.env.BOT_BACKEND_API_KEY ? '[CONFIGURADA]' : '[NO CONFIGURADA]');
                }

                const response = await fetch(botApiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        numero: phoneNumber,
                        mensaje: message.body
                    }),
                    signal: AbortSignal.timeout(60000) // TIMEOUT aumentado: 60 segundos para Render free tier
                });

                // Leer el cuerpo de la respuesta como texto para manejar JSON y texto plano
                const raw = await response.text();
                let botReply = null;

                if (response.ok) {
                    botStats.messagesSentToAI++;
                    smartLog('real', '✅ Mensaje enviado al bot de IA correctamente');

                    // Intentar parsear JSON y extraer el texto de respuesta en varios campos comunes
                    try {
                        const json = JSON.parse(raw);
                        botReply = json.respuesta || json.respuesta_bot || json.message || json.answer || (json.data && (json.data.message || json.data.text)) || (json.choices && json.choices[0] && json.choices[0].text) || null;
                    } catch (e) {
                        // No es JSON, usar texto plano
                        botReply = raw && raw.trim() ? raw.trim() : null;
                    }

                    if (botReply) {
                        smartLog('real', '📱 Enviando respuesta del bot al usuario');
                        
                        try {
                            // Mostrar "escribiendo..." brevemente (solo si está habilitado)
                            if (BOT_CONFIG.ENABLE_TYPING_INDICATOR) {
                                const chat = await message.getChat();
                                await chat.sendStateTyping();
                                
                                // Delay mínimo solo para que se vea el indicador
                                await new Promise(resolve => setTimeout(resolve, BOT_CONFIG.TYPING_DURATION));
                            }
                            
                            // Enviar respuesta inmediatamente
                            await message.reply(botReply);
                            smartLog('real', `✅ Respuesta enviada (${botReply.length} chars)`);
                        } catch (replyError) {
                            smartLog('error', 'Error enviando respuesta:', replyError.message);
                        }
                    } else {
                        smartLog('error', '⚠️ Respuesta del backend no contenía texto válido');
                    }
                } else {
                    botStats.errors++;
                    smartLog('error', '❌ Error al enviar al bot de IA:', `${response.status} ${response.statusText}`);
                    
                    // Solo enviar mensaje de error si no es un error temporal
                    if (response.status !== 429 && response.status !== 502 && response.status !== 503) {
                        await message.reply('Lo siento, hay un problema técnico. Intenta más tarde.');
                    }
                }

            } catch (error) {
                botStats.errors++;
                smartLog('error', '❌ Error procesando mensaje:', error.message);
                
                try {
                    // Mensaje de error más específico según el tipo de error
                    let errorMessage = 'Disculpa, ocurrió un error. Por favor intenta nuevamente.';
                    
                    if (error.name === 'AbortError' || error.message.includes('timeout')) {
                        errorMessage = 'El servidor está tardando en responder. Por favor intenta en unos momentos.';
                        smartLog('error', '⏱️ Timeout: El backend de IA tardó más de 60 segundos en responder');
                    } else if (error.message.includes('fetch')) {
                        errorMessage = 'No se pudo conectar con el servidor. Por favor intenta más tarde.';
                        smartLog('error', '🔌 Error de conexión con el backend de IA');
                    }
                    
                    await message.reply(errorMessage);
                } catch (replyError) {
                    smartLog('error', 'Error enviando mensaje de error:', replyError.message);
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
app.get('/api/whatsapp/status', async (req, res) => {
    try {
        // Timeout de 5 segundos para verificar estado
        const statusPromise = new Promise((resolve) => {
            resolve({
                status: connectionStatus,
                isReady: isClientReady,
                qrCode: qrCodeData,
                hasSession: fs.existsSync('./session_data'),
                autoBotEnabled: autoBotEnabled,
                stats: botStats,
                message: 'WhatsApp Auto-Bot Service'
            });
        });
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Status check timeout')), 5000);
        });
        
        const result = await Promise.race([statusPromise, timeoutPromise]);
        res.json(result);
        
    } catch (error) {
        console.error('Error checking WhatsApp status:', error.message);
        
        // Devolver estado básico aunque haya error
        res.json({
            status: 'error',
            isReady: false,
            qrCode: null,
            hasSession: fs.existsSync('./session_data'),
            autoBotEnabled: autoBotEnabled,
            message: 'Error checking status - service may be restarting',
            error: error.message
        });
    }
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
    
    // Convertir Set a número para enviar en JSON
    const statsToSend = {
        ...botStats,
        uniqueUsers: botStats.uniqueUsers.size, // Convertir Set a número
        uptime: `${uptimeHours}h ${uptimeMinutes}m`,
        uptimeMs: uptime,
        messagesPerHour: uptimeHours > 0 ? Math.round(botStats.messagesReceived / uptimeHours) : 0
    };
    
    res.json({
        success: true,
        stats: statsToSend,
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
        spamBlocked: 0,
        rateLimited: 0,
        mediaIgnored: 0,
        systemIgnored: 0,
        uniqueUsers: new Set(),
        startTime: new Date()
    };
    processedMessages.clear();
    userLastMessage.clear();
    userMessageCount.clear();
    // Reiniciar también el timestamp del bot si está conectado
    if (isClientReady) {
        botReadyTime = new Date();
        console.log('🔄 Estadísticas reiniciadas - Bot listo desde:', botReadyTime.toISOString());
    }
    
    res.json({
        success: true,
        message: 'Estadísticas reiniciadas',
        stats: {
            ...botStats,
            uniqueUsers: botStats.uniqueUsers.size
        }
    });
});

// Endpoint de debugging para verificar el estado del bot
app.get('/api/whatsapp/debug', (req, res) => {
    res.json({
        success: true,
        debug: {
            botReadyTime: botReadyTime ? botReadyTime.toISOString() : null,
            processedMessagesCount: processedMessages.size,
            userCacheSize: userLastMessage.size,
            rateLimitCacheSize: userMessageCount.size,
            isClientReady,
            connectionStatus,
            autoBotEnabled,
            stats: {
                ...botStats,
                uniqueUsers: botStats.uniqueUsers.size
            },
            config: BOT_CONFIG,
            logConfig: LOG_CONFIG,
            currentTime: new Date().toISOString()
        }
    });
});

// NUEVO: Endpoint de performance y optimización
app.get('/api/whatsapp/performance', (req, res) => {
    const uptime = new Date() - botStats.startTime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    
    const performance = {
        efficiency: {
            totalProcessed: botStats.messagesReceived + botStats.spamBlocked + botStats.systemIgnored + botStats.mediaIgnored,
            realMessages: botStats.messagesReceived,
            spamFiltered: botStats.spamBlocked,
            systemFiltered: botStats.systemIgnored,
            mediaFiltered: botStats.mediaIgnored,
            rateLimited: botStats.rateLimited,
            spamFilterRate: botStats.spamBlocked > 0 ? 
                ((botStats.spamBlocked / (botStats.messagesReceived + botStats.spamBlocked)) * 100).toFixed(2) + '%' : '0%'
        },
        memory: {
            processedMessagesCache: processedMessages.size,
            userCacheSize: userLastMessage.size,
            rateLimitCache: userMessageCount.size,
            uniqueUsers: botStats.uniqueUsers.size
        },
        costs: {
            estimatedSpamSaved: botStats.spamBlocked, // Cada SPAM filtrado = $ ahorrado
            realProcessingLoad: botStats.messagesReceived + botStats.messagesSentToAI,
            errorRate: botStats.errors > 0 ? 
                ((botStats.errors / botStats.messagesReceived) * 100).toFixed(2) + '%' : '0%',
            // NUEVAS MÉTRICAS DE AHORRO
            cpuSavingsPercent: botStats.spamBlocked > 0 ? 
                ((botStats.spamBlocked / (botStats.spamBlocked + botStats.messagesReceived)) * 100).toFixed(1) + '%' : '0%',
            memoryOptimized: processedMessages.size < BOT_CONFIG.MAX_PROCESSED_MESSAGES,
            ioSavings: botStats.spamBlocked // Cada log de SPAM no generado
        },
        recommendations: []
    };
    
    // Generar recomendaciones automáticas
    if (botStats.spamBlocked > botStats.messagesReceived * 2) {
        performance.recommendations.push('Alto volumen de SPAM detectado - filtros funcionando correctamente');
    }
    if (botStats.rateLimited > botStats.messagesReceived * 0.1) {
        performance.recommendations.push('Considerar reducir rate limiting - puede estar bloqueando usuarios reales');
    }
    if (botStats.errors > botStats.messagesReceived * 0.05) {
        performance.recommendations.push('Alta tasa de errores - revisar conectividad con backend');
    }
    if (processedMessages.size > BOT_CONFIG.MAX_PROCESSED_MESSAGES * 0.8) {
        performance.recommendations.push('Caché de mensajes cerca del límite - se limpiará automáticamente');
    }
    
    res.json({
        success: true,
        performance,
        uptimeHours,
        timestamp: new Date().toISOString()
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
// PROTEGIDO: Requiere API key válida
app.post('/api/whatsapp/disconnect', validateApiKey, async (req, res) => {
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
// PROTEGIDO: Requiere API key válida
app.post('/api/whatsapp/send', validateApiKey, async (req, res) => {
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
// PROTEGIDO: Requiere API key válida
app.post('/api/whatsapp/clear-session', validateApiKey, async (req, res) => {
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

// Health check en la raíz para Railway
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'WhatsApp QR Connection Service',
        timestamp: new Date().toISOString()
    });
});

// Endpoint de salud detallado
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
    console.log(`🎯 Bot IA endpoint: [CONFIGURADO]`);
    
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