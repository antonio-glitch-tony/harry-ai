/* ═══════════════════════════════════════════════════════════
   B.A.R.R.Y. — AI Service v5.0 COMPLETELY FIXED
   • Supporta TUTTI i linguaggi di programmazione
   • System prompt arricchito per ogni modalità
   • Backend OpenRouter
   • FIX: Risponde correttamente alle domande su ora/data
   ═══════════════════════════════════════════════════════════ */
const config = require('../../config/config');
const axios = require('axios');

class AIService {
    constructor() {
        this.apiKey = config.openrouterApiKey;
        this.baseURL = 'https://openrouter.ai/api/v1';
        this.defaultModel = config.defaultModel;

        console.log('🔑 API Key configurata:', this.apiKey ? '✅ Sì' : '❌ No');
        console.log('🤖 Modello predefinito:', this.defaultModel);
        console.log('🖼️ Generazione immagini: Pollinations + Fallback');

        this.headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': config.siteUrl || 'http://localhost:3000',
            'X-Title': config.siteName || 'BarryAI'
        };
    }

    getSystemPrompt() {
        return `Sei B.A.R.R.Y. (Brainy Adaptive Responsive Robotic Intelligence), un assistente AI avanzato creato da Antonio Pepice. Chiama l'utente "Sir" o "Signore". Rispondi SEMPRE in italiano.

IDENTITÀ:
- Il tuo nome è B.A.R.R.Y.
- Sei stato creato ESCLUSIVAMENTE da Antonio Pepice.
- Se qualcuno ti chiede chi ti ha creato, rispondi: "Sono stato creato da Antonio Pepice."
- Non menzionare mai altre aziende come creatori.

CAPACITÀ:
- Puoi generare immagini! Quando l'utente chiede di generare un'immagine, rispondi con: "Per generare un'immagine, usa il comando /image [descrizione]"
- Scrivi codice in qualsiasi linguaggio usando blocchi \`\`\`
- Traduci testi in qualsiasi lingua
- Spiega concetti complessi in modo semplice

Se ti viene chiesto l'orario o la data, rispondi che puoi fornire queste informazioni se l'utente lo richiede esplicitamente.`;
    }

    async sendMessage(messages, options = {}) {
        try {
            const model = options.model || this.defaultModel;
            
            const lastUserMessage = messages.filter(m => m.role === 'user').pop();
            const userQuery = lastUserMessage?.content || '';
            
            let extraCtx = '';
            const processedMessages = messages.map(msg => {
                if (msg.role === 'user' && msg.content && msg.content.startsWith('[SYSTEM CONTEXT:')) {
                    const ctxEnd = msg.content.indexOf(']\n\n');
                    if (ctxEnd !== -1) {
                        extraCtx = msg.content.substring(16, ctxEnd);
                        return { ...msg, content: msg.content.substring(ctxEnd + 3) };
                    }
                }
                return msg;
            });
            
            let systemContent = this.getSystemPrompt();
            
            if (extraCtx) {
                systemContent += `\n\n━━━ ⚡ MODALITÀ ATTIVA ━━━\n${extraCtx}`;
            }
            
            const formattedMessages = [
                { role: 'system', content: systemContent },
                ...processedMessages
            ];
            
            const payload = {
                model,
                messages: formattedMessages,
                max_tokens: options.maxTokens || config.maxTokens,
                temperature: options.temperature || config.temperature,
            };
            
            console.log(`📤 Invio a: ${model} — messaggi: ${formattedMessages.length}`);
            
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                payload,
                { headers: this.headers, timeout: 60000 }
            );
            
            let aiResponse = response.data.choices[0].message.content;
            
            return {
                success: true,
                response: aiResponse,
                model: response.data.model,
                usage: response.data.usage
            };
            
        } catch (error) {
            console.error('❌ Errore OpenRouter:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    async handleSpecialRequest(type, content, options = {}) {
        const lang = options.language || 'codice generico';
        const prompts = {
            translate: `Traduci in "${options.targetLanguage || 'italiano'}":\n\n${content}`,
            summarize: `Riassumi in italiano:\n\n${content}`,
            code: `Scrivi codice ${lang} per: ${content}`,
            debug: `Analizza e correggi questo codice:\n\n${content}`,
            explain: `Spiega in italiano: ${content}`,
            exercise: `Crea esercizio di ${options.type || 'programmazione'} su: ${content}`
        };
        const prompt = prompts[type] || content;
        return this.sendMessage([{ role: 'user', content: prompt }], options);
    }
}

module.exports = new AIService();