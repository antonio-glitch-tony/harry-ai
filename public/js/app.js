/* ═══════════════════════════════════════════════════════════
   B.A.R.R.Y. — Frontend App v5.3 COMPLETELY FIXED
   • FIX: Login persistente
   • FIX: Orario ROME con Mattino/Pomeriggio/Sera
   • FIX: Immagini /image mostrate correttamente
   • FIX: Ricerca web funzionante
   • FIX: Persistenza chat
   • NUOVA: Funzione METEO (/meteo città)
   • NUOVA: Supporto immagini incollate
   Autore: Antonio Pepice
   ═══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   MODE SYSTEM PROMPTS
══════════════════════════════════════════════════════════ */
const MODE_PROMPTS = {
    python: 'MODALITÀ PYTHON ATTIVA. Sei ora il massimo esperto di Python nel mondo. Rispondi sempre in italiano con codice ben formattato.',
    javascript: 'MODALITÀ JAVASCRIPT ATTIVA. Sei un guru di JavaScript/Node.js moderno. Rispondi sempre in italiano con esempi di codice.',
    typescript: 'MODALITÀ TYPESCRIPT ATTIVA. Sei un esperto di TypeScript. Rispondi sempre in italiano.',
    java: 'MODALITÀ JAVA ATTIVA. Sei un esperto di Java e Spring Boot. Rispondi sempre in italiano.',
    cpp: 'MODALITÀ C++ ATTIVA. Sei un esperto di C++ moderno. Rispondi sempre in italiano.',
    c: 'MODALITÀ C ATTIVA. Sei un esperto di programmazione C. Rispondi sempre in italiano.',
    csharp: 'MODALITÀ C# ATTIVA. Sei un esperto di C# e .NET. Rispondi sempre in italiano.',
    go: 'MODALITÀ GO ATTIVA. Sei un esperto di Golang. Rispondi sempre in italiano.',
    rust: 'MODALITÀ RUST ATTIVA. Sei un esperto di Rust. Rispondi sempre in italiano.',
    php: 'MODALITÀ PHP ATTIVA. Sei un esperto di PHP moderno. Rispondi sempre in italiano.',
    ruby: 'MODALITÀ RUBY ATTIVA. Sei un esperto di Ruby on Rails. Rispondi sempre in italiano.',
    swift: 'MODALITÀ SWIFT ATTIVA. Sei un esperto di Swift e iOS. Rispondi sempre in italiano.',
    kotlin: 'MODALITÀ KOTLIN ATTIVA. Sei un esperto di Kotlin e Android. Rispondi sempre in italiano.',
    html: 'MODALITÀ HTML/CSS ATTIVA. Sei un esperto di HTML5, CSS3 e responsive design. Rispondi sempre in italiano.',
    sql: 'MODALITÀ SQL ATTIVA. Sei un esperto di database SQL. Rispondi sempre in italiano.',
    bash: 'MODALITÀ BASH/SHELL ATTIVA. Sei un esperto di scripting shell. Rispondi sempre in italiano.',
    study: 'MODALITÀ STUDIO ATTIVA. Sei un tutor accademico che spiega in modo chiaro e approfondito. Rispondi sempre in italiano.',
    translate: 'MODALITÀ TRADUZIONE ATTIVA. Sei un traduttore professionista. Traduci sempre in italiano in modo accurato.',
    summarize: 'MODALITÀ RIASSUNTO ATTIVA. Sei un esperto nel riassumere testi mantenendo i concetti chiave. Rispondi sempre in italiano.',
    debug: 'MODALITÀ DEBUG ATTIVA. Sei un esperto nel debugging. Analizzi il codice e trovi errori. Rispondi sempre in italiano.',
    explain: 'MODALITÀ SPIEGAZIONE ATTIVA. Spieghi concetti complessi in modo semplice e chiaro. Rispondi sempre in italiano.',
    math: 'MODALITÀ MATEMATICA ATTIVA. Sei un professore di matematica. Risolvi problemi passo passo. Rispondi sempre in italiano.',
    creative: 'MODALITÀ CREATIVA ATTIVA. Sei uno scrittore creativo. Rispondi sempre in italiano con stile narrativo.',
    security: 'MODALITÀ CYBERSECURITY ATTIVA. Sei un esperto di sicurezza informatica. Rispondi sempre in italiano.',
    devops: 'MODALITÀ DEVOPS ATTIVA. Sei un esperto di DevOps e CI/CD. Rispondi sempre in italiano.',
    ml: 'MODALITÀ MACHINE LEARNING/AI ATTIVA. Sei un esperto di AI/ML. Rispondi sempre in italiano.',
};

/* ══════════════════════════════════════════════════════════
   GENERA IMPRONTA DIGITALE (FINGERPRINT)
══════════════════════════════════════════════════════════ */
async function generateFingerprint() {
    try {
        const components = [
            navigator.userAgent || 'unknown',
            navigator.language || 'unknown',
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            !!window.chrome,
            !!navigator.webdriver,
            Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
            window.screen.availWidth + 'x' + window.screen.availHeight,
            navigator.maxTouchPoints || 0,
            'BARRY_FINGERPRINT_SALT_v1'
        ];
        const fingerprint = components.join('|');
        return await sha256(fingerprint);
    } catch (e) {
        console.error('Fingerprint error:', e);
        return await sha256(navigator.userAgent + screen.width + screen.height + 'BARRY_FALLBACK');
    }
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 64);
}

