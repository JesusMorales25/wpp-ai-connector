// ================================================
// WHATSAPP BOT CON BAILEYS - MIGRACIÓN COMPLETA
// Mantiene toda la lógica del bot original
// pero usa @whiskeysockets/baileys en lugar de whatsapp-web.js
// ================================================

// Cargar variables de entorno
require('dotenv').config();

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const P = require('pino');

const app = express();
const PORT = process.env.PORT || 3001;

// Logger de Baileys (silencioso en producción)
const logger = P({ level: process.env.LOG_LEVEL || 'silent' });

// Configuración específica para Railway/Render/Producción
const isProduction = process.env.NODE_ENV === 'production';

// ================================================
// MIDDLEWARE DE SEGURIDAD (igual que antes)
// ================================================

// Headers HTTP de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:");
  
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  res.removeHeader('X-Powered-By');
  next();
});

// Configuración de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:8080', 'http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  optionsSuccessStatus: 200
};

// Rate limiting
const requestCounts = new Map();
const RATE_LIMIT = {
  windowMs: 60000,
  maxRequests: 100
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
          error: 'Demasiadas solicitudes',
          message: 'Por favor, intenta más tarde',
          retryAfter: Math.ceil((data.resetTime - now) / 1000)
        });
      }
    }
  }
  
  next();
};

// Aplicar middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimitMiddleware);

// Servir archivos estáticos (para el QR viewer)
app.use(express.static(__dirname));

// ================================================
// ESTADO GLOBAL DEL BOT
// ================================================

let sock = null; // Socket de Baileys
let qrCodeData = null; // QR code en base64
let connectionStatus = 'disconnected'; // Estado: disconnected, connecting, qr_received, connected
let isClientReady = false;
let saveCreds = null; // Función para guardar credenciales

// Estadísticas del bot
const botStats = {
  startTime: new Date(),
  messagesReceived: 0,
  messagesSent: 0,
  errors: 0,
  autoReplies: 0
};

// Bot automático activado por defecto
let autoBotEnabled = process.env.AUTO_BOT_ENABLED !== 'false';
let botReadyTime = null;
let shouldAutoReconnect = true; // Control de reconexión automática

// Control de mensajes procesados (evitar duplicados)
const processedMessages = new Set();

// Configuración del bot
const BOT_CONFIG = {
  COOLDOWN_MS: parseInt(process.env.BOT_COOLDOWN_MS) || 0,
  MAX_MESSAGES_PER_CHAT: parseInt(process.env.MAX_MESSAGES_PER_CHAT) || 10,
  TYPING_DELAY_MS: parseInt(process.env.TYPING_DELAY_MS) || 1000,
  BOT_IA_ENDPOINT: process.env.BOT_IA_ENDPOINT || 'http://localhost:8081/api/chat'
};

console.log('🤖 Bot automático:', autoBotEnabled ? 'ACTIVADO ✅' : 'DESACTIVADO ❌');
console.log('🎯 Bot IA endpoint:', BOT_CONFIG.BOT_IA_ENDPOINT);

// ================================================
// DIRECTORIO DE SESIÓN (AUTH STATE)
// ================================================

const SESSION_DIR = './baileys_auth';

// Crear directorio si no existe
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  console.log('📁 Directorio de sesión creado:', SESSION_DIR);
}

// ================================================
// FUNCIONES DE WHATSAPP (BAILEYS)
// ================================================

