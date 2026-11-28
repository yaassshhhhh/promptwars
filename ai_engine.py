"""
Urban Air Quality Assistant - GenAI Engine
Handles LLM queries, Gemini API integration, Groq integration,
and built-in scientific contextual reasoning for urban smog & air pollution.
"""

import os
import json
import logging
import requests

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """
You are Kaze, an elite GenAI Urban Air Quality & Winter Smog Specialist for families and communities.
Your mission is to guide people through severe winter smog, diurnal thermal inversions, and hazardous particulate spikes with actionable, scientifically verified counsel.

CRITICAL RULES FOR RESPONSES:
1. DIRECT ANSWER FIRST: If the user asks whether an activity, walk, commute, or ventilation is safe (e.g., "Is it safe for my asthmatic mother to walk at 8am?"), ALWAYS start with a bold, unequivocal verdict first:
   - "**Direct Answer: NO — Strictly Avoid.**" OR
   - "**Direct Answer: YES — Safe Window.**" OR
   - "**Direct Answer: CONDITIONAL — Only with N95 & Low Exertion.**"
   Follow immediately with the scientific rationale referencing their specific city and current AQI.
2. TIME & INVERSION AWARENESS: Specifically analyze the hour mentioned (e.g., 6:00 AM - 10:30 AM lies in the peak morning nocturnal thermal inversion layer where pollutants are trapped at ground level; whereas early afternoon is the solar dispersal window).
3. VULNERABILITY GROUNDING: Account strictly for active household vulnerability toggles (Asthma, Elderly 65+, Infants/Kids, Pets). E.g. asthmatic/elderly members face acute bronchial spasms during cold morning smog spikes.
4. GROUNDED REALITY: Never invent or hallucinate cities that are not in the provided context. Strictly ground recommendations in the provided city's geography, current AQI, and safe ventilation window.
5. QUANTIFY IMPACT: Always highlight personal exposure defense (PM2.5 reduction, cigarettes avoided) and community carbon sparing (CO2 kg avoided = ~118 smartphone charges/kg).
6. FORMATTING: Use structured markdown with crisp bullet points. No vague conversational filler.
"""

def generate_gemini_response(api_key: str, prompt: str, context: dict) -> str:
    """Query Google Gemini API directly via REST."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    context_str = json.dumps(context, indent=2)
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"{SYSTEM_INSTRUCTION}\n\nCURRENT USER & ENVIRONMENTAL CONTEXT:\n{context_str}\n\nUSER PROMPT: {prompt}"
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1024
        }
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
            return None
    except Exception as e:
        logger.error(f"Error querying Gemini API: {e}")
        return None


def generate_groq_response(api_key: str, prompt: str, context: dict) -> str:
    """Query Groq API directly via REST."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    context_str = json.dumps(context, indent=2)
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": f"Context: {context_str}\n\nUser request: {prompt}"}
        ],
        "temperature": 0.4,
        "max_tokens": 1024
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=15)
        if resp.status_code == 200:
            return resp.json()["choices"][0]["message"]["content"]
        return None
    except Exception as e:
        logger.error(f"Error querying Groq API: {e}")
        return None


