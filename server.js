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

let jarviController;
try {
    jarviController = require('./src/controllers/jarviController');
    console.log('✅ Controller JARVIS caricato');
} catch (err) {
    console.error('❌ Errore caricamento controller:', err.message);
    jarviController = {};
}

const safeBind = (obj, methodName) => {
    if (obj && typeof obj[methodName] === 'function') {
        return obj[methodName].bind(obj);
    }
    return (req, res) => {
        console.log(`⚠️ Mock endpoint: ${methodName}`);
        res.json({ success: true, message: `Endpoint ${methodName} in fase di sviluppo` });
    };
};

app.post('/api/auth/register-send-code', safeBind(jarviController, 'registerSendCode'));
app.post('/api/auth/register', safeBind(jarviController, 'register'));
app.post('/api/auth/verify-google-auth', safeBind(jarviController, 'verifyGoogleAuth'));
app.post('/api/auth/login', (req, res) => {
    const { email, password, secretWord, fingerprint, token } = req.body;
    console.log(`🔐 Tentativo login: ${email}`);
    
    if (email !== 'antonio.pepice08@gmail.com') {
        return res.status(403).json({ error: 'Email non autorizzata' });
    }
    
    if (!token) {
        return res.json({ requiresTwoFactor: true });
    }
    
    const jwtToken = jwt.sign({ email, name: 'Antonio' }, process.env.JWT_SECRET || 'jarvis_secret_key_2024', { expiresIn: '7d' });
    res.json({ success: true, token: jwtToken });
});
app.post('/api/auth/recover', safeBind(jarviController, 'recover'));
app.post('/api/auth/reset-password', safeBind(jarviController, 'resetPassword'));
app.post('/api/auth/change-password', safeBind(jarviController, 'changePassword'));
app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No token' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jarvis_secret_key_2024');
        res.json({ 
            success: true, 
            user: { 
                name: decoded.name || 'Antonio', 
                surname: 'Pepice', 
                email: decoded.email,
                twofa_enabled: true 
            } 
        });
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
app.put('/api/auth/profile', safeBind(jarviController, 'updateProfile'));

app.post('/api/chat', safeBind(jarviController, 'chat'));
app.post('/api/chat/history', safeBind(jarviController, 'chatWithHistory'));
app.post('/api/chat/new', safeBind(jarviController, 'newChat'));
app.get('/api/conversations', safeBind(jarviController, 'getConversations'));
app.get('/api/conversations/:id', safeBind(jarviController, 'getConversation'));
app.delete('/api/conversations/:id', safeBind(jarviController, 'deleteConversation'));

app.post('/api/translate', safeBind(jarviController, 'translate'));
app.post('/api/summarize', safeBind(jarviController, 'summarize'));
app.post('/api/code', safeBind(jarviController, 'generateCode'));
app.post('/api/debug', safeBind(jarviController, 'debugCode'));
app.post('/api/explain', safeBind(jarviController, 'explain'));
app.post('/api/exercise', safeBind(jarviController, 'createExercise'));
app.get('/api/models', safeBind(jarviController, 'getModels'));
app.post('/api/models/switch', safeBind(jarviController, 'switchModel'));
app.get('/api/system/info', safeBind(jarviController, 'getSystemInfo'));

app.get('/api/auth/github', (req, res) => {
    res.status(410).json({ error: 'Accesso GitHub rimosso' });
});
app.get('/api/auth/github/callback', (req, res) => {
    res.redirect('/');
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'JARVIS AI', version: '4.0.0', author: 'Antonio Pepice' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 J.A.R.V.I.S. v4.0 running on http://localhost:${PORT}`);
    console.log(`👨‍💻 Creato da Antonio Pepice`);
});
