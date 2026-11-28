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
 * Fetch and populate cities dropdown grouped by continent/region
 */
async function initCities() {
  const citySelect = document.getElementById('citySelect');
  try {
    const resp = await fetch('/api/cities');
    const data = await resp.json();
    const cities = data.cities || [];

    citySelect.innerHTML = '';

    // Group cities by continent / region
    const groups = {};
    cities.forEach(c => {
      const region = c.continent || 'Global';
      if (!groups[region]) groups[region] = [];
      groups[region].push(c);
    });

    // Preferred order of regions
    const regionOrder = ['India', 'Asia & Middle East', 'Europe', 'Americas', 'Africa & Oceania'];
    const sortedRegions = Object.keys(groups).sort((a, b) => {
      const idxA = regionOrder.indexOf(a);
      const idxB = regionOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    sortedRegions.forEach(region => {
      const optGroup = document.createElement('optgroup');
      optGroup.label = `📍 ${region} (${groups[region].length})`;
      optGroup.className = "bg-[#07130e] text-rose-300 font-bold";

      groups[region].forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.country}) - AQI ${c.aqi}`;
        opt.className = "bg-[#0b1c15] text-slate-200 font-normal";
        optGroup.appendChild(opt);
      });

      citySelect.appendChild(optGroup);
    });

    // Default select first city (Delhi)
    if (cities.length > 0) {
      citySelect.value = cities[0].id;
      await loadCityData(cities[0].id);
    }

    citySelect.addEventListener('change', async (e) => {
      await loadCityData(e.target.value);
    });
  } catch (err) {
    console.error("Error loading cities:", err);
  }
}

let currentDisplayedAqi = 0;

/**
 * Animate numeric counter smoothly from current value to target
 */
function animateAqiCounter(targetVal) {
  const el = document.getElementById('cardAqiValue');
  if (!el) return;
  const startVal = currentDisplayedAqi || 0;
  const target = parseInt(targetVal, 10) || 0;
  currentDisplayedAqi = target;

  if (startVal === target && startVal !== 0) {
    el.textContent = target;
    return;
  }

  const duration = 650;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Smooth ease-out cubic
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (target - startVal) * easeOut);
    el.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target;
    }
  }

  requestAnimationFrame(step);
}

/**
 * Load complete environmental & smog dynamics for selected city
 */
async function loadCityData(cityId, isRefresh = false) {
  try {
    const url = isRefresh
      ? `/api/aqi?city=${cityId}&refresh=1&_t=${Date.now()}`
      : `/api/aqi?city=${cityId}&_t=${Date.now()}`;
    const resp = await fetch(url);
    const city = await resp.json();
    window.CurrentCityData = city;

    // Update Dashboard UI
    document.getElementById('cardCityName').textContent = city.name;
    document.getElementById('cardRegion').textContent = `${city.region}, ${city.country} • Winter Smog Profile`;

    // Smooth animated counter
    animateAqiCounter(city.aqi);

    const aqi = parseInt(city.aqi, 10) || 0;
    const aqiEl = document.getElementById('cardAqiValue');
    const aqiLabel = document.getElementById('cardAqiLabel');
    const badge = document.getElementById('aqiBadge');
    const telemetryCard = document.getElementById('telemetryCard');

    // Dynamic AQI Coloring Rules (User Request):
    // > 200: Red (Severe / Hazardous)
    // 100 < aqi <= 200: Yellow (Moderate / Sensitive Groups)
    // <= 100: Green (Good / Clean Air)
    if (aqi > 200) {
      if (aqiEl) aqiEl.className = "text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-rose-400 font-['Outfit'] fire-glow-red transition-colors duration-500 leading-none";
      if (aqiLabel) aqiLabel.className = "text-xs sm:text-sm font-bold text-rose-300 block transition-colors duration-500";
      if (badge) {
        badge.className = "px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-[#881337] text-rose-100 border border-rose-500/50 flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-rose-950/60 glow-hazard transition-all duration-500 shrink-0";
        const ping = badge.querySelector('span:first-child');
        if (ping) ping.className = "w-2 h-2 rounded-full bg-rose-400 animate-ping";
      }
      if (telemetryCard) {
        telemetryCard.style.borderColor = "rgba(244, 63, 94, 0.45)";
      }
    } else if (aqi > 100) {
      if (aqiEl) aqiEl.className = "text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-amber-400 font-['Outfit'] fire-glow-yellow transition-colors duration-500 leading-none";
      if (aqiLabel) aqiLabel.className = "text-xs sm:text-sm font-bold text-amber-300 block transition-colors duration-500";
      if (badge) {
        badge.className = "px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-950/80 text-amber-200 border border-amber-500/50 flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-amber-950/60 transition-all duration-500 shrink-0";
        const ping = badge.querySelector('span:first-child');
        if (ping) ping.className = "w-2 h-2 rounded-full bg-amber-400 animate-ping";
      }
      if (telemetryCard) {
        telemetryCard.style.borderColor = "rgba(245, 158, 11, 0.45)";
      }
    } else {
      if (aqiEl) aqiEl.className = "text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-emerald-400 font-['Outfit'] fire-glow-green transition-colors duration-500 leading-none";
      if (aqiLabel) aqiLabel.className = "text-xs sm:text-sm font-bold text-emerald-300 block transition-colors duration-500";
      if (badge) {
        badge.className = "px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-950/80 text-emerald-200 border border-emerald-500/50 flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-950/60 transition-all duration-500 shrink-0";
        const ping = badge.querySelector('span:first-child');
        if (ping) ping.className = "w-2 h-2 rounded-full bg-emerald-400";
      }
      if (telemetryCard) {
        telemetryCard.style.borderColor = "rgba(16, 185, 129, 0.45)";
      }
    }

    document.getElementById('cardPrimaryPollutant').textContent = city.primary_pollutant;
    document.getElementById('cardPm25').innerHTML = `${city.pm25} <span class="text-[10px] font-normal text-slate-400">µg/m³</span>`;
    document.getElementById('cardPm10').innerHTML = `${city.pm10} <span class="text-[10px] font-normal text-slate-400">µg/m³</span>`;
    document.getElementById('cardNo2').innerHTML = `${city.no2} <span class="text-[10px] font-normal text-slate-400">ppb</span>`;
    document.getElementById('cardInversionAlert').textContent = city.inversion_alert;
    document.getElementById('safeVentWindow').textContent = city.safe_ventilation_window;
    document.getElementById('aqiCategory').textContent = city.category;

    // Update Chart Footer dynamic safe window
    const chartSolarWin = document.getElementById('chartSolarWindow');
    if (chartSolarWin) chartSolarWin.textContent = city.safe_ventilation_window;

    // Update Telemetry Source & Live Timestamp
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeEl = document.getElementById('telemetryTimestamp');
    if (timeEl) timeEl.textContent = `Live • Updated ${timeStr}`;
    const sourceEl = document.getElementById('telemetrySource');
    if (sourceEl) sourceEl.textContent = city.source || "Central Pollution Control Board (CPCB) / OpenAQ Ground Station Feed";

    // Update Phone Mockup UI
    document.getElementById('phoneCityPill').textContent = city.name;
    document.getElementById('phoneAqiText').textContent = `${city.category} (AQI ${city.aqi})`;
    document.getElementById('phonePrimaryText').textContent = `PM2.5: ${city.pm25} µg/m³ • Inversion Active`;
    document.getElementById('phoneVentWindow').textContent = city.safe_ventilation_window;

    const phoneCard = document.getElementById('phoneAqiCard');
    if (phoneCard) {
      if (aqi > 200) {
        phoneCard.className = "bg-gradient-to-r from-[#7a182b] to-[#991b1b] rounded-2xl p-4 text-white shadow-lg cursor-pointer hover:opacity-95 transition flex items-center justify-between border border-rose-500/40";
      } else if (aqi > 100) {
        phoneCard.className = "bg-gradient-to-r from-[#78350f] to-[#b45309] rounded-2xl p-4 text-white shadow-lg cursor-pointer hover:opacity-95 transition flex items-center justify-between border border-amber-500/40";
      } else {
        phoneCard.className = "bg-gradient-to-r from-[#064e3b] to-[#047857] rounded-2xl p-4 text-white shadow-lg cursor-pointer hover:opacity-95 transition flex items-center justify-between border border-emerald-500/40";
      }
    }

    // Render / update 24h forecast chart
    renderAqiChart(city.hourly_forecast || []);

    // Notify Kaze AI chat of new city context
    if (window.AIChat && window.AIChat.updateContext) {
      window.AIChat.updateContext();
    }

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
          titleFont: { family: "'Plus Jakarta Sans', sans-serif", weight: 'bold' },
          bodyColor: '#e2e8f0',
          borderColor: '#f43f5e',
          borderWidth: 1.5,
          padding: 12,
          boxPadding: 4,
          callbacks: {
            label: (ctx) => {
              const item = forecast[ctx.dataIndex];
              return ` Air Quality (AQI): ${ctx.raw} [${item ? item.inversion : ''}]`;
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
      card.className = "ema-card p-6 flex flex-col justify-between group cursor-pointer relative shrine-roof min-h-[220px]";
      card.onclick = () => openHackModal(hack.id);

      card.innerHTML = `
        <!-- Corner Kanamono -->
        <div class="kanamono-corner kanamono-tl"></div>
        <div class="kanamono-corner kanamono-tr"></div>

        <div>
          <div class="flex items-center justify-between gap-2 mb-2.5">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/80">${hack.category}</span>
            <span class="text-xs font-semibold text-amber-300">${hack.cost_tier}</span>
          </div>
          <h4 class="text-base font-bold text-white group-hover:text-rose-400 transition font-['Outfit']">${hack.title}</h4>
          <p class="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">${hack.subtitle}</p>
        </div>

        <div class="mt-5 pt-3.5 border-t border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span class="text-emerald-300 font-medium text-[11px] leading-tight flex-1 pr-2">${hack.efficacy}</span>
          <span class="text-rose-400 group-hover:text-white flex items-center gap-1 font-bold text-xs shrink-0 self-end sm:self-auto">
            Inspect Blueprint <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
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
    <h3 class="text-xl font-extrabold text-white font-['Outfit']">${hack.title}</h3>
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
 * Refresh current city AQI Telemetry with animation
 */
window.refreshAqiData = async function() {
  const select = document.getElementById('citySelect');
  const cityId = select ? select.value : 'delhi';
  const refreshBtn = document.getElementById('refreshAqiBtn');
  if (refreshBtn) {
    refreshBtn.classList.add('animate-spin');
  }

  try {
    await loadCityData(cityId, true);
  } finally {
    setTimeout(() => {
      if (refreshBtn) refreshBtn.classList.remove('animate-spin');
    }, 600);
  }
};

/**
 * Interactive Civic Report Upvoting with localStorage persistence
 */
window.upvoteReport = async function(reportId, btn) {
  const upvotedKey = 'upvoted_reports';
  let votedList = [];
  try {
    votedList = JSON.parse(localStorage.getItem(upvotedKey) || '[]');
  } catch (e) {
    votedList = [];
  }

  if (votedList.includes(reportId)) {
    alert("You have already verified and upvoted this incident report.");
    return;
  }

  try {
    const resp = await fetch('/api/community/upvote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: reportId })
    });
    if (resp.ok) {
      const data = await resp.json();
      votedList.push(reportId);
      localStorage.setItem(upvotedKey, JSON.stringify(votedList));

      if (btn) {
        const countSpan = btn.querySelector('.upvote-count');
        if (countSpan) countSpan.textContent = data.upvotes;
        btn.classList.add('bg-rose-900/60', 'text-rose-200', 'border-rose-500/80');
      }
    }
  } catch (err) {
    console.error("Upvote failed:", err);
  }
};

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

    let votedList = [];
    try {
      votedList = JSON.parse(localStorage.getItem('upvoted_reports') || '[]');
    } catch (e) {
      votedList = [];
    }

    container.innerHTML = '';
    reports.forEach(r => {
      const card = document.createElement('div');
      card.className = "ema-card p-5 flex flex-col justify-between text-xs relative overflow-hidden min-h-[175px] shadow-md";
      
      const isUpvoted = votedList.includes(r.id);
      const activeClass = isUpvoted 
        ? "bg-rose-900/60 text-rose-200 border-rose-500/80" 
        : "bg-emerald-950/80 hover:bg-rose-900/40 text-slate-200 border-emerald-800/60 hover:border-rose-500/60";

      card.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between text-[11px] text-slate-300 gap-2">
            <span class="font-bold text-white text-xs truncate">${r.neighborhood}</span>
            <span class="text-amber-400 font-semibold text-[10px] shrink-0">${r.timestamp}</span>
          </div>
          <span class="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-800/80">
            ${r.type}
          </span>
          <p class="text-slate-200 text-xs leading-relaxed line-clamp-2">${r.details}</p>
        </div>
        <div class="mt-3 pt-2.5 border-t border-emerald-900/60 flex items-center justify-between text-[11px] gap-2">
          <span class="text-amber-300 font-semibold text-[11px] truncate">${r.status}</span>
          <button type="button" onclick="window.upvoteReport('${r.id}', this)" class="upvote-btn px-2.5 py-1 rounded-lg ${activeClass} transition flex items-center gap-1.5 cursor-pointer text-xs font-semibold active:scale-95 shadow-sm" aria-label="Upvote report ${r.id}">
            <i data-lucide="thumbs-up" class="w-3.5 h-3.5 text-rose-400"></i>
            <span class="upvote-count">${r.upvotes}</span>
          </button>
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

  // Methodology Modal Close & Action Handlers
  document.getElementById('closeMethodologyModalBtn')?.addEventListener('click', () => {
    document.getElementById('methodologyModal')?.classList.add('hidden');
  });
  document.getElementById('askKazeFromModalBtn')?.addEventListener('click', () => {
    document.getElementById('methodologyModal')?.classList.add('hidden');
    const chamber = document.getElementById('chatMessages');
    if (chamber) chamber.scrollIntoView({ behavior: 'smooth' });
    if (window.AIChat) {
      window.AIChat.sendMessage("Explain the scientific calculation behind my CO2 savings, PM2.5 avoidance, and cigarette equivalent.");
    }
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

  // Re-sync Kaze context when vulnerability profile changes
  ['profileInfants', 'profileElderly', 'profileAsthma', 'profilePets'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      if (window.AIChat && window.AIChat.updateContext) {
        window.AIChat.updateContext();
      }
    });
  });
}

/**
 * Handle Suggestion clicks inside the Phone View
 */
window.handlePhoneSuggestion = function (type) {
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