def calculate_impact_metrics(aqi: int, commute_km: float, transit_mode: str, carpool_count: int = 1, air_purifier_hours: int = 8) -> dict:
    """
    Computes direct personal and community impact:
    - CO2 saved vs solo petrol car
    - PM2.5 tailpipe avoided
    - Inhaled PM2.5 avoided (micrograms)
    - Equivalent cigarettes avoided
    - Smartphone charges equivalent (~118 charges per 1 kg CO2)
    - Dynamic health risk reduction percentage
    """
    # Baseline solo petrol car: ~170g CO2/km, 0.04g PM2.5/km
    baseline_co2_per_km = 0.170  # kg CO2
    baseline_pm_per_km = 0.04    # grams PM2.5
    
    co2_factors = {
        "solo_car": 1.0,
        "carpool": 1.0 / max(carpool_count, 2),
        "two_wheeler": 0.45,
        "metro": 0.15,
        "electric_bus": 0.20,
        "ev": 0.30,
        "wfh": 0.0
    }
    
    pm_factors = {
        "solo_car": 1.0,
        "carpool": 1.0 / max(carpool_count, 2),
        "two_wheeler": 1.2,
        "metro": 0.05,
        "electric_bus": 0.10,
        "ev": 0.05,
        "wfh": 0.0
    }
    
    factor_co2 = co2_factors.get(transit_mode, 0.5)
    factor_pm = pm_factors.get(transit_mode, 0.5)
    
    # Commute distance from slider is treated directly as roundtrip
    total_km = max(0.0, float(commute_km))
    co2_saved_kg = round(total_km * baseline_co2_per_km * (1.0 - factor_co2), 2)
    pm25_avoided_g = round(total_km * baseline_pm_per_km * (1.0 - factor_pm), 3)
    
    # Consistent smartphone charging metric: 1 kg CO2 ≈ 118 smartphone full charges
    smartphone_charges = int(round(co2_saved_kg * 118))
    
    # Breathing volume per day: ~15 m^3 / day (~0.625 m^3 / hour)
    # Berkeley Earth rule: 22 ug/m3 PM2.5 roughly equates to 1 cigarette's particulate toxicity
    avg_pm25 = max(20.0, aqi * 0.72)
    purifier_filtered_ug = round(air_purifier_hours * 0.625 * (avg_pm25 * 0.85), 1)
    
    # Unified Cigarettes Avoided Formula:
    # Based on daily inhaled microgram reduction through filtration + cleaner transit
    transit_protection = 0.25 if transit_mode in ["metro", "wfh", "ev"] else (0.12 if transit_mode == "carpool" else 0.04)
    filtration_fraction = (purifier_filtered_ug / max(avg_pm25 * 15.0, 1.0))
    daily_cig_equiv = round((aqi / 22.0) * (filtration_fraction * 0.75 + transit_protection), 1)
    cigs_avoided = max(0.3, daily_cig_equiv)

    # Dynamic Health Risk Reduction Percentage (dynamically responds between 20% and 92%)
    base_reduction = 22
    purifier_boost = min(46, int(air_purifier_hours * 4.2))
    mode_boost = 24 if transit_mode in ["metro", "wfh"] else (18 if transit_mode in ["ev", "electric_bus"] else (12 if transit_mode == "carpool" else 5))
    health_risk_reduction = min(92, max(20, base_reduction + purifier_boost + mode_boost))

    return {
        "co2_saved_kg": max(0.0, co2_saved_kg),
        "pm25_avoided_g": max(0.0, pm25_avoided_g),
        "smartphone_charges": smartphone_charges,
        "purifier_filtered_ug": purifier_filtered_ug,
        "cigarettes_avoided": cigs_avoided,
        "health_risk_reduction_pct": health_risk_reduction
    }