// Conectar a WhatsApp
async function connectToWhatsApp() {
  try {
    console.log('🚀 Iniciando conexión con WhatsApp (Baileys)...');
    
    // Verificar si hay archivos de sesión
    const hasSession = fs.existsSync(SESSION_DIR) && fs.readdirSync(SESSION_DIR).length > 0;
    console.log('📂 Sesión existente:', hasSession ? 'SÍ' : 'NO');
    
    // Cargar autenticación guardada
    const { state, saveCreds: saveCredsFunc } = await useMultiFileAuthState(SESSION_DIR);
    saveCreds = saveCredsFunc;
    
    // Obtener versión más reciente de Baileys
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📱 Usando WA v${version.join('.')}, es la última: ${isLatest}`);
    
    // Crear socket de WhatsApp
    sock = makeWASocket({
      version,
      logger,
      auth: state,
      defaultQueryTimeoutMs: undefined,
    });
    
    connectionStatus = 'connecting';
    
    // ================================================
    // EVENT HANDLERS
    // ================================================
    
    // Manejo de actualizaciones de conexión
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log('🔄 Connection update:', { 
        connection, 
        hasQR: !!qr,
        statusCode: lastDisconnect?.error?.output?.statusCode,
        reason: lastDisconnect?.error?.message 
      });
      
      // QR Code recibido
      if (qr) {
        console.log('📱 QR Code recibido');
        connectionStatus = 'qr_received';
        
        // Convertir QR a base64 para el frontend
        try {
          qrCodeData = await QRCode.toDataURL(qr);
          console.log('✅ QR convertido a base64 (longitud:', qrCodeData.length, 'caracteres)');
        } catch (err) {
          console.error('❌ Error convirtiendo QR:', err);
        }
      }
      
      // Conexión cerrada
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut && shouldAutoReconnect;
        
        console.log('⚠️ Conexión cerrada, código:', statusCode, 'reconectar:', shouldReconnect);
        console.log('   Razón:', lastDisconnect?.error?.message || 'Desconocida');
        
        // Limpiar estado
        connectionStatus = 'disconnected';
        isClientReady = false;
        qrCodeData = null;
        
        // Manejar diferentes tipos de desconexión
        if (statusCode === DisconnectReason.badSession) {
          console.log('🗑️ Sesión corrupta detectada, limpiando...');
          if (fs.existsSync(SESSION_DIR)) {
            fs.rmSync(SESSION_DIR, { recursive: true, force: true });
            console.log('✅ Sesión corrupta eliminada');
          }
        } else if (statusCode === DisconnectReason.connectionClosed) {
          console.log('🔌 Conexión cerrada por WhatsApp - posible timeout o límite');
        } else if (statusCode === DisconnectReason.connectionLost) {
          console.log('📡 Conexión perdida - problema de red');
        } else if (statusCode === DisconnectReason.connectionReplaced) {
          console.log('📱 Conexión reemplazada - otro dispositivo se conectó');
          shouldAutoReconnect = false; // No reconectar automáticamente
        } else if (statusCode === DisconnectReason.timedOut) {
          console.log('⏰ Timeout de conexión');
        } else if (statusCode === DisconnectReason.restartRequired) {
          console.log('🔄 Reinicio requerido por WhatsApp');
        }
        
        if (shouldReconnect) {
          console.log('🔄 Reconectando en 3 segundos...');
          setTimeout(() => connectToWhatsApp(), 3000);
        } else {
          console.log('🔴 No se reconectará automáticamente');
          sock = null; // Limpiar socket
        }
      }
      
      // Conexión abierta (autenticado)
      if (connection === 'open') {
        console.log('✅ WhatsApp conectado exitosamente!');
        connectionStatus = 'connected';
        isClientReady = true;
        qrCodeData = null;
        botReadyTime = new Date();
        
        console.log('🤖 Bot listo para recibir mensajes desde:', botReadyTime.toISOString());
      }
    });
    
    // Guardar credenciales cuando cambien
    sock.ev.on('creds.update', saveCreds);
    
    // Manejo de mensajes
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      
      for (const msg of messages) {
        await handleIncomingMessage(msg);
      }
    });
    
  } catch (error) {
    console.error('❌ Error conectando a WhatsApp:', error);
    connectionStatus = 'disconnected';
    throw error;
  }
}

// ================================================
// MANEJO DE MENSAJES ENTRANTES
// ================================================

async function handleIncomingMessage(msg) {
  try {
    // Ignorar mensajes propios
    if (msg.key.fromMe) return;
    
    // Ignorar mensajes sin contenido
    if (!msg.message) return;
    
    // Extraer información del mensaje
    const messageId = msg.key.id;
    const from = msg.key.remoteJid; // Número del remitente
    
    // Extraer texto del mensaje según el tipo (iPhone, Android, Web, etc.)
    let messageText = '';
    
    if (msg.message.conversation) {
      // Mensaje normal (iPhone/Android)
      messageText = msg.message.conversation;
    } else if (msg.message.extendedTextMessage?.text) {
      // Mensaje desde WhatsApp Web o con formato extendido
      messageText = msg.message.extendedTextMessage.text;
    } else if (msg.message.imageMessage?.caption) {
      // Imagen con caption
      messageText = msg.message.imageMessage.caption;
    } else if (msg.message.documentMessage?.caption) {
      // Documento con caption
      messageText = msg.message.documentMessage.caption;
    } else if (msg.message.videoMessage?.caption) {
      // Video con caption
      messageText = msg.message.videoMessage.caption;
    } else if (msg.message.buttonsResponseMessage?.selectedButtonId) {
      // Respuesta a botones
      messageText = msg.message.buttonsResponseMessage.selectedButtonId;
    } else if (msg.message.listResponseMessage?.singleSelectReply?.selectedRowId) {
      // Respuesta a lista
      messageText = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
    } else {
      // Tipo de mensaje no soportado para bot IA
      console.log(`⚠️ Tipo de mensaje no soportado para bot IA:`, Object.keys(msg.message));
      return;
    }
    
    // Si no hay texto, ignorar
    if (!messageText.trim()) {
      console.log(`⚠️ Mensaje sin texto válido de ${from}`);
      return;
    }
    
    // Evitar procesar el mismo mensaje dos veces
    if (processedMessages.has(messageId)) {
      return;
    }
    processedMessages.add(messageId);
    
    // Limpiar set de mensajes procesados si tiene más de 1000
    if (processedMessages.size > 1000) {
      const toDelete = Array.from(processedMessages).slice(0, 500);
      toDelete.forEach(id => processedMessages.delete(id));
    }
    
      botStats.messagesReceived++;    
      if (!autoBotEnabled) {
        return;
      }
    
    // Procesar con el bot IA
    await processMessageWithBot(from, messageText, msg);
    
  } catch (error) {
    console.error('❌ Error manejando mensaje:', error);
    botStats.errors++;
  }
}

// ================================================
// INTEGRACIÓN CON BOT IA
// ================================================

async function processMessageWithBot(chatId, messageText, originalMessage) {
  try {
    console.log(`🤖 Procesando con bot IA: ${chatId}`);
    
    // Simular indicador de escritura (typing)
    if (BOT_CONFIG.TYPING_DELAY_MS > 0) {
      try {
        if (!isClientReady || !sock) await ensureConnected(2, 1000);
        if (sock && typeof sock.sendPresenceUpdate === 'function') {
          await sock.sendPresenceUpdate('composing', chatId);
        }
      } catch (err) {
        console.warn('⚠️ No se pudo enviar presence update (composing):', err.message || err);
      }

      await new Promise(resolve => setTimeout(resolve, BOT_CONFIG.TYPING_DELAY_MS));
    }
    
    // Llamar al backend de IA
    let botReply = null;
    try {
      // Construir headers con X-API-KEY si está disponible
      const headers = { 'Content-Type': 'application/json' };
      const apiKey = process.env.BOT_API_KEY || process.env.KEY || process.env.X_API_KEY || process.env['X-API-KEY'];
      if (apiKey) headers['X-API-KEY'] = apiKey;

      // Extraer número de chatId (ej: 549123456789@s.whatsapp.net -> 549123456789)
      const numero = String(chatId).split('@')[0];

      const response = await fetch(BOT_CONFIG.BOT_IA_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          numero,
          mensaje: messageText
        })
      });

      if (response.ok) {
        const data = await response.json();
        botReply = data.response || data.message || data.data || data.respuesta || data.texto || data.reply || null;
        if (!botReply && typeof data === 'string') {
          botReply = data;
        }
      } else {
        // Dejar que caiga al fallback
        throw new Error(`Backend IA error: ${response.status}`);
      }
    } catch (primaryError) {
      console.warn('Primary IA endpoint failed, attempting fallback format...', primaryError.message);

      // Intentar fallback: si la API espera { numero, mensaje } en /api/chat/send
      try {
        // Construir URL de fallback si es necesario
        let fallbackUrl = BOT_CONFIG.BOT_IA_ENDPOINT;
        if (fallbackUrl.endsWith('/api/chat')) {
          fallbackUrl = fallbackUrl.replace(/\/api\/chat$/, '/api/chat/send');
        } else if (!fallbackUrl.endsWith('/send')) {
          // intentar añadir /send
          fallbackUrl = fallbackUrl.replace(/\/$/, '') + '/send';
        }

        // Extraer número de chatId (ej: 549123456789@s.whatsapp.net -> 549123456789)
        const numero = String(chatId).split('@')[0];

        const headers = { 'Content-Type': 'application/json' };
        const apiKey = process.env.BOT_API_KEY || process.env.X_API_KEY || process.env['X-API-KEY'];
        if (apiKey) headers['X-API-KEY'] = apiKey;

        const fbResponse = await fetch(fallbackUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ numero: numero, mensaje: messageText })
        });

        if (fbResponse.ok) {
          const fbData = await fbResponse.json();
          console.log('📥 Respuesta del backend IA:', JSON.stringify(fbData, null, 2));
          
          // Intentar extraer la respuesta de múltiples formatos posibles
          botReply = fbData.response || fbData.message || fbData.data || fbData.respuesta || fbData.texto || fbData.reply || null;
          
          // Si fbData es un string directamente
          if (!botReply && typeof fbData === 'string') {
            botReply = fbData;
          }
          
          console.log('💬 Bot reply extraído:', botReply);
        } else {
          throw new Error(`Fallback IA error: ${fbResponse.status}`);
        }
      } catch (fallbackErr) {
        console.error('Fallback IA failed:', fallbackErr.message);
        throw primaryError; // rethrow original to be caught by outer catch
      }
    }

    if (!botReply) {
      botReply = 'Lo siento, no pude procesar tu mensaje.';
    }
    
    // Enviar respuesta usando sendMessage (maneja reconexión y reintentos)
    try {
      await sendMessage(chatId, botReply);
      botStats.autoReplies++;
    } catch (sendErr) {
      console.error('❌ Error enviando respuesta del bot:', sendErr.message || sendErr);
      throw sendErr;
    }
    
  // Log crítico ya realizado junto al contenido de la respuesta
    
    // Remover indicador de escritura
    try {
      if (!isClientReady || !sock) await ensureConnected(2, 1000);
      if (sock && typeof sock.sendPresenceUpdate === 'function') {
        await sock.sendPresenceUpdate('available', chatId);
      }
    } catch (err) {
      console.warn('⚠️ No se pudo enviar presence update (available):', err.message || err);
    }
    
  } catch (error) {
    console.error('❌ Error procesando mensaje con bot:', error);
    botStats.errors++;
    
    // Enviar mensaje de error genérico
    try {
      await sock.sendMessage(chatId, { 
        text: 'Disculpa, hubo un error procesando tu mensaje. Por favor, intenta de nuevo más tarde.' 
      });
    } catch (sendError) {
      console.error('❌ Error enviando mensaje de error:', sendError);
    }
  }
}

// ================================================
// FUNCIONES AUXILIARES
// ================================================

// Espera (sleep)
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Intentar reconectar si el cliente no está listo
async function ensureConnected(retries = 3, delayMs = 2000) {
  if (isClientReady && sock) return true;

  console.log('🔎 ensureConnected: socket no listo, intentando reconectar...');
  for (let i = 0; i < retries; i++) {
    try {
      // Intentar conectar de nuevo
      await connectToWhatsApp();

      if (isClientReady && sock) {
        console.log('🔌 Reconexión exitosa');
        return true;
      }
    } catch (err) {
      console.log(`⚠️ Reconexión fallida (intento ${i + 1}/${retries}):`, err.message || err);
    }

    await wait(delayMs * (i + 1)); // backoff lineal
  }

  console.log('❌ No fue posible reconectar después de varios intentos');
  return false;
}


// Enviar mensaje programático
async function sendMessage(phone, message) {
  // Asegurarnos de que el socket esté listo antes de intentar enviar
  if (!isClientReady || !sock) {
    const ok = await ensureConnected(3, 2000);
    if (!ok) throw new Error('WhatsApp no está conectado');
  }

  try {
    // Limpiar y formatear número
    let cleanPhone = String(phone).trim();
    
    // Remover caracteres no numéricos excepto @
    if (!cleanPhone.includes('@')) {
      cleanPhone = cleanPhone.replace(/[^0-9]/g, '');
      
      // Si el número no tiene código de país, asumir Perú (+51)
      if (cleanPhone.length < 11 && !cleanPhone.startsWith('51')) {
        cleanPhone = '51' + cleanPhone;
      }
    }
    
    // Formatear número (agregar @s.whatsapp.net si no lo tiene)
    const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
    
    console.log(`📤 Enviando mensaje a: ${jid}`);
    console.log(`📝 Mensaje: ${message.substring(0, 50)}...`);
    
    // Intentar enviar con reintentos en caso de cierre de conexión
    const maxSendRetries = 2;
    for (let attempt = 0; attempt <= maxSendRetries; attempt++) {
      try {
        await sock.sendMessage(jid, { text: message });
        botStats.messagesSent++;
        console.log(`✅ Mensaje enviado exitosamente a ${jid}`);
        return { success: true, message: 'Mensaje enviado' };
      } catch (err) {
        // Detectar error de conexión cerrada y tratar de reconectar
        const statusCode = err?.output?.statusCode || null;
        const msg = err?.message || '';
        console.error(`❌ Error enviando mensaje (intento ${attempt + 1}):`, msg);

        if (statusCode === 428 || /Connection Closed/i.test(msg) || /closed/i.test(msg)) {
          console.log('🔄 Detectado socket cerrado, intentando reconectar antes de reintentar...');
          isClientReady = false;
          sock = null;
          const reok = await ensureConnected(3, 2000);
          if (!reok) {
            // Si no se puede reconectar, lanzar el error final
            throw err;
          }
          // conseguir nuevo socket en variable global 'sock' y reintentar
          continue;
        } else {
          // Si no es error de conexión, no reintentamos
          throw err;
        }
      }
    }

    // Si llegamos aquí, todos los reintentos fallaron
    throw new Error('No se pudo enviar el mensaje después de varios intentos');
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    botStats.errors++;
    throw error;
  }
}

// Limpiar sesión
async function clearSession() {
  try {
    console.log('🗑️ Limpiando sesión de WhatsApp...');
    
    // Desactivar reconexión automática
    shouldAutoReconnect = false;
    
    // Solo intentar logout si el socket está conectado
    if (sock && connectionStatus === 'connected') {
      try {
        await sock.logout();
        console.log('✅ Logout exitoso');
      } catch (logoutError) {
        console.log('⚠️ No se pudo hacer logout (conexión ya cerrada):', logoutError.message);
      }
    }
    
    // Limpiar socket
    sock = null;
    
    // Eliminar archivos de autenticación
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
      console.log('✅ Archivos de sesión eliminados');
    }
    
    connectionStatus = 'disconnected';
    isClientReady = false;
    qrCodeData = null;
    processedMessages.clear();
    
    // Recrear directorio
    fs.mkdirSync(SESSION_DIR, { recursive: true });
    
  } catch (error) {
    console.error('❌ Error limpiando sesión:', error);
    throw error;
  }
}

// ================================================
// API REST ENDPOINTS
// ================================================

// Página principal con QR viewer
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'qr-viewer.html'));
});

// Obtener estado de conexión y QR
app.get('/api/whatsapp/status', async (req, res) => {
  try {
    const hasSession = fs.existsSync(path.join(SESSION_DIR, 'creds.json'));
    
    res.json({
      status: connectionStatus,
      isReady: isClientReady,
      qrCode: qrCodeData,
      hasSession: hasSession,
      autoBotEnabled: autoBotEnabled,
      stats: {
        ...botStats,
        uptime: Math.floor((Date.now() - botStats.startTime.getTime()) / 1000)
      },
      message: 'WhatsApp Auto-Bot Service (Baileys)'
    });
  } catch (error) {
    console.error('❌ Error en /status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Inicializar conexión
app.post('/api/whatsapp/initialize', async (req, res) => {
  try {
    if (isClientReady) {
      return res.json({ success: true, message: 'WhatsApp ya está conectado' });
    }
    
    // Reactivar reconexión automática al inicializar
    shouldAutoReconnect = true;
    
    await connectToWhatsApp();
    res.json({ success: true, message: 'Conexión iniciada' });
  } catch (error) {
    console.error('❌ Error inicializando:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensaje (versión nueva con phone/message)
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: phone y message' 
      });
    }
    
    const result = await sendMessage(phone, message);
    res.json(result);
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensaje (compatibilidad con frontend - numero/mensaje)
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    // Soportar ambos formatos: {phone, message} y {numero, mensaje}
    const phone = req.body.phone || req.body.numero;
    const message = req.body.message || req.body.mensaje;
    
    if (!phone || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'Faltan parámetros requeridos: numero/phone y mensaje/message' 
      });
    }
    
    console.log(`📤 Enviando mensaje desde frontend a: ${phone}`);
    
    const result = await sendMessage(phone, message);
    
    // Formatear respuesta compatible con frontend
    res.json({
      success: true,
      message: 'Mensaje enviado correctamente',
      messageId: `baileys_${Date.now()}`,
      to: phone
    });
  } catch (error) {
    console.error('❌ Error enviando mensaje desde frontend:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al enviar mensaje',
      error: error.message 
    });
  }
});

// Limpiar sesión
app.post('/api/whatsapp/clear-session', async (req, res) => {
  try {
    await clearSession();
    res.json({ message: 'Sesión eliminada correctamente' });
  } catch (error) {
    console.error('❌ Error limpiando sesión:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle bot automático
app.post('/api/whatsapp/toggle-bot', async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ 
        error: 'Parámetro "enabled" debe ser boolean' 
      });
    }
    
    autoBotEnabled = enabled;
    console.log(`🤖 Bot automático ${enabled ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'}`);
    
    res.json({ 
      message: `Bot automático ${enabled ? 'activado' : 'desactivado'}`,
      autoBotEnabled: autoBotEnabled
    });
  } catch (error) {
    console.error('❌ Error en toggle-bot:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias para toggle-autobot (compatibilidad con frontend)
app.post('/api/whatsapp/toggle-autobot', async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ 
        error: 'Parámetro "enabled" debe ser boolean' 
      });
    }
    
    autoBotEnabled = enabled;
    console.log(`🤖 Bot automático ${enabled ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'}`);
    
    res.json({ 
      success: true,
      message: `Bot automático ${enabled ? 'activado' : 'desactivado'}`,
      autoBotEnabled: autoBotEnabled
    });
  } catch (error) {
    console.error('❌ Error en toggle-autobot:', error);
    res.status(500).json({ error: error.message });
  }
});

