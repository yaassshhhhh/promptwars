/**
 * Main Application Orchestrator for Urban Air Quality Assistant
 * Handles data fetching, charts, modals, view toggles, and UI updates.
 */

window.CurrentCityData = null;
let aqiChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initCities();
  await loadIndoorHacks();
  await loadCommunityReports();

  // Initialize modules
  if (window.ImpactCalculator) window.ImpactCalculator.init();
  if (window.AIChat) window.AIChat.init();

  bindAppEvents();
});

/**
 * Fetch and populate cities dropdown
 */
async function initCities() {
  const citySelect = document.getElementById('citySelect');
  try {
    const resp = await fetch('/api/cities');
    const data = await resp.json();
    const cities = data.cities || [];

    citySelect.innerHTML = '';
    cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.country}) - AQI ${c.aqi}`;
      citySelect.appendChild(opt);
    });

    // Default select first city (Delhi)
    if (cities.length > 0) {
      await loadCityData(cities[0].id);
    }

    citySelect.addEventListener('change', async (e) => {
      await loadCityData(e.target.value);
    });
  } catch (err) {
    console.error("Error loading cities:", err);
  }
}

/**
 * Load complete environmental & smog dynamics for selected city
 */
async function loadCityData(cityId) {
  try {
    const resp = await fetch(`/api/aqi?city=${cityId}`);
    const city = await resp.json();
    window.CurrentCityData = city;

    // Update Dashboard UI
    document.getElementById('cardCityName').textContent = city.name;
    document.getElementById('cardRegion').textContent = `${city.region}, ${city.country} • Winter Smog Profile`;
    document.getElementById('cardAqiValue').textContent = city.aqi;
    document.getElementById('cardPrimaryPollutant').textContent = city.primary_pollutant;
    document.getElementById('cardPm25').innerHTML = `${city.pm25} <span class="text-[10px] font-normal text-slate-400">µg/m³</span>`;
    document.getElementById('cardPm10').innerHTML = `${city.pm10} <span class="text-[10px] font-normal text-slate-400">µg/m³</span>`;
    document.getElementById('cardNo2').innerHTML = `${city.no2} <span class="text-[10px] font-normal text-slate-400">ppb</span>`;
    document.getElementById('cardInversionAlert').textContent = city.inversion_alert;
    document.getElementById('safeVentWindow').textContent = city.safe_ventilation_window;
    document.getElementById('aqiCategory').textContent = city.category;

    // AQI Category badge color dynamics
    const badge = document.getElementById('aqiBadge');
    if (city.aqi > 300) {
      badge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#881337] text-rose-100 border border-rose-500/40 flex items-center gap-1.5 shadow-lg shadow-rose-950/40 glow-hazard";
    } else if (city.aqi > 200) {
      badge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-900/80 text-amber-100 border border-amber-500/40 flex items-center gap-1.5 shadow-lg";
    } else {
      badge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-900/80 text-emerald-100 border border-emerald-500/40 flex items-center gap-1.5";
    }

    // Update Phone Mockup UI
    document.getElementById('phoneCityPill').textContent = city.name;
    document.getElementById('phoneAqiText').textContent = `${city.category} (AQI ${city.aqi})`;
    document.getElementById('phonePrimaryText').textContent = `PM2.5: ${city.pm25} µg/m³ • Inversion Active`;
    document.getElementById('phoneVentWindow').textContent = city.safe_ventilation_window;

    // Render / update 24h forecast chart
    renderAqiChart(city.hourly_forecast || []);

    // Recalculate impact for this city's AQI
    if (window.ImpactCalculator) {
      window.ImpactCalculator.recalculate();
    }
  } catch (err) {
    console.error("Error loading city data:", err);
  }
}

/**
 * Render Chart.js Diurnal Smog & Ventilation Curve
 */
function renderAqiChart(forecast) {
  const ctx = document.getElementById('aqiHourlyChart')?.getContext('2d');
  if (!ctx) return;

  const labels = forecast.map(f => f.hour);
  const aqiData = forecast.map(f => f.aqi);

  if (aqiChartInstance) {
    aqiChartInstance.destroy();
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, 'rgba(220, 38, 38, 0.55)');
  gradient.addColorStop(0.4, 'rgba(244, 114, 182, 0.3)');
  gradient.addColorStop(0.8, 'rgba(245, 158, 11, 0.15)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

  aqiChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'AQI Trajectory',
        data: aqiData,
        borderColor: '#f43f5e',
        borderWidth: 3,
        backgroundColor: gradient,
        tension: 0.45,
        fill: true,
        pointBackgroundColor: (context) => {
          const val = context.raw;
          if (val > 350) return '#dc2626';
          if (val > 250) return '#f59e0b';
          return '#34d399';
        },
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#07120c',
          titleColor: '#fce7f3',
          titleFont: { family: "'Shippori Mincho', serif", weight: 'bold' },
          bodyColor: '#e2e8f0',
          borderColor: '#f43f5e',
          borderWidth: 1.5,
          padding: 12,
          boxPadding: 4,
          callbacks: {
            label: (ctx) => {
              const item = forecast[ctx.dataIndex];
              return ` 大気質 (AQI): ${ctx.raw} 【${item ? item.inversion : ''}】`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(244, 114, 182, 0.08)' },
          ticks: { color: '#cbd5e1', font: { size: 10, weight: '600' } }
        },
        y: {
          grid: { color: 'rgba(244, 114, 182, 0.08)' },
          ticks: { color: '#cbd5e1', font: { size: 10, weight: '600' } },
          min: 40
        }
      }
    }
  });
}

/**
 * Load indoor air quality hacks
 */
let allHacks = [];
async function loadIndoorHacks() {
  try {
    const resp = await fetch('/api/hacks');
    const data = await resp.json();
    allHacks = data.hacks || [];
    const container = document.getElementById('hacksGrid');
    if (!container) return;

    container.innerHTML = '';
    allHacks.forEach(hack => {
      const card = document.createElement('div');
      card.className = "ema-card p-6 flex flex-col justify-between group cursor-pointer relative shrine-roof";
      card.onclick = () => openHackModal(hack.id);

      card.innerHTML = `
        <!-- Corner Kanamono -->
        <div class="kanamono-corner kanamono-tl"></div>
        <div class="kanamono-corner kanamono-tr"></div>

        <div>
          <div class="flex items-center justify-between gap-2 mb-2.5">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/80 font-kanji">${hack.category}</span>
            <span class="text-xs font-semibold text-amber-300">${hack.cost_tier}</span>
          </div>
          <h4 class="text-base font-bold text-white group-hover:text-rose-400 transition font-kanji">${hack.title}</h4>
          <p class="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">${hack.subtitle}</p>
        </div>

        <div class="mt-5 pt-3.5 border-t border-emerald-900/60 flex items-center justify-between text-xs">
          <span class="text-emerald-300 font-medium text-[11px] font-kanji">${hack.efficacy}</span>
          <span class="text-rose-400 group-hover:text-white flex items-center gap-1 font-bold font-kanji">
            秘伝設計図 <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </span>
        </div>
      `;
      container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("Error loading hacks:", err);
  }
}

/**
 * Open Hack Detail / Blueprint Modal
 */
function openHackModal(hackId) {
  const hack = allHacks.find(h => h.id === hackId);
  if (!hack) return;

  const content = document.getElementById('hackModalContent');
  content.innerHTML = `
    <div class="flex items-center gap-2 mb-1">
      <span class="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">${hack.category}</span>
      <span class="text-xs text-slate-400">${hack.cost_tier}</span>
    </div>
    <h3 class="text-xl font-extrabold text-white font-['Plus_Jakarta_Sans']">${hack.title}</h3>
    <p class="text-sm text-emerald-400 font-medium mt-1">${hack.subtitle}</p>

    <div class="my-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-200">
      <strong>Verified Efficacy:</strong> ${hack.efficacy}
    </div>

    <div class="space-y-4 text-xs text-slate-200">
      <div>
        <h5 class="font-bold text-white uppercase tracking-wider mb-2 text-[11px]">Required Materials / Supplies</h5>
        <ul class="space-y-1.5 list-disc pl-4 text-slate-300">
          ${hack.supplies.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>

      <div>
        <h5 class="font-bold text-white uppercase tracking-wider mb-2 text-[11px]">Step-by-Step Execution Protocol</h5>
        <ol class="space-y-2 list-decimal pl-4 text-slate-300">
          ${hack.steps.map(step => `<li>${step}</li>`).join('')}
        </ol>
      </div>

      <div class="p-3 rounded-xl bg-[#091712] border border-emerald-900/60">
        <h5 class="font-bold text-emerald-400 text-xs mb-1">Measurable Clean Air Impact</h5>
        <p class="text-slate-300 leading-relaxed">${hack.impact}</p>
      </div>
    </div>
  `;

  document.getElementById('hackModal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

/**
 * Load Community Watch Reports
 */
async function loadCommunityReports() {
  try {
    const resp = await fetch('/api/community');
    const data = await resp.json();
    const reports = data.reports || [];
    const container = document.getElementById('communityReportsList');
    if (!container) return;

    container.innerHTML = '';
    reports.forEach(r => {
      const card = document.createElement('div');
      card.className = "ema-card p-4.5 flex flex-col justify-between text-xs relative overflow-hidden";
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between text-[11px] text-slate-300 mb-1.5 font-kanji">
            <span class="font-bold text-white">${r.neighborhood}</span>
            <span class="text-amber-400 font-semibold">${r.timestamp}</span>
          </div>
          <span class="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-800/80 mb-2 font-kanji">
            ${r.type}
          </span>
          <p class="text-slate-200 leading-snug">${r.details}</p>
        </div>
        <div class="mt-3 pt-2.5 border-t border-emerald-900/60 flex items-center justify-between text-[11px]">
          <span class="text-amber-300 font-bold font-kanji">${r.status}</span>
          <span class="text-slate-300 font-semibold flex items-center gap-1">
            <i data-lucide="thumbs-up" class="w-3.5 h-3.5 text-rose-400"></i> ${r.upvotes}
          </span>
        </div>
      `;
      container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("Error loading community reports:", err);
  }
}