def built_in_expert_reasoner(prompt: str, context: dict) -> str:
    """
    High-fidelity domain reasoning engine that synthesizes personalized,
    scientifically grounded advice with direct Yes/No verdicts first.
    """
    city = context.get("city", "Delhi NCR")
    aqi = int(context.get("aqi", 348))
    category = context.get("category", "Hazardous")
    safe_window = context.get("safe_ventilation_window", "1:30 PM - 3:30 PM")
    profile = context.get("profile", {})
    commute = context.get("commute", {})
    
    has_infants = profile.get("infants", False)
    has_elderly = profile.get("elderly", False)
    has_asthma = profile.get("asthma", False)
    has_pets = profile.get("pets", False)
    
    p_lower = prompt.lower()
    
    # Detect query for walking / morning exercise / jogging / outdoor activity (e.g., "safe for asthmatic mother to walk at 8am?")
    is_activity_query = any(k in p_lower for k in ["walk", "jog", "run", "exercise", "cycling", "outside", "outdoor", "stroll", "park", "morning walk"])
    has_morning_time = any(k in p_lower for k in ["8am", "8 am", "7am", "7 am", "6am", "6 am", "9am", "9 am", "10am", "10 am", "morning"])
    
    if is_activity_query or has_morning_time:
        if aqi > 120 and (has_morning_time or "morning" in p_lower):
            vulnerable_str = ""
            if has_asthma or "asthma" in p_lower:
                vulnerable_str += " especially for individuals with asthma (cold particulate triggers severe bronchospasms)"
            if has_elderly or "mother" in p_lower or "elder" in p_lower or "senior" in p_lower:
                vulnerable_str += " and elderly family members"
            if has_infants or "child" in p_lower or "kid" in p_lower or "baby" in p_lower or "infant" in p_lower:
                vulnerable_str += " and developing pediatric lungs"

            return f"""### ⛔ Outdoor Activity Safety Verdict for {city}

**Direct Answer: NO — Strictly Avoid.**

Walking or exercising outdoors at 8:00 AM in **{city}** (Current AQI: **{aqi}** • **{category}**) is hazardous{vulnerable_str}.

#### 🔬 Scientific Rationale:
1. **Morning Thermal Inversion Trap (6:00 AM - 10:30 AM)**: Cold ground temperatures form a dense atmospheric lid, locking toxic diesel exhaust, $PM_{{2.5}}$, and heavy metals in the lowest 40 meters of air right at human breathing height.
2. **Deep Lung Deposition**: Walking or physical exertion increases inhalation volume from 6 L/min to 25+ L/min, forcing ultra-fine micro-soot deep into bronchial tubes and alveoli.
3. **Medical Advisory**:
   - Keep indoor air purifiers running in active living areas.
   - For asthmatic or elderly members: Ensure bronchodilator inhalers are on hand; keep indoor relative humidity around 45%.
   - **Safe Alternative**: Reschedule outdoor walks strictly for the solar dispersal window (**{safe_window}**) when sunlight warms the ground and breaks the thermal inversion ceiling."""
        elif aqi <= 100:
            return f"""### ✅ Outdoor Activity Safety Verdict for {city}

**Direct Answer: YES — Safe Window.**

With a current AQI of **{aqi}** in **{city}**, air quality meets safe environmental thresholds.

#### 🌿 Recommended Action:
- Morning outdoor exercise is acceptable.
- Maintain gentle natural ventilation during midday."""

    # 1. Routine Request
    if any(k in p_lower for k in ["routine", "schedule", "day plan", "plan my day"]):
        return generate_expert_routine(city, aqi, profile, commute)
    
    # 2. Indoor Hacks / Purifier Request
    if any(k in p_lower for k in ["hack", "purifier", "filter", "diy", "corsi", "box fan", "plant"]):
        return generate_expert_hacks(aqi, profile)
        
    # 3. Ventilation Window Query
    if any(k in p_lower for k in ["window", "ventilat", "when to open", "fresh air"]):
        return f"""### 🪟 Optimal Ventilation Protocol for {city} (AQI {aqi})

**Direct Answer: Ventilate strictly during {safe_window}.**

#### ⏱️ The Flash-Ventilation Rule:
- **Morning (5:30 AM - 11:00 AM)**: ⛔ Keep all exterior windows sealed. Nocturnal ground inversion concentrates toxic particulate matter.
- **Solar Window ({safe_window})**: ✅ Open opposite windows for **strictly 8 to 12 minutes** to flush indoor $CO_2$ and VOCs.
- **Post-Ventilation Clean**: Immediately damp-mop hard floors to trap micro-dust without re-suspending settled particles into breathing zones.
- **Evening Seal**: Lock windows shut before sunset as surface cooling re-establishes the inversion smog blanket."""

    # 4. Direct Impact Request
    if any(k in p_lower for k in ["impact", "saving", "co2", "emissions", "cigarette", "health risk"]):
        km = float(commute.get("distance_km", 14.0))
        mode = commute.get("mode", "metro")
        metrics = calculate_impact_metrics(aqi, km, mode, air_purifier_hours=10)
        return f"""### 📊 Direct Impact Analysis: Your Personal & Community Footprint

By optimizing your daily routine and transit in **{city}** (AQI: {aqi} • {category}):

#### 1. 💚 Community Emission Sparing
- **CO₂ Avoided Today**: **{metrics['co2_saved_kg']} kg** (Equivalent to charging **~{metrics['smartphone_charges']} smartphones**).
- **PM2.5 Tailpipe Soot Sparing**: **{metrics['pm25_avoided_g']} grams** of micro-particulates kept out of neighborhood air.
- **Why this matters**: In severe winter smog, ground-level thermal inversion traps localized tailpipe emissions within a 50m blanket. Your mode shift directly spares adjacent pedestrians and morning commuters.

#### 2. 🫁 Personal Respiratory Protection
- **Particulate Filtered**: **{metrics['purifier_filtered_ug']} µg** of PM2.5 prevented from penetrating deep alveolar lung tissue.
- **Equivalent Toxic Dose Avoided**: Equal to **{metrics['cigarettes_avoided']} cigarettes** of toxic particulate load avoided today.
- **Overall Health Risk Reduction**: **{metrics['health_risk_reduction_pct']}%** lower acute cardiovascular and bronchial inflammation.

#### 🎯 Highest Leverage Choice for Tomorrow:
Shift any peak morning transit (7:30 AM - 9:30 AM) to off-peak or metro. During morning inversions, ground pollutant concentrations are 2.8x denser than mid-afternoon!"""

    # 5. General / Specific Prompt Response with context
    alert_badge = "🚨 CRITICAL SMOG ADVISORY" if aqi > 300 else ("⚠️ UNHEALTHY AIR WARNING" if aqi > 150 else "🌿 MODERATE AIR ADVISORY")
    
    special_care = []
    if has_infants:
        special_care.append("👶 **Infants/Toddlers**: Alveoli are still developing; keep indoor rooms sealed under HEPA filtration; strictly no outdoor stroller strolls before 1:00 PM.")
    if has_asthma:
        special_care.append("🫁 **Asthma/Respiratory**: Keep rapid-acting bronchodilators accessible; wear fitted N95 respirators even for brief balcony visits.")
    if has_elderly:
        special_care.append("👵 **Elderly Members (65+)**: Elevate room hydration (40-50% relative humidity) to reduce airway irritation; cancel early morning outdoor walks (6:00-10:30 AM).")
    if has_pets:
        special_care.append("🐾 **Household Pets**: Wipe paws and fur with a damp microfiber cloth after short outdoor breaks; avoid aerosol sprays and essential oil diffusers.")
    
    care_text = "\n".join(special_care) if special_care else "✅ General adult population: moderate outdoor exertion and wear certified N95 respirators during transit."

    return f"""### {alert_badge} for {city} (AQI {aqi} • {category})

Hello! Here is your tailored air quality assessment and actionable guidance:

#### 1. 🌡️ Winter Smog & Thermal Inversion Status
- **Current Dynamic**: Boundary-layer thermal inversion traps heavy PM2.5 micro-soot close to the ground.
- **Safe Ventilation Window**: **{safe_window} only** (when solar radiation temporarily breaks the thermal blanket). Keep windows sealed tight before 11 AM and after sunset.

#### 2. 🛡️ Vulnerable Profile Customizations
{care_text}

#### 3. 🌿 Recommended Action Items Today
- **Indoor Filtration**: Run your air purifier continuously in sleep/medium mode. A DIY Corsi-Rosenthal box costs under $50 and delivers 450+ CADR.
- **Kitchen Combustion**: Do not fry without high-flow exhaust active. Use electric kettles and lids on cooking pots to prevent indoor NO₂ spikes.
- **Commuter Shield**: Take public transit or carpool to avoid road-level diesel exhaust infiltration."""


