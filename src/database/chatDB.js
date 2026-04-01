/* ═══════════════════════════════════════════════════════════
   J.A.R.V.I.S. — Chat Database (SQLite) — v2.3 SYNC EDITION
   Le conversazioni sono legate all'account (user_id).
   ═══════════════════════════════════════════════════════════ */
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');

class ChatDatabase {
    constructor() {
        this.db          = null;
        this.isAvailable = false;
        this.dbPath      = null;
        this.init();
    }

    init() {
        try {
            const dataDir = path.join(__dirname, '../../data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
                console.log('📁 Cartella data creata:', dataDir);
            }
            this.dbPath = path.join(dataDir, 'chats.db');
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Errore connessione database:', err.message);
                    this.isAvailable = false;
                } else {
                    console.log('✅ Database SQLite connesso:', this.dbPath);
                    this.isAvailable = true;
                    this.migrateDatabase();
                }
            });
        } catch (err) {
            console.error('❌ Database non disponibile:', err.message);
            this.isAvailable = false;
        }
    }

    migrateDatabase() {
        if (!this.isAvailable || !this.db) return;

        // Abilita foreign keys
        this.db.run('PRAGMA foreign_keys=ON');

        // Prima verifica la struttura attuale
        this.db.all("PRAGMA table_info(conversations)", (err, columns) => {
            if (err) {
                console.log('⚠️ Tabella conversations non esiste, verrà creata');
                this.createFreshTables();
                return;
            }

            const hasUserId = columns && columns.some(col => col.name === 'user_id');
            
            if (!hasUserId && columns && columns.length > 0) {
                // Tabella esiste ma senza user_id - ricreazione completa
                console.log('🔄 Migrazione forzata: ricreazione tabella con user_id');
                
                // Inizia una transazione
                this.db.run('BEGIN TRANSACTION');
                
                // Crea tabella temporanea
                this.db.run(`
                    CREATE TABLE conversations_temp (
                        id         INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id    TEXT NOT NULL DEFAULT 'legacy',
                        title      TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        console.error('❌ Errore creazione tabella temp:', err);
                        this.db.run('ROLLBACK');
                        this.createFreshTables();
                        return;
                    }
                    
                    // Copia i dati esistenti (user_id sarà 'legacy')
                    this.db.run(`
                        INSERT INTO conversations_temp (id, title, created_at, updated_at)
                        SELECT id, title, created_at, updated_at FROM conversations
                    `, (err) => {
                        if (err) {
                            console.error('❌ Errore copia dati:', err);
                            this.db.run('ROLLBACK');
                            this.createFreshTables();
                            return;
                        }
                        
                        // Elimina tabella vecchia
                        this.db.run(`DROP TABLE conversations`, (err) => {
                            if (err) {
                                console.error('❌ Errore drop tabella:', err);
                                this.db.run('ROLLBACK');
                                this.createFreshTables();
                                return;
                            }
                            
                            // Rinomina tabella temp
                            this.db.run(`ALTER TABLE conversations_temp RENAME TO conversations`, (err) => {
                                if (err) {
                                    console.error('❌ Errore rename tabella:', err);
                                    this.db.run('ROLLBACK');
                                    this.createFreshTables();
                                    return;
                                }
                                
                                // Commit transazione
                                this.db.run('COMMIT', (err) => {
                                    if (err) {
                                        console.error('❌ Errore commit:', err);
                                    } else {
                                        console.log('✅ Migrazione completata con successo');
                                    }
                                    this.createRemainingTables();
                                });
                            });
                        });
                    });
                });
            } else if (!columns || columns.length === 0) {
                // Tabella non esiste
                console.log('📝 Creazione tabelle da zero');
                this.createFreshTables();
            } else {
                // Tabella esiste già con user_id
                console.log('✅ Tabella conversations già corretta');
                this.createRemainingTables();
            }
        });
    }

    createFreshTables() {
        if (!this.isAvailable || !this.db) return;
        
        // Crea tabella conversations con struttura corretta
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
        
        // Crea tabella messages
        this.db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER,
                role            TEXT,
                content         TEXT,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) {
                console.error('❌ Errore creazione tabella messages:', err);
            } else {
                console.log('✅ Tabella messages pronta');
            }
        });

        // Crea indice per velocizzare le query
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id, updated_at DESC)`, (err) => {
            if (err) {
                console.error('❌ Errore creazione indice:', err.message);
            } else {
                console.log('✅ Indice idx_conv_user creato');
            }
        });

        console.log('✅ Database completamente inizializzato');
    }

    /* ── CREA CONVERSAZIONE per utente specifico ── */
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

    /* ── SALVA MESSAGGIO ── */
    saveMessage(conversationId, role, content) {
        return new Promise((resolve, reject) => {
            if (!this.isAvailable || !this.db) { resolve(Date.now()); return; }
            this.db.run(
                'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
                [conversationId, role, content],
                function(err) { if (err) reject(err); else resolve(this.lastID); }
            );
        });
    }

    /* ── AGGIORNA TIMESTAMP ── */
    updateConversationTime(conversationId) {
        if (!this.isAvailable || !this.db) return;
        this.db.run('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);
    }

    /* ── LISTA CONVERSAZIONI per utente ── */
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

    /* ── MESSAGGI DI UNA CONVERSAZIONE ── */
    getMessages(conversationId) {
        return new Promise((resolve, reject) => {
            if (!this.isAvailable || !this.db) { resolve([]); return; }
            this.db.all(
                'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
                [conversationId],
                (err, rows) => { if (err) reject(err); else resolve(rows || []); }
            );
        });
    }

    /* ── VERIFICA PROPRIETÀ ── */
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

    /* ── ELIMINA CONVERSAZIONE ── */
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