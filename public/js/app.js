/* ═══════════════════════════════════════════════════════════
   J.A.R.V.I.S. — Frontend App v4.0
   Autore: Antonio Pepice
   ═══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   MODE SYSTEM PROMPTS
══════════════════════════════════════════════════════════ */
const MODE_PROMPTS = {
    python: 'MODALITÀ PYTHON ATTIVA. Sei ora il massimo esperto di Python nel mondo...',
    javascript: 'MODALITÀ JAVASCRIPT ATTIVA. Sei un guru di JavaScript/Node.js moderno...',
    typescript: 'MODALITÀ TYPESCRIPT ATTIVA...',
    java: 'MODALITÀ JAVA ATTIVA...',
    cpp: 'MODALITÀ C++ ATTIVA...',
    c: 'MODALITÀ C ATTIVA...',
    csharp: 'MODALITÀ C# ATTIVA...',
    go: 'MODALITÀ GO ATTIVA...',
    rust: 'MODALITÀ RUST ATTIVA...',
    php: 'MODALITÀ PHP ATTIVA...',
    ruby: 'MODALITÀ RUBY ATTIVA...',
    swift: 'MODALITÀ SWIFT ATTIVA...',
    kotlin: 'MODALITÀ KOTLIN ATTIVA...',
    html: 'MODALITÀ HTML/CSS ATTIVA...',
    sql: 'MODALITÀ SQL ATTIVA...',
    bash: 'MODALITÀ BASH/SHELL ATTIVA...',
    dart: 'MODALITÀ DART/FLUTTER ATTIVA...',
    scala: 'MODALITÀ SCALA ATTIVA...',
    haskell: 'MODALITÀ HASKELL ATTIVA...',
    r: 'MODALITÀ R ATTIVA...',
    matlab: 'MODALITÀ MATLAB ATTIVA...',
    julia: 'MODALITÀ JULIA ATTIVA...',
    lua: 'MODALITÀ LUA ATTIVA...',
    elixir: 'MODALITÀ ELIXIR ATTIVA...',
    erlang: 'MODALITÀ ERLANG ATTIVA...',
    clojure: 'MODALITÀ CLOJURE ATTIVA...',
    fsharp: 'MODALITÀ F# ATTIVA...',
    ocaml: 'MODALITÀ OCAML ATTIVA...',
    assembly: 'MODALITÀ ASSEMBLY ATTIVA...',
    zig: 'MODALITÀ ZIG ATTIVA...',
    nim: 'MODALITÀ NIM ATTIVA...',
    wasm: 'MODALITÀ WEBASSEMBLY ATTIVA...',
    glsl: 'MODALITÀ GLSL/HLSL ATTIVA...',
    powershell: 'MODALITÀ POWERSHELL ATTIVA...',
    cobol: 'MODALITÀ COBOL ATTIVA...',
    translate: 'MODALITÀ TRADUZIONE ATTIVA...',
    summarize: 'MODALITÀ RIASSUNTO ATTIVA...',
    debug: 'MODALITÀ DEBUG ATTIVA...',
    explain: 'MODALITÀ SPIEGAZIONE ATTIVA...',
    math: 'MODALITÀ MATEMATICA ATTIVA...',
    creative: 'MODALITÀ CREATIVA ATTIVA...',
    security: 'MODALITÀ CYBERSECURITY ATTIVA...',
    devops: 'MODALITÀ DEVOPS ATTIVA...',
    ml: 'MODALITÀ MACHINE LEARNING/AI ATTIVA...',
};

/* ══════════════════════════════════════════════════════════
   GENERA IMPRONTA DIGITALE (FINGERPRINT) - FUNZIONANTE
══════════════════════════════════════════════════════════ */
async function generateFingerprint() {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.deviceMemory || 'unknown',
        !!navigator.plugins.length,
        !!window.chrome,
        !!navigator.webdriver,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        await getCanvasFingerprint(),
        await getWebGLFingerprint()
    ];
    const fingerprint = components.join('|');
    return await sha256(fingerprint);
}

async function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 100, 40);
        ctx.fillStyle = '#069';
        ctx.fillText('JARVIS', 2, 15);
        return canvas.toDataURL();
    } catch(e) { return 'canvas_error'; }
}

async function getWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return 'webgl_not_supported';
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
        return 'webgl_no_info';
    } catch(e) { return 'webgl_error'; }
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 64);
}

