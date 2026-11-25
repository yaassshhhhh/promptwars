"""
Automated Test Suite for Urban Air Quality Assistant
Verifies all backend endpoints, calculations, and GenAI reasoning functionality.
"""

import unittest
import json
from app import app
from ai_engine import calculate_impact_metrics, built_in_expert_reasoner, generate_expert_routine

class TestUrbanAirQualityAssistant(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_health_endpoint(self):
        """Test healthcheck endpoint."""
        resp = self.app.get('/api/health')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertGreater(data["cities_count"], 0)

    def test_cities_endpoint(self):
        """Test cities list retrieval."""
        resp = self.app.get('/api/cities')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("cities", data)
        self.assertGreaterEqual(len(data["cities"]), 5)
        # Verify Delhi NCR exists
        names = [c["name"] for c in data["cities"]]
        self.assertIn("Delhi NCR", names)

    def test_city_aqi_endpoint(self):
        """Test city detailed AQI retrieval."""
        resp = self.app.get('/api/aqi?city=delhi')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["name"], "Delhi NCR")
        self.assertIn("aqi", data)
        self.assertIn("inversion_alert", data)
        self.assertIn("hourly_forecast", data)
        self.assertGreaterEqual(len(data["hourly_forecast"]), 8)

    def test_hacks_endpoint(self):
        """Test indoor hacks retrieval."""
        resp = self.app.get('/api/hacks')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("hacks", data)
        # Verify Corsi-Rosenthal box exists
        hack_ids = [h["id"] for h in data["hacks"]]
        self.assertIn("corsi-rosenthal", hack_ids)
        self.assertIn("inversion-ventilation", hack_ids)

    def test_chat_endpoint_reasoning(self):
        """Test GenAI chat endpoint with custom context."""
        payload = {
            "prompt": "How can I protect my 2-year-old infant during this smog spike?",
            "context": {
                "city": "Delhi NCR",
                "aqi": 348,
                "category": "Hazardous",
                "profile": {
                    "infants": True,
                    "asthma": True
                },
                "commute": {
                    "mode": "metro",
                    "distance_km": 15.0
                }
            }
        }
        resp = self.app.post('/api/chat', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("reply", data)
        self.assertIn("provider", data)
        self.assertIn("impact", data)
        self.assertIn("Infants", data["reply"])

    def test_routine_generation_endpoint(self):
        """Test low-emission routine generation."""
        payload = {
            "city": "Delhi NCR",
            "aqi": 348,
            "profile": {"asthma": True},
            "commute": {"mode": "metro", "distance_km": 12.0},
            "purifier_hours": 10
        }
        resp = self.app.post('/api/routine', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("routine", data)
        self.assertIn("impact", data)
        self.assertIn("Thermal Inversion", data["routine"])

    def test_impact_calculation(self):
        """Test direct impact mathematical metrics."""
        metrics = calculate_impact_metrics(
            aqi=350,
            commute_km=14.0,
            transit_mode="metro",
            air_purifier_hours=10
        )
        self.assertGreater(metrics["co2_saved_kg"], 0.0)
        self.assertGreater(metrics["pm25_avoided_g"], 0.0)
        self.assertGreater(metrics["cigarettes_avoided"], 0.0)
        self.assertGreater(metrics["health_risk_reduction_pct"], 50)

    def test_community_reports(self):
        """Test getting and creating community reports."""
        resp = self.app.get('/api/community')
        self.assertEqual(resp.status_code, 200)
        initial_count = len(resp.get_json()["reports"])

        post_data = {
            "city": "Delhi NCR",
            "neighborhood": "Pitampura Block C",
            "type": "Open Biomass Burning",
            "details": "Leaf burning observed in park alley."
        }
        post_resp = self.app.post('/api/community/report', data=json.dumps(post_data), content_type='application/json')
        self.assertEqual(post_resp.status_code, 200)
        self.assertTrue(post_resp.get_json()["success"])

        # Check count increased
        resp2 = self.app.get('/api/community')
        self.assertEqual(len(resp2.get_json()["reports"]), initial_count + 1)

if __name__ == "__main__":
    unittest.main()
