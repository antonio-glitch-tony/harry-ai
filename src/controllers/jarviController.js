/* ═══════════════════════════════════════════════════════════
   J.A.R.V.I.S. — Controller (Solo Google Authenticator + Fingerprint)
   ═══════════════════════════════════════════════════════════ */
const aiService = require('../services/aiService');
const chatDB = require('../database/chatDB');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const ALLOWED_EMAIL = 'antonio.pepice08@gmail.com';
const JWT_SECRET = process.env.JWT_SECRET || 'jarvis_secret_key_2024';

class JarviController {

    async newChat(req, res) {
        try {
            const { title } = req.body;
            const conversationId = await chatDB.createConversation(title);
            res.json({ success: true, conversationId });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async chatWithHistory(req, res) {
        try {
            const { conversationId, message, options } = req.body;
            if (!message) return res.status(400).json({ error: 'Message is required' });

            let convId = conversationId;
            if (!convId) {
                convId = await chatDB.createConversation(message.substring(0, 50));
            }

            await chatDB.saveMessage(convId, 'user', message);
            chatDB.updateConversationTime(convId);

            const history = await chatDB.getMessages(convId);
            const messages = history.map(m => ({ role: m.role, content: m.content }));

            const result = await aiService.sendMessage(messages, options || {});

            if (result.success) {
                await chatDB.saveMessage(convId, 'assistant', result.response);
                chatDB.updateConversationTime(convId);
                res.json({ success: true, conversationId: convId, response: result.response });
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async getConversations(req, res) {
        try {
            const conversations = await chatDB.getConversations();
            res.json({ success: true, conversations });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async getConversation(req, res) {
        try {
            const { id } = req.params;
            const messages = await chatDB.getMessages(id);
            const conversations = await chatDB.getConversations();
            const conversation = conversations.find(c => c.id == id);
            res.json({ success: true, conversation, messages });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async deleteConversation(req, res) {
        try {
            await chatDB.deleteConversation(req.params.id);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async chat(req, res) {
        try {
            const { messages, options } = req.body;
            if (!messages || !Array.isArray(messages))
                return res.status(400).json({ error: 'Messages array is required' });
            const result = await aiService.sendMessage(messages, options || {});
            if (result.success) {
                res.json({ success: true, response: result.response });
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async translate(req, res) {
        try {
            const { text, targetLanguage } = req.body;
            const result = await aiService.handleSpecialRequest('translate', text, { targetLanguage });
            result.success ? res.json({ success: true, translation: result.response }) : res.status(500).json({ error: result.error });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async summarize(req, res) {
        try {
            const { text } = req.body;
            const result = await aiService.handleSpecialRequest('summarize', text);
            result.success ? res.json({ success: true, summary: result.response }) : res.status(500).json({ error: result.error });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async generateCode(req, res) {
        try {
            const { prompt, language } = req.body;
            const result = await aiService.handleSpecialRequest('code', prompt, { language });
            result.success ? res.json({ success: true, code: result.response }) : res.status(500).json({ error: result.error });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async debugCode(req, res) {
        try {
            const { code } = req.body;
            const result = await aiService.handleSpecialRequest('debug', code);
            result.success ? res.json({ success: true, debugged: result.response }) : res.status(500).json({ error: result.error });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async explain(req, res) {
        try {
            const { concept } = req.body;
            const result = await aiService.handleSpecialRequest('explain', concept);
            result.success ? res.json({ success: true, explanation: result.response }) : res.status(500).json({ error: result.error });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async createExercise(req, res) {
        try {
            const { topic, type, level } = req.body;
            const result = await aiService.handleSpecialRequest('exercise', topic, { type, level });
            result.success ? res.json({ success: true, exercise: result.response }) : res.status(500).json({ error: result.error });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async getModels(req, res) {
        try {
            const config = require('../../config/config');
            res.json({ success: true, models: config.models });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async switchModel(req, res) {
        try {
            const config = require('../../config/config');
            const { modelKey } = req.body;
            if (config.models[modelKey]) {
                aiService.defaultModel = config.models[modelKey];
                res.json({ success: true, currentModel: aiService.defaultModel });
            } else {
                res.status(400).json({ error: 'Model not found' });
            }
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async getSystemInfo(req, res) {
        try {
            const now = new Date();
            res.json({
                success: true,
                date: now.toLocaleDateString('it-IT'),
                time: now.toLocaleTimeString('it-IT'),
                day: now.toLocaleDateString('it-IT', { weekday: 'long' })
            });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    // ============ AUTH (SENZA CODICE EMAIL) ============
    
    // REGISTRAZIONE - Step 1: crea utente e genera QR per Google Authenticator
    async register(req, res) {
        try {
            const { name, surname, email, password, secretWord, fingerprint } = req.body;
            
            if (!name || !surname || !email || !password || !secretWord || !fingerprint) {
                return res.status(400).json({ error: 'Tutti i campi obbligatori (nome, cognome, email, password, parola segreta, fingerprint)' });
            }

            const normalizedEmail = email.trim().toLowerCase();

            if (normalizedEmail !== ALLOWED_EMAIL) {
                return res.status(403).json({ error: 'Email non autorizzata.' });
            }

            // Hash delle credenziali
            const hashedPassword = await bcrypt.hash(password, 10);
            const hashedSecretWord = await bcrypt.hash(secretWord, 10);

            // Genera secret per Google Authenticator
            const secret = speakeasy.generateSecret({
                name: `JARVIS (${normalizedEmail})`,
                length: 20
            });

            // Salva utente in memoria (in produzione usare database)
            if (!global._users) global._users = {};
            
            global._users[normalizedEmail] = {
                name,
                surname,
                email: normalizedEmail,
                password: hashedPassword,
                secretWord: hashedSecretWord,
                fingerprint,
                gaSecret: secret.base32,
                twofaEnabled: true,
                createdAt: Date.now()
            };

            // Genera QR code
            const qrCode = await qrcode.toDataURL(secret.otpauth_url);

            console.log(`🎉 Utente registrato: ${normalizedEmail}`);
            console.log(`🔐 Secret TOTP: ${secret.base32}`);

            res.json({ 
                success: true, 
                requiresGoogleAuth: true, 
                qrCode,
                message: 'Scansiona il QR code con Google Authenticator'
            });

        } catch (e) {
            console.error('Errore register:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // REGISTRAZIONE - Step 2: verifica Google Authenticator e completa
    async verifyGoogleAuth(req, res) {
        try {
            const { email, gaCode } = req.body;
            if (!email || !gaCode) {
                return res.status(400).json({ error: 'Email e codice Google Auth richiesti' });
            }

            const normalizedEmail = email.trim().toLowerCase();
            const user = global._users?.[normalizedEmail];

            if (!user) {
                return res.status(400).json({ error: 'Utente non trovato. Ricomincia la registrazione.' });
            }

            if (user.completed) {
                return res.status(400).json({ error: 'Utente già registrato. Procedi con il login.' });
            }

            // Verifica codice TOTP
            const verified = speakeasy.totp.verify({
                secret: user.gaSecret,
                encoding: 'base32',
                token: gaCode.toString().trim(),
                window: 1
            });

            if (!verified) {
                return res.status(400).json({ error: 'Codice Google Authenticator non valido' });
            }

            // Marca utente come completato
            user.completed = true;
            user.registeredAt = Date.now();

            console.log(`✅ Registrazione completata con 2FA: ${normalizedEmail}`);

            // Genera token JWT
            const token = jwt.sign(
                { email: normalizedEmail, name: user.name },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({ 
                success: true, 
                token, 
                message: 'Benvenuto in JARVIS! Autenticazione a due fattori attiva.' 
            });

        } catch (e) {
            console.error('Errore verifyGoogleAuth:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // LOGIN con password + parola segreta + fingerprint + 2FA
    async login(req, res) {
        try {
            const { email, password, secretWord, fingerprint, token } = req.body;

            if (!email || !password || !secretWord || !fingerprint) {
                return res.status(400).json({ error: 'Email, password, parola segreta e fingerprint richiesti' });
            }

            const normalizedEmail = email.trim().toLowerCase();

            if (normalizedEmail !== ALLOWED_EMAIL) {
                return res.status(403).json({ error: 'Email non autorizzata.' });
            }

            const user = global._users?.[normalizedEmail];

            if (!user || !user.completed) {
                return res.status(400).json({ error: 'Utente non trovato. Devi prima registrarti.' });
            }

            // Verifica password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Password errata' });
            }

            // Verifica parola segreta
            const validSecretWord = await bcrypt.compare(secretWord, user.secretWord);
            if (!validSecretWord) {
                return res.status(400).json({ error: 'Parola segreta errata' });
            }

            // Verifica fingerprint
            if (user.fingerprint !== fingerprint) {
                return res.status(400).json({ error: 'Impronta digitale non riconosciuta' });
            }

            // Se 2FA è attivo e non c'è il token, richiedilo
            if (user.twofaEnabled && !token) {
                return res.json({ requiresTwoFactor: true });
            }

            // Verifica codice 2FA
            if (user.twofaEnabled && token) {
                const verified = speakeasy.totp.verify({
                    secret: user.gaSecret,
                    encoding: 'base32',
                    token: token.toString().trim(),
                    window: 1
                });

                if (!verified) {
                    return res.status(400).json({ error: 'Codice 2FA non valido' });
                }
            }

            // Genera token JWT
            const jwtToken = jwt.sign(
                { email: normalizedEmail, name: user.name },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            console.log(`🔐 Login effettuato: ${normalizedEmail}`);
            res.json({ success: true, token: jwtToken });

        } catch (e) {
            console.error('Errore login:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // RECOVER - Reset password (semplificato)
    async recover(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email richiesta' });
            res.json({ success: true, message: 'Contatta l\'amministratore per il reset della password.' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async resetPassword(req, res) {
        try {
            const { email, newPassword } = req.body;
            const normalizedEmail = email.trim().toLowerCase();
            
            if (global._users?.[normalizedEmail]) {
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                global._users[normalizedEmail].password = hashedPassword;
                console.log(`✅ Password resettata per: ${normalizedEmail}`);
            }
            
            res.json({ success: true, message: 'Password aggiornata.' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async changePassword(req, res) {
        try {
            const { email, currentPassword, newPassword } = req.body;
            const normalizedEmail = email.trim().toLowerCase();
            const user = global._users?.[normalizedEmail];
            
            if (user) {
                const valid = await bcrypt.compare(currentPassword, user.password);
                if (valid) {
                    user.password = await bcrypt.hash(newPassword, 10);
                    console.log(`✅ Password cambiata per: ${normalizedEmail}`);
                }
            }
            
            res.json({ success: true, message: 'Password aggiornata.' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async me(req, res) {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) return res.status(401).json({ error: 'No token' });

            const decoded = jwt.verify(token, JWT_SECRET);
            const user = global._users?.[decoded.email];
            
            res.json({
                success: true,
                user: {
                    name: user?.name || 'Antonio',
                    surname: user?.surname || 'Pepice',
                    email: decoded.email,
                    twofa_enabled: true
                }
            });
        } catch (e) {
            res.status(401).json({ error: 'Invalid token' });
        }
    }

    async updateProfile(req, res) {
        try {
            const { name, surname } = req.body;
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (global._users?.[decoded.email]) {
                    global._users[decoded.email].name = name;
                    global._users[decoded.email].surname = surname;
                }
            }
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    githubLogin(req, res) {
        res.status(410).json({ error: 'Accesso GitHub rimosso.' });
    }

    async githubCallback(req, res) {
        res.redirect('/');
    }
}

module.exports = new JarviController();