/* ══════════════════════════════════════════════════════════
   HOLOGRAM — Avengers: Age of Ultron style (CON VOICE)
══════════════════════════════════════════════════════════ */
class JarvisHologram {
    constructor(canvasId, size = 380) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.canvas.width  = size;
        this.canvas.height = size;
        this.ctx     = this.canvas.getContext('2d');
        this.t       = 0;
        this.active  = false;
        this.speaking = false;
        this.particles = Array.from({ length: 90 }, () => ({
            angle:  Math.random() * Math.PI * 2,
            radius: (size * 0.25) + Math.random() * (size * 0.2),
            speed:  0.003 + Math.random() * 0.015,
            size:   1 + Math.random() * 3,
            alpha:  Math.random(),
        }));
    }

    start()  { this.active = true;  this._frame(); }
    stop()   { this.active = false; }
    setSpeaking(v) { this.speaking = v; }

    _frame() {
        if (!this.active || !this.canvas) return;
        const { canvas, ctx } = this;
        const cx = canvas.width  / 2;
        const cy = canvas.height / 2;
        const R  = canvas.width  * 0.4;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.t += 0.012;

        for (let r = 4; r >= 1; r--) {
            ctx.beginPath();
            ctx.arc(cx, cy, R + 8, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0,243,255,${0.04 * r})`;
            ctx.lineWidth   = r * 8;
            ctx.stroke();
        }

        const arcCfg = [
            { r: R * 0.92, speed: 0.32, color: 'rgba(0,220,255,0.85)' },
            { r: R * 1.06, speed: -0.24, color: 'rgba(0,180,255,0.65)' },
            { r: R * 1.2, speed: 0.18, color: 'rgba(0,120,255,0.45)' },
            { r: R * 1.34, speed: -0.12, color: 'rgba(0,80,200,0.3)' },
        ];
        arcCfg.forEach(({ r, speed, color }, i) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(this.t * speed);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * (1.3 + 0.25 * Math.sin(this.t * 1.5 + i)));
            ctx.strokeStyle = color;
            ctx.lineWidth   = 2.2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(r, 0, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#00f3ff';
            ctx.fill();
            ctx.restore();
        });

        const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R * 1.2);
        grad.addColorStop(0,   'rgba(200,240,255,0.95)');
        grad.addColorStop(0.3, 'rgba(0,200,255,0.8)');
        grad.addColorStop(0.6, 'rgba(0,100,200,0.5)');
        grad.addColorStop(1,   'rgba(0,30,100,0.2)');
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        const coreR = R * 0.42;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fillStyle   = 'rgba(180,235,255,0.95)';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur  = this.speaking ? 35 : 22;
        ctx.fill();
        ctx.shadowBlur  = 0;

        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + this.t * 0.8;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * coreR * 0.5, cy + Math.sin(a) * coreR * 0.5);
            ctx.lineTo(cx + Math.cos(a) * coreR * 1.1, cy + Math.sin(a) * coreR * 1.1);
            ctx.strokeStyle = 'rgba(0,100,200,0.9)';
            ctx.lineWidth   = 2.5;
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < 4; i++) {
            const rr = R * (0.55 - i * 0.12);
            ctx.beginPath();
            ctx.arc(0, 0, rr, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0,220,255,${0.22 + i * 0.08})`;
            ctx.lineWidth   = 1.2;
            ctx.stroke();
        }
        
        if (this.speaking) {
            const wave = coreR * 1.2 + coreR * 0.25 * Math.abs(Math.sin(this.t * 12));
            ctx.beginPath();
            ctx.arc(0, 0, wave, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0,255,200,0.7)';
            ctx.lineWidth   = 3;
            ctx.stroke();
            
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, wave + i * 6, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0,200,255,${0.3 - i * 0.08})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
        ctx.restore();

        this.particles.forEach(p => {
            p.angle += p.speed;
            p.alpha  = 0.4 + 0.6 * Math.abs(Math.sin(p.angle * 2.5));
            const x  = cx + Math.cos(p.angle) * p.radius;
            const y  = cy + Math.sin(p.angle) * p.radius * 0.4;
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,243,255,${p.alpha * 0.7})`;
            ctx.fill();
        });

        for (let y = 0; y < canvas.height; y += 3) {
            ctx.fillStyle = 'rgba(0,0,20,0.04)';
            ctx.fillRect(0, y, canvas.width, 1);
        }

        ctx.font      = `${Math.max(8, canvas.width * 0.03)}px Share Tech Mono, monospace`;
        ctx.fillStyle = 'rgba(0,243,255,0.55)';
        const readout = ['SYS:ONLINE', `T:${(this.t % 100).toFixed(1)}`, 'SEC:AES-256', 'NET:ACTIVE', '2FA:ENABLED'];
        readout.forEach((l, i) => ctx.fillText(l, 6, 18 + i * (canvas.width * 0.045)));

        requestAnimationFrame(() => this._frame());
    }
}

/* ══════════════════════════════════════════════════════════
   FILE MEMORY MANAGER
══════════════════════════════════════════════════════════ */
class FileMemoryManager {
    constructor() {
        this.files = new Map();
        this.maxFileSize = 50000;
    }

    addFile(name, content, type) {
        const key = Date.now() + '_' + name;
        let truncatedContent = content;
        if (content.length > this.maxFileSize) {
            truncatedContent = content.substring(0, this.maxFileSize) + 
                `\n\n[FILE TROPPO LUNGO: ${content.length} caratteri, mostrati i primi ${this.maxFileSize}]`;
        }
        this.files.set(key, {
            name, content: truncatedContent, type, timestamp: Date.now()
        });
        return key;
    }

    getFileContent(key) {
        return this.files.get(key)?.content || null;
    }

    getAllFilesContext() {
        if (this.files.size === 0) return '';
        let context = '\n\n📁 **FILE MEMORIZZATI:**\n';
        for (const [key, file] of this.files) {
            context += `\n--- FILE: ${file.name} ---\n${file.content.substring(0, 3000)}...\n`;
        }
        return context;
    }

    clear() {
        this.files.clear();
    }
}

/* ══════════════════════════════════════════════════════════
   MAIN INTERFACE CLASS
══════════════════════════════════════════════════════════ */
class JarvisInterface {
    constructor() {
        this.apiUrl             = '';
        this.token              = localStorage.getItem('jarvis_token');
        this.currentUser        = null;
        this.currentConversationId = null;
        this.conversations      = [];
        this.synthesis          = window.speechSynthesis;
        this.recognition        = null;
        this.isSpeaking         = false;
        this.isListening        = false;
        this.activeMode         = null;
        this.hologram           = null;
        this.hologramVisible    = false;
        this.authHologram       = null;
        this.fileMemory         = new FileMemoryManager();
        this.holoRecognition    = null;

        if (this.token) {
            this.verifyAuth();
        } else {
            this.showAuthPage();
        }
        this.initSidebar();
        this._startAuthHologram();
    }

    async verifyAuth() {
        try {
            const res  = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${this.token}` } });
            const data = await res.json();
            if (data.success) {
                this.currentUser = data.user;
                this.initChat();
            } else {
                this.showAuthPage();
            }
        } catch {
            this.showAuthPage();
        }
    }

    showAuthPage() {
        document.getElementById('authPage').style.display  = 'flex';
        document.getElementById('chatPage').style.display  = 'none';
        this.token = null;
        localStorage.removeItem('jarvis_token');
        this._startAuthHologram();
    }

    _startAuthHologram() {
        if (!this.authHologram) {
            this.authHologram = new JarvisHologram('hologramCanvas', 300);
        }
        this.authHologram.start();
    }

    initChat() {
        document.getElementById('authPage').style.display = 'none';
        document.getElementById('chatPage').style.display = 'block';
        if (this.authHologram) this.authHologram.stop();

        this.chatMessages = document.getElementById('chatMessages');
        this.userInput    = document.getElementById('userInput');
        this.sendBtn      = document.getElementById('sendBtn');

        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
        });
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = Math.min(this.userInput.scrollHeight, 120) + 'px';
        });

        this.initCapabilitiesDropdown();
        this.initSpeechRecognition();
        this.loadConversations();
        this.createNewChat();
    }

    initCapabilitiesDropdown() {
        const dropdown = document.getElementById('capabilitiesDropdown');
        if (!dropdown) return;
        
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        
        document.addEventListener('click', () => {
            dropdown.classList.remove('open');
        });
        
        const items = dropdown.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const mode = item.dataset.mode;
                const label = item.dataset.label;
                this.setMode(mode, label);
                dropdown.classList.remove('open');
            });
        });
    }

    initSidebar() {
        this.sidebar        = document.getElementById('sidebar');
        this.hamburgerBtn   = document.getElementById('hamburgerBtn');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        if (window.innerWidth < 992) this.closeSidebar();
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 992) this.openSidebar(); else this.closeSidebar();
        });
    }
    
    toggleSidebar() { this.sidebar?.classList.contains('open') ? this.closeSidebar() : this.openSidebar(); }
    openSidebar()   {
        this.sidebar?.classList.add('open');
        this.hamburgerBtn?.classList.add('active');
        this.sidebarOverlay?.classList.add('active');
    }
    closeSidebar()  {
        this.sidebar?.classList.remove('open');
        this.hamburgerBtn?.classList.remove('active');
        this.sidebarOverlay?.classList.remove('active');
    }

    setMode(mode, label) {
        this.activeMode = mode;
        const bar  = document.getElementById('activeModeBar');
        const text = document.getElementById('activeModeText');
        const modeLabel = label || mode.toUpperCase();

        if (bar && text) {
            text.textContent = `⚡ Modalità Attiva: ${modeLabel}`;
            bar.style.display = 'flex';
        }

        const dropdownBtn = document.querySelector('.dropdown-btn');
        if (dropdownBtn) {
            dropdownBtn.innerHTML = `<span class="dropdown-icon">⚡</span> ${modeLabel} <span class="dropdown-arrow">▼</span>`;
        }

        const placeholders = {
            python: 'Cosa vuoi fare in Python, Signore?',
            javascript: 'Dimmi cosa costruire in JavaScript...',
            translate: 'Incolla il testo da tradurre...',
            summarize: 'Incolla il testo da riassumere...',
            debug: 'Incolla il codice da analizzare...',
            explain: 'Cosa devo spiegarle, Signore?',
            math: 'Inserisci il problema matematico...',
        };
        if (this.userInput) {
            this.userInput.placeholder = placeholders[mode] || `Richiesta in modalità ${modeLabel}...`;
            this.userInput.focus();
        }

        const greetings = {
            python: `Modalità **${modeLabel}** inizializzata, Signore. Sono pronto a scrivere codice Python di alto livello...`,
            javascript: `Eccellente scelta, Sir. **Modalità JavaScript** online...`,
            debug: `**Modalità Debug** attivata, Signore...`,
            translate: `**Modalità Traduzione** attivata...`,
            creative: `**Modalità Creativa** attivata, Signore...`,
        };
        const greeting = greetings[mode] || `Modalità **${modeLabel}** attivata, Signore. Come posso assisterla?`;
        this.addMessage('JARVIS', greeting, 'assistant', [], true);
    }

    clearMode() {
        this.activeMode = null;
        const bar = document.getElementById('activeModeBar');
        if (bar) bar.style.display = 'none';
        
        const dropdownBtn = document.querySelector('.dropdown-btn');
        if (dropdownBtn) {
            dropdownBtn.innerHTML = `<span class="dropdown-icon">⚡</span> Seleziona Modalità <span class="dropdown-arrow">▼</span>`;
        }
        
        if (this.userInput) {
            this.userInput.placeholder = 'Scrivi o parla con JARVIS...';
        }
    }

    toggleHologram() {
        const el          = document.getElementById('holoJarvis');
        const mainContent = document.querySelector('.main-content');
        const sidebar     = document.getElementById('sidebar');
        const hamburger   = document.getElementById('hamburgerBtn');
        if (!el) return;
        this.hologramVisible = !this.hologramVisible;

        if (this.hologramVisible) {
            el.style.display = 'flex';
            if (mainContent) mainContent.style.visibility = 'hidden';
            if (sidebar)     sidebar.style.visibility     = 'hidden';
            if (hamburger)   hamburger.style.visibility   = 'hidden';
            if (!this.hologram) this.hologram = new JarvisHologram('holoCanvas', 380);
            this.hologram.start();
            this.initHoloSpeechRecognition();
        } else {
            el.style.display = 'none';
            if (mainContent) mainContent.style.visibility = 'visible';
            if (sidebar)     sidebar.style.visibility     = 'visible';
            if (hamburger)   hamburger.style.visibility   = 'visible';
            this.hologram?.stop();
            if (this.holoRecognition) {
                this.holoRecognition.stop();
            }
        }
    }

    initHoloSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.holoRecognition = new SR();
            this.holoRecognition.lang = 'it-IT';
            this.holoRecognition.continuous = false;
            this.holoRecognition.interimResults = true;
            
            this.holoRecognition.onresult = (e) => {
                let transcript = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    transcript += e.results[i][0].transcript;
                }
                const holoInput = document.getElementById('holoInput');
                if (holoInput) {
                    holoInput.value = transcript;
                    if (e.results[0].isFinal) {
                        setTimeout(() => this.sendHologramMessage(), 100);
                    }
                }
            };
            
            this.holoRecognition.onerror = () => {
                console.log('Errore riconoscimento vocale ologramma');
            };
        }
    }

    startHoloListening() {
        if (this.holoRecognition) {
            try {
                this.holoRecognition.start();
                const micBtn = document.getElementById('holoMicBtn');
                if (micBtn) micBtn.classList.add('listening');
                setTimeout(() => {
                    if (micBtn) micBtn.classList.remove('listening');
                }, 5000);
            } catch(e) {}
        }
    }

    async sendHologramMessage() {
        const input = document.getElementById('holoInput');
        const msgs  = document.getElementById('holoMessages');
        if (!input || !msgs) return;
        const text = input.value.trim();
        if (!text) return;
        input.value = '';

        const userDiv = document.createElement('div');
        userDiv.className   = 'holo-msg holo-msg-user';
        userDiv.textContent = text;
        msgs.appendChild(userDiv);
        msgs.scrollTop = msgs.scrollHeight;

        const loadDiv = document.createElement('div');
        loadDiv.className   = 'holo-msg holo-msg-jarvis';
        loadDiv.innerHTML = '<span class="holo-typing">● ● ●</span>';
        msgs.appendChild(loadDiv);
        msgs.scrollTop = msgs.scrollHeight;

        try {
            if (!this.holoHistory) this.holoHistory = [];
            this.holoHistory.push({ role: 'user', content: text });
            
            let finalMessage = text;
            const fileContext = this.fileMemory.getAllFilesContext();
            if (fileContext) {
                finalMessage = `[CONTESTO FILE]\n${fileContext}\n\n[DOMANDA]\n${text}`;
            }
            
            const res  = await fetch('/api/chat', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body:    JSON.stringify({ messages: [...this.holoHistory.slice(0, -1), { role: 'user', content: finalMessage }] })
            });
            const data  = await res.json();
            const reply = data.success ? data.response : 'Errore di sistema, Signore.';
            this.holoHistory.push({ role: 'assistant', content: reply });
            loadDiv.innerHTML = this.formatMessage(reply);
            loadDiv.classList.remove('holo-typing');

            if (this.synthesis && this.hologram) {
                this.hologram.setSpeaking(true);
                const utt = new SpeechSynthesisUtterance(reply.replace(/[*_`#]/g, '').substring(0, 400));
                utt.lang  = 'it-IT';
                utt.onend = () => this.hologram?.setSpeaking(false);
                this.synthesis.speak(utt);
            }
        } catch {
            loadDiv.innerHTML = 'Errore di connessione, Signore.';
        }
        msgs.scrollTop = msgs.scrollHeight;
    }

    async loadConversations() {
        try {
            const res  = await fetch('/api/conversations', { headers: { 'Authorization': `Bearer ${this.token}` } });
            const data = await res.json();
            if (data.success) {
                this.conversations = data.conversations || [];
                this.renderConversationsList();
            }
        } catch (e) { console.error(e); }
    }

    _groupByDate(conversations) {
        const now   = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yday  = new Date(today); yday.setDate(yday.getDate() - 1);
        const week  = new Date(today); week.setDate(week.getDate() - 7);
        const month = new Date(today); month.setDate(month.getDate() - 30);

        const groups = { 'OGGI': [], 'IERI': [], 'ULTIMI 7 GIORNI': [], 'ULTIMO MESE': [], 'PRECEDENTI': [] };
        conversations.forEach(c => {
            const d   = new Date(c.updated_at);
            const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            if      (day >= today) groups['OGGI'].push(c);
            else if (day >= yday)  groups['IERI'].push(c);
            else if (day >= week)  groups['ULTIMI 7 GIORNI'].push(c);
            else if (day >= month) groups['ULTIMO MESE'].push(c);
            else                   groups['PRECEDENTI'].push(c);
        });
        return groups;
    }

    renderConversationsList() {
        const container = document.getElementById('conversationsList');
        if (!container) return;

        if (!this.conversations.length) {
            container.innerHTML = '<div class="sidebar-empty-msg">Nessuna conversazione</div>';
            return;
        }

        const groups = this._groupByDate(this.conversations);
        let html = '';
        Object.entries(groups).forEach(([label, convs]) => {
            if (!convs.length) return;
            html += `<div class="sidebar-section-label">${label}</div>`;
            convs.forEach(conv => {
                const title    = this.escapeHtml((conv.title || 'Nuova Chat').substring(0, 45));
                const isActive = this.currentConversationId === conv.id ? 'active' : '';
                html += `
                    <div class="conv-item ${isActive}" onclick="window.jarvis.loadConversation(${conv.id})">
                        <div class="conv-item-icon">💬</div>
                        <div class="conv-item-text">
                            <div class="conv-item-title">${title}</div>
                            <div class="conv-item-date">${new Date(conv.updated_at).toLocaleDateString('it-IT')}</div>
                        </div>
                        <button class="conv-item-delete" onclick="event.stopPropagation();window.jarvis.deleteConversation(${conv.id})" title="Elimina">🗑</button>
                    </div>`;
            });
        });
        container.innerHTML = html;
    }

    async loadConversation(id) {
        try {
            const res  = await fetch(`/api/conversations/${id}`, { headers: { 'Authorization': `Bearer ${this.token}` } });
            const data = await res.json();
            if (data.success) {
                this.currentConversationId = id;
                this.clearMessages();
                if (data.messages?.length) {
                    data.messages.forEach(msg => {
                        this.addMessage(msg.role === 'user' ? 'Tu' : 'JARVIS', msg.content, msg.role, [], false);
                    });
                }
                this.renderConversationsList();
                if (window.innerWidth < 992) this.closeSidebar();
            }
        } catch (e) { console.error(e); }
    }

    async deleteConversation(id) {
        if (!confirm('Eliminare questa conversazione?')) return;
        try {
            await fetch(`/api/conversations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            await this.loadConversations();
            if (this.currentConversationId === id) this.createNewChat();
        } catch (e) { console.error(e); }
    }

    async createNewChat() {
        try {
            const res  = await fetch('/api/chat/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) {
                this.currentConversationId = data.conversationId;
                this.clearMessages();
                this.clearMode();
                this.fileMemory.clear();
                
                const name = this.currentUser?.name || 'Signore';
                const creatorMessage = this.currentUser?.email === 'antonio.pepice08@gmail.com' 
                    ? `Buongiorno, ${name}! Sono J.A.R.V.I.S., il suo assistente personale creato da **Antonio Pepice**. Posso aiutarla con qualsiasi linguaggio di programmazione, analisi file, traduzioni, matematica e molto altro. Come posso assisterla oggi?`
                    : `Buongiorno, ${name}! Sono J.A.R.V.I.S. Posso aiutarla con qualsiasi linguaggio di programmazione, analisi file, traduzioni, matematica e molto altro. Come posso assisterla oggi?`;
                
                this.addMessage('JARVIS', creatorMessage, 'assistant', [], true);
                await this.loadConversations();
                this.userInput?.focus();
                if (window.innerWidth < 992) this.closeSidebar();
            }
        } catch (e) { console.error(e); }
    }

    async sendMessage() {
        const content = this.userInput.value.trim();
        if (!content) return;

        this.addMessage('Tu', content, 'user', [], true);
        this.userInput.value = '';
        this.userInput.style.height = 'auto';

        let finalMessage = content;
        
        const fileContext = this.fileMemory.getAllFilesContext();
        if (fileContext) {
            finalMessage = `[CONTESTO FILE]\n${fileContext}\n\n[DOMANDA]\n${content}`;
        }
        
        if (this.activeMode && MODE_PROMPTS[this.activeMode]) {
            finalMessage = `[SYSTEM CONTEXT: ${MODE_PROMPTS[this.activeMode]}]\n\n${finalMessage}`;
        }

        this.showTypingIndicator();
        try {
            const res  = await fetch('/api/chat/history', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body:    JSON.stringify({ conversationId: this.currentConversationId, message: finalMessage })
            });
            const data = await res.json();
            this.hideTypingIndicator();

            if (data.success) {
                this.currentConversationId = data.conversationId;
                await this.typeMessage(data.response, []);
                this.speak(data.response);
                await this.loadConversations();
            } else {
                this.addMessage('JARVIS', `Errore, Signore: ${data.error}`, 'system', [], true);
            }
        } catch (e) {
            this.hideTypingIndicator();
            this.addMessage('JARVIS', `Errore di connessione, Sir: ${e.message}`, 'system', [], true);
        }
    }

    async uploadFile(file) {
        if (!file) return;
        
        this.addMessage('Sistema', `📎 Analisi: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'system', []);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            let fileContent = e.target.result;
            
            this.fileMemory.addFile(file.name, fileContent, file.type);
            
            const truncatedContent = fileContent.length > 8000 ? fileContent.substring(0, 8000) + '...[FILE TROPPO LUNGO, TRONCATO]' : fileContent;
            
            const prompt = `Ho caricato il file "${file.name}". Ecco il suo contenuto:\n\n${truncatedContent}\n\nAnalizza questo file e dimmi di cosa si tratta. Se è codice, spiegamelo. Se è testo, riassumimelo. Se è un'immagine (nome file), dimmi cosa potrebbe contenere in base al nome.`;
            
            this.showTypingIndicator();
            try {
                const res  = await fetch('/api/chat/history', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                    body:    JSON.stringify({ conversationId: this.currentConversationId, message: prompt })
                });
                const data = await res.json();
                this.hideTypingIndicator();
                if (data.success) {
                    this.currentConversationId = data.conversationId;
                    await this.typeMessage(`📄 **Analisi: ${file.name}**\n\n${data.response}\n\n💡 *Ora puoi farmi domande specifiche su questo file!*`, []);
                    await this.loadConversations();
                } else {
                    this.addMessage('JARVIS', `Errore: ${data.error}`, 'system', []);
                }
            } catch (err) {
                this.hideTypingIndicator();
                this.addMessage('JARVIS', `Errore: ${err.message}`, 'system', []);
            }
        };
        
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.js') || 
            file.name.endsWith('.py') || file.name.endsWith('.html') || file.name.endsWith('.css') ||
            file.name.endsWith('.json') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
            reader.readAsText(file, 'UTF-8');
        } else {
            this.fileMemory.addFile(file.name, `[File: ${file.name} - Tipo: ${file.type || 'sconosciuto'} - Dimensione: ${(file.size / 1024).toFixed(1)} KB]`, file.type);
            this.addMessage('JARVIS', `📁 Ho memorizzato il file **${file.name}**. Puoi farmi domande su di esso.`, 'assistant', [], true);
            this.hideTypingIndicator();
        }
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SR();
            this.recognition.lang = 'it-IT';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.onstart  = () => { this.isListening = true;  this._showHide('listeningIndicator', true);  document.getElementById('micBtn')?.classList.add('listening'); };
            this.recognition.onend    = () => { this.isListening = false; this._showHide('listeningIndicator', false); document.getElementById('micBtn')?.classList.remove('listening'); };
            this.recognition.onerror  = () => { this.isListening = false; this._showHide('listeningIndicator', false); document.getElementById('micBtn')?.classList.remove('listening'); };
            this.recognition.onresult = (e) => {
                let t = '';
                for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
                this.userInput.value = t;
                if (e.results[0].isFinal) setTimeout(() => this.sendMessage(), 100);
            };
        } else {
            const btn = document.getElementById('micBtn');
            if (btn) { btn.style.opacity = '0.35'; btn.disabled = true; }
        }
    }

    startListening() {
        if (!this.recognition) return;
        if (this.isListening) { this.recognition.stop(); return; }
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => this.recognition.start())
            .catch(() => {});
    }

    speak(text) {
        if (!text) return;
        if (this.synthesis.speaking) this.synthesis.cancel();
        const clean = text.replace(/```[\s\S]*?```/g, '').replace(/[#*_`]/g, '').substring(0, 600);
        const utt   = new SpeechSynthesisUtterance(clean);
        utt.lang  = 'it-IT'; utt.rate = 0.9; utt.pitch = 0.9;
        utt.onstart = () => {
            this.isSpeaking = true;
            this._showHide('speakingIndicator', true);
            this.hologram?.setSpeaking(true);
        };
        utt.onend   = () => {
            this.isSpeaking = false;
            this._showHide('speakingIndicator', false);
            this.hologram?.setSpeaking(false);
        };
        this.synthesis.speak(utt);
    }

    _showHide(id, show) {
        const el = document.getElementById(id);
        if (el) el.style.display = show ? 'block' : 'none';
    }

    showTypingIndicator() {
        const d = document.createElement('div');
        d.className = 'message system-message typing-indicator';
        d.id = 'typingIndicator';
        d.innerHTML = `<div class="message-content"><span>●</span><span>●</span><span>●</span></div>`;
        this.chatMessages.appendChild(d);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() { document.getElementById('typingIndicator')?.remove(); }
    clearMessages()       { this.chatMessages.innerHTML = ''; }
    scrollToBottom()      { this.chatMessages.scrollTop = this.chatMessages.scrollHeight; }

    addMessage(sender, content, role, sources = [], scroll = true) {
        const d     = document.createElement('div');
        d.className = `message ${role === 'user' ? 'user-message' : 'system-message'}`;
        const time  = new Date().toLocaleTimeString('it-IT');
        const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        d.innerHTML = `
            <div class="message-header">${sender} • ${time}</div>
            <div class="message-content" id="${msgId}">${this.formatMessage(content)}</div>`;
        this.chatMessages.appendChild(d);
        if (scroll) this.scrollToBottom();
        if (content.includes('```')) this._addDownloadBtn(d.querySelector(`#${msgId}`), content);
    }

    async typeMessage(content, sources) {
        return new Promise(resolve => {
            const d     = document.createElement('div');
            d.className = 'message system-message';
            const time  = new Date().toLocaleTimeString('it-IT');
            const msgId = 'msg_' + Date.now();
            d.innerHTML = `<div class="message-header">JARVIS • ${time}</div><div class="message-content" id="${msgId}"></div>`;
            this.chatMessages.appendChild(d);
            this.scrollToBottom();

            const el    = document.getElementById(msgId);
            let i       = 0;
            el.classList.add('typing');
            const speed = content.length > 800 ? 4 : 12;
            const tick  = setInterval(() => {
                if (i < content.length) {
                    el.innerHTML = this.formatMessage(content.substring(0, ++i));
                    this.scrollToBottom();
                } else {
                    clearInterval(tick);
                    el.classList.remove('typing');
                    if (content.includes('```')) this._addDownloadBtn(el, content);
                    resolve();
                }
            }, speed);
        });
    }

    formatMessage(content) {
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
            `<pre><code class="lang-${lang || 'text'}">${this.escapeHtml(code)}</code></pre>`);
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/`([^`]+)`/g,     '<code class="inline-code">$1</code>');
        content = content.replace(/\n/g,             '<br>');
        return content;
    }

    escapeHtml(t) {
        const d = document.createElement('div');
        d.textContent = t;
        return d.innerHTML;
    }

    _addDownloadBtn(el, content) {
        const m = content.match(/```(\w+)\n([\s\S]*?)```/);
        if (!m) return;
        const [, lang, code] = m;
        const btn = document.createElement('button');
        btn.className = 'code-download-btn';
        btn.innerHTML = '📥 Scarica Codice';
        btn.onclick   = () => this._downloadCode(code, lang);
        el.parentElement.appendChild(btn);
    }

    _downloadCode(code, lang) {
        const extMap = {
            javascript:'js', typescript:'ts', python:'py', html:'html', css:'css', java:'java',
            cpp:'cpp', c:'c', csharp:'cs', go:'go', rust:'rs', php:'php', ruby:'rb', swift:'swift',
            kotlin:'kt', dart:'dart', scala:'scala', haskell:'hs', r:'r', sql:'sql', bash:'sh',
            julia:'jl', lua:'lua', elixir:'ex', erlang:'erl', clojure:'clj', fsharp:'fs',
            ocaml:'ml', asm:'asm', zig:'zig', nim:'nim', powershell:'ps1', cobol:'cbl',
            glsl:'glsl', matlab:'m', wat:'wat',
        };
        const ext = extMap[lang] || 'txt';
        const a   = Object.assign(document.createElement('a'), {
            href:     URL.createObjectURL(new Blob([code], { type: 'text/plain' })),
            download: `jarvis_code.${ext}`
        });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }

    async showProfile() {
        const u    = this.currentUser;
        const html = `
        <div id="profileModal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h2>👤 Profilo JARVIS</h2>
              <button onclick="document.getElementById('profileModal').remove()">✕</button>
            </div>
            <div class="modal-body">
              <div class="profile-info">
                <div class="info-group">
                  <label>NOME</label>
                  <input type="text" id="profileName" value="${this.escapeHtml(u?.name || '')}">
                </div>
                <div class="info-group">
                  <label>COGNOME</label>
                  <input type="text" id="profileSurname" value="${this.escapeHtml(u?.surname || '')}">
                </div>
                <div class="info-group">
                  <label>EMAIL</label>
                  <input type="email" id="profileEmail" value="${this.escapeHtml(u?.email || '')}" disabled>
                </div>
                <div class="info-group">
                  <label>2FA</label>
                  <input type="text" value="${u?.twofa_enabled ? '✅ Attivo' : '❌ Non attivo'}" disabled>
                </div>
              </div>
              <div class="profile-actions">
                <button class="btn-success" onclick="window.jarvis.saveProfile()">💾 Salva</button>
                <button class="btn-danger"  onclick="logout()">🚪 Logout</button>
              </div>
              <div id="profileMsg" style="font-size:0.8rem;text-align:center;min-height:20px;margin-top:8px;"></div>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    async saveProfile() {
        const name    = document.getElementById('profileName')?.value;
        const surname = document.getElementById('profileSurname')?.value;
        try {
            const res  = await fetch('/api/auth/profile', {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body:    JSON.stringify({ name, surname })
            });
            const data = await res.json();
            const msg  = document.getElementById('profileMsg');
            if (data.success) {
                if (this.currentUser) { this.currentUser.name = name; this.currentUser.surname = surname; }
                if (msg) msg.innerHTML = '<span style="color:#00ff88">✅ Profilo aggiornato</span>';
            } else {
                if (msg) msg.innerHTML = `<span style="color:#ff4444">❌ ${data.error}</span>`;
            }
        } catch (e) {
            const msg = document.getElementById('profileMsg');
            if (msg) msg.innerHTML = `<span style="color:#ff4444">❌ ${e.message}</span>`;
        }
    }
}

