"""
Urban Air Quality Assistant - Backend Flask Application
Serves interactive UI and provides GenAI-powered REST API endpoints
for winter smog guidance, daily routines, indoor air hacks, and impact metrics.
"""

import os
import json
import logging
from flask import Flask, render_template, request, jsonify
from ai_engine import query_assistant, calculate_impact_metrics, built_in_expert_reasoner, generate_expert_routine

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("UrbanAirQualityApp")

app = Flask(__name__, static_folder="static", template_folder="templates")

# Load cities & hacks data
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "cities.json")
with open(DATA_FILE, "r", encoding="utf-8") as f:
    DATABASE = json.load(f)

# In-memory community reports storage (with seed community data)
COMMUNITY_REPORTS = [
    {
        "id": "rep-1",
        "city": "Delhi NCR",
        "neighborhood": "Rohini Sector 16",
        "type": "Open Biomass Burning",
        "details": "Dry leaves and plastic waste being burned near the community park.",
        "status": "Reported to Civic Authorities",
        "timestamp": "18 mins ago",
        "upvotes": 14
    },
    {
        "id": "rep-2",
        "city": "Delhi NCR",
        "neighborhood": "Dwarka Expressway",
        "type": "Uncovered Construction Dust",
        "details": "High PM10 plume due to uncovered demolition debris on active corridor.",
        "status": "Inspection Queued",
        "timestamp": "42 mins ago",
        "upvotes": 29
    },
    {
        "id": "rep-3",
        "city": "Lahore",
        "neighborhood": "Gulberg III",
        "type": "Diesel Generator Idling",
        "details": "Continuous thick black exhaust from heavy commercial generator.",
        "status": "Green Squad Alerted",
        "timestamp": "1 hr ago",
        "upvotes": 8
    },
    {
        "id": "rep-4",
        "city": "Salt Lake City",
        "neighborhood": "Sugar House",
        "type": "Residential Wood Smoke",
        "details": "Wood stove operating during mandatory Red Air Day burning ban.",
        "status": "Notice Dispatched",
        "timestamp": "3 hrs ago",
        "upvotes": 12
    }
]


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.route("/")
def index():
    """Serves the main application page."""
    return render_template("index.html")


@app.route("/api/health")
def health():
    """Healthcheck endpoint."""
    return jsonify({
        "status": "healthy",
        "version": "1.0.0",
        "cities_count": len(DATABASE.get("cities", []))
    })


@app.route("/api/cities")
def get_cities():
    """Returns available cities with summarized AQI."""
    cities_summary = [
        {
            "id": c["id"],
            "name": c["name"],
            "country": c["country"],
            "continent": c.get("continent", "Global"),
            "aqi": c["aqi"],
            "category": c["category"],
            "primary_pollutant": c["primary_pollutant"]
        }
        for c in DATABASE.get("cities", [])
    ]
    return jsonify({"cities": cities_summary})


@app.route("/api/aqi")
def get_city_aqi():
    """Get detailed AQI and winter smog dynamics for a specific city."""
    city_id = request.args.get("city", "delhi").lower().strip()
    
    # Match city
    found = None
    for c in DATABASE.get("cities", []):
        if c["id"].lower() == city_id or c["name"].lower() == city_id:
            found = c
            break
            
    if not found:
        # Default fallback to first city (Delhi)
        found = DATABASE["cities"][0]
        
    return jsonify(found)