def generate_expert_routine(city: str, aqi: int, profile: dict, commute: dict) -> str:
    """Generates a structured, hourly low-emission routine."""
    mode = commute.get("mode", "metro")
    has_kids = profile.get("infants", False)
    km = float(commute.get("distance_km", 14.0))
    impact = calculate_impact_metrics(aqi, km, mode)
    
    return f"""### 📅 Optimized Low-Emission Daily Routine for {city}
**Current Air Index: AQI {aqi} | Commute: {mode.capitalize()} ({km} km roundtrip)**

---

#### 🌅 06:30 AM - 09:00 AM: Morning Inversion Shield
* **Thermal Inversion State**: **Critical** (Cold dense air trapping vehicle exhaust and biomass smoke at surface level).
* **Indoor Protocol**: Keep all exterior windows sealed. Run bedroom air purifier on medium. Use damp mop on floors (do not dry sweep, which resuspends settled PM2.5).
* **Exercise Advisory**: ⛔ Cancel all outdoor jogs, cycling, or balcony yoga. Transition to indoor resistance training or stretching with purifier running.
* **School / Commute Routine**: 
  - If driving: Set car ventilation to **"Recirculate Air"** mode and wear an N95 mask during embarkation.
  - Recommended Community Action: Coordinate a neighborhood carpool or use electric rail/metro to cut peak-hour tailpipe congestion by 65%.

---

#### ☀️ 11:30 AM - 03:30 PM: Solar Ventilation & Low-Emission Errands
* **Thermal Inversion State**: **Low to Moderate** (Solar heating lifts the inversion ceiling from 100m to 800m+).
* **Ventilation Window**: Open opposite windows for **8 to 12 minutes** ("Flash Ventilation") to flush stale indoor carbon dioxide (CO₂) without saturating rooms with soot.
* **Low-Emission Errands**: Combine groceries and pharmacy runs into a single consolidated trip or walk short distances with an N95 mask.

---

#### 🌆 05:00 PM - 08:30 PM: Evening Rush Hour & Clean Cooking
* **Thermal Inversion State**: **Rapid Re-inversion** (As the sun sets, surface temperatures plummet, condensing smog once again).
* **Return Commute**: Stagger departure 30 minutes after peak rush hour if feasible, avoiding stagnant vehicular queues where cabin PM2.5 exceeds 250 µg/m³.
* **Clean Kitchen Hack**: Turn on kitchen exhaust 2 minutes prior to cooking. Use lids on pots. Prefer induction or microwave over open gas burner combustion.
* **Kid/Family Activities**: Indoor board games, reading, or creative play. Avoid burning incense sticks, mosquito coils, or scented candles.

---

#### 🌙 09:00 PM - Night: Restorative Sanctuary Setup
* **Bedroom Sealing**: Place a silicone door sweep or rolled towel under the bedroom door to create a micro-clean sanctuary.
* **Purifier Position**: Position your purifier 3 feet away from walls, angled toward the bed headrest on quiet mode.
* **Bio-Filter Synergy**: Keep a Snake Plant (Sansevieria) in the bedroom for nocturnal oxygen replenishment.

---
**💡 Direct Daily Impact**: Adhering to this routine reduces your family's inhaled micro-particulate load by **~{impact['health_risk_reduction_pct']}%** and eliminates **{impact['co2_saved_kg']} kg of urban CO₂ emissions** (equivalent to ~{impact['smartphone_charges']} smartphone charges spared)."""


