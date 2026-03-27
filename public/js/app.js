class JarvisInterface {
    constructor() {
        this.apiUrl = window.location.origin + '/api';
        this.currentConversationId = null;
        this.conversations = [];
        this.synthesis = window.speechSynthesis;
        this.recognition = null;
        this.isSpeaking = false;
        this.isListening = false;
        this.init();
    }

    init() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.conversationsDropdown = document.getElementById('conversationsDropdown');
        
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.initSpeechRecognition();
        this.loadConversations();
        this.createNewChat();
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'it-IT';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                console.log('🎤 Microfono attivo');
                this.isListening = true;
                this.showListeningIndicator();
                const micBtn = document.getElementById('micBtn');
                if (micBtn) micBtn.classList.add('listening');
            };
            
            this.recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                console.log('🎤 Riconosciuto:', transcript);
                this.userInput.value = transcript;
                
                if (event.results[0].isFinal) {
                    setTimeout(() => {
                        this.hideListeningIndicator();
                        const micBtn = document.getElementById('micBtn');
                        if (micBtn) micBtn.classList.remove('listening');
                        this.sendMessage();
                    }, 100);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.hideListeningIndicator();
                const micBtn = document.getElementById('micBtn');
                if (micBtn) micBtn.classList.remove('listening');
                this.isListening = false;
                
                let errorMsg = "Non ho capito, puoi ripetere?";
                if (event.error === 'not-allowed') {
                    errorMsg = "Per favore, concedi il permesso al microfono. Clicca sull'icona del lucchetto nella barra degli indirizzi e abilita il microfono.";
                } else if (event.error === 'no-speech') {
                    errorMsg = "Non ho rilevato alcuna voce. Prova a parlare più forte o avvicinati al microfono.";
                } else if (event.error === 'audio-capture') {
                    errorMsg = "Nessun microfono trovato. Collega un microfono al computer.";
                }
                this.addMessage('JARVIS', errorMsg, 'system');
            };
            
            this.recognition.onend = () => {
                console.log('🎤 Microfono disattivato');
                this.isListening = false;
                this.hideListeningIndicator();
                const micBtn = document.getElementById('micBtn');
                if (micBtn) micBtn.classList.remove('listening');
            };
        } else {
            console.warn('Speech recognition not supported');
            const micBtn = document.getElementById('micBtn');
            if (micBtn) {
                micBtn.style.opacity = '0.5';
                micBtn.title = 'Riconoscimento vocale non supportato in questo browser. Usa Chrome o Edge.';
                micBtn.disabled = true;
            }
            this.addMessage('JARVIS', 'Il riconoscimento vocale non è supportato in questo browser. Per parlare con me, usa Google Chrome o Microsoft Edge.', 'system');
        }
    }

    startListening() {
        if (!this.recognition) {
            this.addMessage('JARVIS', 'Il riconoscimento vocale non è supportato in questo browser. Usa Google Chrome o Microsoft Edge.', 'system');
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
            return;
        }
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                this.recognition.start();
            })
            .catch((err) => {
                console.error('Microphone permission denied:', err);
                this.addMessage('JARVIS', 'Per parlare con me, devi concedere il permesso al microfono. Clicca sull\'icona del lucchetto nella barra degli indirizzi e abilita il microfono.', 'system');
            });
    }

    showListeningIndicator() {
        const indicator = document.getElementById('listeningIndicator');
        if (indicator) indicator.style.display = 'block';
    }

    hideListeningIndicator() {
        const indicator = document.getElementById('listeningIndicator');
        if (indicator) indicator.style.display = 'none';
    }

    async uploadFile(file) {
        if (!file) return;
        
        this.addMessage('System', `📎 Caricamento: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, 'system');
        
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const fileContent = e.target.result;
            
            console.log('📄 Contenuto file letto:', fileContent.substring(0, 200));
            
            const preview = fileContent.substring(0, 500);
            this.addMessage('System', `📄 **Contenuto del file:**\n\`\`\`bash\n${preview}${fileContent.length > 500 ? '\n... (contenuto troncato)' : ''}\n\`\`\``, 'system');
            
            const prompt = `Ecco il contenuto del file "${file.name}":

\`\`\`
${fileContent}
\`\`\`

Analizza questo file. Cosa contiene? Spiegami cosa fa questo file in dettaglio. Rispondi in italiano.`;
            
            this.showTypingIndicator();
            
            try {
                const response = await fetch(`${this.apiUrl}/chat/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversationId: this.currentConversationId,
                        message: prompt
                    })
                });
                
                const data = await response.json();
                this.hideTypingIndicator();
                
                if (data.success) {
                    this.currentConversationId = data.conversationId;
                    this.addMessage('JARVIS', `📄 **Analisi file: ${file.name}**\n\n${data.response}`, 'assistant');
                    this.speak(data.response);
                    await this.loadConversations();
                    this.updateConversationTitle();
                } else {
                    this.addMessage('JARVIS', `Errore durante l'analisi: ${data.error}`, 'system');
                }
            } catch (error) {
                this.hideTypingIndicator();
                this.addMessage('JARVIS', `Errore: ${error.message}`, 'system');
            }
        };
        
        reader.onerror = (error) => {
            console.error('Errore lettura file:', error);
            this.addMessage('JARVIS', `Errore nella lettura del file: ${error.message}`, 'system');
        };
        
        reader.readAsText(file, 'UTF-8');
    }

    async loadConversations() {
        try {
            const response = await fetch(`${this.apiUrl}/conversations`);
            const data = await response.json();
            if (data.success) {
                this.conversations = data.conversations;
                this.renderConversationsList();
                this.renderConversationsDropdown();
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    renderConversationsDropdown() {
        if (!this.conversationsDropdown) return;
        
        if (this.conversations.length === 0) {
            this.conversationsDropdown.innerHTML = '<option value="">-- Nessuna conversazione --</option>';
            return;
        }
        
        this.conversationsDropdown.innerHTML = '<option value="">-- Seleziona conversazione --</option>' +
            this.conversations.map(conv => {
                let displayTitle = conv.title || 'Nuova conversazione';
                if (displayTitle.length > 35) {
                    displayTitle = displayTitle.substring(0, 35) + '...';
                }
                const date = new Date(conv.updated_at).toLocaleString();
                return `<option value="${conv.id}" ${this.currentConversationId === conv.id ? 'selected' : ''}>
                    ${displayTitle} (${date})
                </option>`;
            }).join('');
        
        if (this.currentConversationId) {
            this.conversationsDropdown.value = this.currentConversationId;
        }
    }

    async loadConversationFromDropdown(id) {
        if (!id) return;
        await this.loadConversation(parseInt(id));
    }

    renderConversationsList() {
        const container = document.getElementById('conversationsList');
        if (!container) return;
        
        if (this.conversations.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: rgba(0,243,255,0.5);">Nessuna conversazione</div>';
            return;
        }
        
        container.innerHTML = this.conversations.map(conv => `
            <div class="conversation-item ${this.currentConversationId === conv.id ? 'active' : ''}" 
                 onclick="window.jarvis.loadConversation(${conv.id})">
                <div class="conv-title">${this.escapeHtml(conv.title || 'Nuova Chat')}</div>
                <div class="conv-date">${new Date(conv.updated_at).toLocaleString()}</div>
                <button onclick="event.stopPropagation(); window.jarvis.deleteConversation(${conv.id})" class="delete-conv">🗑️</button>
            </div>
        `).join('');
    }

    async loadConversation(id) {
        try {
            const response = await fetch(`${this.apiUrl}/conversations/${id}`);
            const data = await response.json();
            if (data.success) {
                this.currentConversationId = id;
                this.clearMessages();
                
                data.messages.forEach(msg => {
                    const sender = msg.role === 'user' ? 'Tu' : 'JARVIS';
                    this.addMessage(sender, msg.content, msg.role);
                });
                
                this.renderConversationsList();
                this.renderConversationsDropdown();
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    }

    async deleteConversation(id) {
        if (!confirm('Eliminare questa conversazione?')) return;
        
        try {
            await fetch(`${this.apiUrl}/conversations/${id}`, { method: 'DELETE' });
            await this.loadConversations();
            if (this.currentConversationId === id) {
                this.createNewChat();
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    }

    async createNewChat() {
        try {
            const response = await fetch(`${this.apiUrl}/chat/new`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await response.json();
            this.currentConversationId = data.conversationId;
            this.clearMessages();
            this.addMessage('JARVIS', 'Sistema pronto. Come posso assisterla, signore?', 'system');
            
            await this.loadConversations();
            this.updateConversationTitle();
            this.userInput.focus();
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    }

    updateConversationTitle() {
        if (!this.currentConversationId) return;
        
        const currentConv = this.conversations.find(c => c.id === this.currentConversationId);
        if (currentConv && this.conversationsDropdown) {
            const options = this.conversationsDropdown.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value == this.currentConversationId) {
                    options[i].selected = true;
                    break;
                }
            }
        }
    }

    async updateConversationTitleWithFirstMessage(firstMessage) {
        if (!this.currentConversationId) return;
        
        const title = firstMessage.length > 40 ? firstMessage.substring(0, 40) + '...' : firstMessage;
        
        try {
            await this.loadConversations();
            this.updateConversationTitle();
        } catch (error) {
            console.error('Errore aggiornamento titolo:', error);
        }
    }

    updateActiveConversation() {
        this.renderConversationsList();
        this.renderConversationsDropdown();
    }

    async sendMessage() {
        const content = this.userInput.value.trim();
        if (!content) return;
        
        this.addMessage('Tu', content, 'user');
        this.userInput.value = '';
        
        this.showTypingIndicator();
        
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('chi ti ha creato') || 
            lowerContent.includes('chi ti ha programmato') ||
            lowerContent.includes('chi è il tuo creatore') ||
            lowerContent.includes('chi ti ha fatto') ||
            lowerContent.includes('chi è antonio') ||
            lowerContent.includes('chi è il tuo padrone') ||
            lowerContent.includes('chi ti ha costruito')) {
            
            this.hideTypingIndicator();
            const creatorResponse = "Sono stato creato da Antonio Pepice, la mente brillante dietro questo sistema JARVIS. Mi ha progettato per essere il tuo assistente AI personale, signore.";
            this.addMessage('JARVIS', creatorResponse, 'assistant');
            this.speak(creatorResponse);
            
            await this.updateConversationTitleWithFirstMessage(content);
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/chat/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: this.currentConversationId,
                    message: content
                })
            });
            
            const data = await response.json();
            this.hideTypingIndicator();
            
            if (data.success) {
                this.currentConversationId = data.conversationId;
                this.addMessage('JARVIS', data.response, 'assistant');
                this.speak(data.response);
                
                await this.loadConversations();
                this.updateConversationTitle();
            } else {
                this.addMessage('JARVIS', `Errore: ${data.error}`, 'system');
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('JARVIS', `Errore di connessione: ${error.message}`, 'system');
        }
    }

    speak(text) {
        if (!text) return;
        
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        
        const cleanText = text.replace(/```[\s\S]*?```/g, '').replace(/[#*_]/g, '').substring(0, 500);
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'it-IT';
        utterance.rate = 0.9;
        utterance.pitch = 0.9;
        
        utterance.onstart = () => {
            this.isSpeaking = true;
            const indicator = document.getElementById('speakingIndicator');
            if (indicator) indicator.style.display = 'block';
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            const indicator = document.getElementById('speakingIndicator');
            if (indicator) indicator.style.display = 'none';
        };
        
        utterance.onerror = (event) => {
            console.error('Speech error:', event);
            this.isSpeaking = false;
            const indicator = document.getElementById('speakingIndicator');
            if (indicator) indicator.style.display = 'none';
        };
        
        this.synthesis.speak(utterance);
    }

    addMessage(sender, content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type === 'user' ? 'user-message' : 'system-message'}`;
        
        const time = new Date().toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="message-header">${sender} • ${time}</div>
            <div class="message-content">${this.formatMessage(content)}</div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
        });
        content = content.replace(/\n/g, '<br>');
        return content;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearMessages() {
        this.chatMessages.innerHTML = '';
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message system-message typing-indicator';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `<div class="message-content"><span>●</span><span>●</span><span>●</span></div>`;
        this.chatMessages.appendChild(indicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.jarvis = new JarvisInterface();
});