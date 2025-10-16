const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Estado simple para testing
let connectionStatus = 'disconnected';

// Ruta de prueba
app.get('/api/whatsapp/status', (req, res) => {
    console.log('Status endpoint called');
    res.json({
        status: connectionStatus,
        isReady: false,
        qrCode: null,
        hasSession: false,
        message: 'Simple test server running'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Inicializar endpoint
app.post('/api/whatsapp/initialize', (req, res) => {
    console.log('Initialize endpoint called');
    connectionStatus = 'qr_received';
    res.json({
        success: true,
        message: 'Test initialization',
        status: connectionStatus
    });
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
    console.log(`Test WhatsApp Server running on port ${PORT}`);
    console.log(`Test URL: http://localhost:${PORT}/api/test`);
    console.log(`Status URL: http://localhost:${PORT}/api/whatsapp/status`);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('Shutting down test server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Shutting down test server...');
    process.exit(0);
});