/* ══════════════════════════════════════════════════════════
   HOLOGRAM STYLE
══════════════════════════════════════════════════════════ */
class BarryHologram {
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
class BarryInterface {
    constructor() {
        this.apiUrl             = '';
        this.token              = localStorage.getItem('barry_token');
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

    /* ── OTTIENE SALUTO BASATO SULL'ORARIO DI ROME ── */
    async getTimeBasedGreeting() {
        try {
            const res = await fetch('/api/system/info', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await res.json();
            if (data.success) {
                let greeting = '';
                if (data.timeOfDay === 'Mattino') greeting = 'Buongiorno';
                else if (data.timeOfDay === 'Pomeriggio') greeting = 'Buon pomeriggio';
                else greeting = 'Buonasera';
                
                return {
                    greeting: greeting,
                    timeOfDay: data.timeOfDay,
                    formattedTime: data.time,
                    formattedDate: data.date,
                    day: data.day
                };
            }
        } catch(e) {
            console.log('Errore recupero orario, uso locale');
        }
        // Fallback locale
        const now = new Date();
        const hours = now.getHours();
        let timeOfDay = hours < 12 ? 'Mattino' : (hours < 18 ? 'Pomeriggio' : 'Sera');
        let greeting = timeOfDay === 'Mattino' ? 'Buongiorno' : (timeOfDay === 'Pomeriggio' ? 'Buon pomeriggio' : 'Buonasera');
        return {
            greeting: greeting,
            timeOfDay: timeOfDay,
            formattedTime: now.toLocaleTimeString('it-IT'),
            formattedDate: now.toLocaleDateString('it-IT'),
            day: now.toLocaleDateString('it-IT', { weekday: 'long' })
        };
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
        localStorage.removeItem('barry_token');
        this._startAuthHologram();
    }

    _startAuthHologram() {
        if (!this.authHologram) {
            this.authHologram = new BarryHologram('hologramCanvas', 300);
        }
        this.authHologram.start();
        
        const authHoloTrigger = document.getElementById('authHologramTrigger');
        if (authHoloTrigger) {
            authHoloTrigger.onclick = () => this.openAuthHologramVoice();
        }
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
        
        window.barry = this;
    }

    initCapabilitiesDropdown() {
        const dropdown = document.getElementById('capabilitiesDropdown');
        if (!dropdown) return;
        
        const btn = dropdown.querySelector('.dropdown-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });
        }
        
        const closeDropdown = (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        };
        document.addEventListener('click', closeDropdown);
        document.addEventListener('touchstart', closeDropdown);
        
        const items = dropdown.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            const selectMode = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const mode = item.dataset.mode;
                const label = item.dataset.label;
                this.setMode(mode, label);
                dropdown.classList.remove('open');
            };
            item.addEventListener('click', selectMode);
            item.addEventListener('touchstart', selectMode);
        });
    }

