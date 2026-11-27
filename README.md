# 🌿 Urban Air Quality Assistant • AEROVA (Challenge 06)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://promptwars-livid-sigma.vercel.app)
[![Python](https://img.shields.io/badge/Python_3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask_Backend-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript_ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![HTML5 / CSS3](https://img.shields.io/badge/HTML5_%26_CSS3-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

> **Autonomous GenAI-powered winter smog sanctuary & urban air quality assistant.**  
> Built for Prompt Wars • Challenge 06.

---

### 💻 Technology Stack & Language Breakdown

| Language / Tech | Role in Project | Highlights |
| :--- | :--- | :--- |
| **Python** | Backend Server & AI Engine | Flask REST API, 42-city telemetry routing, GenAI domain expert reasoning & formula calculator |
| **JavaScript** | Frontend Orchestration & Dynamics | Chart.js diurnal inversion curves, dynamic AQI counter easing, 3D sakura canvas particles & Japanese theme audio player |
| **CSS3** | Visual Design & Theme | Japanese Cyberpunk Glassmorphism, Cinnabar red / Amber / Emerald fire-glow animations, Washi glass cards |
| **HTML5** | Semantic Altar Structure | Responsive single-page application with dual views (Desktop Sanctuary Command Center + Mobile Phone Simulator) |

---

## 🌟 Overview & Problem Statement

During severe winter smog episodes, urban centers experience acute **temperature inversions** where cold ground air traps vehicular exhaust, industrial fumes, and biomass smoke within tens of meters of the surface. Standard weather apps simply display an AQI number without actionable, lifestyle-tailored guidance.

**Urban Air Quality Assistant ("Aura")** empowers families and communities with:
1. **Dynamic Low-Emission Daily Routines**: Tailored hourly schedules avoiding peak thermal inversion hours and heavy traffic corridors.
2. **Indoor Air Quality Hacks & Blueprints**: Step-by-step DIY Corsi-Rosenthal boxes ($45 vs $400 commercial HEPA units), solar-thermal flash ventilation protocols, and NASA bio-filtration.
3. **Quantifiable Direct Impact Calculator**: Translating everyday choices into **kg of CO₂ avoided**, **grams of PM2.5 tailpipe emissions spared**, and **equivalent cigarettes avoided** using scientific aerosol models.
4. **Vulnerable Household Profiles**: Specialized safeguards for infants, toddlers, elderly family members, asthmatics, and household pets.
5. **Interactive Dual Experience**:
   - **Phone Simulator Mode**: Faithfully reproduces the mobile UI from Challenge 06.
   - **Full Desktop Dashboard Mode**: Complete command center with 24-hour diurnal inversion charts, live chat, routine configurators, and community watch boards.

---

## 🏗️ Architecture

```
promptwars/
├── app.py                 # Flask server with REST API endpoints
├── ai_engine.py           # GenAI Assistant (Gemini API, Groq, or built-in contextual LLM engine)
├── data/
│   └── cities.json        # Winter smog database (Delhi NCR, Lahore, Salt Lake City, Beijing, Milan, etc.)
├── static/
│   ├── css/
│   │   └── style.css      # Styling, phone mockup frame, animations
│   └── js/
│       ├── app.js         # Main UI orchestration, charts, city dynamics
│       ├── ai_chat.js     # GenAI Chat assistant with speech recognition & markdown
│       └── impact.js      # Impact calculator & transit mode evaluator
├── templates/
│   └── index.html         # Responsive single-page application with dual views
├── tests/
│   └── test_api.py        # Automated test suite (100% pass)
└── run.sh                 # Quick launch script
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.9+ with Flask (already installed)

### 1. Run the Assistant
```bash
python3 app.py
```
Or execute the quick start script:
```bash
chmod +x run.sh && ./run.sh
```

### 2. Open in Browser
Open `http://127.0.0.1:5000` in your web browser.

---

## 🧪 Running Automated Tests

Run the test suite verifying all 8 endpoints and reasoning logic:
```bash
python3 -m unittest tests/test_api.py
```

---

## 💡 Key Features & Capabilities

### 1. GenAI Conversational Specialist ("Aura")
- **Multi-Persona Context Awareness**: Adjusts recommendations based on active profile checkboxes (`Infants/Kids`, `Elderly`, `Asthma`, `Pets`).
- **Flexible AI Integration**: Works out-of-the-box using the built-in domain expert reasoning engine, or connects live to Google Gemini 2.5 Flash via optional API Key.
- **Voice-Enabled**: Speech-to-text input via Web Speech API and spoken responses.

### 2. Diurnal Smog & Thermal Inversion Chart
- Identifies the critical **Morning Inversion Layer** (6:00 AM - 10:30 AM) when pollutants are trapped.
- Pinpoints the **Solar Flash Ventilation Window** (1:30 PM - 3:30 PM) when ground heating breaks the inversion.

### 3. Indoor Air Quality Hacks Library
- **DIY Corsi-Rosenthal Box**: 4 MERV-13 filters + box fan delivering 450+ CADR at $45.
- **Solar Ventilation Timing**: Prevents carbon dioxide accumulation (>1200 ppm) while blocking soot.
- **Kitchen Combustion Control**: Eliminates indoor NO₂ and formaldehyde hotspots.
- **NASA Bio-Filters**: Pet-safe plant recommendations (Snake Plant, Spider Plant).

### 4. Direct Impact Math
- **Community CO₂ Avoided**: $total\_km \times 0.170 \times (1 - factor)$
- **PM2.5 Tailpipe Avoided**: $total\_km \times 0.04 \times (1 - factor)$
- **Cigarette Equivalence**: Based on Berkeley Earth rule of thumb ($22 \mu g/m^3$ of PM2.5 = 1 cigarette/day).

---

## 📸 Alignment with Challenge 06 Prompt

| Challenge Requirement | Implementation |
| :--- | :--- |
| **GenAI-powered assistant** | Aura Conversational Agent with context, custom presets, and voice support |
| **Help families & communities** | Vulnerable household toggles + Community Smog Watch & violation reporting |
| **Severe winter smog & pollution** | Real-time thermal inversion index, diurnal forecasting, and safe window guidance |
| **Low-emission daily routines** | Dynamic routine builder based on transit mode, work hours, and commute distance |
| **Indoor air quality hacks** | Interactive blueprints (Corsi-Rosenthal box, ventilation timing, bio-filters) |
| **Sustainable alternatives & direct impact** | Real-time impact calculator (CO₂ saved, PM2.5 spared, cigarettes avoided) |
| **Visual aesthetics** | Faithfully reproduces the Challenge 06 phone mockup + expands to dashboard |