@app.route("/api/hacks")
def get_indoor_hacks():
    """Returns curated indoor air quality hacks."""
    return jsonify({"hacks": DATABASE.get("hacks", [])})


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    GenAI chat endpoint:
    Accepts user prompt and current contextual profile.
    """
    data = request.get_json(force=True, silent=True) or {}
    prompt = data.get("prompt", "").strip()
    if not prompt:
        return jsonify({"error": "Prompt cannot be empty"}), 400

    context = data.get("context", {})
    user_api_key = data.get("api_key")
    
    # Enrich context if minimal
    if not context.get("city"):
        context["city"] = "Delhi NCR"
    if not context.get("aqi"):
        context["aqi"] = 348
    if not context.get("category"):
        context["category"] = "Hazardous"
        
    result = query_assistant(prompt, context, user_api_key=user_api_key)
    return jsonify(result)


@app.route("/api/routine", methods=["POST"])
def generate_routine():
    """Generates an optimized low-emission daily routine based on lifestyle."""
    data = request.get_json(force=True, silent=True) or {}
    city = data.get("city", "Delhi NCR")
    aqi = int(data.get("aqi", 312))
    profile = data.get("profile", {})
    commute = data.get("commute", {
        "mode": "metro",
        "distance_km": 14.0,
        "work_schedule": "hybrid"
    })
    
    routine_text = generate_expert_routine(city, aqi, profile, commute)
    impact = calculate_impact_metrics(
        aqi=aqi,
        commute_km=float(commute.get("distance_km", 14.0)),
        transit_mode=commute.get("mode", "metro"),
        air_purifier_hours=int(data.get("purifier_hours", 8))
    )
    
    return jsonify({
        "routine": routine_text,
        "impact": impact
    })


@app.route("/api/impact", methods=["POST"])
def compute_impact():
    """Computes direct impact metrics for user's lifestyle choices."""
    data = request.get_json(force=True, silent=True) or {}
    aqi = int(data.get("aqi", 312))
    commute_km = float(data.get("commute_km", 12.0))
    transit_mode = data.get("transit_mode", "metro")
    carpool_count = int(data.get("carpool_count", 2))
    purifier_hours = int(data.get("purifier_hours", 8))
    
    metrics = calculate_impact_metrics(
        aqi=aqi,
        commute_km=commute_km,
        transit_mode=transit_mode,
        carpool_count=carpool_count,
        air_purifier_hours=purifier_hours
    )
    
    # Generate detailed narrative of impact
    narrative = (
        f"By using {transit_mode.replace('_', ' ').title()} over a solo vehicle for your {commute_km*2:.1f} km roundtrip "
        f"and running a HEPA air cleaner for {purifier_hours} hours, you successfully avoided {metrics['co2_saved_kg']} kg of CO₂ "
        f"and {metrics['pm25_avoided_g']} g of tailpipe PM2.5 in your community. "
        f"This shields your lungs from the toxic particulate equivalent of {metrics['cigarettes_avoided']} cigarettes today!"
    )
    
    return jsonify({
        "metrics": metrics,
        "explanation": narrative
    })


@app.route("/api/community", methods=["GET"])
def get_community():
    """Returns community smog reports and initiatives."""
    city_filter = request.args.get("city")
    if city_filter:
        reports = [r for r in COMMUNITY_REPORTS if city_filter.lower() in r["city"].lower()]
    else:
        reports = COMMUNITY_REPORTS
    return jsonify({"reports": reports})


@app.route("/api/community/report", methods=["POST"])
def submit_community_report():
    """Allows community members to report local smog emission violations."""
    data = request.get_json(force=True, silent=True) or {}
    city = data.get("city", "Delhi NCR")
    neighborhood = data.get("neighborhood", "").strip()
    rep_type = data.get("type", "Open Biomass Burning")
    details = data.get("details", "").strip()
    
    if not neighborhood or not details:
        return jsonify({"error": "Neighborhood and details are required"}), 400
        
    new_report = {
        "id": f"rep-{len(COMMUNITY_REPORTS) + 1}",
        "city": city,
        "neighborhood": neighborhood,
        "type": rep_type,
        "details": details,
        "status": "Under Civic Review",
        "timestamp": "Just now",
        "upvotes": 1
    }
    COMMUNITY_REPORTS.insert(0, new_report)
    return jsonify({"success": True, "report": new_report})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Urban Air Quality Assistant on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)
