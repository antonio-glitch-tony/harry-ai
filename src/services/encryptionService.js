/* ═══════════════════════════════════════════════════════════
   B.A.R.R.Y. — Encryption Service v1.0
   AES-256-GCM per crittografia end-to-end
   ═══════════════════════════════════════════════════════════ */
const crypto = require('crypto');

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bit
        this.ivLength = 16;  // 128 bit
        this.authTagLength = 16;
    }

    /**
     * Deriva una chiave AES-256 dalla password dell'utente
     * @param {string} password - La password/secret word dell'utente
     * @param {string} salt - Salt univoco (opzionale)
     * @returns {Promise<{key: Buffer, salt: string}>}
     */
    async deriveKey(password, salt = null) {
        const useSalt = salt || crypto.randomBytes(32).toString('hex');
        const key = await new Promise((resolve, reject) => {
            crypto.pbkdf2(password, useSalt, 100000, this.keyLength, 'sha256', (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey);
            });
        });
        return { key, salt: useSalt };
    }

    /**
     * Cripta un testo con AES-256-GCM
     * @param {string} text - Testo da criptare
     * @param {Buffer} key - Chiave di cifratura
     * @returns {string} Stringa criptata in formato: iv:authTag:encrypted
     */
    encrypt(text, key) {
        if (!text || text === '') return '';
        
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final()
        ]);
        
        const authTag = cipher.getAuthTag();
        
        // Formato: iv (hex) + ':' + authTag (hex) + ':' + encrypted (hex)
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
    }

    /**
     * Decripta un testo con AES-256-GCM
     * @param {string} encryptedData - Dati criptati (formato: iv:authTag:encrypted)
     * @param {Buffer} key - Chiave di decifratura
     * @returns {string} Testo decriptato
     */
    decrypt(encryptedData, key) {
        if (!encryptedData || encryptedData === '') return '';
        
        const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
        
        if (!ivHex || !authTagHex || !encryptedHex) {
            throw new Error('Formato dati criptati non valido');
        }
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        decipher.setAuthTag(authTag);
        
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
        
        return decrypted.toString('utf8');
    }

    /**
     * Cripta un oggetto JSON
     * @param {Object} obj - Oggetto da criptare
     * @param {Buffer} key - Chiave di cifratura
     * @returns {string}
     */
    encryptObject(obj, key) {
        return this.encrypt(JSON.stringify(obj), key);
    }

    /**
     * Decripta un oggetto JSON
     * @param {string} encryptedData - Dati criptati
     * @param {Buffer} key - Chiave di decifratura
     * @returns {Object}
     */
    decryptObject(encryptedData, key) {
        const decrypted = this.decrypt(encryptedData, key);
        return JSON.parse(decrypted);
    }

    /**
     * Genera un hash SHA-256 per fingerprint
     * @param {string} data - Dati da hashare
     * @returns {string}
     */
    hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Verifica un hash
     * @param {string} data - Dati originali
     * @param {string} hash - Hash da verificare
     * @returns {boolean}
     */
    verifyHash(data, hash) {
        return this.hash(data) === hash;
    }
}

module.exports = new EncryptionService();