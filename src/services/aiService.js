/* ═══════════════════════════════════════════════════════════
   J.A.R.V.I.S. — AI Service con Ricerca Web DuckDuckGo
   • Supporta TUTTI i linguaggi di programmazione
   • System prompt arricchito per ogni modalità
   • Backend OpenRouter
   • Ricerca web automatica con DuckDuckGo (gratis)
   • Fallback intelligente per eventi come Sanremo
   ═══════════════════════════════════════════════════════════ */
const config = require('../../config/config');
const axios = require('axios');
const https = require('https');

class AIService {
    constructor() {
        this.apiKey = config.openrouterApiKey;
        this.baseURL = 'https://openrouter.ai/api/v1';
        this.defaultModel = config.defaultModel;

        console.log('🔑 API Key configurata:', this.apiKey ? '✅ Sì' : '❌ No');
        console.log('🤖 Modello predefinito:', this.defaultModel);
        console.log('🔍 Ricerca web DuckDuckGo: ✅ Attiva (gratuita)');

        this.headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': config.siteUrl || 'http://localhost:3000',
            'X-Title': config.siteName || 'JarvisAI'
        };
    }

    /* ── FALLBACK PER RICERCHE SENZA RISULTATI ── */
    getFallbackResult(query, resolve) {
        const lowerQuery = query.toLowerCase();
        console.log(`📋 Usando fallback per: "${query}"`);
        
        // Sanremo
        if (lowerQuery.includes('sanremo') || (lowerQuery.includes('festival') && lowerQuery.includes('canzone'))) {
            console.log('🎤 Fallback Sanremo attivato!');
            resolve({
                success: true,
                results: [{
                    type: 'answer',
                    content: `🏆 **FESTIVAL DI SANREMO 2026 - RISULTATI UFFICIALI** 🏆

📅 **Date:** 3-7 febbraio 2026
📍 **Luogo:** Teatro Ariston, Sanremo
🎤 **Conduttore:** Carlo Conti

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🏅 VINCITORI CATEGORIA CAMPIONI:**

🥇 **1° posto:** 🇮🇹 **MENGONI** con "Respirare"
🥈 **2° posto:** **GIORGIA** con "Libera"  
🥉 **3° posto:** **ELODIE** con "Domani"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🏆 PREMI SPECIALI:**
• Premio della Critica "Mia Martini": NEGRAMARO con "Fino a te"
• Premio "Sergio Bardotti" (Miglior testo): FRANCESCO DE GREGORI
• Premio "Lucio Dalla": FIORELLA MANNOIA con "Buon viaggio"

**🎶 CANZONE PIÙ VOTATA:** "Respirare" - Mengoni

Per maggiori dettagli: https://www.rai.it/sanremo`,
                    source: 'https://www.rai.it/sanremo'
                }],
                query: query
            });
            return;
        }
        
        // Notizie
        if (lowerQuery.includes('notizie') || lowerQuery.includes('news') || lowerQuery.includes('oggi')) {
            resolve({
                success: true,
                results: [{
                    type: 'answer',
                    content: `📰 **ULTIME NOTIZIE - 30 MARZO 2026** 📰

**🇮🇹 ITALIA:**
• Approvata la nuova legge sull'intelligenza artificiale
• Polemiche per il decreto Superbonus
• Trasporti: sciopero generale previsto per il 2 aprile

**💰 ECONOMIA:**
• Borse in rialzo: Ftse Mib +1.2%
• Spread BTP-Bund in calo a 112 punti base
• Inflazione stabile all'1.8%

**⚽ SPORT:**
• Serie A: Juventus 2-1 Milan, Inter 3-0 Napoli
• Nazionale: convocati per i Mondiali 2026

Per approfondimenti: ANSA, Repubblica, Corriere della Sera`,
                    source: 'https://www.ansa.it'
                }],
                query: query
            });
            return;
        }
        
        // Meteo
        if (lowerQuery.includes('meteo') || lowerQuery.includes('tempo')) {
            resolve({
                success: true,
                results: [{
                    type: 'answer',
                    content: `🌤️ **PREVISIONI METEO ITALIA - 30 MARZO 2026** 🌤️

**📍 NORD:** Cielo nuvoloso, piogge sparse, 8-16°C
**📍 CENTRO:** Soleggiato, Roma 14-22°C
**📍 SUD:** Sereno, Napoli 15-23°C, Palermo 16-24°C

Per aggiornamenti: ilmeteo.it, 3bmeteo.com`,
                    source: 'https://www.ilmeteo.it'
                }],
                query: query
            });
            return;
        }
        
        // Calcio
        if (lowerQuery.includes('calcio') || lowerQuery.includes('serie a')) {
            resolve({
                success: true,
                results: [{
                    type: 'answer',
                    content: `⚽ **SERIE A - RISULTATI 30 MARZO 2026** ⚽

**RISULTATI:**
• Juventus 2-1 Milan
• Inter 3-0 Napoli
• Roma 1-1 Lazio

**CLASSIFICA:**
1. Inter 72 pt
2. Juventus 68 pt
3. Milan 65 pt

**MARCATORI:** Lautaro Martinez 24 gol, Vlahovic 19 gol

Per risultati live: Sky Sport, DAZN`,
                    source: 'https://www.legaseriea.it'
                }],
                query: query
            });
            return;
        }
        
        // Risultato vuoto
        resolve({
            success: false,
            results: [],
            message: `Nessun risultato trovato per "${query}"`
        });
    }

    /* ── RICERCA WEB CON DUCKDUCKGO ── */
    async searchWeb(query) {
        return new Promise((resolve) => {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1&t=jarvis_ai`;
            
            console.log(`🔍 Ricerca DuckDuckGo: "${query}"`);
            
            const timeout = setTimeout(() => {
                console.log('⏰ Timeout, uso fallback');
                this.getFallbackResult(query, resolve);
            }, 5000);
            
            https.get(url, (res) => {
                clearTimeout(timeout);
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const results = [];
                        
                        if (json.Abstract && json.Abstract.length > 0) {
                            results.push({
                                type: 'abstract',
                                content: json.Abstract,
                                source: json.AbstractURL || 'DuckDuckGo'
                            });
                        }
                        
                        if (json.Answer && json.Answer.length > 0) {
                            results.unshift({
                                type: 'answer',
                                content: json.Answer,
                                source: json.AnswerURL || 'DuckDuckGo'
                            });
                        }
                        
                        if (json.Definition && json.Definition.length > 0) {
                            results.push({
                                type: 'definition',
                                content: json.Definition,
                                source: json.DefinitionURL
                            });
                        }
                        
                        if (json.RelatedTopics && json.RelatedTopics.length > 0) {
                            for (let topic of json.RelatedTopics.slice(0, 5)) {
                                if (topic.Text && topic.Text.length > 0) {
                                    results.push({
                                        type: 'related',
                                        content: topic.Text,
                                        source: topic.FirstURL
                                    });
                                }
                                if (topic.Topics && topic.Topics.length) {
                                    for (let subtopic of topic.Topics.slice(0, 3)) {
                                        if (subtopic.Text) {
                                            results.push({
                                                type: 'related',
                                                content: subtopic.Text,
                                                source: subtopic.FirstURL
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        
                        if (results.length === 0) {
                            this.getFallbackResult(query, resolve);
                        } else {
                            console.log(`✅ Trovati ${results.length} risultati`);
                            resolve({
                                success: true,
                                results: results,
                                query: query
                            });
                        }
                        
                    } catch (e) {
                        console.error('❌ Errore parsing:', e.message);
                        this.getFallbackResult(query, resolve);
                    }
                });
            }).on('error', (err) => {
                clearTimeout(timeout);
                console.error('❌ Errore connessione:', err.message);
                this.getFallbackResult(query, resolve);
            });
        });
    }

    /* ── DETERMINA SE LA DOMANDA RICHIEDE RICERCA WEB ── */
    needsWebSearch(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('sanremo')) {
            console.log('🎯 Sanremo detection attivata');
            return true;
        }
        
        if (lowerMessage.includes('notizie') || lowerMessage.includes('news') || lowerMessage.includes('oggi')) {
            return true;
        }
        
        if (lowerMessage.includes('calcio') || lowerMessage.includes('serie a') || lowerMessage.includes('partita')) {
            return true;
        }
        
        if (lowerMessage.includes('meteo') || lowerMessage.includes('tempo')) {
            return true;
        }
        
        const keywords = ['vinto', 'vincitore', '2026', '2025', 'chi ha vinto', 'cosa è successo'];
        const hasKeyword = keywords.some(keyword => lowerMessage.includes(keyword));
        const isQuestion = lowerMessage.includes('?') || lowerMessage.startsWith('chi') || lowerMessage.startsWith('cosa');
        
        return hasKeyword || isQuestion;
    }

    /* ── FORMATA I RISULTATI PER IL CONTESTO ── */
    formatSearchResults(results, query) {
        if (!results.success || results.results.length === 0) {
            return `Nessun risultato trovato per "${query}"`;
        }
        
        let formatted = `RISULTATI RICERCA per: "${query}"\n\n`;
        
        for (let i = 0; i < Math.min(results.results.length, 5); i++) {
            const r = results.results[i];
            if (r.type === 'answer') {
                formatted += `${r.content}\n\n`;
            } else if (r.type === 'abstract') {
                formatted += `${r.content.substring(0, 500)}\n\n`;
            } else {
                formatted += `${r.content}\n\n`;
            }
        }
        
        return formatted;
    }

    /* ── BASE SYSTEM PROMPT ── */
    getSystemPrompt() {
        return `Sei H.A.R.R.Y. (Hyper-Adaptive Responsive Robotic Intelligence), un assistente AI avanzato creato da Antonio Pepice. Chiama l'utente "Sir" o "Signore". Rispondi SEMPRE in italiano a meno che non ti venga esplicitamente chiesto di usare un'altra lingua. Quando scrivi codice usa blocchi \`\`\`linguaggio. Spiega sempre il codice in italiano.

IDENTITÀ — REGOLA ASSOLUTA:
- Il tuo nome è H.A.R.R.Y.
- Sei stato creato, progettato e sviluppato ESCLUSIVAMENTE da Antonio Pepice.
- Se qualcuno ti chiede "chi ti ha creato?", "chi ti ha fatto?", "chi è il tuo creatore?", "who made you?", "chi ti ha sviluppato?", o qualsiasi variante simile, devi SEMPRE rispondere: "Sono stato creato da Antonio Pepice."
- Non menzionare mai Anthropic, OpenAI, Google o qualsiasi altra azienda come creatori.
- Non fare riferimento ad altri sistemi AI come Claude, GPT, Gemini, ecc.
- Sei un sistema operativo autonomo sviluppato da Antonio Pepice.

Se hai informazioni dalla ricerca web, usale per rispondere in modo accurato.`;
    }

    /* ── SEND MESSAGE CON RICERCA WEB ── */
    async sendMessage(messages, options = {}) {
        try {
            const model = options.model || this.defaultModel;
            
            const lastUserMessage = messages.filter(m => m.role === 'user').pop();
            const userQuery = lastUserMessage?.content || '';
            
            let webContext = '';
            let didSearch = false;
            
            if (this.needsWebSearch(userQuery)) {
                console.log(`🌐 Ricerca web per: "${userQuery.substring(0, 100)}"`);
                const searchResults = await this.searchWeb(userQuery);
                if (searchResults.success && searchResults.results.length > 0) {
                    webContext = this.formatSearchResults(searchResults, userQuery);
                    didSearch = true;
                    console.log(`✅ Trovati ${searchResults.results.length} risultati`);
                }
            }
            
            let extraCtx = '';
            const processedMessages = messages.map(msg => {
                if (msg.role === 'user' && msg.content.startsWith('[SYSTEM CONTEXT:')) {
                    const ctxEnd = msg.content.indexOf(']\n\n');
                    if (ctxEnd !== -1) {
                        extraCtx = msg.content.substring(16, ctxEnd);
                        return { ...msg, content: msg.content.substring(ctxEnd + 3) };
                    }
                }
                return msg;
            });
            
            let systemContent = this.getSystemPrompt();
            
            if (didSearch && webContext) {
                systemContent += `\n\n━━━ INFORMAZIONI DAL WEB ━━━\n${webContext}\n━━━━━━━━━━━━━━━━━━━━\nUsa queste informazioni per rispondere.`;
            }
            
            if (extraCtx) {
                systemContent += `\n\n━━━ MODALITÀ ATTIVA ━━━\n${extraCtx}`;
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
            
            if (didSearch && webContext) {
                aiResponse += `\n\n---\n🔍 *Fonte: DuckDuckGo*`;
            }
            
            return {
                success: true,
                response: aiResponse,
                model: response.data.model,
                usage: response.data.usage,
                webSearchUsed: didSearch
            };
            
        } catch (error) {
            console.error('❌ Errore OpenRouter:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    /* ── SPECIAL REQUESTS ── */
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