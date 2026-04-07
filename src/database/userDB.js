/* ═══════════════════════════════════════════════════════════
   B.A.R.R.Y. — User Database (Turso Cloud) — PERSISTENTE
   • Memorizza tutti gli utenti su Turso Cloud
   • I dati NON si perdono mai, anche dopo riavvio
   ═══════════════════════════════════════════════════════════ */
const { createClient } = require('@libsql/client');

class UserDatabase {
    constructor() {
        this.client = null;
        this.isAvailable = false;
        this.init();
    }

    init() {
        try {
            const url = process.env.TURSO_URL;
            const token = process.env.TURSO_TOKEN;
            
            if (!url || !token) {
                console.error('❌ TURSO_URL o TURSO_TOKEN non configurati nel .env');
                this.isAvailable = false;
                return;
            }
            
            this.client = createClient({
                url: url,
                authToken: token
            });
            
            this.isAvailable = true;
            console.log('✅ Turso Cloud connesso (PERSISTENTE):', url);
            this.createTables();
        } catch (err) {
            console.error('❌ Errore connessione Turso:', err.message);
            this.isAvailable = false;
        }
    }

    async createTables() {
        if (!this.isAvailable) return;
        
        try {
            // Tabella utenti
            await this.client.execute(`
                CREATE TABLE IF NOT EXISTS users (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    email           TEXT UNIQUE NOT NULL,
                    name            TEXT,
                    surname         TEXT,
                    encrypted_name   TEXT,
                    encrypted_surname TEXT,
                    encryption_salt  TEXT,
                    password_hash    TEXT,
                    secret_word_hash TEXT,
                    fingerprint_hash TEXT,
                    ga_secret        TEXT,
                    twofa_enabled    INTEGER DEFAULT 1,
                    completed        INTEGER DEFAULT 0,
                    email_verified   INTEGER DEFAULT 0,
                    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
                    registered_at    DATETIME,
                    last_login       DATETIME,
                    ip_address       TEXT,
                    user_agent       TEXT
                )
            `);
            
            // Tabella tentativi di login
            await this.client.execute(`
                CREATE TABLE IF NOT EXISTS login_attempts (
                    id         INTEGER PRIMARY KEY AUTOINCREMENT,
                    email      TEXT,
                    ip_address TEXT,
                    success    INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('✅ Tabelle create su Turso Cloud');
        } catch (err) {
            console.error('❌ Errore creazione tabelle:', err.message);
        }
    }

    async saveUser(userData) {
        if (!this.isAvailable) return;
        
        const { email, encryptedName, encryptedSurname, encryptionSalt, 
                passwordHash, secretWordHash, fingerprintHash, gaSecret,
                completed, emailVerified, name, surname } = userData;
        
        try {
            await this.client.execute({
                sql: `
                    INSERT OR REPLACE INTO users 
                    (email, name, surname, encrypted_name, encrypted_surname, encryption_salt,
                     password_hash, secret_word_hash, fingerprint_hash, ga_secret,
                     completed, email_verified, registered_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `,
                args: [email, name || null, surname || null, encryptedName, encryptedSurname, encryptionSalt,
                       passwordHash, secretWordHash, fingerprintHash, gaSecret,
                       completed ? 1 : 0, emailVerified ? 1 : 0]
            });
            console.log(`✅ Utente salvato su Turso: ${email}`);
        } catch (err) {
            console.error('❌ Errore saveUser:', err.message);
        }
    }

    async getAllUsers() {
        if (!this.isAvailable) return [];
        
        try {
            const result = await this.client.execute(`
                SELECT id, email, name, surname, completed, email_verified, 
                       twofa_enabled, created_at, registered_at, last_login
                FROM users 
                ORDER BY created_at DESC
            `);
            return result.rows || [];
        } catch (err) {
            console.error('❌ Errore getAllUsers:', err.message);
            return [];
        }
    }

    async getUserByEmail(email) {
        if (!this.isAvailable) return null;
        
        try {
            const result = await this.client.execute({
                sql: `SELECT * FROM users WHERE email = ?`,
                args: [email]
            });
            
            if (result.rows && result.rows.length > 0) {
                const row = result.rows[0];
                return {
                    id: row.id,
                    email: row.email,
                    name: row.name,
                    surname: row.surname,
                    encrypted_name: row.encrypted_name,
                    encrypted_surname: row.encrypted_surname,
                    encryption_salt: row.encryption_salt,
                    password_hash: row.password_hash,
                    secret_word_hash: row.secret_word_hash,
                    fingerprint_hash: row.fingerprint_hash,
                    ga_secret: row.ga_secret,
                    twofa_enabled: row.twofa_enabled,
                    completed: row.completed,
                    email_verified: row.email_verified,
                    created_at: row.created_at,
                    registered_at: row.registered_at,
                    last_login: row.last_login
                };
            }
            return null;
        } catch (err) {
            console.error('❌ Errore getUserByEmail:', err.message);
            return null;
        }
    }

    async updateLastLogin(email, ip, userAgent) {
        if (!this.isAvailable) return;
        
        try {
            await this.client.execute({
                sql: `UPDATE users SET last_login = CURRENT_TIMESTAMP, ip_address = ?, user_agent = ? WHERE email = ?`,
                args: [ip, userAgent, email]
            });
        } catch (err) {
            console.error('❌ Errore updateLastLogin:', err.message);
        }
    }

    async logLoginAttempt(email, ip, success) {
        if (!this.isAvailable) return;
        
        try {
            await this.client.execute({
                sql: `INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)`,
                args: [email, ip, success ? 1 : 0]
            });
        } catch (err) {
            console.error('❌ Errore logLoginAttempt:', err.message);
        }
    }

    async deleteUser(email) {
        if (!this.isAvailable) return;
        
        try {
            await this.client.execute({
                sql: `DELETE FROM users WHERE email = ?`,
                args: [email]
            });
            console.log(`✅ Utente eliminato: ${email}`);
        } catch (err) {
            console.error('❌ Errore deleteUser:', err.message);
        }
    }
}

module.exports = new UserDatabase();