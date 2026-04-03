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

/* ═══════════════════════════════════════════════════════════
   Ricerca Web — DuckDuckGo + Brave Search + SERPAPI
═══════════════════════════════════════════════════════════ */
app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || !query.trim()) {
            return res.json({ success: false, error: 'Query mancante' });
        }

        const axios = require('axios');
        const encodedQuery = encodeURIComponent(query.trim());
        const results = [];

        // ========== TENTATIVO 1: Brave Search API (gratuito) ==========
        const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
        if (BRAVE_API_KEY) {
            try {
                const braveRes = await axios.get(`https://api.search.brave.com/res/v1/web/search?q=${encodedQuery}&count=5`, {
                    headers: { 
                        'Accept': 'application/json',
                        'X-Subscription-Token': BRAVE_API_KEY 
                    },
                    timeout: 8000
                });
                if (braveRes.data.web?.results) {
                    braveRes.data.web.results.forEach(r => {
                        results.push({
                            title: r.title,
                            snippet: r.description?.substring(0, 300) || '',
                            url: r.url
                        });
                    });
                    console.log(`✅ Brave Search: ${braveRes.data.web.results.length} risultati`);
                }
            } catch(e) { console.log('Brave Search fallito:', e.message); }
        }

        // ========== TENTATIVO 2: DuckDuckGo Instant Answer ==========
        if (results.length === 0) {
            try {
                const ddgUrl = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1&t=barry_ai`;
                const ddgRes = await axios.get(ddgUrl, { timeout: 8000, headers: { 'User-Agent': 'BARRY-AI/5.0' } });
                const ddg = ddgRes.data;

                if (ddg.AbstractText) {
                    results.push({
                        title: ddg.Heading || query,
                        snippet: ddg.AbstractText.substring(0, 300),
                        url: ddg.AbstractURL || `https://duckduckgo.com/?q=${encodedQuery}`
                    });
                }

                if (ddg.RelatedTopics && ddg.RelatedTopics.length) {
                    ddg.RelatedTopics.slice(0, 5).forEach(t => {
                        if (t.Text && t.FirstURL) {
                            results.push({
                                title: t.Text.substring(0, 80),
                                snippet: t.Text.substring(0, 250),
                                url: t.FirstURL
                            });
                        }
                    });
                }
                console.log(`✅ DuckDuckGo: ${results.length} risultati`);
            } catch(e) { console.log('DuckDuckGo fallito:', e.message); }
        }

        // ========== TENTATIVO 3: Wikipedia ==========
        if (results.length === 0) {
            try {
                const wikiRes = await axios.get(`https://it.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`, { timeout: 5000 });
                if (wikiRes.data.extract) {
                    results.push({
                        title: wikiRes.data.title || query,
                        snippet: wikiRes.data.extract.substring(0, 400),
                        url: wikiRes.data.content_urls?.desktop?.page || `https://it.wikipedia.org/wiki/${encodedQuery}`
                    });
                    console.log(`✅ Wikipedia: 1 risultato`);
                }
            } catch(e) { console.log('Wikipedia fallito'); }
            
            // Tentativo Wikipedia inglese
            if (results.length === 0) {
                try {
                    const wikiEnRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`, { timeout: 5000 });
                    if (wikiEnRes.data.extract) {
                        results.push({
                            title: wikiEnRes.data.title || query,
                            snippet: wikiEnRes.data.extract.substring(0, 400),
                            url: wikiEnRes.data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedQuery}`
                        });
                        console.log(`✅ Wikipedia EN: 1 risultato`);
                    }
                } catch(e) { console.log('Wikipedia EN fallito'); }
            }
        }

        // ========== FALLBACK: Risposte predefinite per domande comuni ==========
        if (results.length === 0) {
            const lowerQuery = query.toLowerCase();
            
            // Chi ha vinto il mondiale 2010?
            if (lowerQuery.includes('mondiale') && lowerQuery.includes('2010')) {
                results.push({
                    title: 'Mondiale 2010 - Vincitore',
                    snippet: 'La Spagna ha vinto il Campionato Mondiale di Calcio 2010 in Sudafrica, battendo i Paesi Bassi 1-0 in finale con un gol di Andrés Iniesta ai supplementari.',
                    url: 'https://it.wikipedia.org/wiki/Campionato_mondiale_di_calcio_2010'
                });
            }
            // Chi ha creato BARRY?
            else if (lowerQuery.includes('chi ti ha creato') || lowerQuery.includes('tuo creatore')) {
                results.push({
                    title: 'Creatore di B.A.R.R.Y.',
                    snippet: 'Sono stato creato da Antonio Pepice, ingegnere informatico e sviluppatore full-stack.',
                    url: '#'
                });
            }
            // Ora e data
            else if (lowerQuery.includes('che ore') || lowerQuery.includes('che giorno') || lowerQuery.includes('data')) {
                const now = new Date();
                const romeDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
                results.push({
                    title: 'Data e ora attuali',
                    snippet: `${romeDate.toLocaleDateString('it-IT')} - ${romeDate.toLocaleTimeString('it-IT')} (fuso orario Roma)`,
                    url: '#'
                });
            }
            else {
                results.push({
                    title: `Cerca "${query}" online`,
                    snippet: `Non ho trovato risultati immediati. Puoi cercare manualmente su DuckDuckGo.`,
                    url: `https://duckduckgo.com/?q=${encodedQuery}`
                });
            }
        }

        // Genera riepilogo AI
        let aiSummary = null;
        try {
            if (results.length > 0 && barryController && process.env.OPENROUTER_API_KEY) {
                const snippets = results.slice(0, 3).map(r => r.snippet).filter(Boolean).join('\n');
                if (snippets.length > 50) {
                    const summaryData = await barryController._callOpenRouter([{
                        role: 'user',
                        content: `Riassumi brevemente in 2-3 frasi in italiano questi risultati di ricerca per la query "${query}":\n\n${snippets}`
                    }], 300);
                    aiSummary = summaryData;
                }
            }
        } catch(e) { /* silenzioso */ }

        res.json({ success: true, results: results.slice(0, 6), aiSummary, query });
    } catch (err) {
        console.error('❌ Errore ricerca:', err.message);
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/code',                barryController.generateCode.bind(barryController));
app.post('/api/debug',               barryController.debugCode.bind(barryController));
app.post('/api/explain',             barryController.explain.bind(barryController));
app.post('/api/exercise',            barryController.createExercise.bind(barryController));
app.post('/api/generate-image',      barryController.generateImage.bind(barryController));
app.get('/api/models',               barryController.getModels.bind(barryController));
app.post('/api/models/switch',       barryController.switchModel.bind(barryController));
app.get('/api/system/info',          barryController.getSystemInfo.bind(barryController));
app.get('/api/weather',              barryController.getWeather.bind(barryController));

/* ═══════════════════════════════════════════════════════════
   Auth Routes
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
app.get('/api/auth/github',               barryController.githubLogin.bind(barryController));
app.get('/api/auth/github/callback',      barryController.githubCallback.bind(barryController));

/* ═══════════════════════════════════════════════════════════
   Health Check
═══════════════════════════════════════════════════════════ */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'B.A.R.R.Y.', 
        version: '5.0.0', 
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
    console.log('🚀 B.A.R.R.Y. v5.0 - Brainy Adaptive Responsive Robotic Intelligence');
    console.log('═'.repeat(60));
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`👨‍💻 Creato da Antonio Pepice`);
    console.log(`🔐 2FA: Attivo con Google Authenticator`);
    console.log(`📧 Verifica email: Attiva`);
    console.log(`🔒 Crittografia: AES-256-GCM per tutti i dati`);
    console.log(`🤖 AI Model: OpenRouter`);
    console.log(`🖼️ Generazione Immagini: Pollinations + Fallback`);
    console.log(`🔍 Ricerca Web: DuckDuckGo + Brave + Wikipedia`);
    console.log(`🌤️ Meteo: wttr.in`);
    console.log(`⏰ Timezone: Europe/Rome`);
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