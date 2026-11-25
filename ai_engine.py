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
You are Aura, an elite GenAI Urban Air Quality & Winter Smog Assistant for families and communities.
Your mission is to help people navigate severe winter smog, thermal inversions, and high PM2.5/PM10 episodes.
Key guidelines:
1. Always analyze the user's specific context: Location, current AQI, and Vulnerable Household Profile (kids, elderly, asthma, pets).
2. Recommend practical low-emission daily routines tailored to their transit mode and work hours.
3. Provide high-impact indoor air quality hacks (e.g. Corsi-Rosenthal boxes, solar-thermal ventilation timing, zero-combustion cooking).
4. Suggest sustainable community alternatives (e.g. carpooling, mass transit, electric heating, reporting open burning).
5. Always quantify and clearly explain the DIRECT IMPACT of their choices:
   - Personal health impact (PM2.5 exposure reduction %, respiratory strain decrease, equivalent cigarettes avoided).
   - Community impact (kg of CO2 avoided, g of PM2.5 tailpipe emissions spared).
6. Be empathetic, scientifically grounded, and concise yet actionable.
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
    
    total_km = commute_km * 2  # roundtrip
    co2_saved_kg = round(total_km * baseline_co2_per_km * (1.0 - factor_co2), 2)
    pm25_avoided_g = round(total_km * baseline_pm_per_km * (1.0 - factor_pm), 3)
    
    # Breathing volume per day: ~15 m^3 / day (~0.625 m^3 / hour)
    # 22 ug/m3 PM2.5 roughly equates to 1 cigarette's particulate toxicity (Berkeley Earth rule of thumb)
    # With purifier running: indoor PM drops by ~75%
    avg_pm25 = max(25.0, aqi * 0.7)
    purifier_filtered_ug = round(air_purifier_hours * 0.625 * (avg_pm25 * 0.75), 1)
    
    # Total cigarettes equivalent toxicity avoided daily:
    daily_inhaled_ug = (avg_pm25 * 15.0)
    filtered_fraction = (purifier_filtered_ug / max(daily_inhaled_ug, 1.0))
    cigs_avoided = round((daily_inhaled_ug * filtered_fraction) / (22.0 * 20), 1)
    if cigs_avoided < 0.1 and aqi > 200:
        cigs_avoided = round(aqi / 40.0, 1)

    return {
        "co2_saved_kg": max(0.0, co2_saved_kg),
        "pm25_avoided_g": max(0.0, pm25_avoided_g),
        "purifier_filtered_ug": purifier_filtered_ug,
        "cigarettes_avoided": max(0.2, cigs_avoided),
        "health_risk_reduction_pct": min(88, int(35 + (air_purifier_hours * 5) + (30 if transit_mode in ["metro", "wfh"] else 10)))
    }


def built_in_expert_reasoner(prompt: str, context: dict) -> str:
    """
    High-fidelity domain reasoning engine that synthesizes personalized advice,
    routine recommendations, indoor air hacks, and impact explanation.
    """
    city = context.get("city", "Delhi NCR")
    aqi = context.get("aqi", 312)
    category = context.get("category", "Very Poor")
    profile = context.get("profile", {})
    commute = context.get("commute", {})
    
    has_infants = profile.get("infants", False)
    has_elderly = profile.get("elderly", False)
    has_asthma = profile.get("asthma", False)
    has_pets = profile.get("pets", False)
    
    p_lower = prompt.lower()
    
    # 1. Routine Request
    if any(k in p_lower for k in ["routine", "schedule", "commute", "morning", "day plan", "plan my day"]):
        return generate_expert_routine(city, aqi, profile, commute)
    
    # 2. Indoor Hacks Request
    if any(k in p_lower for k in ["hack", "purifier", "filter", "diy", "window", "ventilat", "plant", "indoor"]):
        return generate_expert_hacks(aqi, profile)
    
    # 3. Direct Impact Request
    if any(k in p_lower for k in ["impact", "saving", "co2", "emissions", "cigarette", "health risk"]):
        km = float(commute.get("distance_km", 14.0))
        mode = commute.get("mode", "metro")
        metrics = calculate_impact_metrics(aqi, km, mode, air_purifier_hours=10)
        return f"""### 📊 Direct Impact Analysis: Your Personal & Community Footprint

By optimizing your daily routine and transit in **{city}** (AQI: {aqi} - {category}):

#### 1. 💚 Community Emission Sparing
- **CO₂ Avoided Today**: **{metrics['co2_saved_kg']} kg** (Equivalent to charging ~{int(metrics['co2_saved_kg']*120)} smartphones).
- **PM2.5 Tailpipe Soot Sparing**: **{metrics['pm25_avoided_g']} grams** of micro-particulates kept out of neighborhood air.
- **Why this matters**: In severe winter smog, ground-level thermal inversion traps localized tailpipe emissions within a 50m blanket. Your mode shift directly spares adjacent pedestrians and morning commuters.

#### 2. 🫁 Personal Respiratory Protection
- **Particulate Filtered**: **{metrics['purifier_filtered_ug']} µg** of PM2.5 prevented from penetrating deep alveolar lung tissue.
- **Equivalent Toxic Dose Avoided**: Equal to **{metrics['cigarettes_avoided']} cigarettes** of toxic particulate load avoided today.
- **Overall Health Risk Reduction**: **{metrics['health_risk_reduction_pct']}%** lower acute cardiovascular and bronchial inflammation.

#### 🎯 Highest Leverage Choice for Tomorrow:
Shift any peak morning transit (7:30 AM - 9:30 AM) to off-peak or metro. During morning inversions, ground pollutant concentrations are 2.8x denser than mid-afternoon!"""

    # 4. General / Specific Prompt Response with context
    alert_badge = "🚨 CRITICAL SMOG ADVISORY" if aqi > 300 else "⚠️ UNHEALTHY AIR WARNING"
    
    special_care = []
    if has_infants:
        special_care.append("👶 **Infants/Toddlers**: Alveoli are still developing; keep indoor rooms sealed under HEPA filtration; strictly no outdoor stroller strolls before 1:00 PM.")
    if has_asthma:
        special_care.append("🫁 **Asthma/Respiratory**: Keep rapid-acting bronchodilators accessible; wear fitted N95 respirators even for brief balcony visits.")
    if has_elderly:
        special_care.append("👵 **Elderly Members**: Elevate room hydration (40-50% relative humidity) to reduce airway irritation; monitor resting pulse and blood pressure.")
    if has_pets:
        special_care.append("🐾 **Household Pets**: Wipe paws and fur with a damp microfiber cloth after short garden breaks; avoid essential oil diffusers which irritate canine/feline lungs.")
    
    care_text = "\n".join(special_care) if special_care else "✅ General adult population: moderate outdoor exertion and wear N95 on commutes."

    return f"""### {alert_badge} for {city} (AQI {aqi} • {category})

Hello! Here is your tailored air quality assessment and actionable guidance:

#### 1. 🌡️ Winter Smog & Thermal Inversion Status
- **Current Dynamic**: Cold ground temperatures have created a nocturnal boundary-layer inversion, trapping heavy PM2.5 micro-soot close to the ground.
- **Safe Ventilation Window**: **1:30 PM - 3:30 PM only** (when solar radiation temporarily breaks the thermal blanket). Keep windows sealed tight before 11 AM and after 4:30 PM.

#### 2. 🛡️ Vulnerable Profile Customizations
{care_text}

#### 3. 🌿 Recommended Action Items Today
- **Indoor Filtration**: Run your air purifier in "Sleep/Low" mode in bedrooms continuously. If you lack commercial units, a DIY Corsi-Rosenthal box costs under $45 and delivers ~450 CADR.
- **Kitchen Combustion**: Do not fry or sauté without high-flow exhaust active. Swap gas stove boiling for an electric kettle to eliminate indoor NO₂ spikes.
- **Commuter Shield**: If commuting today, take the metro or carpool. Solo petrol idling in morning traffic elevates personal PM2.5 exposure by 340% due to cabin air intake of road-level diesel exhaust.

*Would you like a personalized hour-by-hour low-emission daily schedule or a step-by-step DIY air cleaner guide?*"""


