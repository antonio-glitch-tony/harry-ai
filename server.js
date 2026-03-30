require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Importa controller
let jarviController;
try {
    jarviController = require('./src/controllers/jarviController');
    console.log('✅ Controller JARVIS caricato');
} catch (err) {
    console.error('❌ Errore:', err.message);
    jarviController = {};
}

// Helper per verificare se un metodo esiste
const safeBind = (obj, methodName) => {
    if (obj && typeof obj[methodName] === 'function') {
        return obj[methodName].bind(obj);
    }
    // Fallback mock
    return (req, res) => res.json({ success: true, message: `Mock ${methodName}` });
};

// ── ROUTES con fallback ──
app.post('/api/auth/register-send-code', safeBind(jarviController, 'registerSendCode'));
app.post('/api/auth/register', safeBind(jarviController, 'register'));
app.post('/api/auth/register-confirm-ga', safeBind(jarviController, 'registerConfirmGA'));
app.post('/api/auth/login', (req, res) => {
    // Login mock per test
    const { email, password, secretWord, fingerprint, token } = req.body;
    if (email !== 'antonio.pepice08@gmail.com') {
        return res.status(403).json({ error: 'Email non autorizzata' });
    }
    if (!token) {
        return res.json({ requiresTwoFactor: true });
    }
    const jwtToken = jwt.sign({ email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ success: true, token: jwtToken });
});
app.post('/api/auth/recover', safeBind(jarviController, 'recover'));
app.post('/api/auth/reset-password', safeBind(jarviController, 'resetPassword'));
app.post('/api/auth/change-password', safeBind(jarviController, 'changePassword'));
app.get('/api/auth/me', safeBind(jarviController, 'me'));
app.put('/api/auth/profile', safeBind(jarviController, 'updateProfile'));

// Chat routes
app.post('/api/chat', safeBind(jarviController, 'chat'));
app.post('/api/chat/history', safeBind(jarviController, 'chatWithHistory'));
app.post('/api/chat/new', safeBind(jarviController, 'newChat'));
app.get('/api/conversations', safeBind(jarviController, 'getConversations'));
app.get('/api/conversations/:id', safeBind(jarviController, 'getConversation'));
app.delete('/api/conversations/:id', safeBind(jarviController, 'deleteConversation'));

// Special routes
app.post('/api/translate', safeBind(jarviController, 'translate'));
app.post('/api/summarize', safeBind(jarviController, 'summarize'));
app.post('/api/code', safeBind(jarviController, 'generateCode'));
app.post('/api/debug', safeBind(jarviController, 'debugCode'));
app.post('/api/explain', safeBind(jarviController, 'explain'));
app.post('/api/exercise', safeBind(jarviController, 'createExercise'));
app.get('/api/models', safeBind(jarviController, 'getModels'));
app.post('/api/models/switch', safeBind(jarviController, 'switchModel'));
app.get('/api/system/info', safeBind(jarviController, 'getSystemInfo'));

// GitHub
app.get('/api/auth/github', safeBind(jarviController, 'githubLogin'));
app.get('/api/auth/github/callback', safeBind(jarviController, 'githubCallback'));

// Health
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'JARVIS AI', version: '2.2.0' });
});

// Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});