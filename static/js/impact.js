/**
 * Impact Calculator Engine for Urban Air Quality Assistant
 * Computes quantifiable direct impacts: CO2, PM2.5 tailpipe,
 * cigarettes equivalent avoided, and personal health risk score.
 */

window.ImpactCalculator = {
  currentMetrics: {
    co2_saved_kg: 4.05,
    pm25_avoided_g: 1.06,
    purifier_filtered_ug: 1110.0,
    cigarettes_avoided: 8.7,
    health_risk_reduction_pct: 72
  },

  init() {
    this.bindEvents();
    this.recalculate();
  },

  bindEvents() {
    // Transit buttons
    const transitButtons = document.querySelectorAll('.transit-btn');
    transitButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        transitButtons.forEach(b => {
          b.classList.remove('active', 'border-emerald-500', 'bg-emerald-600/30', 'text-white');
          b.classList.add('border-emerald-800/60', 'bg-[#142e23]', 'text-slate-300');
        });
        const target = e.currentTarget;
        target.classList.add('active', 'border-emerald-500', 'bg-emerald-600/30', 'text-white');
        target.classList.remove('border-emerald-800/60', 'bg-[#142e23]', 'text-slate-300');
        this.recalculate();
      });
    });

    // Commute Distance Slider
    const commuteKmInput = document.getElementById('commuteKmInput');
    const commuteKmDisplay = document.getElementById('commuteKmDisplay');
    if (commuteKmInput && commuteKmDisplay) {
      commuteKmInput.addEventListener('input', (e) => {
        commuteKmDisplay.textContent = `${e.target.value} km`;
        this.recalculate();
      });
    }

    // Air Purifier Hours Slider
    const purifierHoursInput = document.getElementById('purifierHoursInput');
    const purifierHoursDisplay = document.getElementById('purifierHoursDisplay');
    if (purifierHoursInput && purifierHoursDisplay) {
      purifierHoursInput.addEventListener('input', (e) => {
        purifierHoursDisplay.textContent = `${e.target.value} hours`;
        this.recalculate();
      });
    }

    // Vulnerable checkboxes recalculate
    ['profileInfants', 'profileElderly', 'profileAsthma', 'profilePets'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => this.recalculate());
    });

    // Explain impact button
    const explainBtn = document.getElementById('askImpactExplanationBtn');
    if (explainBtn) {
      explainBtn.addEventListener('click', () => {
        if (window.AIChat) {
          window.AIChat.sendMessage("Explain the scientific calculation behind my CO2 savings, PM2.5 avoidance, and cigarette equivalent.");
        }
      });
    }
  },

  getSelectedTransitMode() {
    const activeBtn = document.querySelector('.transit-btn.active');
    return activeBtn ? activeBtn.getAttribute('data-mode') : 'metro';
  },

  async recalculate() {
    const commuteKm = parseFloat(document.getElementById('commuteKmInput')?.value || 14);
    const purifierHours = parseInt(document.getElementById('purifierHoursInput')?.value || 10);
    const mode = this.getSelectedTransitMode();
    const currentAqi = window.CurrentCityData ? window.CurrentCityData.aqi : 348;

    try {
      const resp = await fetch('/api/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aqi: currentAqi,
          commute_km: commuteKm,
          transit_mode: mode,
          carpool_count: mode === 'carpool' ? 3 : 1,
          purifier_hours: purifierHours
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        this.currentMetrics = data.metrics;
        this.updateUI(data.metrics, data.explanation);
      }
    } catch (e) {
      console.warn("Using offline impact calculations:", e);
      this.calculateLocal(currentAqi, commuteKm, mode, purifierHours);
    }
  },

  calculateLocal(aqi, km, mode, purifierHours) {
    const factors = {
      solo_car: { co2: 1.0, pm: 1.0 },
      carpool: { co2: 0.35, pm: 0.35 },
      two_wheeler: { co2: 0.45, pm: 1.2 },
      metro: { co2: 0.15, pm: 0.05 },
      ev: { co2: 0.30, pm: 0.05 },
      wfh: { co2: 0.0, pm: 0.0 }
    };

    const f = factors[mode] || { co2: 0.5, pm: 0.5 };
    const totalKm = km * 2;
    const co2Saved = Math.max(0, (totalKm * 0.170 * (1.0 - f.co2))).toFixed(2);
    const pmSaved = Math.max(0, (totalKm * 0.04 * (1.0 - f.pm))).toFixed(3);
    const cigs = Math.max(0.5, ((aqi / 38.0) * (purifierHours / 12.0) * (mode === 'metro' || mode === 'wfh' ? 1.4 : 1.0))).toFixed(1);
    const riskRed = Math.min(88, Math.round(35 + (purifierHours * 3.5) + (mode === 'metro' ? 25 : 10)));

    const metrics = {
      co2_saved_kg: parseFloat(co2Saved),
      pm25_avoided_g: parseFloat(pmSaved),
      cigarettes_avoided: parseFloat(cigs),
      health_risk_reduction_pct: riskRed
    };
    this.currentMetrics = metrics;
    this.updateUI(metrics, `By choosing ${mode.replace('_', ' ')} over a solo petrol car and running HEPA filtration for ${purifierHours}h, you spare your community emissions and protect your lungs from ${cigs} cigarettes equivalent toxicity.`);
  },

  updateUI(metrics, explanation) {
    // Dashboard elements
    const co2El = document.getElementById('impactCo2');
    const pmEl = document.getElementById('impactPm25');
    const cigsEl = document.getElementById('impactCigs');
    const riskEl = document.getElementById('impactRiskPct');
    const narrEl = document.getElementById('impactNarrative');

    if (co2El) co2El.textContent = metrics.co2_saved_kg;
    if (pmEl) pmEl.textContent = metrics.pm25_avoided_g;
    if (cigsEl) cigsEl.textContent = metrics.cigarettes_avoided;
    if (riskEl) riskEl.textContent = `${metrics.health_risk_reduction_pct}%`;
    if (narrEl && explanation) narrEl.textContent = explanation;

    // Phone mockup elements
    const phoneCo2 = document.getElementById('phoneCo2Saved');
    const phoneCigs = document.getElementById('phoneCigsAvoided');
    if (phoneCo2) phoneCo2.textContent = `${metrics.co2_saved_kg} kg`;
    if (phoneCigs) phoneCigs.textContent = `${metrics.cigarettes_avoided}`;
  }
};
