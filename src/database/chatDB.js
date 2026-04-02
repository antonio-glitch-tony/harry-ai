/* ═══════════════════════════════════════════════════════════
   B.A.R.R.Y. — Chat Database (SQLite) — v3.0 ENCRYPTED EDITION
   • Tutti i messaggi sono criptati con AES-256-GCM
   • Le conversazioni sono legate all'account (user_id)
   ═══════════════════════════════════════════════════════════ */
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');
const encryptionService = require('../services/encryptionService');

class ChatDatabase {
    constructor() {
        this.db          = null;
        this.isAvailable = false;
        this.dbPath      = null;
        this.userKeys    = new Map(); // Cache delle chiavi degli utenti (email -> key buffer)
        this.init();
    }

    init() {
        try {
            const dataDir = path.join(__dirname, '../../data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
                console.log('📁 Cartella data creata:', dataDir);
            }
            this.dbPath = path.join(dataDir, 'chats_encrypted.db');
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Errore connessione database:', err.message);
                    this.isAvailable = false;
                } else {
                    console.log('✅ Database SQLite connesso (CRITTOGRAFIA ATTIVA):', this.dbPath);
                    this.isAvailable = true;
                    this.migrateDatabase();
                }
            });
        } catch (err) {
            console.error('❌ Database non disponibile:', err.message);
            this.isAvailable = false;
        }
    }

    /**
     * Imposta la chiave di cifratura per un utente
     * @param {string} userId - Email dell'utente
     * @param {Buffer} key - Chiave AES-256
     */
    setUserKey(userId, key) {
        if (key && Buffer.isBuffer(key)) {
            this.userKeys.set(userId, key);
            console.log(`🔑 Chiave impostata per utente: ${userId}`);
        }
    }

    /**
     * Ottiene la chiave di cifratura per un utente
     * @param {string} userId - Email dell'utente
     * @returns {Buffer|null}
     */
    getUserKey(userId) {
        return this.userKeys.get(userId) || null;
    }

    /**
     * Rimuove la chiave dalla cache (logout)
     * @param {string} userId - Email dell'utente
     */
    clearUserKey(userId) {
        this.userKeys.delete(userId);
        console.log(`🔑 Chiave rimossa per utente: ${userId}`);
    }

    migrateDatabase() {
        if (!this.isAvailable || !this.db) return;

        this.db.run('PRAGMA foreign_keys=ON');

        this.db.all("PRAGMA table_info(conversations)", (err, columns) => {
            if (err) {
                this.createFreshTables();
                return;
            }

            const hasUserId = columns && columns.some(col => col.name === 'user_id');
            
            if (!hasUserId && columns && columns.length > 0) {
                console.log('🔄 Migrazione forzata: ricreazione tabella con user_id');
                this.db.run('BEGIN TRANSACTION');
                
                this.db.run(`
                    CREATE TABLE conversations_temp (
                        id         INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id    TEXT NOT NULL,
                        title      TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        this.db.run('ROLLBACK');
                        this.createFreshTables();
                        return;
                    }
                    
                    this.db.run(`
                        INSERT INTO conversations_temp (id, title, created_at, updated_at)
                        SELECT id, title, created_at, updated_at FROM conversations
                    `, (err) => {
                        if (err) {
                            this.db.run('ROLLBACK');
                            this.createFreshTables();
                            return;
                        }
                        
                        this.db.run(`DROP TABLE conversations`, (err) => {
                            if (err) {
                                this.db.run('ROLLBACK');
                                this.createFreshTables();
                                return;
                            }
                            
                            this.db.run(`ALTER TABLE conversations_temp RENAME TO conversations`, (err) => {
                                if (err) {
                                    this.db.run('ROLLBACK');
                                    this.createFreshTables();
                                    return;
                                }
                                
                                this.db.run('COMMIT', () => {
                                    console.log('✅ Migrazione completata');
                                });
                                this.createRemainingTables();
                            });
                        });
                    });
                });
            } else if (!columns || columns.length === 0) {
                console.log('📝 Creazione tabelle da zero');
                this.createFreshTables();
            } else {
                console.log('✅ Tabella conversations già corretta');
                this.createRemainingTables();
            }
        });
    }

    createFreshTables() {
        if (!this.isAvailable || !this.db) return;
        
        this.db.run(`
            CREATE TABLE IF NOT EXISTS conversations (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    TEXT NOT NULL,
                title      TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Errore creazione tabella conversations:', err);
            } else {
                console.log('✅ Tabella conversations creata');
            }
            this.createRemainingTables();
        });
    }

    createRemainingTables() {
        if (!this.isAvailable || !this.db) return;
        
        // Tabella messages con campo content_encrypted (invece di content)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER,
                role            TEXT,
                content_encrypted TEXT NOT NULL,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) {
                console.error('❌ Errore creazione tabella messages:', err);
            } else {
                console.log('✅ Tabella messages (criptata) pronta');
            }
        });

        this.db.run(`CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id, updated_at DESC)`, (err) => {
            if (err) {
                console.error('❌ Errore creazione indice:', err.message);
            }
        });

        console.log('✅ Database completamente inizializzato con crittografia');
    }

    createConversation(userId, title) {
        return new Promise((resolve, reject) => {
            if (!this.isAvailable || !this.db) { resolve(Date.now()); return; }
            if (!userId) return reject(new Error('userId richiesto'));
            const defaultTitle = title || `Chat ${new Date().toLocaleString('it-IT')}`;
            this.db.run(
                'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
                [userId, defaultTitle],
                function(err) { if (err) reject(err); else resolve(this.lastID); }
            );
        });
    }

    /**
     * Salva un messaggio CRIPTATO
     * @param {number} conversationId - ID della conversazione
     * @param {string} role - 'user' o 'assistant'
     * @param {string} content - Contenuto da criptare
     * @returns {Promise<number>}
     */
    async saveMessage(conversationId, role, content) {
        return new Promise(async (resolve, reject) => {
            if (!this.isAvailable || !this.db) { resolve(Date.now()); return; }
            
            // Ottieni la conversazione per sapere l'user_id
            this.db.get('SELECT user_id FROM conversations WHERE id = ?', [conversationId], async (err, conv) => {
                if (err || !conv) {
                    reject(err || new Error('Conversazione non trovata'));
                    return;
                }
                
                const userKey = this.getUserKey(conv.user_id);
                if (!userKey) {
                    console.error(`❌ Nessuna chiave per l'utente: ${conv.user_id}`);
                    reject(new Error('Chiave di cifratura non disponibile'));
                    return;
                }
                
                // Cripta il messaggio
                const encryptedContent = encryptionService.encrypt(content, userKey);
                
                this.db.run(
                    'INSERT INTO messages (conversation_id, role, content_encrypted) VALUES (?, ?, ?)',
                    [conversationId, role, encryptedContent],
                    function(err) { 
                        if (err) reject(err); 
                        else resolve(this.lastID); 
                    }
                );
            });
        });
    }

    /**
     * Ottiene i messaggi DECRIPTATI di una conversazione
     * @param {number} conversationId - ID della conversazione
     * @returns {Promise<Array>}
     */
    async getMessages(conversationId) {
        return new Promise(async (resolve, reject) => {
            if (!this.isAvailable || !this.db) { resolve([]); return; }
            
            // Ottieni la conversazione per sapere l'user_id
            this.db.get('SELECT user_id FROM conversations WHERE id = ?', [conversationId], async (err, conv) => {
                if (err || !conv) {
                    reject(err || new Error('Conversazione non trovata'));
                    return;
                }
                
                const userKey = this.getUserKey(conv.user_id);
                if (!userKey) {
                    console.error(`❌ Nessuna chiave per l'utente: ${conv.user_id}`);
                    reject(new Error('Chiave di cifratura non disponibile'));
                    return;
                }
                
                this.db.all(
                    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
                    [conversationId],
                    (err, rows) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        // Decripta ogni messaggio
                        const decryptedRows = rows.map(row => {
                            try {
                                const decryptedContent = encryptionService.decrypt(row.content_encrypted, userKey);
                                return {
                                    ...row,
                                    content: decryptedContent,
                                    content_encrypted: undefined // Non restituire il campo criptato
                                };
                            } catch (decryptErr) {
                                console.error('Errore decriptazione messaggio:', decryptErr);
                                return {
                                    ...row,
                                    content: '[MESSAGGIO CRIPTATO - IMPOSSIBILE DECRIPTARE]',
                                    content_encrypted: undefined
                                };
                            }
                        });
                        
                        resolve(decryptedRows || []);
                    }
                );
            });
        });
    }

    updateConversationTime(conversationId) {
        if (!this.isAvailable || !this.db) return;
        this.db.run('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);
    }

    getConversations(userId) {
        return new Promise((resolve, reject) => {
            if (!this.isAvailable || !this.db) { resolve([]); return; }
            if (!userId) { resolve([]); return; }
            this.db.all(
                'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
                [userId],
                (err, rows) => { if (err) reject(err); else resolve(rows || []); }
            );
        });
    }

    conversationBelongsToUser(conversationId, userId) {
        return new Promise((resolve, reject) => {
            if (!this.isAvailable || !this.db) { resolve(false); return; }
            this.db.get(
                'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
                [conversationId, userId],
                (err, row) => { if (err) reject(err); else resolve(!!row); }
            );
        });
    }

    deleteConversation(conversationId, userId) {
        return new Promise(async (resolve, reject) => {
            if (!this.isAvailable || !this.db) { resolve(); return; }
            try {
                if (userId) {
                    const owned = await this.conversationBelongsToUser(conversationId, userId);
                    if (!owned) return reject(new Error('Non autorizzato'));
                }
                this.db.run('DELETE FROM messages WHERE conversation_id = ?', [conversationId], (err) => {
                    if (err) return reject(err);
                    this.db.run('DELETE FROM conversations WHERE id = ?', [conversationId], (err2) => {
                        if (err2) reject(err2); else resolve();
                    });
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}

module.exports = new ChatDatabase();