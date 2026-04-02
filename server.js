// server.js - Entry point per B.A.R.R.Y. AI Assistant
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

// Importa il controller BARRY
const barryController = require('./src/controllers/BarryController');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ═══════════════════════════════════════════════════════════
   API Routes Chat - B.A.R.R.Y.
═══════════════════════════════════════════════════════════ */
app.post('/api/chat',                barryController.chat.bind(barryController));
app.post('/api/chat/history',        barryController.chatWithHistory.bind(barryController));
app.post('/api/chat/new',            barryController.newChat.bind(barryController));
app.get('/api/conversations',        barryController.getConversations.bind(barryController));
app.get('/api/conversations/:id',    barryController.getConversation.bind(barryController));
app.delete('/api/conversations/:id', barryController.deleteConversation.bind(barryController));

/* ═══════════════════════════════════════════════════════════
   API Routes Speciali
═══════════════════════════════════════════════════════════ */
app.post('/api/translate',           barryController.translate.bind(barryController));
app.post('/api/summarize',           barryController.summarize.bind(barryController));
app.post('/api/code',                barryController.generateCode.bind(barryController));
app.post('/api/debug',               barryController.debugCode.bind(barryController));
app.post('/api/explain',             barryController.explain.bind(barryController));
app.post('/api/exercise',            barryController.createExercise.bind(barryController));
app.post('/api/generate-image', barryController.generateImage.bind(barryController));
app.get('/api/models',               barryController.getModels.bind(barryController));
app.post('/api/models/switch',       barryController.switchModel.bind(barryController));
app.get('/api/system/info',          barryController.getSystemInfo.bind(barryController));

/* ═══════════════════════════════════════════════════════════
   Auth Routes - COMPLETE CON CRITTOGRAFIA
═══════════════════════════════════════════════════════════ */
app.post('/api/auth/register-send-code',  barryController.registerSendCode.bind(barryController));
app.post('/api/auth/verify-email-code',   barryController.verifyEmailCode.bind(barryController));
app.post('/api/auth/register',            barryController.register.bind(barryController));
app.post('/api/auth/register-confirm-ga', barryController.registerConfirmGA.bind(barryController));
app.post('/api/auth/verify-google-auth',  barryController.verifyGoogleAuth.bind(barryController));
app.post('/api/auth/login',               barryController.login.bind(barryController));
app.post('/api/auth/recover',             barryController.recover.bind(barryController));
app.post('/api/auth/reset-password',      barryController.resetPassword.bind(barryController));
app.post('/api/auth/change-password',     barryController.changePassword.bind(barryController));
app.get('/api/auth/me',                   barryController.me.bind(barryController));
app.put('/api/auth/profile',              barryController.updateProfile.bind(barryController));
app.post('/api/auth/resend-code',         barryController.resendVerificationCode.bind(barryController));

// Route di debug (solo per sviluppo)
app.post('/api/auth/debug/reset-users',   (req, res) => {
    if (global._users) {
        global._users = {};
        res.json({ success: true, message: 'Utenti resettati' });
    } else {
        res.json({ success: true, message: 'Nessun utente da resettare' });
    }
});

app.get('/api/auth/debug/users', (req, res) => {
    const users = global._users ? Object.keys(global._users).map(email => ({
        email,
        completed: global._users[email].completed,
        hasFingerprint: !!global._users[email].fingerprint,
        emailVerified: global._users[email].emailVerified || false,
        encrypted: !!global._users[email].encryptedData
    })) : [];
    res.json({ success: true, users });
});

/* ═══════════════════════════════════════════════════════════
   GitHub OAuth — RIMOSSO
═══════════════════════════════════════════════════════════ */
app.get('/api/auth/github',          barryController.githubLogin.bind(barryController));
app.get('/api/auth/github/callback', barryController.githubCallback.bind(barryController));

/* ═══════════════════════════════════════════════════════════
   Health Check
═══════════════════════════════════════════════════════════ */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'B.A.R.R.Y.', 
        version: '4.1.0', 
        platform: 'OpenRouter',
        creator: 'Antonio Pepice',
        uptime: process.uptime(),
        encryption: 'AES-256-GCM'
    });
});

/* ═══════════════════════════════════════════════════════════
   Root - Serve index.html
═══════════════════════════════════════════════════════════ */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

/* ═══════════════════════════════════════════════════════════
   Error handling middleware
═══════════════════════════════════════════════════════════ */
app.use((err, req, res, next) => {
    console.error('❌ Errore server:', err);
    res.status(500).json({ error: 'Errore interno del server' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route non trovata' });
});

/* ═══════════════════════════════════════════════════════════
   Avvio del server
═══════════════════════════════════════════════════════════ */
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
    console.log('═'.repeat(60));
    console.log('🚀 B.A.R.R.Y. v4.1 - Brainy Adaptive Responsive Robotic Intelligence');
    console.log('═'.repeat(60));
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`👨‍💻 Creato da Antonio Pepice`);
    console.log(`🔐 2FA: Attivo con Google Authenticator`);
    console.log(`📧 Verifica email: Attiva`);
    console.log(`🆔 Fingerprint: SHA-256`);
    console.log(`🔒 Crittografia: AES-256-GCM per tutti i dati`);
    console.log(`💬 Messaggi criptati: SI (end-to-end encryption)`);
    console.log(`🤖 AI Model: OpenRouter`);
    console.log(`🖼️ Generazione Immagini: Pollinations AI (gratuita)`);
    console.log('═'.repeat(60));
});

process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM ricevuto, chiusura graceful...');
    server.close(() => {
        console.log('✅ Server chiuso');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT ricevuto, chiusura graceful...');
    server.close(() => {
        console.log('✅ Server chiuso');
        process.exit(0);
    });
});