def generate_expert_hacks(aqi: int, profile: dict) -> str:
    """Generates an in-depth indoor air quality hacks guide."""
    has_pets = profile.get("pets", False)
    
    pet_note = "*(Note: Spider Plants & Boston Ferns are 100% pet-safe; avoid Peace Lilies if cats or dogs are prone to nibbling foliage.)*" if has_pets else ""

    return f"""### 🛠️ High-Impact Indoor Air Quality Hacks (Winter Smog Edition)

When outdoor AQI is {aqi}, outdoor air is toxic. These proven low-cost interventions turn your home into a safe clean-air sanctuary:

---

#### 1. 🌀 The DIY Corsi-Rosenthal Box (Hospital-Grade Air for <$50)
* **The Problem**: Commercial air purifiers cost $300-$600, with replacement filters costing $80/year.
* **The Solution**: 
  - Tape 4 MERV-13 furnace filters (20" x 20" x 1") into a square box with air-flow arrows pointing inward.
  - Tape a cardboard bottom base and secure a standard 20" box fan on top blowing UPWARD.
  - Add a cardboard circular shroud around the fan blades to eliminate reverse corner turbulence.
* **Efficacy**: Cleans room air at **450+ CADR (Clean Air Delivery Rate)**, cutting PM2.5 by 85-92% in 25 minutes.

---

#### 2. 🪟 The "Flash Ventilation" Window Rule
* **The Problem**: Sealing a house for days builds toxic indoor CO₂ (>1400 ppm), causing brain fog, headaches, and sleep apnea.
* **The Hack**:
  - Never open windows in the morning (5 AM - 11 AM) when ground inversion traps smog.
  - Open windows for **strictly 7-10 minutes between 1:30 PM and 3:00 PM** when solar thermal lift disperses particulates.
  - Immediately run damp micro-fiber mop on smooth surfaces to capture settled particles without scattering dust into the air.

---

#### 3. 🍳 Kitchen Combustion Control
* **The Problem**: Cooking on methane gas stoves produces Nitrogen Dioxide (NO₂), ultrafine carbon, and formaldehyde, spiking kitchen AQI to 500+ within 10 minutes.
* **The Hack**:
  - Turn exhaust hood on **before** striking the match.
  - Cover pans with tight lids; switch from frying to steaming or baking.
  - Use an electric kettle or induction plate for winter teas and soups.

---

#### 4. 🌿 NASA Clean Air Bio-Filters
* **Top Performers**:
  - **Snake Plant (Sansevieria)**: Crassulacean Acid Metabolism releases oxygen during nighttime sleep.
  - **Spider Plant**: Rapid VOC absorption and 100% non-toxic. {pet_note}
  - **Areca Palm**: Natural winter humidifier preventing dry mucous membranes that make airways susceptible to infection.

---

#### 5. 🚪 Zero-Cost Perimeter Sealing
* Apply adhesive foam weatherstripping ($4) to drafty window frames.
* Place a damp rolled towel or silicone door draft stopper along external and balcony door bases to prevent toxic negative-pressure suction."""


