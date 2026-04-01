/* ═══════════════════════════════════════════════════════════
   J.A.R.V.I.S. — Chat Database (SQLite) — v2.2 SYNC EDITION
   Le conversazioni sono legate all'account (user_id).
   Eliminare una chat la rimuove definitivamente per tutti i dispositivi.
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
                    this.createTables();
                }
            });
        } catch (err) {
            console.error('❌ Database non disponibile:', err.message);
            this.isAvailable = false;
        }
    }

    createTables() {
        if (!this.isAvailable || !this.db) return;

        // Abilita foreign keys e WAL per prestazioni migliori
        this.db.run('PRAGMA journal_mode=WAL');
        this.db.run('PRAGMA foreign_keys=ON');

        // Verifica se la tabella conversations esiste e ha la colonna user_id
        this.db.get("PRAGMA table_info(conversations)", (err, rows) => {
            if (err) {
                console.error('❌ Errore verifica struttura tabella:', err);
                this.createRemainingTables();
                return;
            }
            
            // rows è un array di oggetti, controlla se esiste user_id
            const hasUserId = rows && Array.isArray(rows) && rows.some(col => col.name === 'user_id');
            const tableExists = rows && rows.length > 0;
            
            if (!hasUserId && tableExists) {
                // La tabella esiste ma non ha user_id - migrazione necessaria
                console.log('🔄 Migrazione database: aggiunta colonna user_id...');
                
                // Rinomina tabella esistente
                this.db.run(`ALTER TABLE conversations RENAME TO conversations_old`, (renameErr) => {
                    if (renameErr) {
                        console.error('❌ Errore rename tabella:', renameErr);
                        this.createRemainingTables();
                        return;
                    }
                    
                    // Crea nuova tabella con struttura corretta
                    this.db.run(`
                        CREATE TABLE conversations (
                            id         INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id    TEXT NOT NULL DEFAULT 'legacy',
                            title      TEXT,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `, (createErr) => {
                        if (createErr) {
                            console.error('❌ Errore creazione nuova tabella:', createErr);
                            this.createRemainingTables();
                            return;
                        }
                        
                        // Migra i dati esistenti (user_id sarà 'legacy' per i vecchi record)
                        this.db.run(`
                            INSERT INTO conversations (id, title, created_at, updated_at)
                            SELECT id, title, created_at, updated_at FROM conversations_old
                        `, (migrateErr) => {
                            if (migrateErr) {
                                console.error('❌ Errore migrazione dati:', migrateErr);
                            } else {
                                console.log('✅ Dati migrati con successo');
                            }
                            
                            // Elimina tabella vecchia
                            this.db.run(`DROP TABLE conversations_old`, (dropErr) => {
                                if (dropErr) {
                                    console.error('❌ Errore drop tabella vecchia:', dropErr);
                                } else {
                                    console.log('✅ Migrazione database completata (aggiunta user_id)');
                                }
                                // Continua con la creazione degli indici
                                this.createRemainingTables();
                            });
                        });
                    });
                });
            } else if (!tableExists) {
                // Tabella non esiste, creala direttamente
                console.log('📝 Creazione tabella conversations...');
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS conversations (
                        id         INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id    TEXT NOT NULL,
                        title      TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) console.error('❌ Errore creazione tabella conversations:', err);
                    this.createRemainingTables();
                });
            } else {
                // Tabella esiste già con user_id
                console.log('✅ Tabella conversations già corretta');
                this.createRemainingTables();
            }
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
            if (err) console.error('❌ Errore creazione tabella messages:', err);
        });

        // Verifica se la colonna user_id esiste prima di creare l'indice
        this.db.get("PRAGMA table_info(conversations)", (err, columns) => {
            if (err) {
                console.error('❌ Errore verifica colonne per indice:', err);
                console.log('✅ Tabelle database pronte (sync per account abilitato)');
                return;
            }
            
            const hasUserId = columns && Array.isArray(columns) && columns.some(col => col.name === 'user_id');
            
            if (hasUserId) {
                // Crea indice per velocizzare le query per utente
                this.db.run(`CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id, updated_at DESC)`, (err) => {
                    if (err) {
                        console.error('❌ Errore creazione indice:', err.message);
                    } else {
                        console.log('✅ Indice idx_conv_user creato');
                    }
                    console.log('✅ Tabelle database pronte (sync per account abilitato)');
                });
            } else {
                console.log('⚠️ Indice non creato: colonna user_id non presente');
                console.log('✅ Tabelle database pronte (sync per account abilitato)');
            }
        });
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

    /* ── LISTA CONVERSAZIONI per utente (sincronizzazione cross-device) ── */
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

    /* ── VERIFICA CHE LA CONVERSAZIONE APPARTENGA ALL'UTENTE ── */
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

    /* ── ELIMINA CONVERSAZIONE (definitiva, cross-device) ── */
    deleteConversation(conversationId, userId) {
        return new Promise(async (resolve, reject) => {
            if (!this.isAvailable || !this.db) { resolve(); return; }
            try {
                // Sicurezza: verifica che la chat appartenga all'utente
                if (userId) {
                    const owned = await this.conversationBelongsToUser(conversationId, userId);
                    if (!owned) return reject(new Error('Non autorizzato a eliminare questa conversazione'));
                }
                // Elimina messaggi e conversazione
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