/* ══════════════════════════════════════════════════════════
   GLOBAL AUTH FUNCTIONS
══════════════════════════════════════════════════════════ */

function switchAuthTab(tab) {
    const forms = ['loginForm','registerForm','recoverForm','changePasswordForm'];
    const tabs  = document.querySelectorAll('.auth-tab');
    const map   = { login: 0, register: 1, recover: 2, changePassword: 3 };
    forms.forEach((f, i) => document.getElementById(f)?.classList.toggle('active', i === map[tab]));
    tabs.forEach((t, i) => t.classList.toggle('active', i === map[tab]));
    document.getElementById('authMessage').innerHTML = '';
}

function showAuthMessage(msg, ok = false) {
    const d = document.getElementById('authMessage');
    if (d) d.innerHTML = `<span style="color:${ok ? '#00ff88' : '#ff4444'};">${msg}</span>`;
}

function togglePwd(id, btn) {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

function initTfaInputs(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const digits = container.querySelectorAll('.tfa-digit');
    digits.forEach((inp, i) => {
        inp.addEventListener('input', (e) => {
            const val = e.target.value.replace(/\D/g, '');
            e.target.value = val.slice(-1);
            e.target.classList.toggle('filled', !!val);
            if (val && i < digits.length - 1) digits[i + 1].focus();
        });
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !inp.value && i > 0) {
                digits[i - 1].focus();
                digits[i - 1].value = '';
                digits[i - 1].classList.remove('filled');
            }
        });
        inp.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
            paste.split('').forEach((ch, j) => {
                if (digits[i + j]) { digits[i + j].value = ch; digits[i + j].classList.add('filled'); }
            });
            if (digits[Math.min(i + paste.length, digits.length - 1)]) {
                digits[Math.min(i + paste.length, digits.length - 1)].focus();
            }
        });
    });
}

