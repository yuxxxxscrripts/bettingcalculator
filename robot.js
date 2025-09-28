class TippmixBot {
    constructor() {
        // Eltávolítva a Gemini API kulcs a biztonság érdekében!
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Enter gomb a chat inputban
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Küldés gomb
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Felhasználó üzenetének hozzáadása
        this.addMessage(message, 'user');
        this.messageInput.value = '';

        // Bot "gépel" állapot
        const typingElement = this.addTypingIndicator();

        try {
            // A hívás most a Vercel Serverless Function-re mutat (/api/chat)
            const responseText = await this.callGeminiAPI(message);
            this.removeTypingIndicator(typingElement);
            this.addMessage(responseText, 'bot');
        } catch (error) {
            this.removeTypingIndicator(typingElement);
            // Kijelzi a szerver oldali hibaüzenetet, ha lehetséges, segít a debuggolásban
            this.addMessage(`⚠️ Hiba történt a válasz generálásakor. Próbáld újra! (${error.message || 'Ismeretlen hiba'})`, 'bot', true);
            console.error('API hiba:', error);
        }
    }

    async callGeminiAPI(message) {
        // Csak a felhasználói üzenetet küldjük a backend szervernek
        const response = await fetch('/api/chat', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message 
            })
        });

        if (!response.ok) {
            // Próbálja kiolvasni a szerver oldali hibaüzenetet
            const errorData = await response.json().catch(() => ({ error: 'Nem tudta értelmezni a szerver válaszát.' }));
            throw new Error(`Szerver hiba (${response.status}): ${errorData.error || 'Ismeretlen hiba'}`);
        }

        const data = await response.json();
        
        // A szervernek a választ a 'text' mezőben kell küldenie
        if (!data.text) {
            throw new Error('Érvénytelen válasz a szervertől (hiányzik a "text" mező)');
        }

        return data.text;
    }

    addMessage(content, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message ${isError ? 'error-message' : ''}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'bot') {
            const icon = isError ? '⚠️' : '🤖';
            const name = isError ? 'Hiba' : 'Tippmix Bot';
            messageContent.innerHTML = `<strong>${icon} ${name}:</strong> ${content}`;
        } else {
            messageContent.innerHTML = `<strong>👤 Te:</strong> ${content}`;
        }
        
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        
        // Scroll az aljára
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing';
        typingDiv.innerHTML = `
            <div class="message-content">
                <strong>🤖 Tippmix Bot:</strong> 
                <span class="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                </span>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        return typingDiv;
    }

    removeTypingIndicator(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }
}

// Bot inicializálása
document.addEventListener('DOMContentLoaded', () => {
    new TippmixBot();
});