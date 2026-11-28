/**
 * Impact Calculator Engine for Urban Air Quality Assistant
 * Computes quantifiable direct impacts: CO2, PM2.5 tailpipe,
 * cigarettes equivalent avoided, and personal health risk score.
 */

window.ImpactCalculator = {
  currentMetrics: {
    co2_saved_kg: 2.02,
    pm25_avoided_g: 0.532,
    purifier_filtered_ug: 1331.1,
    cigarettes_avoided: 8.2,
    health_risk_reduction_pct: 86
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

    // Explain impact button -> Opens Scientific Methodology Modal
    const explainBtn = document.getElementById('askImpactExplanationBtn');
    if (explainBtn) {
      explainBtn.addEventListener('click', () => {
        const modal = document.getElementById('methodologyModal');
        if (modal) {
          modal.classList.remove('hidden');
        } else if (window.AIChat) {
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
    // Slider value is already roundtrip: do not double multiply
    const totalKm = Math.max(0, parseFloat(km) || 0);
    const co2Saved = Math.max(0, (totalKm * 0.170 * (1.0 - f.co2))).toFixed(2);
    const pmSaved = Math.max(0, (totalKm * 0.04 * (1.0 - f.pm))).toFixed(3);
    const smartphoneCharges = Math.round(parseFloat(co2Saved) * 118);

    const avgPm25 = Math.max(20.0, aqi * 0.72);
    const purifierFiltered = purifierHours * 0.625 * (avgPm25 * 0.85);

    const commuteHours = totalKm / 25.0;
    const streetPm25Intake = commuteHours * 0.625 * (avgPm25 * 1.35);
    const transitProt = (mode === 'metro' || mode === 'wfh') ? 0.85 : ((mode === 'ev') ? 0.70 : (mode === 'carpool' ? 0.40 : 0.05));
    const commuteShielded = streetPm25Intake * transitProt;
    const totalPmAvoided = purifierFiltered + commuteShielded;

    const cigs = Math.max(0.3, parseFloat((totalPmAvoided / 175.0).toFixed(1)));

    // Dynamic Health Risk Reduction (20% - 95%, responding dynamically to purifier hours, mode, and distance)
    const baseRed = 20;
    const purifierBoost = Math.min(44, Math.round(purifierHours * 4.0));
    const modeBoost = (mode === 'metro' || mode === 'wfh') ? 22 : ((mode === 'ev') ? 16 : ((mode === 'carpool') ? 10 : 4));
    const distFactor = (mode === 'metro' || mode === 'wfh' || mode === 'ev') ? Math.min(12, Math.round(totalKm * 0.35)) : -Math.min(8, Math.round(totalKm * 0.25));
    const riskRed = Math.min(95, Math.max(18, baseRed + purifierBoost + modeBoost + distFactor));

    const metrics = {
      co2_saved_kg: parseFloat(co2Saved),
      pm25_avoided_g: parseFloat(pmSaved),
      smartphone_charges: smartphoneCharges,
      cigarettes_avoided: cigs,
      health_risk_reduction_pct: riskRed
    };
    this.currentMetrics = metrics;
    this.updateUI(metrics, `By choosing ${mode.replace('_', ' ')} over a solo petrol car for your ${totalKm} km roundtrip and running HEPA filtration for ${purifierHours}h, you avoided ${co2Saved} kg of CO₂ (≈ ${smartphoneCharges} smartphone charges) and protected your lungs from ${cigs} cigarettes equivalent toxicity.`);
  },

  updateUI(metrics, explanation) {
    // Dashboard elements
    const co2El = document.getElementById('impactCo2');
    const pmEl = document.getElementById('impactPm25');
    const cigsEl = document.getElementById('impactCigs');
    const riskEl = document.getElementById('impactRiskPct');
    const narrEl = document.getElementById('impactNarrative');
    const smartEl = document.getElementById('impactSmartphones');

    if (co2El) co2El.textContent = metrics.co2_saved_kg;
    if (pmEl) pmEl.textContent = metrics.pm25_avoided_g;
    if (cigsEl) cigsEl.textContent = metrics.cigarettes_avoided;
    if (riskEl) riskEl.textContent = `${metrics.health_risk_reduction_pct}%`;
    if (narrEl && explanation) narrEl.textContent = explanation;

    const charges = metrics.smartphone_charges || Math.round((metrics.co2_saved_kg || 0) * 118);
    if (smartEl) smartEl.textContent = `≈ ${charges} smartphone charges`;

    // Phone mockup elements
    const phoneCo2 = document.getElementById('phoneCo2Saved');
    const phoneCigs = document.getElementById('phoneCigsAvoided');
    if (phoneCo2) phoneCo2.textContent = `${metrics.co2_saved_kg} kg`;
    if (phoneCigs) phoneCigs.textContent = `${metrics.cigarettes_avoided}`;
  }
};