// Información del bot
app.get('/api/whatsapp/info', async (req, res) => {
  try {
    res.json({
      status: connectionStatus,
      isReady: isClientReady,
      autoBotEnabled: autoBotEnabled,
      botReadyTime: botReadyTime,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error obteniendo info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas del bot
app.get('/api/whatsapp/stats', async (req, res) => {
  try {
    res.json({
      ...botStats,
      uptime: Math.floor((new Date() - botStats.startTime) / 1000),
      autoBotEnabled: autoBotEnabled,
      connectionStatus: connectionStatus,
      isReady: isClientReady
    });
  } catch (error) {
    console.error('❌ Error obteniendo stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Bot (Baileys)'
  });
});

// ================================================
// INICIAR SERVIDOR
// ================================================

app.listen(PORT, async () => {
  console.log(`🚀 Servidor WhatsApp Bot corriendo en puerto ${PORT}`);
  console.log(`📡 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`🔧 Auto-inicialización: ${process.env.AUTO_INIT !== 'false' ? 'SI' : 'NO'}`);
  
  // Auto-inicializar si está configurado
  if (process.env.AUTO_INIT !== 'false') {
    console.log('🔄 Iniciando conexión automáticamente...');
    try {
      await connectToWhatsApp();
    } catch (error) {
      console.error('❌ Error en auto-inicialización:', error);
    }
  }
});

// Manejo de señales de terminación
process.on('SIGINT', async () => {
  console.log('\n⚠️ Recibido SIGINT - cerrando servidor...');
  if (sock) {
    await sock.logout();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Recibido SIGTERM - cerrando servidor...');
  if (sock) {
    await sock.logout();
  }
  process.exit(0);
});
