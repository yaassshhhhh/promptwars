/**
 * GenAI Conversational Assistant Engine for Urban Air Quality Assistant
 * Handles AI chat, prompt injection, voice synthesis/recognition,
 * and contextual environment syncing.
 */

window.AIChat = {
  chatMessages: [],
  speechSynth: window.speechSynthesis,
  recognition: null,
  isRecording: false,

  init() {
    this.initSpeech();
    this.bindEvents();
    this.sendInitialGreeting();
  },

  initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isRecording = true;
        const statusEl = document.getElementById('voiceStatus');
        const btn = document.getElementById('voiceInputBtn');
        if (statusEl) statusEl.classList.remove('hidden');
        if (btn) btn.classList.add('bg-rose-600', 'text-white');
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('chatInput');
        if (input) {
          input.value = transcript;
          this.sendMessage(transcript);
        }
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        const statusEl = document.getElementById('voiceStatus');
        const btn = document.getElementById('voiceInputBtn');
        if (statusEl) statusEl.classList.add('hidden');
        if (btn) btn.classList.remove('bg-rose-600', 'text-white');
      };

      this.recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        this.recognition.stop();
      };
    }
  },

  bindEvents() {
    // Form submit
    const form = document.getElementById('chatForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const msg = input.value.trim();
        if (msg) {
          input.value = '';
          this.sendMessage(msg);
        }
      });
    }

    // Voice button
    const voiceBtn = document.getElementById('voiceInputBtn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        if (!this.recognition) {
          alert("Speech recognition is not supported in this browser. Please type your message.");
          return;
        }
        if (this.isRecording) {
          this.recognition.stop();
        } else {
          this.recognition.start();
        }
      });
    }

    // Quick prompts
    document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = e.currentTarget.textContent.trim().replace(/^[^a-zA-Z0-9]+/, '');
        this.sendMessage(text);
      });
    });

    // Clear chat
    const clearBtn = document.getElementById('clearChatBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.chatMessages = [];
        const container = document.getElementById('chatMessages');
        if (container) container.innerHTML = '';
        this.sendInitialGreeting();
      });
    }
  },

  sendInitialGreeting() {
    const city = window.CurrentCityData ? window.CurrentCityData.name : "Delhi NCR";
    const aqi = window.CurrentCityData ? window.CurrentCityData.aqi : 348;
    const cat = window.CurrentCityData ? window.CurrentCityData.category : "Hazardous";

    const greeting = `### 🛡️ Kaze • Urban Air Quality AI Assistant
Welcome! I am **Kaze**, your autonomous GenAI advisor for navigating winter smog, thermal inversions, and hazardous urban air in **${city}** (AQI: ${aqi} • ${cat}).

**Core Capabilities:**
1. 🌬️ **Low-Emission Action Routines**: Schedule commutes and errands during clean solar windows to avoid hazardous morning/evening thermal inversions.
2. 🌀 **Hospital-Grade Indoor Hacks**: Deploy high-CADR low-cost solutions like the \$45 Corsi-Rosenthal box, HEPA filters, and perimeter sealing.
3. 💚 **Quantified Health & Climate Impact**: Calculate exact community $CO_2$ spared, $PM_{2.5}$ emissions avoided, and cigarette-inhalation equivalence.

*How can I assist your family or optimize your routine today?*`;

    this.renderMessage('assistant', greeting);
  },

  async sendMessage(promptText) {
    if (!promptText) return;

    // Render User Message
    this.renderMessage('user', promptText);

    // Show Typing Indicator
    const typingId = this.showTypingIndicator();

    // Gather contextual parameters
    const cityData = window.CurrentCityData || { name: 'Delhi NCR', aqi: 348, category: 'Hazardous' };
    const context = {
      city: cityData.name,
      aqi: cityData.aqi,
      category: cityData.category,
      profile: {
        infants: document.getElementById('profileInfants')?.checked || false,
        elderly: document.getElementById('profileElderly')?.checked || false,
        asthma: document.getElementById('profileAsthma')?.checked || false,
        pets: document.getElementById('profilePets')?.checked || false
      },
      commute: {
        mode: window.ImpactCalculator ? window.ImpactCalculator.getSelectedTransitMode() : 'metro',
        distance_km: parseFloat(document.getElementById('commuteKmInput')?.value || 14)
      }
    };

    const apiKey = localStorage.getItem('aura_gemini_key') || null;

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          context: context,
          api_key: apiKey
        })
      });

      this.removeTypingIndicator(typingId);

      if (resp.ok) {
        const data = await resp.json();
        
        // Update provider badge
        const badge = document.getElementById('aiProviderBadge');
        if (badge && data.provider) {
          badge.textContent = data.provider;
        }

        // Render AI Message
        this.renderMessage('assistant', data.reply, data.impact);

        // Update Impact Calculator if updated
        if (data.impact && window.ImpactCalculator) {
          window.ImpactCalculator.currentMetrics = data.impact;
          window.ImpactCalculator.updateUI(data.impact);
        }
      } else {
        this.renderMessage('assistant', "⚠️ I encountered an error connecting to the reasoning service. Please check your network or try again in a moment.");
      }
    } catch (err) {
      this.removeTypingIndicator(typingId);
      console.error("Chat error:", err);
      this.renderMessage('assistant', "⚠️ Offline notice: I am running in local mode. Please verify the backend server is active.");
    }
  },

  renderMessage(sender, text, impact = null) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `flex gap-3 ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

    if (sender === 'user') {
      msgDiv.innerHTML = `
        <div class="max-w-[85%] bg-emerald-700/80 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-md text-sm border border-emerald-600/50">
          <p>${this.escapeHtml(text)}</p>
        </div>
      `;
    } else {
      // Parse markdown
      const parsedHtml = window.marked ? marked.parse(text) : `<p>${text}</p>`;

      let impactBadge = '';
      if (impact) {
        impactBadge = `
          <div class="mt-3 pt-2.5 border-t border-emerald-900/60 flex flex-wrap items-center gap-2 text-xs">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              🌱 -${impact.co2_saved_kg} kg CO₂
            </span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-teal-300 border border-emerald-800">
              💨 -${impact.pm25_avoided_g}g PM2.5
            </span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-amber-300 border border-emerald-800">
              🫁 -${impact.cigarettes_avoided} Cigs Eq.
            </span>
          </div>
        `;
      }

      msgDiv.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-400 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm mt-0.5 border border-rose-300/40 font-kanji">
          風
        </div>
        <div class="max-w-[88%] bg-[#0e221b] text-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md border border-emerald-800/40 prose-dark text-sm">
          ${parsedHtml}
          ${impactBadge}
        </div>
      `;
    }

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  },

  showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'flex gap-3 justify-start';
    typingDiv.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-400 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm mt-0.5 border border-rose-300/40 font-kanji">
        風
      </div>
      <div class="bg-[#10241c] rounded-2xl rounded-tl-sm px-4 py-3 border border-emerald-800/40 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
      </div>
    `;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
    return id;
  },

  removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};