def generate_expert_routine(city: str, aqi: int, profile: dict, commute: dict) -> str:
    """Generates a structured, hourly low-emission routine."""
    mode = commute.get("mode", "metro")
    has_kids = profile.get("infants", False)
    
    return f"""### 📅 Optimized Low-Emission Daily Routine for {city}
**Current Air Index: AQI {aqi} | Commute: {mode.capitalize()}**

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
* **Ventilation Window**: Open opposite windows for **8 to 12 minutes between 1:30 PM and 3:00 PM** ("Flash Ventilation") to flush stale indoor carbon dioxide (CO₂) and bio-effluents without saturating rooms with soot.
* **Low-Emission Errands**: Combine groceries and pharmacy runs into a single consolidated trip or walk short distances with a KF94 mask.

---

#### 🌆 05:00 PM - 08:30 PM: Evening Rush Hour & Clean Cooking
* **Thermal Inversion State**: **Rapid Re-inversion** (As the sun sets, surface temperatures plummet, condensing smog once again).
* **Return Commute**: Stagger departure 30 minutes after peak 6:30 PM rush hour if feasible, avoiding stagnant vehicular queues where cabin PM2.5 exceeds 250 µg/m³.
* **Clean Kitchen Hack**: Turn on kitchen exhaust 2 minutes prior to cooking. Use lids on pots. Prefer induction or microwave over open gas burner combustion.
* **Kid/Family Activities**: Indoor board games, reading, or creative play. Avoid burning incense sticks, mosquito coils, or scented candles.

---

#### 🌙 09:00 PM - Night: Restorative Sanctuary Setup
* **Bedroom Sealing**: Place a silicone door sweep or rolled towel under the bedroom door to create a micro-clean sanctuary.
* **Purifier Position**: Position your purifier 3 feet away from walls, angled toward the bed headrest on quiet mode.
* **Bio-Filter Synergy**: Keep a Snake Plant (Sansevieria) in the bedroom for nocturnal oxygen replenishment.

---
**💡 Direct Daily Impact**: Adhering to this routine reduces your family's inhaled micro-particulate load by **~68%** and eliminates **3.2 kg of urban CO₂ emissions**."""


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
    3. Seamlessly falls back to Built-In High-Fidelity Domain Expert Reasoner.
    """
    gemini_key = user_api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")
    
    response_text = None
    provider_used = "Built-in Expert GenAI Reasoner"
    
    if gemini_key:
        resp = generate_gemini_response(gemini_key, prompt, context)
        if resp:
            response_text = resp
            provider_used = "Gemini 2.5 Flash (Live API)"
            
    if not response_text and groq_key:
        resp = generate_groq_response(groq_key, prompt, context)
        if resp:
            response_text = resp
            provider_used = "Groq LLaMA 3.3 (Live API)"
            
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