function getTfaCode(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return '';
    return Array.from(container.querySelectorAll('.tfa-digit')).map(d => d.value).join('');
}

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const secretWord = document.getElementById('loginSecretWord').value;
    const section2fa = document.getElementById('login2FASection');
    const code2fa  = section2fa?.style.display !== 'none' ? getTfaCode('tfaInputs') : '';
    const fingerprint = await generateFingerprint();

    if (email !== 'antonio.pepice08@gmail.com') {
        showAuthMessage('❌ Email non autorizzata. Accesso riservato.');
        return;
    }

    if (!secretWord) {
        showAuthMessage('❌ Inserisci la parola segreta');
        return;
    }

    try {
        const res  = await fetch('/api/auth/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password, secretWord, fingerprint, token: code2fa || undefined })
        });
        const data = await res.json();

        if (data.requiresTwoFactor) {
            section2fa.style.display = 'flex';
            initTfaInputs('tfaInputs');
            showAuthMessage('🔐 Inserisci il codice 2FA dalla tua app Authenticator');
            return;
        }

        if (data.success) {
            localStorage.setItem('jarvis_token', data.token);
            window.jarvis = new JarvisInterface();
            showAuthMessage('✅ Accesso effettuato!', true);
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch {
        showAuthMessage('❌ Errore di connessione');
    }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('regName').value.trim();
    const surname = document.getElementById('regSurname').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const secretWord = document.getElementById('regSecretWord').value;
    const fingerprint = await generateFingerprint();

    if (email !== 'antonio.pepice08@gmail.com') {
        showAuthMessage('❌ Email non autorizzata. Accesso riservato.');
        return;
    }

    if (password !== confirm) {
        showAuthMessage('❌ Le password non coincidono');
        return;
    }
    if (password.length < 8) {
        showAuthMessage('❌ Password troppo corta (min 8 caratteri)');
        return;
    }
    if (secretWord.length < 4) {
        showAuthMessage('❌ Parola segreta troppo corta (min 4 caratteri)');
        return;
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, surname, email, password, secretWord, fingerprint })
        });
        const data = await res.json();
        
        if (data.success && data.requiresGoogleAuth) {
            const qrSec = document.getElementById('regGoogleAuthSection');
            const qrImg = document.getElementById('regQrCode');
            const submitBtn = document.querySelector('#registerForm .send-button');
            
            if (qrSec) qrSec.style.display = 'flex';
            if (qrImg && data.qrCode) qrImg.src = data.qrCode;
            if (submitBtn) submitBtn.style.display = 'none';
            
            window._pendingGaEmail = email;
            
            showAuthMessage('📱 Scansiona il QR con Google Authenticator, poi inserisci il codice a 6 cifre.', true);
        } else if (data.success) {
            localStorage.setItem('jarvis_token', data.token);
            window.jarvis = new JarvisInterface();
            showAuthMessage('✅ Registrazione completata!', true);
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch (err) {
        showAuthMessage(`❌ Errore: ${err.message}`);
    }
});

