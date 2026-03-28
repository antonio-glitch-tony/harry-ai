class JarvisInterface {
    constructor() {
        this.apiUrl = '';
        this.token = localStorage.getItem('jarvis_token');
        this.currentUser = null;
        this.currentConversationId = null;
        this.conversations = [];
        this.synthesis = window.speechSynthesis;
        this.recognition = null;
        this.isSpeaking = false;
        this.isListening = false;
        
        if (this.token) {
            this.verifyAuth();
        } else {
            this.showAuthPage();
        }
        
        this.initSidebar();
    }
    
    async verifyAuth() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.initChat();
            } else {
                this.showAuthPage();
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.showAuthPage();
        }
    }
    
    showAuthPage() {
        document.getElementById('authPage').style.display = 'flex';
        document.getElementById('chatPage').style.display = 'none';
        this.token = null;
        localStorage.removeItem('jarvis_token');
    }
    
    initChat() {
        document.getElementById('authPage').style.display = 'none';
        document.getElementById('chatPage').style.display = 'block';
        
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
        this.updateSystemTime();
        
        // Welcome message with user name
        setTimeout(() => {
            this.addMessage('JARVIS', `Benvenuto ${this.currentUser.name}! Come posso assisterti oggi, signore?`, 'assistant', []);
        }, 500);
    }
    
    initSidebar() {
        this.sidebar = document.getElementById('sidebar');
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (window.innerWidth < 992) {
            this.closeSidebar();
        }
        
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 992) {
                this.openSidebar();
            } else {
                this.closeSidebar();
            }
        });
    }
    
    toggleSidebar() {
        if (this.sidebar.classList.contains('open')) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }
    
    openSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.add('open');
            if (this.hamburgerBtn) this.hamburgerBtn.classList.add('active');
            if (this.sidebarOverlay) this.sidebarOverlay.classList.add('active');
        }
    }
    
    closeSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.remove('open');
            if (this.hamburgerBtn) this.hamburgerBtn.classList.remove('active');
            if (this.sidebarOverlay) this.sidebarOverlay.classList.remove('active');
        }
    }
    
    async updateSystemTime() {
        try {
            const response = await fetch('/api/system/info');
            const data = await response.json();
            if (data.success) {
                console.log(`📅 ${data.day} ${data.date} - 🕐 ${data.time}`);
            }
        } catch (error) {
            console.error('Errore recupero ora:', error);
        }
    }
    
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'it-IT';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            
            this.recognition.onstart = () => {
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
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.hideListeningIndicator();
                const micBtn = document.getElementById('micBtn');
                if (micBtn) micBtn.classList.remove('listening');
            };
        } else {
            const micBtn = document.getElementById('micBtn');
            if (micBtn) {
                micBtn.style.opacity = '0.5';
                micBtn.disabled = true;
            }
        }
    }
    
    startListening() {
        if (!this.recognition) return;
        if (this.isListening) {
            this.recognition.stop();
            return;
        }
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => this.recognition.start())
            .catch((err) => {
                console.error('Microphone permission denied:', err);
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
        
        this.addMessage('System', `📎 Caricamento: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, 'system', []);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const fileContent = e.target.result;
            const prompt = `Analizza questo file chiamato "${file.name}" e spiegami cosa contiene:\n\n${fileContent}`;
            
            this.showTypingIndicator();
            
            try {
                const response = await fetch('/api/chat/history', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({
                        conversationId: this.currentConversationId,
                        message: prompt
                    })
                });
                
                const data = await response.json();
                this.hideTypingIndicator();
                
                if (data.success) {
                    this.currentConversationId = data.conversationId;
                    await this.typeMessage(`📄 **Analisi file: ${file.name}**\n\n${data.response}`, data.sources || []);
                    this.speak(data.response);
                    await this.loadConversations();
                } else {
                    this.addMessage('JARVIS', `Errore: ${data.error}`, 'system', []);
                }
            } catch (error) {
                this.hideTypingIndicator();
                this.addMessage('JARVIS', `Errore: ${error.message}`, 'system', []);
            }
        };
        reader.readAsText(file, 'UTF-8');
    }
    
    async loadConversations() {
        try {
            const response = await fetch('/api/conversations', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
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
                return `<option value="${conv.id}" ${this.currentConversationId === conv.id ? 'selected' : ''}>${displayTitle}</option>`;
            }).join('');
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
            const response = await fetch(`/api/conversations/${id}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            if (data.success) {
                this.currentConversationId = id;
                this.clearMessages();
                
                data.messages.forEach(msg => {
                    const sources = msg.sources ? JSON.parse(msg.sources) : [];
                    this.addMessage(msg.role === 'user' ? 'Tu' : 'JARVIS', msg.content, msg.role, sources);
                });
                
                this.renderConversationsList();
                this.renderConversationsDropdown();
                
                if (window.innerWidth < 992) {
                    this.closeSidebar();
                }
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    }
    
    async deleteConversation(id) {
        if (!confirm('Eliminare questa conversazione?')) return;
        
        try {
            await fetch(`/api/conversations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
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
            const response = await fetch('/api/chat/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({})
            });
            const data = await response.json();
            this.currentConversationId = data.conversationId;
            this.clearMessages();
            this.addMessage('JARVIS', `Sistema pronto. Come posso assisterla, ${this.currentUser.name}?`, 'assistant', []);
            await this.loadConversations();
            this.userInput.focus();
            
            if (window.innerWidth < 992) {
                this.closeSidebar();
            }
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    }
    
    loadConversationFromDropdown(id) {
        if (!id) return;
        this.loadConversation(parseInt(id));
    }
    
    async sendMessage() {
        const content = this.userInput.value.trim();
        if (!content) return;
        
        this.addMessage('Tu', content, 'user', []);
        this.userInput.value = '';
        
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/chat/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    conversationId: this.currentConversationId,
                    message: content
                })
            });
            
            const data = await response.json();
            this.hideTypingIndicator();
            
            if (data.success) {
                this.currentConversationId = data.conversationId;
                await this.typeMessage(data.response, data.sources || []);
                this.speak(data.response);
                await this.loadConversations();
            } else {
                this.addMessage('JARVIS', `Errore: ${data.error}`, 'system', []);
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('JARVIS', `Errore di connessione: ${error.message}`, 'system', []);
        }
    }
    
    async typeMessage(content, sources) {
        return new Promise((resolve) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message system-message';
            
            const time = new Date().toLocaleTimeString();
            const messageId = 'msg_' + Date.now();
            
            messageDiv.innerHTML = `
                <div class="message-header">JARVIS • ${time}</div>
                <div class="message-content" id="${messageId}"></div>
                <div class="message-sources">
                    <div class="sources-toggle" onclick="document.getElementById('sources_${messageId}').classList.toggle('show')">
                        🔍 Fonti verificate ▼
                    </div>
                    <div id="sources_${messageId}" class="sources-list">
                        ${sources.map(s => `
                            <div class="source-item">
                                <span class="source-verified">✓</span>
                                ${s.url ? `<a href="${s.url}" target="_blank" class="source-link">${s.title}</a>` : s.title}
                                ${s.verified ? '<span style="color: #00ff00;"> (Verificata)</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
            
            const contentElement = document.getElementById(messageId);
            let i = 0;
            contentElement.classList.add('typing');
            
            const interval = setInterval(() => {
                if (i < content.length) {
                    contentElement.innerHTML += content.charAt(i);
                    this.scrollToBottom();
                    i++;
                } else {
                    clearInterval(interval);
                    contentElement.classList.remove('typing');
                    
                    // Check for code blocks and add download button
                    if (content.includes('```')) {
                        this.addCodeDownloadButton(contentElement, content);
                    }
                    
                    resolve();
                }
            }, 30);
        });
    }
    
    addCodeDownloadButton(element, content) {
        const codeMatch = content.match(/```(\w+)\n([\s\S]*?)```/);
        if (codeMatch) {
            const language = codeMatch[1];
            const code = codeMatch[2];
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'code-download-btn';
            downloadBtn.innerHTML = '📥 Scarica Codice';
            downloadBtn.onclick = () => this.downloadCode(code, language);
            
            element.parentElement.appendChild(downloadBtn);
        }
    }
    
    downloadCode(code, language) {
        let extension = 'txt';
        switch(language) {
            case 'javascript': extension = 'js'; break;
            case 'python': extension = 'py'; break;
            case 'html': extension = 'html'; break;
            case 'css': extension = 'css'; break;
            case 'json': extension = 'json'; break;
        }
        
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jarvis_code.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    addMessage(sender, content, role, sources) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role === 'user' ? 'user-message' : 'system-message'}`;
        
        const time = new Date().toLocaleTimeString();
        const messageId = 'msg_' + Date.now();
        
        let sourcesHtml = '';
        if (sources && sources.length > 0) {
            sourcesHtml = `
                <div class="message-sources">
                    <div class="sources-toggle" onclick="document.getElementById('sources_${messageId}').classList.toggle('show')">
                        🔍 Fonti verificate ▼
                    </div>
                    <div id="sources_${messageId}" class="sources-list">
                        ${sources.map(s => `
                            <div class="source-item">
                                <span class="source-verified">✓</span>
                                ${s.url ? `<a href="${s.url}" target="_blank" class="source-link">${s.title}</a>` : s.title}
                                ${s.verified ? '<span style="color: #00ff00;"> (Verificata)</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            <div class="message-header">${sender} • ${time}</div>
            <div class="message-content">${this.formatMessage(content)}</div>
            ${sourcesHtml}
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add download button for code
        if (content.includes('```')) {
            this.addCodeDownloadButton(messageDiv.querySelector('.message-content'), content);
        }
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
        
        this.synthesis.speak(utterance);
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

// Auth Functions
function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// Login handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('authMessage');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('jarvis_token', data.token);
            window.jarvis = new JarvisInterface();
            messageDiv.innerHTML = '<span style="color: #00ff00;">✅ Login effettuato!</span>';
        } else {
            messageDiv.innerHTML = `<span style="color: #ff4444;">❌ ${data.error}</span>`;
        }
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: #ff4444;">❌ Errore di connessione</span>`;
    }
});

// Register handler
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const surname = document.getElementById('regSurname').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const messageDiv = document.getElementById('authMessage');
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, surname, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('jarvis_token', data.token);
            window.jarvis = new JarvisInterface();
            messageDiv.innerHTML = '<span style="color: #00ff00;">✅ Registrazione completata!</span>';
        } else {
            messageDiv.innerHTML = `<span style="color: #ff4444;">❌ ${data.error}</span>`;
        }
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: #ff4444;">❌ Errore di connessione</span>`;
    }
});

function logout() {
    localStorage.removeItem('jarvis_token');
    window.location.reload();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.jarvis = new JarvisInterface();
});