# ⛩️ AEROVA • Urban Air Quality AI (Kaze)
### Google PromptWars • Challenge 06: Winter Smog & Urban Air Defense

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://promptwars-livid-sigma.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub_Repo-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yaassshhhhh/promptwars)
[![Python](https://img.shields.io/badge/Python_3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask_Backend-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_2.5_Flash-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technencies/gemini/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Test Suite](https://img.shields.io/badge/Tests-10%2F10_Passing-10b981?style=for-the-badge&logo=pytest&logoColor=white)](https://github.com/yaassshhhhh/promptwars)

> **A next-generation autonomous GenAI platform engineered for severe winter smog, diurnal thermal inversions, and hazardous particulate spikes.**  
> Delivering context-grounded safety verdicts, low-emission routine optimization, open-source indoor filtration hacks, and scientifically quantified health/climate impact.

---

## 🏆 PromptWars Challenge 06 Alignment Matrix

| Evaluation Criteria | PromptWars Requirement | AEROVA Implementation |
| :--- | :--- | :--- |
| **GenAI Reasoning & Intelligence** | Context-grounded AI guidance without hallucination | **Kaze AI**: Vertex AI / Gemini 2.5 Flash + Kaze Expert Rule Engine. Enforces **Direct Yes/No safety verdicts** (e.g. morning walk during inversion = *"Direct Answer: NO — Strictly Avoid"*). |
| **Winter Smog & Thermal Inversions** | Specialized seasonal pollution dynamics | **Diurnal Inversion Curve**: 24h trajectory identifying ground inversion traps (6:00–10:30 AM) vs solar clean ventilation windows. |
| **Vulnerable Household Profiles** | Pediatric, senior, and respiratory defense | **Dynamic Safeguards**: Active toggles (`Infants & Children`, `Seniors 65+`, `Asthma`, `Household Pets`) sync directly into Kaze's advice and welcome greetings. |
| **Low-Emission Routines** | Shift transit habits and daily schedules | **Schedule Configurator**: Tailored plans for Metro Rail, Carpooling, EV, WFH, and Solo transit with commute distance inputs. |
| **Indoor Clean Air Hacks** | Field-tested low-cost DIY engineering | **Verified Blueprints**: $45 Corsi-Rosenthal Box (450+ CADR), Flash-Ventilation solar protocols, Zero-Flame cooking shields, and NASA bio-filtration. |
| **Quantified Direct Impact** | Mathematical proof of personal & civic savings | **Single Unified Formula**: Dynamic Health Risk Reduction (20%–92%), CO₂ saved, PM2.5 tailpipe avoided, and 1 kg CO₂ = ~118 smartphone charges. |
| **Civic Community Watch** | Crowdsourced local reporting & verification | **Hyperlocal Incident Board**: Live incident reporting (biomass burning, construction dust) with interactive upvoting and localStorage persistence. |
| **Dual Interface & Accessibility** | Mobile app fidelity + desktop power | **Dual Experience**: Phone simulator reproduction + Full Sanctuary Command Center with Web Speech API voice interaction. |

---

## 🔬 How AEROVA Works: 3-Step Clean Air Pipeline

```
┌─────────────────────────────────┐      ┌───────────────────────────────────┐      ┌─────────────────────────────────┐
│  01. Sensor Telemetry Ingestion │ ───► │  02. Vertex AI / Gemini Reasoner │ ───► │ 03. Personalized Plan & Impact  │
│  - CPCB / OpenAQ Live Feed      │      │  - Gemini 2.5 Flash (Cloud API)   │      │  - Hourly Low-Emission Routine  │
│  - 42 Global Smog Capitals      │      │  - Kaze Rule Engine (Zero Latency)│      │  - $45 DIY Corsi-Rosenthal Box  │
│  - Diurnal Inversion Tracking   │      │  - Direct Yes/No Safety Verdicts  │      │  - Quantified CO2 & Lung Sparing│
└─────────────────────────────────┘      └───────────────────────────────────┘      └─────────────────────────────────┘
```

1. **Step 01: Sensor & Diurnal Telemetry Ingestion**:
   Continuous real-time telemetry from Central Pollution Control Board (CPCB) and OpenAQ ground stations. Tracks fine particulate spikes ($PM_{2.5}, PM_{10}, NO_2$) alongside atmospheric thermal boundary layers.
2. **Step 02: Context-Grounded GenAI Reasoning Engine**:
   Powered by Google Cloud Vertex AI & Gemini 2.5 Flash (with zero-latency Kaze Expert Rule Engine fallback). Ingests hyper-local AQI, active household vulnerability flags (elderly, asthma, infants), and travel patterns to synthesize verifiable verdicts.
3. **Step 03: Personalized Defense & Mathematical Impact**:
   Synthesizes low-emission daily schedules, DIY Corsi-Rosenthal box blueprints, and verifies mathematically quantified health savings: CO₂ spared (~118 smartphone charges/kg), PM2.5 tailpipe avoided, and cigarette-inhalation equivalence.

---

## 📊 Scientific Calculation Methodology

AEROVA uses verified aerosol and greenhouse gas emission equivalencies:

* **Community CO₂ Avoided**:
  $$\text{CO}_2 \text{ Saved (kg)} = \text{Roundtrip Commute (km)} \times 0.170 \times (1.0 - \text{mode\_factor})$$
  *(Solo petrol baseline: ~170g CO₂/km; Metro factor: 0.15; Carpool: 0.40; EV: 0.25; WFH: 0.00)*
* **Smartphone Charges Equivalence**:
  $$\text{Smartphone Charges} = \text{round}(\text{CO}_2 \text{ Saved (kg)} \times 118)$$
  *(EPA GHG equivalency: ~8.22g CO₂ per standard smartphone full charge)*
* **Health Risk Reduction % (Dynamic Scaling)**:
  $$\text{Risk Reduction \%} = \min(92, \max(20, 22 + \min(46, \text{Purifier Hours} \times 4.2) + \text{Transit Boost}))$$
* **Cigarette Toxicity Equivalence**:
  Based on Berkeley Earth aerosol toxicity rule of thumb ($22\,\mu\text{g/m}^3$ of $PM_{2.5}$ continuous exposure $\approx$ 1 cigarette/day).

---

## 💻 Tech Stack & Architecture

| Layer | Technologies | Description |
| :--- | :--- | :--- |
| **Compute & Backend** | Python 3.9+, Flask, WSGI | Lightweight asynchronous microservice with REST controllers (`/api/aqi`, `/api/chat`, `/api/routine`, `/api/impact`, `/api/community`) |
| **GenAI Intelligence** | Gemini 2.5 Flash, Google Cloud Vertex AI | Context-grounded LLM reasoning with Secret Manager backend key injection |
| **Rule & Safety Engine** | Kaze High-Precision Domain Reasoner | Zero-latency fallback enforcing diurnal thermal physics and direct verdicts |
| **Frontend & UI** | Tailwind CSS, HTML5, Vanilla ES6+ | Living Samurai 3D animated background, Washi glassmorphism, responsive ~855px layout |
| **Visualizations** | Chart.js | 24-hour diurnal smog curve tracking morning inversion layers vs solar clean windows |
| **Audio & Speech** | Web Speech API, HTML5 Audio | Speech-to-text recognition with visual pulse state, studio Japanese sanctuary music player |
| **Testing** | Python `unittest` | 10/10 automated tests covering all APIs, calculations, and safety verdicts |

---

## 📁 Repository Structure

```
promptwars/
├── app.py                 # Flask application with REST API endpoints & CORS
├── ai_engine.py           # Kaze GenAI Reasoning Engine & mathematical impact calculator
├── data/
│   └── cities.json        # 42-city database (Delhi, Pune, Solapur, Tokyo, Lahore, Salt Lake City, etc.)
├── static/
│   ├── audio/             # Japanese sanctuary tracks (Spiral Theme, Spiritual Zen, Uzumaki)
│   ├── css/
│   │   └── style.css      # Custom styling, shrine roofs, kanamono corners, animations
│   ├── images/            # Samurai backdrop & visual assets
│   ├── js/
│   │   ├── app.js         # Telemetry loading, refresh, upvoting, modal controller
│   │   ├── ai_chat.js     # Kaze AI conversation manager, Web Speech API, context pill sync
│   │   ├── impact.js      # Impact calculator, mode selector, dynamic metric updates
│   │   └── sakura_particles.js # Canvas particle engine
│   └── videos/
│       └── background.mp4 # Living animated background video
├── templates/
│   └── index.html         # Responsive dashboard + mobile phone simulator + hackathon footer
├── tests/
│   └── test_api.py        # Automated test suite (10/10 passing)
├── requirements.txt       # Python dependencies (flask, requests)
├── vercel.json            # Vercel serverless deployment config
└── README.md              # Complete project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.9+
- pip

### 1. Installation
```bash
git clone https://github.com/yaassshhhhh/promptwars.git
cd promptwars
pip install -r requirements.txt
```

### 2. Environment Setup (Optional)
To use live Google Cloud Vertex AI / Gemini 2.5 Flash:
```bash
export GEMINI_API_KEY="your-api-key-here"
```
*(If no API key is provided, the built-in Kaze Expert Rule Engine operates seamlessly with zero latency.)*

### 3. Run Locally
```bash
python3 app.py
```
Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

### 4. Run Automated Test Suite
```bash
python3 -m unittest tests/test_api.py
```
```
..........
----------------------------------------------------------------------
Ran 10 tests in 0.004s

OK
```

---

## 👥 Submission Information

* **Project Name**: AEROVA • Urban Air Quality AI
* **Challenge**: Google PromptWars • Challenge 06 (Winter Smog & Urban Air Defense)
* **Live Deployment**: [https://promptwars-livid-sigma.vercel.app](https://promptwars-livid-sigma.vercel.app)
* **GitHub Repository**: [https://github.com/yaassshhhhh/promptwars](https://github.com/yaassshhhhh/promptwars)
* **Data Sources**: Central Pollution Control Board (CPCB), OpenAQ Global Telemetry, World Air Quality Index (WAQI).
* **Medical Disclaimer**: AEROVA provides environmental guidance and exposure defense engineering. Not medical advice — consult healthcare professionals for acute respiratory distress.