/**
 * Bind General UI Events (Modals, Buttons, View Toggles)
 */
function bindAppEvents() {
  // View Toggle: Dashboard vs Phone Mockup
  const dashBtn = document.getElementById('viewDashboardBtn');
  const phoneBtn = document.getElementById('viewPhoneBtn');
  const dashView = document.getElementById('dashboardView');
  const phoneView = document.getElementById('phoneView');

  if (dashBtn && phoneBtn && dashView && phoneView) {
    dashBtn.addEventListener('click', () => {
      dashView.classList.remove('hidden');
      phoneView.classList.add('hidden');
      dashBtn.classList.add('bg-emerald-600', 'text-white');
      dashBtn.classList.remove('text-slate-400');
      phoneBtn.classList.remove('bg-emerald-600', 'text-white');
      phoneBtn.classList.add('text-slate-400');
    });

    phoneBtn.addEventListener('click', () => {
      dashView.classList.add('hidden');
      phoneView.classList.remove('hidden');
      phoneBtn.classList.add('bg-emerald-600', 'text-white');
      phoneBtn.classList.remove('text-slate-400');
      dashBtn.classList.remove('bg-emerald-600', 'text-white');
      dashBtn.classList.add('text-slate-400');
    });
  }

  // Quick Routine Generator Trigger
  const quickRoutineBtn = document.getElementById('quickRoutineBtn');
  if (quickRoutineBtn) {
    quickRoutineBtn.addEventListener('click', () => {
      if (window.AIChat) {
        window.AIChat.sendMessage("Generate my complete low-emission daily schedule for today's smog levels.");
      }
    });
  }

  // Quick Hacks Trigger
  const quickHacksBtn = document.getElementById('quickHacksBtn');
  if (quickHacksBtn) {
    quickHacksBtn.addEventListener('click', () => {
      openHackModal('corsi-rosenthal');
    });
  }

  // Hack Modal Close
  document.getElementById('closeHackModalBtn')?.addEventListener('click', () => {
    document.getElementById('hackModal').classList.add('hidden');
  });

  // Report Modal
  document.getElementById('openReportModalBtn')?.addEventListener('click', () => {
    document.getElementById('reportModal').classList.remove('hidden');
  });
  document.getElementById('closeReportModalBtn')?.addEventListener('click', () => {
    document.getElementById('reportModal').classList.add('hidden');
  });

  // Report Form Submit
  document.getElementById('reportForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const repType = document.getElementById('reportType').value;
    const hood = document.getElementById('reportNeighborhood').value;
    const details = document.getElementById('reportDetails').value;
    const city = window.CurrentCityData ? window.CurrentCityData.name : 'Delhi NCR';

    try {
      const resp = await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: city,
          neighborhood: hood,
          type: repType,
          details: details
        })
      });
      if (resp.ok) {
        document.getElementById('reportModal').classList.add('hidden');
        document.getElementById('reportForm').reset();
        await loadCommunityReports();
        alert("Thank you! Your pollution violation report has been broadcast to the community and logged with civic authorities.");
      }
    } catch (err) {
      console.error("Report submit error:", err);
    }
  });

  // Settings Modal
  const settingsModal = document.getElementById('settingsModal');
  const userGeminiKey = document.getElementById('userGeminiKey');

  document.getElementById('openSettingsBtn')?.addEventListener('click', () => {
    if (userGeminiKey) {
      userGeminiKey.value = localStorage.getItem('aura_gemini_key') || '';
    }
    settingsModal.classList.remove('hidden');
  });

  document.getElementById('closeSettingsModalBtn')?.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
    if (userGeminiKey) {
      const key = userGeminiKey.value.trim();
      if (key) {
        localStorage.setItem('aura_gemini_key', key);
      } else {
        localStorage.removeItem('aura_gemini_key');
      }
    }
    settingsModal.classList.add('hidden');
    alert("Assistant settings saved successfully!");
  });
}

/**
 * Handle Suggestion clicks inside the Phone View
 */
window.handlePhoneSuggestion = function(type) {
  // Switch back to dashboard view to show full AI reasoning
  document.getElementById('viewDashboardBtn')?.click();

  if (!window.AIChat) return;

  if (type === 'purifier') {
    window.AIChat.sendMessage("What are the optimal air purifier placement and runtime guidelines for high AQI today?");
  } else if (type === 'commute') {
    window.AIChat.sendMessage("How does switching from car to metro protect my health and reduce community smog today?");
  } else if (type === 'cooking') {
    window.AIChat.sendMessage("Give me indoor kitchen cooking tips to prevent indoor pollution spikes during winter smog.");
  } else if (type === 'mask') {
    window.AIChat.sendMessage("How do I perform a fit-test on my N95 respirator before outdoor travel?");
  }
};
