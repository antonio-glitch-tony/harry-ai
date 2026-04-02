/* ═══════════════════════════════════════════════════════════
   B.A.R.R.Y. — Controller v5.0 ENCRYPTED EDITION
   • Tutti i dati utente sono criptati con AES-256-GCM
   • Le chiavi sono derivate da email + secret word
   • I messaggi sono criptati individualmente
   ═══════════════════════════════════════════════════════════ */
const aiService = require('../services/aiService');
const chatDB    = require('../database/chatDB');
const encryptionService = require('../services/encryptionService');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode    = require('qrcode');
const nodemailer = require('nodemailer');

const ALLOWED_EMAIL = 'antonio.pepice08@gmail.com';
const JWT_SECRET    = process.env.JWT_SECRET || 'barry_secret_key_2024';

// Configurazione email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Store temporaneo
const verificationCodes = new Map();
const pendingRegistrations = new Map();

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, code) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🔐 B.A.R.R.Y. - Codice di Verifica',
        html: `
            <div style="font-family: 'Courier New', monospace; background: #0a0a0a; padding: 30px; border-radius: 10px; border: 1px solid #00e8ff;">
                <h1 style="color: #00e8ff; text-align: center;">B.A.R.R.Y.</h1>
                <h2 style="color: #00e8ff; text-align: center;">Sistema di Autenticazione</h2>
                <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #fff; font-size: 16px;">Il tuo codice di verifica è:</p>
                    <div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #00e8ff; background: #000; padding: 15px; border-radius: 5px;">
                        ${code}
                    </div>
                    <p style="color: #888; font-size: 12px; text-align: center; margin-top: 15px;">
                        Questo codice scade tra 10 minuti.
                    </p>
                </div>
                <p style="color: #666; text-align: center; font-size: 12px;">
                    Se non hai richiesto tu questa verifica, ignora questo messaggio.
                </p>
                <hr style="border-color: #333;">
                <p style="color: #444; text-align: center; font-size: 10px;">
                    B.A.R.R.Y. - Creato da Antonio Pepice
                </p>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email di verifica inviata a: ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Errore invio email:', error);
        return false;
    }
}

function getUserIdFromReq(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return null;
    try {
        const token   = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.email ? decoded.email.trim().toLowerCase() : null;
    } catch (e) {
        return null;
    }
}

class BarryController {

    /* ══════════════════════════════════
       VERIFICA EMAIL
    ══════════════════════════════════ */
    
    async registerSendCode(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email richiesta' });
            
            const normalizedEmail = email.trim().toLowerCase();
            if (normalizedEmail !== ALLOWED_EMAIL) {
                return res.status(403).json({ error: 'Email non autorizzata.' });
            }
            
            if (global._users && global._users[normalizedEmail] && global._users[normalizedEmail].completed) {
                return res.status(400).json({ error: 'Utente già registrato. Procedi con il login.' });
            }
            
            const code = generateVerificationCode();
            const expiresAt = Date.now() + 10 * 60 * 1000;
            verificationCodes.set(normalizedEmail, { code, expiresAt });
            
            const emailSent = await sendVerificationEmail(normalizedEmail, code);
            if (!emailSent) {
                return res.status(500).json({ error: 'Errore nell\'invio dell\'email. Riprova.' });
            }
            
            res.json({ success: true, message: 'Codice di verifica inviato alla tua email.', email: normalizedEmail });
        } catch (e) {
            console.error('Errore registerSendCode:', e);
            res.status(500).json({ error: e.message });
        }
    }
    
    async verifyEmailCode(req, res) {
        try {
            const { email, code } = req.body;
            if (!email || !code) return res.status(400).json({ error: 'Email e codice richiesti' });
            
            const normalizedEmail = email.trim().toLowerCase();
            const storedCode = verificationCodes.get(normalizedEmail);
            
            if (!storedCode) {
                return res.status(400).json({ error: 'Nessun codice di verifica attivo. Richiedi un nuovo codice.' });
            }
            if (storedCode.expiresAt < Date.now()) {
                verificationCodes.delete(normalizedEmail);
                return res.status(400).json({ error: 'Codice scaduto. Richiedi un nuovo codice.' });
            }
            if (storedCode.code !== code) {
                return res.status(400).json({ error: 'Codice non valido.' });
            }
            
            verificationCodes.delete(normalizedEmail);
            pendingRegistrations.set(normalizedEmail, { emailVerified: true, verifiedAt: Date.now() });
            
            res.json({ success: true, message: 'Email verificata con successo.', emailVerified: true });
        } catch (e) {
            console.error('Errore verifyEmailCode:', e);
            res.status(500).json({ error: e.message });
        }
    }
    
    async resendVerificationCode(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email richiesta' });
            
            const normalizedEmail = email.trim().toLowerCase();
            if (normalizedEmail !== ALLOWED_EMAIL) {
                return res.status(403).json({ error: 'Email non autorizzata.' });
            }
            
            const code = generateVerificationCode();
            const expiresAt = Date.now() + 10 * 60 * 1000;
            verificationCodes.set(normalizedEmail, { code, expiresAt });
            
            const emailSent = await sendVerificationEmail(normalizedEmail, code);
            if (!emailSent) {
                return res.status(500).json({ error: 'Errore nell\'invio dell\'email.' });
            }
            
            res.json({ success: true, message: 'Nuovo codice inviato.' });
        } catch (e) {
            console.error('Errore resendVerificationCode:', e);
            res.status(500).json({ error: e.message });
        }
    }

    /* ══════════════════════════════════
       REGISTRAZIONE CON CRITTOGRAFIA
    ══════════════════════════════════ */

    async register(req, res) {
        try {
            const { name, surname, email, password, secretWord, fingerprint } = req.body;

            if (!name || !surname || !email || !password || !secretWord || !fingerprint) {
                return res.status(400).json({ error: 'Tutti i campi obbligatori' });
            }

            const normalizedEmail = email.trim().toLowerCase();
            if (normalizedEmail !== ALLOWED_EMAIL) {
                return res.status(403).json({ error: 'Email non autorizzata.' });
            }
            
            const pendingReg = pendingRegistrations.get(normalizedEmail);
            if (!pendingReg || !pendingReg.emailVerified) {
                return res.status(400).json({ error: 'Devi prima verificare la tua email.' });
            }

            if (global._users && global._users[normalizedEmail] && global._users[normalizedEmail].completed) {
                return res.status(400).json({ error: 'Utente già registrato.' });
            }

            // Deriva la chiave di cifratura dalla secret word (NON dalla password!)
            // La secret word è usata come passphrase per la crittografia end-to-end
            const { key: encryptionKey, salt: encryptionSalt } = await encryptionService.deriveKey(secretWord);
            
            // Cripta i dati sensibili con la chiave derivata
            const encryptedName = encryptionService.encrypt(name, encryptionKey);
            const encryptedSurname = encryptionService.encrypt(surname, encryptionKey);
            
            // Hash delle credenziali per l'autenticazione (bcrypt, non reversibile)
            const hashedPassword = await bcrypt.hash(password, 10);
            const hashedSecretWord = await bcrypt.hash(secretWord, 10);

            // Genera secret per 2FA
            const secret = speakeasy.generateSecret({
                name: `B.A.R.R.Y. (${normalizedEmail})`,
                length: 32
            });

            if (!global._users) global._users = {};
            
            // Salva TUTTI i dati criptati
            global._users[normalizedEmail] = {
                // Dati criptati
                encryptedName: encryptedName,
                encryptedSurname: encryptedSurname,
                encryptionSalt: encryptionSalt,
                // Hash per autenticazione
                passwordHash: hashedPassword,
                secretWordHash: hashedSecretWord,
                fingerprintHash: encryptionService.hash(fingerprint),
                // 2FA
                gaSecret: secret.base32,
                twofaEnabled: true,
                // Stato
                completed: false,
                emailVerified: true,
                registeredAt: null,
                // Timestamp
                createdAt: Date.now()
            };

            console.log(`📝 Registrazione iniziata (CRIPTATA): ${normalizedEmail}`);

            const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
            pendingRegistrations.delete(normalizedEmail);

            res.json({
                success: true,
                requiresGoogleAuth: true,
                qrCode: qrDataUrl,
                secret: secret.base32,
                message: 'Scansiona il QR con Google Authenticator'
            });
        } catch (e) {
            console.error('Errore register:', e);
            res.status(500).json({ error: e.message });
        }
    }

    async verifyGoogleAuth(req, res) {
        try {
            const { email, gaCode } = req.body;
            if (!email || !gaCode) return res.status(400).json({ error: 'Email e codice GA richiesti' });

            const normalizedEmail = email.trim().toLowerCase();
            const user = global._users?.[normalizedEmail];

            if (!user) return res.status(400).json({ error: 'Utente non trovato.' });
            if (user.completed) return res.status(400).json({ error: 'Utente già registrato.' });

            const verified = speakeasy.totp.verify({
                secret: user.gaSecret,
                encoding: 'base32',
                token: gaCode.toString().trim(),
                window: 2
            });
            
            if (!verified) return res.status(400).json({ error: 'Codice Google Authenticator non valido' });

            user.completed = true;
            user.registeredAt = Date.now();
            console.log(`✅ Registrazione completata (CRIPTATA): ${normalizedEmail}`);

            const token = jwt.sign(
                { email: normalizedEmail, name: '[CRIPTATO]' },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            res.json({ success: true, token, message: 'Benvenuto in BARRY! 2FA attiva.' });
        } catch (e) {
            console.error('Errore verifyGoogleAuth:', e);
            res.status(500).json({ error: e.message });
        }
    }

    async registerConfirmGA(req, res) {
        return this.verifyGoogleAuth(req, res);
    }

    /* ══════════════════════════════════
       LOGIN CON DECRIPTAZIONE
    ══════════════════════════════════ */

    async login(req, res) {
        try {
            const { email, password, secretWord, fingerprint, token } = req.body;
            
            console.log(`🔐 Tentativo login per: ${email}`);
            
            if (!email || !password || !secretWord || !fingerprint) {
                return res.status(400).json({ error: 'Tutti i campi richiesti' });
            }

            const normalizedEmail = email.trim().toLowerCase();
            if (normalizedEmail !== ALLOWED_EMAIL) {
                return res.status(403).json({ error: 'Email non autorizzata.' });
            }

            const user = global._users?.[normalizedEmail];
            
            if (!user || !user.completed) {
                return res.status(400).json({ error: 'Utente non trovato. Devi prima registrarti.' });
            }

            // Verifica password (bcrypt)
            const validPassword = await bcrypt.compare(password, user.passwordHash);
            if (!validPassword) return res.status(400).json({ error: 'Password errata' });

            // Verifica secret word (bcrypt)
            const validSecretWord = await bcrypt.compare(secretWord, user.secretWordHash);
            if (!validSecretWord) return res.status(400).json({ error: 'Parola segreta errata' });

            // Verifica fingerprint
            const fingerprintHash = encryptionService.hash(fingerprint);
            if (user.fingerprintHash !== fingerprintHash) {
                console.log(`❌ Fingerprint mismatch!`);
                return res.status(400).json({ error: 'Impronta digitale non riconosciuta.' });
            }

            // 2FA
            if (user.twofaEnabled && !token) {
                return res.json({ requiresTwoFactor: true });
            }

            if (user.twofaEnabled && token) {
                const verified = speakeasy.totp.verify({
                    secret: user.gaSecret,
                    encoding: 'base32',
                    token: token.toString().trim(),
                    window: 2
                });
                if (!verified) return res.status(400).json({ error: 'Codice 2FA non valido' });
            }

            // 🔓 DERIVA LA CHIAVE DI CRITTOGRAFIA dalla secret word
            const { key: encryptionKey } = await encryptionService.deriveKey(secretWord, user.encryptionSalt);
            
            // 🔓 DECRIPTA i dati dell'utente per verifica
            let decryptedName = '';
            let decryptedSurname = '';
            try {
                decryptedName = encryptionService.decrypt(user.encryptedName, encryptionKey);
                decryptedSurname = encryptionService.decrypt(user.encryptedSurname, encryptionKey);
            } catch (decryptErr) {
                console.error('Errore decriptazione dati utente:', decryptErr);
                return res.status(400).json({ error: 'Errore di decriptazione. Contatta l\'amministratore.' });
            }

            // 🔑 Imposta la chiave nel database per decriptare i messaggi
            chatDB.setUserKey(normalizedEmail, encryptionKey);

            const jwtToken = jwt.sign(
                { email: normalizedEmail, name: decryptedName },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            console.log(`🔐 Login riuscito (DECRIPTATO): ${normalizedEmail}`);
            res.json({ 
                success: true, 
                token: jwtToken,
                user: {
                    name: decryptedName,
                    surname: decryptedSurname,
                    email: normalizedEmail
                }
            });
        } catch (e) {
            console.error('Errore login:', e);
            res.status(500).json({ error: e.message });
        }
    }

    async recover(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email richiesta' });
            res.json({ success: true, message: "Contatta l'amministratore per il reset." });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async resetPassword(req, res) {
        try {
            const { email, newPassword } = req.body;
            const normalizedEmail = email.trim().toLowerCase();
            if (global._users?.[normalizedEmail]) {
                global._users[normalizedEmail].passwordHash = await bcrypt.hash(newPassword, 10);
                console.log(`✅ Password resettata: ${normalizedEmail}`);
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
                const valid = await bcrypt.compare(currentPassword, user.passwordHash);
                if (valid) {
                    user.passwordHash = await bcrypt.hash(newPassword, 10);
                    console.log(`✅ Password cambiata: ${normalizedEmail}`);
                } else {
                    return res.status(400).json({ error: 'Password attuale errata' });
                }
            }
            res.json({ success: true, message: 'Password aggiornata.' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    async me(req, res) {
        try {
            const userId = getUserIdFromReq(req);
            if (!userId) return res.status(401).json({ error: 'No token' });

            const user = global._users?.[userId];
            
            // Non possiamo decriptare i dati senza la secret word
            // Restituiamo solo le informazioni di base
            res.json({
                success: true,
                user: {
                    name: '[CRITTOGRAFATO]',
                    surname: '[CRITTOGRAFATO]',
                    email: userId,
                    twofa_enabled: true,
                    encrypted: true
                }
            });
        } catch (e) {
            res.status(401).json({ error: 'Invalid token' });
        }
    }

    async updateProfile(req, res) {
        try {
            const { name, surname } = req.body;
            const userId = getUserIdFromReq(req);
            
            if (!userId || !global._users?.[userId]) {
                return res.status(401).json({ error: 'Non autorizzato' });
            }
            
            // Nota: per aggiornare il profilo servirebbe la secret word per decriptare/ricriptare
            // Per semplicità, per ora non permettiamo l'aggiornamento del profilo
            res.json({ success: true, message: 'Per modificare il profilo contatta l\'amministratore' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    /* ══════════════════════════════════
       CHAT (con messaggi criptati)
    ══════════════════════════════════ */

    async newChat(req, res) {
        try {
            const userId = getUserIdFromReq(req);
            if (!userId) return res.status(401).json({ error: 'Autenticazione richiesta' });
            
            // Verifica che la chiave sia impostata
            if (!chatDB.getUserKey(userId)) {
                return res.status(401).json({ error: 'Sessione non valida. Effettua di nuovo il login.' });
            }
            
            const { title } = req.body;
            const conversationId = await chatDB.createConversation(userId, title);
            res.json({ success: true, conversationId });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async chatWithHistory(req, res) {
        try {
            const userId = getUserIdFromReq(req);
            if (!userId) return res.status(401).json({ error: 'Autenticazione richiesta' });
            
            // Verifica che la chiave sia impostata
            if (!chatDB.getUserKey(userId)) {
                return res.status(401).json({ error: 'Sessione non valida. Effettua di nuovo il login.' });
            }

            const { conversationId, message, options } = req.body;
            if (!message) return res.status(400).json({ error: 'Message is required' });

            let convId = conversationId;

            if (!convId) {
                const autoTitle = await this._generateChatTitle(message);
                convId = await chatDB.createConversation(userId, autoTitle);
            } else {
                const owned = await chatDB.conversationBelongsToUser(convId, userId);
                if (!owned) return res.status(403).json({ error: 'Accesso negato' });
            }

            // Salva il messaggio (verrà automaticamente criptato)
            await chatDB.saveMessage(convId, 'user', message);
            chatDB.updateConversationTime(convId);

            // Ottieni la storia (viene automaticamente decriptata)
            const history = await chatDB.getMessages(convId);
            const messages = history.map(m => ({ role: m.role, content: m.content }));

            const result = await aiService.sendMessage(messages, options || {});

            if (result.success) {
                // Salva la risposta (verrà criptata)
                await chatDB.saveMessage(convId, 'assistant', result.response);
                chatDB.updateConversationTime(convId);
                res.json({ success: true, conversationId: convId, response: result.response });
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (e) {
            console.error('Errore chatWithHistory:', e);
            res.status(500).json({ error: e.message });
        }
    }

    async getConversations(req, res) {
        try {
            const userId = getUserIdFromReq(req);
            if (!userId) return res.status(401).json({ error: 'Autenticazione richiesta' });
            
            const conversations = await chatDB.getConversations(userId);
            const uniqueConvs = [];
            const seenIds = new Set();
            for (const conv of conversations) {
                if (!seenIds.has(conv.id)) {
                    seenIds.add(conv.id);
                    uniqueConvs.push(conv);
                }
            }
            res.json({ success: true, conversations: uniqueConvs });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async getConversation(req, res) {
        try {
            const userId = getUserIdFromReq(req);
            if (!userId) return res.status(401).json({ error: 'Autenticazione richiesta' });

            const { id } = req.params;
            const owned = await chatDB.conversationBelongsToUser(id, userId);
            if (!owned) return res.status(403).json({ error: 'Accesso negato' });

            const messages = await chatDB.getMessages(id);
            const conversations = await chatDB.getConversations(userId);
            const conversation = conversations.find(c => c.id == id);
            res.json({ success: true, conversation, messages });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async deleteConversation(req, res) {
        try {
            const userId = getUserIdFromReq(req);
            if (!userId) return res.status(401).json({ error: 'Autenticazione richiesta' });
            await chatDB.deleteConversation(req.params.id, userId);
            res.json({ success: true, message: 'Conversazione eliminata' });
        } catch (e) {
            res.status(e.message.includes('Non autorizzato') ? 403 : 500).json({ error: e.message });
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
        } catch (e) { res.status(500).json({ error: e.message }); }
    }

    /* ══════════════════════════════════
       GENERAZIONE IMMAGINI
    ══════════════════════════════════ */
    async generateImage(req, res) {
        try {
            const { prompt } = req.body;
            if (!prompt) return res.status(400).json({ error: 'Prompt richiesto' });
            const encodedPrompt = encodeURIComponent(prompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
            res.json({
                success: true,
                imageUrl: imageUrl,
                prompt: prompt,
                message: `🖼️ Immagine generata per: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`
            });
        } catch (e) {
            console.error('Errore generazione immagine:', e);
            res.status(500).json({ error: e.message });
        }
    }

    /* ══════════════════════════════════
       FUNZIONI SPECIALI
    ══════════════════════════════════ */
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

    async _generateChatTitle(firstMessage) {
        try {
            const result = await aiService.sendMessage([
                {
                    role: 'user',
                    content: `Genera un titolo brevissimo (max 5 parole) per una chat che inizia con questo messaggio. Rispondi SOLO con il titolo, senza virgolette, senza punteggiatura finale, senza spiegazioni.\n\nMessaggio: "${firstMessage.substring(0, 200)}"`
                }
            ], { maxTokens: 20 });

            if (result.success && result.response) {
                const title = result.response.trim().replace(/^["']|["']$/g, '').substring(0, 60);
                if (title.length > 2) return title;
            }
        } catch (e) {
            console.log('⚠️ Titolo automatico fallito, uso fallback');
        }
        const words = firstMessage.trim().split(/\s+/).slice(0, 6).join(' ');
        return words.length > 0 ? words : 'Nuova chat';
    }

    githubLogin(req, res) { res.status(410).json({ error: 'Accesso GitHub rimosso.' }); }
    async githubCallback(req, res) { res.redirect('/'); }
}

module.exports = new BarryController();