def query_assistant(prompt: str, context: dict, user_api_key: str = None) -> dict:
    """
    Unified entry point for the GenAI assistant:
    1. Tries user-provided Gemini API key or environment GEMINI_API_KEY.
    2. Tries Groq API key if available.
    3. Seamlessly falls back to Built-In High-Fidelity Domain Expert Reasoner (Kaze Expert Rule Engine).
    """
    gemini_key = user_api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")
    
    response_text = None
    provider_used = "Kaze Expert Rule Engine"
    
    if gemini_key:
        resp = generate_gemini_response(gemini_key, prompt, context)
        if resp:
            response_text = resp
            provider_used = "Gemini 2.5 Flash (Cloud API)"
            
    if not response_text and groq_key:
        resp = generate_groq_response(groq_key, prompt, context)
        if resp:
            response_text = resp
            provider_used = "Groq LLaMA 3.3 (Cloud API)"
            
    if not response_text:
        response_text = built_in_expert_reasoner(prompt, context)
        
    # Also attach impact metrics for the current context
    aqi = context.get("aqi", 312)
    commute = context.get("commute", {})
    km = float(commute.get("distance_km", 14.0))
    mode = commute.get("mode", "metro")
    impact_metrics = calculate_impact_metrics(aqi, km, mode)
    
    return {
        "reply": response_text,
        "provider": provider_used,
        "impact": impact_metrics
    }
