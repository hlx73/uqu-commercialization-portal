import unittest
import os
import sys

# Add backend directory to Python path
sys.path.append(os.path.dirname(__file__))

from analyzer import run_local_fallback_analysis, find_similar_entities, get_wadi_makkah_track
from database import db

class TestUQUAnalyzer(unittest.TestCase):
    def setUp(self):
        # Ensure database is seeded before running tests
        self.projects = db.get_all_projects()
        
    def test_database_loaded(self):
        self.assertTrue(len(self.projects) > 0, "Database must be loaded and seeded.")
        print(f"Checked Database: Loaded {len(self.projects)} records.")

    def test_trl_track_mapping(self):
        self.assertEqual(get_wadi_makkah_track(1), "Masar Training Program (برنامج مسار التأهيلي)")
        self.assertEqual(get_wadi_makkah_track(3), "Nomow Incubator (حاضنة نمو)")
        self.assertEqual(get_wadi_makkah_track(5), "Wadi Makkah Accelerator (مسرعة وادي مكة)")
        self.assertEqual(get_wadi_makkah_track(8), "Wadi Makkah Ventures Fund (صندوق الاستثمار)")
        print("Checked TRL to Incubator Track mappings.")

    def test_crowd_sector_classifier(self):
        crowd_abstract = "This is a computer vision study for crowd movement and flow simulation in the Grand Mosque."
        analysis = run_local_fallback_analysis(crowd_abstract)
        self.assertEqual(analysis["sector"], "Hajj & Umrah Tech")
        self.assertIn("Ministry of Hajj and Umrah", analysis["customers_en"])
        print("Verified classification: Crowd management abstracts mapped to 'Hajj & Umrah Tech'.")

    def test_biotech_sector_classifier(self):
        health_abstract = "A new medical device for diabetic retinopathy screening and disease diagnosis using retinal photos."
        analysis = run_local_fallback_analysis(health_abstract)
        self.assertEqual(analysis["sector"], "HealthTech & Biotech")
        self.assertIn("Ministry of Health", analysis["customers_en"])
        print("Verified classification: Health abstracts mapped to 'HealthTech & Biotech'.")

    def test_startup_similarity_matcher(self):
        startups, challenges = find_similar_entities(
            "crowd flow optimization in holy sites", 
            "تحسين حركة الحشود في المشاعر المقدسة"
        )
        self.assertTrue(len(startups) > 0)
        self.assertTrue(len(challenges) > 0)
        print(f"Verified Similarity Matching. Match startups count: {len(startups)}, challenges count: {len(challenges)}")

if __name__ == "__main__":
    unittest.main()
