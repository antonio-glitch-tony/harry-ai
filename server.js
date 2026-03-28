const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'jarvis_secret_key_2024';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database setup per Render (usa /tmp per i file temporanei)
const dbPath = process.env.RENDER ? '/tmp/jarvis.db' : path.join(__dirname, 'data', 'jarvis.db');
const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(dataDir) && !process.env.RENDER) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        surname TEXT,
        email TEXT UNIQUE,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER,
        role TEXT,
        content TEXT,
        sources TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )`);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// ============ AUTH ROUTES ============
app.post('/api/auth/register', async (req, res) => {
    const { name, surname, email, password } = req.body;
    
    if (!name || !surname || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
            'INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)',
            [name, surname, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                
                const token = jwt.sign({ id: this.lastID, email, name }, JWT_SECRET, { expiresIn: '7d' });
                res.json({ success: true, token, user: { id: this.lastID, name, surname, email } });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user.id, name: user.name, surname: user.surname, email: user.email } });
    });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    db.get('SELECT id, name, surname, email FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, user });
    });
});

// ============ CHAT ROUTES ============
app.post('/api/chat/new', authenticateToken, (req, res) => {
    const { title } = req.body;
    const defaultTitle = title || 'Nuova conversazione';
    
    db.run(
        'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
        [req.user.id, defaultTitle],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, conversationId: this.lastID });
        }
    );
});

app.post('/api/chat/history', authenticateToken, async (req, res) => {
    const { conversationId, message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    let convId = conversationId;
    
    if (!convId) {
        const title = message.substring(0, 50);
        const result = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
                [req.user.id, title],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
        convId = result;
    }
    
    // Save user message
    db.run(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [convId, 'user', message]
    );
    
    db.run('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [convId]);
    
    // Get conversation history
    const messages = await new Promise((resolve, reject) => {
        db.all(
            'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
            [convId],
            (err, rows) => resolve(rows || [])
        );
    });
    
    // Generate AI response
    const aiResponse = generateAIResponse(message, messages, req.user.name);
    const sources = [
        { title: 'Knowledge Base JARVIS', verified: true },
        { title: 'Documentazione Ufficiale', url: 'https://developer.mozilla.org', verified: true }
    ];
    
    // Save AI response with sources
    db.run(
        'INSERT INTO messages (conversation_id, role, content, sources) VALUES (?, ?, ?, ?)',
        [convId, 'assistant', aiResponse, JSON.stringify(sources)]
    );
    
    db.run('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [convId]);
    
    // Update conversation title if it's the first message
    if (messages.length === 0) {
        const newTitle = message.length > 40 ? message.substring(0, 40) + '...' : message;
        db.run('UPDATE conversations SET title = ? WHERE id = ?', [newTitle, convId]);
    }
    
    res.json({
        success: true,
        conversationId: convId,
        response: aiResponse,
        sources: sources
    });
});

app.get('/api/conversations', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, conversations: rows || [] });
        }
    );
});

app.get('/api/conversations/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.get(
        'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        (err, conversation) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
            
            db.all(
                'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
                [id],
                (err, messages) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true, conversation, messages: messages || [] });
                }
            );
        }
    );
});

app.delete('/api/conversations/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.run(
        'DELETE FROM conversations WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// AI Response Generator
function generateAIResponse(message, history, userName) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('codice') || lowerMessage.includes('code')) {
        return `Signor ${userName}, ecco il codice richiesto:

\`\`\`javascript
// Funzione esempio
function salutaUtente(nome) {
    return \`Ciao \${nome}, benvenuto in JARVIS!\`;
}

// Test
console.log(salutaUtente("${userName}"));
\`\`\`

[🔽 Clicca qui per scaricare il file]`;
    }
    
    if (lowerMessage.includes('traduci') || lowerMessage.includes('translate')) {
        return `Signor ${userName}, ecco la traduzione richiesta:\n\n"${message.replace(/traduci|translate/gi, '').trim()}" in italiano significa: **Traduzione generata**.\n\nFonte: Dizionario ufficiale.`;
    }
    
    return `Buongiorno ${userName}! Ho ricevuto la tua richiesta: "${message}".\n\nPosso aiutarti con:\n- Scrivere codice\n- Tradurre testi\n- Rispondere a domande\n- Analizzare file\n\nCosa desideri fare?`;
}

// System info endpoint
app.get('/api/system/info', (req, res) => {
    const now = new Date();
    res.json({
        success: true,
        date: now.toLocaleDateString('it-IT'),
        time: now.toLocaleTimeString('it-IT'),
        day: now.toLocaleDateString('it-IT', { weekday: 'long' })
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'JARVIS AI', version: '2.0.0', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('*', (req, res) => {
    if (!req.path.includes('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 JARVIS Server running on port ${PORT}`);
    console.log(`📁 Database: ${dbPath}`);
    console.log(`🌍 Environment: ${process.env.RENDER ? 'Render.com' : 'Local'}`);
});