async function confirmGoogleAuth() {
    const email = window._pendingGaEmail || document.getElementById('regEmail')?.value.trim().toLowerCase();
    const gaCode = getTfaCode('regGaInputs');
    
    if (gaCode.length < 6) {
        showAuthMessage('❌ Inserisci il codice a 6 cifre da Google Authenticator');
        return;
    }
    
    try {
        const res = await fetch('/api/auth/verify-google-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, gaCode })
        });
        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem('jarvis_token', data.token);
            window.jarvis = new JarvisInterface();
            showAuthMessage('✅ Registrazione completata! Google Auth attivo.', true);
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch (err) {
        showAuthMessage(`❌ Errore: ${err.message}`);
    }
}

async function sendRecoverCode() {
    const email = document.getElementById('recoverEmail')?.value;
    if (!email) { showAuthMessage('❌ Inserisci la tua email'); return; }
    try {
        const res  = await fetch('/api/auth/recover', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
            const sec = document.getElementById('recoverCodeSection');
            if (sec) { sec.style.display = 'flex'; initTfaInputs('recoverTfaInputs'); }
            showAuthMessage('✅ Contatta l\'amministratore per il reset della password.', true);
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch {
        showAuthMessage('❌ Errore di connessione');
    }
}

document.getElementById('recoverForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email       = document.getElementById('recoverEmail').value;
    const newPassword = document.getElementById('recoverNewPassword').value;
    const confirm     = document.getElementById('recoverConfirmPassword').value;

    if (newPassword !== confirm) {
        showAuthMessage('❌ Le password non coincidono');
        return;
    }
    if (newPassword.length < 8) {
        showAuthMessage('❌ Password troppo corta (min 8)');
        return;
    }

    try {
        const res  = await fetch('/api/auth/reset-password', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, newPassword })
        });
        const data = await res.json();
        if (data.success) {
            showAuthMessage('✅ Password aggiornata! Ora puoi accedere.', true);
            setTimeout(() => switchAuthTab('login'), 2200);
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch {
        showAuthMessage('❌ Errore di connessione');
    }
});

document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email           = document.getElementById('changeEmail').value;
    const currentPassword = document.getElementById('changeCurrentPassword').value;
    const newPassword     = document.getElementById('changeNewPassword').value;
    const confirm         = document.getElementById('changeConfirmPassword').value;

    if (newPassword !== confirm) { showAuthMessage('❌ Le nuove password non coincidono'); return; }
    if (newPassword.length < 8)  { showAuthMessage('❌ Password troppo corta (min 8)');   return; }

    try {
        const res  = await fetch('/api/auth/change-password', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, currentPassword, newPassword })
        });
        const data = await res.json();
        if (data.success) {
            showAuthMessage('✅ Password aggiornata! Ora puoi accedere.', true);
            setTimeout(() => switchAuthTab('login'), 2200);
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch {
        showAuthMessage('❌ Errore di connessione');
    }
});

function loginWithGitHub() {
    showAuthMessage('❌ Accesso GitHub non disponibile.');
}

function logout() {
    localStorage.removeItem('jarvis_token');
    window.location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    window.jarvis = new JarvisInterface();
    initTfaInputs('tfaInputs');
    initTfaInputs('recoverTfaInputs');
    initTfaInputs('regGaInputs');
});