    initSidebar() {
        this.sidebar        = document.getElementById('sidebar');
        this.hamburgerBtn   = document.getElementById('hamburgerBtn');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (this.hamburgerBtn) {
            this.hamburgerBtn.onclick = () => this.toggleSidebar();
            this.hamburgerBtn.ontouchstart = () => this.toggleSidebar();
        }
        
        if (window.innerWidth < 992) this.closeSidebar();
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 992) this.openSidebar(); else this.closeSidebar();
        });
    }
    
    toggleSidebar() { this.sidebar?.classList.contains('open') ? this.closeSidebar() : this.openSidebar(); }
    openSidebar()   {
        this.sidebar?.classList.add('open');
        this.hamburgerBtn?.classList.add('active');
        this.sidebarOverlay?.classList.add('show');
    }
    closeSidebar()  {
        this.sidebar?.classList.remove('open');
        this.hamburgerBtn?.classList.remove('active');
        this.sidebarOverlay?.classList.remove('show');
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
            dropdownBtn.innerHTML = `<span>⚡</span> ${modeLabel} <span class="dropdown-arrow-icon">▼</span>`;
        }

        const placeholders = {
            python: 'Cosa vuoi fare in Python, Signore?',
            javascript: 'Dimmi cosa costruire in JavaScript...',
            translate: 'Incolla il testo da tradurre...',
            summarize: 'Incolla il testo da riassumere...',
            debug: 'Incolla il codice da analizzare...',
            explain: 'Cosa devo spiegarle, Signore?',
            study: 'Che argomento vuoi studiare oggi, Signore?',
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
            study: `**Modalità Studio** attivata, Signore. Analizzerò i file e risponderò alle domande in modo approfondito.`,
            creative: `**Modalità Creativa** attivata, Signore...`,
        };
        const greeting = greetings[mode] || `Modalità **${modeLabel}** attivata, Signore. Come posso assisterla?`;
        this.addMessage('BARRY', greeting, 'assistant', [], true);
    }

    clearMode() {
        this.activeMode = null;
        const bar = document.getElementById('activeModeBar');
        if (bar) bar.style.display = 'none';
        
        const dropdownBtn = document.querySelector('.dropdown-btn');
        if (dropdownBtn) {
            dropdownBtn.innerHTML = `<span>⚡</span> Seleziona Modalità <span class="dropdown-arrow-icon">▼</span>`;
        }
        
        if (this.userInput) {
            this.userInput.placeholder = 'Scrivi o parla con BARRY...';
        }
    }

    /* ── METEO ── */
    async getWeather(city) {
        if (!city || city.trim() === '') {
            this.addMessage('BARRY', 'Per conoscere il meteo, scrivi: **meteo [nome città]**\n\nEsempio: `meteo Roma`\n\nOppure usa il comando `/meteo Roma`', 'assistant', [], true);
            return;
        }
        
        this.showTypingIndicator();
        try {
            const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await res.json();
            this.hideTypingIndicator();
            
            if (data.success && data.weather) {
                const w = data.weather;
                const weatherHtml = `
                    <div style="background: rgba(0,232,255,0.05); border: 1px solid rgba(0,232,255,0.15); border-radius: 12px; padding: 15px; margin: 10px 0;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                            <div style="font-size: 48px;">🌤️</div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold;">${w.temperature}°C</div>
                                <div style="color: rgba(0,232,255,0.7);">${w.weatherDesc}</div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 12px;">
                            <div>📍 ${w.location}</div>
                            <div>💨 Vento: ${w.windSpeed} km/h</div>
                            <div>💧 Umidità: ${w.humidity}%</div>
                            <div>🌡️ Percepita: ${w.feelsLike}°C</div>
                            <div>☁️ Nuvolosità: ${w.cloudcover}%</div>
                            <div>👁️ Visibilità: ${w.visibility} km</div>
                        </div>
                    </div>
                `;
                this.addMessage('BARRY', weatherHtml, 'assistant', [], true);
            } else {
                this.addMessage('BARRY', `❌ Non ho trovato informazioni meteo per "${city}". Riprova con un'altra città.`, 'assistant', [], true);
            }
        } catch (err) {
            this.hideTypingIndicator();
            this.addMessage('BARRY', `❌ Errore nel recupero del meteo: ${err.message}`, 'assistant', [], true);
        }
    }

    toggleHologram() {
        const el          = document.getElementById('holoBarry');
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
            if (!this.hologram) this.hologram = new BarryHologram('holoCanvas', 380);
            this.hologram.start();
            this.initHoloSpeechRecognition();
            
            const holoCanvasTrigger = document.getElementById('holoCanvasTrigger');
            if (holoCanvasTrigger) {
                holoCanvasTrigger.onclick = () => this.startHoloListening();
                holoCanvasTrigger.ontouchstart = () => this.startHoloListening();
            }
            
            const statusEl = document.getElementById('holoStatusText');
            if (statusEl) statusEl.textContent = 'CLICCA SULL\'OLOGRAMMA PER PARLARE';
        } else {
            el.style.display = 'none';
            if (mainContent) mainContent.style.visibility = 'visible';
            if (sidebar)     sidebar.style.visibility     = 'visible';
            if (hamburger)   hamburger.style.visibility   = 'visible';
            this.hologram?.stop();
            if (this.holoRecognition) {
                try { this.holoRecognition.stop(); } catch(e) {}
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
            this._holoVoiceBuffer = '';
            
            this.holoRecognition.onresult = (e) => {
                let transcript = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    transcript += e.results[i][0].transcript;
                }
                this._holoVoiceBuffer = transcript;
                const statusEl = document.getElementById('holoStatusText');
                if (statusEl) statusEl.textContent = `"${transcript.substring(0, 40)}${transcript.length > 40 ? '...' : ''}"`;
                this.setHoloWaveActive(true);
                if (e.results[0].isFinal) {
                    setTimeout(() => this.sendHologramVoiceMessage(transcript), 100);
                }
            };
            
            this.holoRecognition.onstart = () => {
                const statusEl = document.getElementById('holoStatusText');
                if (statusEl) statusEl.textContent = 'IN ASCOLTO...';
                this.setHoloWaveActive(true);
            };

            this.holoRecognition.onend = () => {
                const statusEl = document.getElementById('holoStatusText');
                if (statusEl && !this._holoProcessing) statusEl.textContent = 'CLICCA SULL\'OLOGRAMMA PER PARLARE';
                this.setHoloWaveActive(false);
            };
            
            this.holoRecognition.onerror = () => {
                this.setHoloWaveActive(false);
                const statusEl = document.getElementById('holoStatusText');
                if (statusEl) statusEl.textContent = 'ERRORE — RIPROVA';
            };
        }
    }

    setHoloWaveActive(active) {
        const waveEl = document.getElementById('holoWaveform');
        if (!waveEl) return;
        const bars = waveEl.querySelectorAll('.hbar');
        bars.forEach(b => {
            if (active) b.classList.add('active');
            else { b.classList.remove('active'); b.style.height = '4px'; }
        });
    }

    setAuthWaveActive(active) {
        const waveEl = document.getElementById('authHoloWave');
        if (!waveEl) return;
        const bars = waveEl.querySelectorAll('.wave-bar');
        bars.forEach(b => {
            if (active) b.classList.add('active');
            else { b.classList.remove('active'); b.style.height = '4px'; }
        });
    }

    startHoloListening() {
        if (!this.holoRecognition) this.initHoloSpeechRecognition();
        if (this.holoRecognition) {
            try {
                this._holoVoiceBuffer = '';
                this.holoRecognition.start();
            } catch(e) {
                try {
                    this.holoRecognition.stop();
                    setTimeout(() => { try { this.holoRecognition.start(); } catch(e2) {} }, 200);
                } catch(e2) {}
            }
        }
    }

    async sendHologramVoiceMessage(text) {
        const msgs = document.getElementById('holoMessages');
        if (!msgs || !text || !text.trim()) return;
        this._holoProcessing = true;

        const statusEl = document.getElementById('holoStatusText');

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
        if (statusEl) statusEl.textContent = 'BARRY STA ELABORANDO...';
        this.setHoloWaveActive(true);

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

            if (this.synthesis && this.hologram) {
                this.hologram.setSpeaking(true);
                if (statusEl) statusEl.textContent = 'BARRY STA PARLANDO...';
                this.setHoloWaveActive(true);
                const utt = new SpeechSynthesisUtterance(reply.replace(/[*_`#]/g, '').substring(0, 500));
                utt.lang  = 'it-IT';
                utt.rate  = 0.95;
                utt.onend = () => {
                    this.hologram?.setSpeaking(false);
                    this.setHoloWaveActive(false);
                    if (statusEl) statusEl.textContent = 'CLICCA SULL\'OLOGRAMMA PER PARLARE';
                    this._holoProcessing = false;
                };
                this.synthesis.speak(utt);
            } else {
                this.setHoloWaveActive(false);
                if (statusEl) statusEl.textContent = 'CLICCA SULL\'OLOGRAMMA PER PARLARE';
                this._holoProcessing = false;
            }
        } catch {
            loadDiv.innerHTML = 'Errore di connessione, Signore.';
            this.setHoloWaveActive(false);
            if (statusEl) statusEl.textContent = 'ERRORE — RIPROVA';
            this._holoProcessing = false;
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
                console.log(`📋 Caricate ${this.conversations.length} conversazioni`);
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
                    <div class="conv-item ${isActive}" onclick="window.barry.loadConversation(${conv.id})" ontouchstart="window.barry.loadConversation(${conv.id})">
                        <div class="conv-item-icon">💬</div>
                        <div class="conv-item-text">
                            <div class="conv-item-title">${title}</div>
                        </div>
                        <button class="conv-item-delete" onclick="event.stopPropagation();window.barry.deleteConversation(${conv.id})" ontouchstart="event.stopPropagation();window.barry.deleteConversation(${conv.id})" title="Elimina">🗑</button>
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
                        this.addMessage(msg.role === 'user' ? 'Tu' : 'BARRY', msg.content, msg.role, [], false);
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
            const res = await fetch('/api/chat/new', {
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
                
                const { greeting, timeOfDay, formattedTime, formattedDate, day } = await this.getTimeBasedGreeting();
                
                const creatorMessage = `${greeting}, Signore! Sono B.A.R.R.Y., il suo assistente personale creato da **Antonio Pepice**. Oggi è ${formattedDate} (${day}), sono le ${formattedTime} (${timeOfDay}).\n\nPosso aiutarla con qualsiasi linguaggio di programmazione, analisi file, traduzioni, matematica e molto altro. Come posso assisterla oggi?`;
                
                this.addMessage('BARRY', creatorMessage, 'assistant', [], true);
                await this.loadConversations();
                this.userInput?.focus();
                if (window.innerWidth < 992) this.closeSidebar();
            }
        } catch (e) { console.error(e); }
    }

    /* ═══════════════════════════════════════════════════════════
       GENERAZIONE IMMAGINI - FIX COMPLETO
    ═══════════════════════════════════════════════════════════ */
    async generateImage(prompt) {
        this.showTypingIndicator();
        try {
            const res = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body: JSON.stringify({ prompt: prompt })
            });
            const data = await res.json();
            this.hideTypingIndicator();
            
            if (data.success && data.imageUrl) {
                // Aggiungi timestamp per evitare cache
                const imageUrlWithCache = `${data.imageUrl}&_t=${Date.now()}`;
                const imageHtml = `<div style="margin: 10px 0;">
                    <img src="${imageUrlWithCache}" alt="${this.escapeHtml(prompt)}" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid rgba(0,232,255,0.3); background: #0a0a0a; object-fit: contain;" 
                         onload="this.style.opacity='1'" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'400\\' viewBox=\\'0 0 400 400\\'%3E%3Crect width=\\'400\\' height=\\'400\\' fill=\\'%230a0a0a\\'/%3E%3Ctext x=\\'200\\' y=\\'200\\' text-anchor=\\'middle\\' fill=\\'%2300e8ff\\' font-size=\\'14\\'%3E🖼️ Immagine generata%3C/text%3E%3C/svg%3E';" />
                    <br><span style="font-size: 0.7rem; color: rgba(0,232,255,0.5);">🎨 Immagine generata per: "${this.escapeHtml(prompt)}"</span>
                </div>`;
                this.addMessage('BARRY', imageHtml, 'assistant', [], true);
            } else {
                this.addMessage('BARRY', `❌ Non ho potuto generare l'immagine: ${data.error || 'Errore sconosciuto'}`, 'assistant', [], true);
            }
        } catch (err) {
            this.hideTypingIndicator();
            this.addMessage('BARRY', `❌ Errore di connessione: ${err.message}`, 'assistant', [], true);
        }
    }

    async sendMessage() {
        const content = this.userInput.value.trim();
        if (!content) return;

        // Comando /image
        if (content.toLowerCase().startsWith('/image ')) {
            const imagePrompt = content.substring(7).trim();
            if (imagePrompt) {
                this.addMessage('Tu', content, 'user', [], true);
                this.userInput.value = '';
                await this.generateImage(imagePrompt);
            } else {
                this.addMessage('Tu', content, 'user', [], true);
                this.userInput.value = '';
                this.addMessage('BARRY', 'Per generare un\'immagine, usa il comando: `/image descrizione dell\'immagine`\n\nEsempio: `/image un gatto che dorme su una nuvola`', 'assistant', [], true);
            }
            return;
        }
        
        // Comando /meteo
        if (content.toLowerCase().startsWith('/meteo ') || content.toLowerCase().startsWith('meteo ')) {
            const city = content.toLowerCase().startsWith('/meteo ') ? content.substring(7).trim() : content.substring(6).trim();
            this.addMessage('Tu', content, 'user', [], true);
            this.userInput.value = '';
            await this.getWeather(city);
            return;
        }

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
            const res = await fetch('/api/chat/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body: JSON.stringify({ conversationId: this.currentConversationId, message: finalMessage })
            });
            const data = await res.json();
            this.hideTypingIndicator();

            if (data.success) {
                this.currentConversationId = data.conversationId;
                await this.typeMessage(data.response, []);
                this.speak(data.response);
                await this.loadConversations();
            } else {
                this.addMessage('BARRY', `Errore, Signore: ${data.error}`, 'system', [], true);
            }
        } catch (e) {
            this.hideTypingIndicator();
            this.addMessage('BARRY', `Errore di connessione, Sir: ${e.message}`, 'system', [], true);
        }
    }

    async uploadFile(file) {
        if (!file) return;
        
        // Gestisci immagini incollate
        if (file.type && file.type.startsWith('image/')) {
            this.addMessage('Sistema', `🖼️ Immagine ricevuta: ${file.name}`, 'system', []);
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageData = e.target.result;
                const imageHtml = `<div style="margin: 5px 0;">
                    <img src="${imageData}" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid rgba(0,232,255,0.3);" />
                    <br><span style="font-size: 0.7rem; color: rgba(0,232,255,0.5);">📎 Immagine allegata: ${file.name}</span>
                </div>`;
                this.addMessage('Tu', imageHtml, 'user', [], true);
                
                const prompt = `Ho allegato un'immagine chiamata "${file.name}". Puoi descrivere cosa vedi nell'immagine? Se non puoi analizzare direttamente l'immagine, dimmi come posso aiutarti con essa.`;
                
                this.showTypingIndicator();
                try {
                    const res = await fetch('/api/chat/history', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                        body: JSON.stringify({ conversationId: this.currentConversationId, message: prompt })
                    });
                    const data = await res.json();
                    this.hideTypingIndicator();
                    if (data.success) {
                        this.currentConversationId = data.conversationId;
                        await this.typeMessage(data.response, []);
                        await this.loadConversations();
                    }
                } catch (err) {
                    this.hideTypingIndicator();
                    this.addMessage('BARRY', `Ho ricevuto la tua immagine "${file.name}". Purtroppo non posso analizzare visivamente le immagini, ma posso aiutarti a descriverla o a lavorare con essa se me ne parli.`, 'assistant', [], true);
                }
            };
            reader.readAsDataURL(file);
            return;
        }
        
        this.addMessage('Sistema', `📎 Analisi: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'system', []);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            let fileContent = e.target.result;
            
            this.fileMemory.addFile(file.name, fileContent, file.type);
            
            const truncatedContent = fileContent.length > 8000 ? fileContent.substring(0, 8000) + '...[FILE TROPPO LUNGO, TRONCATO]' : fileContent;
            
            const prompt = `Ho caricato il file "${file.name}". Ecco il suo contenuto:\n\n${truncatedContent}\n\nAnalizza questo file e dimmi di cosa si tratta. Se è codice, spiegamelo. Se è testo, riassumimelo. Rispondi in modo completo e dettagliato.`;
            
            this.showTypingIndicator();
            try {
                const res = await fetch('/api/chat/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                    body: JSON.stringify({ conversationId: this.currentConversationId, message: prompt })
                });
                const data = await res.json();
                this.hideTypingIndicator();
                if (data.success) {
                    this.currentConversationId = data.conversationId;
                    await this.typeMessage(`📄 **Analisi: ${file.name}**\n\n${data.response}\n\n💡 *Ora puoi farmi domande specifiche su questo file!*`, []);
                    await this.loadConversations();
                } else {
                    this.addMessage('BARRY', `Errore nell'analisi del file: ${data.error}`, 'system', []);
                }
            } catch (err) {
                this.hideTypingIndicator();
                this.addMessage('BARRY', `Ho ricevuto il file "${file.name}". Analizziamolo insieme! Puoi farmi domande specifiche sul suo contenuto.`, 'assistant', [], true);
            }
        };
        
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.js') || 
            file.name.endsWith('.py') || file.name.endsWith('.html') || file.name.endsWith('.css') ||
            file.name.endsWith('.json') || file.name.endsWith('.md') || file.name.endsWith('.csv') ||
            file.name.endsWith('.xml') || file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
            reader.readAsText(file, 'UTF-8');
        } else {
            this.fileMemory.addFile(file.name, `[File: ${file.name} - Tipo: ${file.type || 'sconosciuto'} - Dimensione: ${(file.size / 1024).toFixed(1)} KB]`, file.type);
            this.addMessage('BARRY', `📁 Ho memorizzato il file **${file.name}**. Puoi farmi domande su di esso.`, 'assistant', [], true);
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
        const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        d.innerHTML = `
            <div class="message-header">${sender}</div>
            <div class="message-content" id="${msgId}">${this.formatMessage(content)}</div>`;
        this.chatMessages.appendChild(d);
        if (scroll) this.scrollToBottom();
        if (content.includes('```')) this._addDownloadBtn(d.querySelector(`#${msgId}`), content);
    }

    async typeMessage(content, sources) {
        return new Promise(resolve => {
            const d     = document.createElement('div');
            d.className = 'message system-message';
            const msgId = 'msg_' + Date.now();
            d.innerHTML = `<div class="message-header">BARRY</div><div class="message-content" id="${msgId}"></div>`;
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
        // Gestisci immagini HTML
        if (content.includes('<img')) {
            return content;
        }
        // Gestisci meteo HTML
        if (content.includes('background: rgba(0,232,255,0.05)')) {
            return content;
        }
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
            kotlin:'kt', dart:'dart', scala:'scala', haskell:'hs', r:'r', sql:'sql', bash:'sh'
        };
        const ext = extMap[lang] || 'txt';
        const a   = Object.assign(document.createElement('a'), {
            href:     URL.createObjectURL(new Blob([code], { type: 'text/plain' })),
            download: `barry_code.${ext}`
        });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }

    async showProfile() {
        const u    = this.currentUser;
        const html = `
        <div id="profileModal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h2>👤 Profilo BARRY</h2>
              <button onclick="document.getElementById('profileModal').remove()">✕</button>
            </div>
            <div class="modal-body">
              <div class="profile-info">
                <div class="info-group">
                  <label>NOME</label>
                  <input type="text" id="profileName" value="${this.escapeHtml(u?.name || 'Utente')}">
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
                <button class="btn-success" onclick="window.barry.saveProfile()">💾 Salva</button>
                <button class="btn-danger"  onclick="window.barry.logout()">🚪 Logout</button>
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

    logout() {
        localStorage.removeItem('barry_token');
        window.location.reload();
    }

    openAuthHologramVoice() {
        const overlay = document.getElementById('authHoloOverlay');
        if (!overlay) return;
        overlay.style.display = 'flex';

        if (!this._authHoloCanvas) {
            this._authHoloCanvas = new BarryHologram('authHoloCanvas', 340);
        }
        this._authHoloCanvas.start();

        this.initAuthHoloRecognition();

        const statusEl = document.getElementById('authHoloStatusText');
        if (statusEl) statusEl.textContent = 'CLICCA SULL\'OLOGRAMMA PER PARLARE';
        
        const authCanvasTrigger = document.getElementById('authHoloCanvasTrigger');
        if (authCanvasTrigger) {
            authCanvasTrigger.onclick = () => this.toggleAuthHoloListening();
            authCanvasTrigger.ontouchstart = () => this.toggleAuthHoloListening();
        }
    }

    initAuthHoloRecognition() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        this._authHoloRecognition = new SR();
        this._authHoloRecognition.lang = 'it-IT';
        this._authHoloRecognition.continuous = false;
        this._authHoloRecognition.interimResults = true;

        this._authHoloRecognition.onstart = () => {
            const statusEl = document.getElementById('authHoloStatusText');
            if (statusEl) statusEl.textContent = 'IN ASCOLTO...';
            this.setAuthWaveActive(true);
        };

        this._authHoloRecognition.onresult = (e) => {
            let transcript = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                transcript += e.results[i][0].transcript;
            }
            const statusEl = document.getElementById('authHoloStatusText');
            if (statusEl) statusEl.textContent = `"${transcript.substring(0, 40)}${transcript.length > 40 ? '...' : ''}"`;
            if (e.results[0].isFinal) {
                setTimeout(() => this.sendAuthHoloMessage(transcript), 100);
            }
        };

        this._authHoloRecognition.onend = () => {
            if (!this._authHoloProcessing) {
                const statusEl = document.getElementById('authHoloStatusText');
                if (statusEl) statusEl.textContent = 'CLICCA SULL\'OLOGRAMMA PER PARLARE';
            }
            this.setAuthWaveActive(false);
        };

        this._authHoloRecognition.onerror = () => {
            this.setAuthWaveActive(false);
            const statusEl = document.getElementById('authHoloStatusText');
            if (statusEl) statusEl.textContent = 'ERRORE — RIPROVA';
        };
    }

    toggleAuthHoloListening() {
        if (!this._authHoloRecognition) this.initAuthHoloRecognition();
        if (!this._authHoloRecognition) return;
        try {
            this._authHoloRecognition.start();
        } catch(e) {
            try {
                this._authHoloRecognition.stop();
                setTimeout(() => { try { this._authHoloRecognition.start(); } catch(e2) {} }, 250);
            } catch(e2) {}
        }
    }

    async sendAuthHoloMessage(text) {
        if (!text || !text.trim()) return;
        this._authHoloProcessing = true;

        const msgs = document.getElementById('authHoloMessages');
        const statusEl = document.getElementById('authHoloStatusText');

        if (msgs) {
            const userDiv = document.createElement('div');
            userDiv.className = 'holo-msg holo-msg-user';
            userDiv.textContent = text;
            msgs.appendChild(userDiv);
            msgs.scrollTop = msgs.scrollHeight;

            const loadDiv = document.createElement('div');
            loadDiv.className = 'holo-msg holo-msg-jarvis';
            loadDiv.innerHTML = '<span class="holo-typing">● ● ●</span>';
            msgs.appendChild(loadDiv);
            msgs.scrollTop = msgs.scrollHeight;

            if (statusEl) statusEl.textContent = 'BARRY STA ELABORANDO...';
            this.setAuthWaveActive(true);

            try {
                if (!this._authHoloHistory) this._authHoloHistory = [];
                this._authHoloHistory.push({ role: 'user', content: text });

                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('barry_token') || ''}` },
                    body: JSON.stringify({ messages: this._authHoloHistory })
                });
                const data = await res.json();
                const reply = data.success ? data.response : 'Sono B.A.R.R.Y. Accedi per usarmi al massimo, Signore.';
                this._authHoloHistory.push({ role: 'assistant', content: reply });
                loadDiv.innerHTML = reply;

                if (window.speechSynthesis) {
                    if (this._authHoloCanvas) this._authHoloCanvas.setSpeaking(true);
                    if (statusEl) statusEl.textContent = 'BARRY STA PARLANDO...';
                    this.setAuthWaveActive(true);
                    const utt = new SpeechSynthesisUtterance(reply.replace(/[*_`#]/g, '').substring(0, 500));
                    utt.lang = 'it-IT';
                    utt.rate = 0.95;
                    utt.onend = () => {
                        if (this._authHoloCanvas) this._authHoloCanvas.setSpeaking(false);
                        this.setAuthWaveActive(false);
                        if (statusEl) statusEl.textContent = 'CLICCA SULL\'OLOGRAMMA PER PARLARE';
                        this._authHoloProcessing = false;
                    };
                    window.speechSynthesis.speak(utt);
                } else {
                    this.setAuthWaveActive(false);
                    if (statusEl) statusEl.textContent = 'CLICCA SULL\'OLOGRAMMA PER PARLARE';
                    this._authHoloProcessing = false;
                }
            } catch(err) {
                loadDiv.textContent = 'Errore di connessione.';
                this.setAuthWaveActive(false);
                if (statusEl) statusEl.textContent = 'ERRORE — RIPROVA';
                this._authHoloProcessing = false;
            }
            msgs.scrollTop = msgs.scrollHeight;
        }
    }

    closeAuthHologramVoice() {
        const overlay = document.getElementById('authHoloOverlay');
        if (overlay) overlay.style.display = 'none';
        if (this._authHoloCanvas) this._authHoloCanvas.stop();
        if (this._authHoloRecognition) {
            try { this._authHoloRecognition.stop(); } catch(e) {}
        }
        this.setAuthWaveActive(false);
    }
}

/* ══════════════════════════════════════════════════════════
   GLOBAL AUTH FUNCTIONS
══════════════════════════════════════════════════════════ */

let pendingRegistrationEmail = null;
let emailVerified = false;

function switchAuthTab(tab) {
    const forms = ['loginForm','registerForm','recoverForm','changePasswordForm'];
    const tabs  = document.querySelectorAll('.auth-tab');
    const map   = { login: 0, register: 1, recover: 2, changePassword: 3 };
    forms.forEach((f, i) => document.getElementById(f)?.classList.toggle('active', i === map[tab]));
    tabs.forEach((t, i) => t.classList.toggle('active', i === map[tab]));
    document.getElementById('authMessage').innerHTML = '';
    
    if (tab === 'register') {
        const emailSection = document.getElementById('registerEmailSection');
        const verifySection = document.getElementById('registerVerifySection');
        const fullRegSection = document.getElementById('registerFullSection');
        if (emailSection) emailSection.style.display = 'block';
        if (verifySection) verifySection.style.display = 'none';
        if (fullRegSection) fullRegSection.style.display = 'none';
        emailVerified = false;
        pendingRegistrationEmail = null;
    }
}

function showAuthMessage(msg, ok = false) {
    const d = document.getElementById('authMessage');
    if (d) {
        d.innerHTML = `<span style="color:${ok ? '#00ff88' : '#ff4444'};">${msg}</span>`;
        d.style.display = 'block';
        setTimeout(() => { d.style.display = 'none'; }, 5000);
    }
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

async function sendVerificationCode() {
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    
    if (!email) {
        showAuthMessage('❌ Inserisci la tua email');
        return;
    }
    
    if (email !== 'antonio.pepice08@gmail.com') {
        showAuthMessage('❌ Email non autorizzata.');
        return;
    }
    
    showAuthMessage('📧 Invio codice...', true);
    
    try {
        const res = await fetch('/api/auth/register-send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        
        if (data.success) {
            pendingRegistrationEmail = email;
            showAuthMessage('✅ Codice inviato!', true);
            
            document.getElementById('registerEmailSection').style.display = 'none';
            document.getElementById('registerVerifySection').style.display = 'block';
            initTfaInputs('verifyCodeInputs');
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch (err) {
        showAuthMessage(`❌ Errore: ${err.message}`);
    }
}

async function verifyEmailCode() {
    const code = getTfaCode('verifyCodeInputs');
    const email = pendingRegistrationEmail;
    
    if (!email) {
        showAuthMessage('❌ Email non trovata.');
        return;
    }
    
    if (code.length < 6) {
        showAuthMessage('❌ Inserisci il codice a 6 cifre');
        return;
    }
    
    showAuthMessage('🔐 Verifica...', true);
    
    try {
        const res = await fetch('/api/auth/verify-email-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });
        
        const data = await res.json();
        
        if (data.success) {
            emailVerified = true;
            showAuthMessage('✅ Email verificata!', true);
            
            document.getElementById('registerVerifySection').style.display = 'none';
            document.getElementById('registerFullSection').style.display = 'block';
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch (err) {
        showAuthMessage(`❌ Errore: ${err.message}`);
    }
}

async function resendVerificationCode() {
    const email = pendingRegistrationEmail;
    
    if (!email) {
        showAuthMessage('❌ Nessuna email in attesa.');
        return;
    }
    
    showAuthMessage('📧 Invio nuovo codice...', true);
    
    try {
        const res = await fetch('/api/auth/resend-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        
        if (data.success) {
            showAuthMessage('✅ Nuovo codice inviato!', true);
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch (err) {
        showAuthMessage(`❌ Errore: ${err.message}`);
    }
}

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!emailVerified) {
        showAuthMessage('❌ Devi prima verificare la tua email.');
        return;
    }
    
    const name = document.getElementById('regName').value.trim();
    const surname = document.getElementById('regSurname').value.trim();
    const email = pendingRegistrationEmail;
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const secretWord = document.getElementById('regSecretWord').value;
    const fingerprint = await generateFingerprint();

    if (!email) {
        showAuthMessage('❌ Email non valida');
        return;
    }

    if (password !== confirm) {
        showAuthMessage('❌ Le password non coincidono');
        return;
    }
    if (password.length < 8) {
        showAuthMessage('❌ Password troppo corta (min 8)');
        return;
    }
    if (secretWord.length < 4) {
        showAuthMessage('❌ Parola segreta troppo corta (min 4)');
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
            
            showAuthMessage('📱 Scansiona il QR con Google Authenticator', true);
        } else if (data.success) {
            localStorage.setItem('barry_token', data.token);
            window.barry = new BarryInterface();
            showAuthMessage('✅ Registrazione completata!', true);
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch (err) {
        showAuthMessage(`❌ Errore: ${err.message}`);
    }
});

async function confirmGoogleAuth() {
    const email = window._pendingGaEmail || pendingRegistrationEmail;
    const gaCode = getTfaCode('regGaInputs');
    
    if (gaCode.length < 6) {
        showAuthMessage('❌ Inserisci il codice a 6 cifre');
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
            localStorage.setItem('barry_token', data.token);
            window.barry = new BarryInterface();
            showAuthMessage('✅ Registrazione completata!', true);
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch (err) {
        showAuthMessage(`❌ Errore: ${err.message}`);
    }
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
        showAuthMessage('❌ Email non autorizzata.');
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
            showAuthMessage('🔐 Inserisci il codice 2FA');
            return;
        }

        if (data.success) {
            localStorage.setItem('barry_token', data.token);
            window.barry = new BarryInterface();
            showAuthMessage('✅ Accesso effettuato!', true);
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch {
        showAuthMessage('❌ Errore di connessione');
    }
});

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
            showAuthMessage('✅ Contatta l\'amministratore.', true);
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
            showAuthMessage('✅ Password aggiornata!', true);
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
            showAuthMessage('✅ Password aggiornata!', true);
            setTimeout(() => switchAuthTab('login'), 2200);
        } else {
            showAuthMessage(`❌ ${data.error}`);
        }
    } catch {
        showAuthMessage('❌ Errore di connessione');
    }
});

function closeAuthHologramVoice() {
    if (window.barry && window.barry.closeAuthHologramVoice) {
        window.barry.closeAuthHologramVoice();
    }
}

// Funzioni globali
window.toggleHologram = () => window.barry?.toggleHologram();
window.showProfile = () => window.barry?.showProfile();
window.logout = () => window.barry?.logout();
window.closeSidebar = () => window.barry?.closeSidebar();
window.createNewChat = () => window.barry?.createNewChat();
window.startListening = () => window.barry?.startListening();
window.uploadFile = (file) => window.barry?.uploadFile(file);
window.clearMode = () => window.barry?.clearMode();

document.addEventListener('DOMContentLoaded', () => {
    window.barry = new BarryInterface();
    initTfaInputs('tfaInputs');
    initTfaInputs('recoverTfaInputs');
    initTfaInputs('regGaInputs');
    initTfaInputs('verifyCodeInputs');
});