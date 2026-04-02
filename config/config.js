/* ═══════════════════════════════════════════════════════════
   B.A.R.R.Y. — Configurazione v4.1
   ═══════════════════════════════════════════════════════════ */
require('dotenv').config();

module.exports = {
    // OpenRouter
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    defaultModel: 'google/gemini-2.0-flash-exp:free',
    
    // Limiti
    maxTokens: 4096,
    temperature: 0.7,
    
    // Sito
    siteUrl: process.env.SITE_URL || 'http://localhost:3000',
    siteName: 'B.A.R.R.Y. AI',
    
    // Modelli disponibili
    models: {
        gemini: 'google/gemini-2.0-flash-exp:free',
        gpt4: 'openai/gpt-4o-mini',
        claude: 'anthropic/claude-3-haiku',
        llama: 'meta-llama/llama-3.2-3b-instruct:free',
        mistral: 'mistralai/mistral-7b-instruct:free'
    },
    
    // Crittografia
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16
    }
};