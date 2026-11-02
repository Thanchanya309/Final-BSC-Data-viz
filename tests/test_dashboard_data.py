# -*- coding: utf-8 -*-
"""
Automated Data and Logic Validation Suite for Digital Disinformation & AI Risk Dashboard
Verifies data contracts, baseline counts, date constraints, and aggregation formulas.
"""

import unittest
import pandas as pd
import json

class TestDashboardData(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ai = pd.read_csv('Data/ai_incidents_clean.csv')
        cls.eu_d = pd.read_csv('Data/euvsdisinfo_debunks_clean.csv')
        cls.eu_a = pd.read_csv('Data/euvsdisinfo_articles_clean.csv')
        cls.thai = pd.read_csv('Data/thai_afnc_verdicts_clean.csv')

    def test_baseline_counts(self):
        """UAT-01: Verify all 4 cleaned datasets match expected baseline record counts."""
        self.assertEqual(len(self.ai), 59, "AI Incident Database count must be exactly 59")
        self.assertEqual(self.ai['incident_id'].nunique(), 59, "AI incident_id must be unique")

        self.assertEqual(len(self.eu_d), 4820, "EU Debunks count must be exactly 4,820")
        self.assertEqual(self.eu_d['debunk_id'].nunique(), 4820, "EU debunk_id must be unique")

        self.assertEqual(len(self.eu_a), 12186, "EU Article Associations count must be exactly 12,186")
        self.assertEqual(self.eu_a['debunk_id'].nunique(), 4820, "EU Articles must reference all 4,820 debunks")

        self.assertEqual(len(self.thai), 4627, "Thai AFNC count must be exactly 4,627")
        self.assertEqual(self.thai['post_id'].nunique(), 4627, "Thai post_id must be unique")

    def test_date_range(self):
        """DATA-06: All records must be strictly between 2020-01-01 and 2022-12-31."""
        for name, df, col in [('AI', self.ai, 'event_date'), ('EU Debunks', self.eu_d, 'event_date'),
                              ('EU Articles', self.eu_a, 'event_date'), ('Thai AFNC', self.thai, 'event_date')]:
            min_date = df[col].min()
            max_date = df[col].max()
            self.assertGreaterEqual(min_date, '2020-01-01', f"{name} min date {min_date} is before 2020-01-01")
            self.assertLessEqual(max_date, '2022-12-31', f"{name} max date {max_date} is after 2022-12-31")
            years = set(df['year'].unique())
            self.assertTrue(years.issubset({2020, 2021, 2022}), f"{name} contains invalid years {years}")

    def test_ai_risk_subdomains(self):
        """AI-K1..K3: Scope must be restricted to 3 risk subdomains."""
        allowed_subdomains = {
            'False or misleading information',
            'Disinformation, surveillance, and influence at scale',
            'Fraud, scams, and targeted manipulation'
        }
        actual_subdomains = set(self.ai['risk_subdomain'].unique())
        self.assertEqual(actual_subdomains, allowed_subdomains, "AI risk subdomains do not match scope")

        # Check topic group counts
        counts = self.ai['topic_group'].value_counts().to_dict()
        self.assertEqual(counts.get('fraud_scams', 0), 26)
        self.assertEqual(counts.get('misinformation', 0), 18)
        self.assertEqual(counts.get('disinformation_influence', 0), 15)
        self.assertEqual(18 + 15, 33, "Misinformation + Disinformation must sum to 33")

    def test_eu_articles_class_counts(self):
        """EU-K2: Check article classes counts."""
        class_counts = self.eu_a['article_class'].value_counts().to_dict()
        self.assertEqual(class_counts.get('disinformation', 0), 7361, "Disinformation article count mismatch")
        self.assertEqual(class_counts.get('trustworthy', 0), 4825, "Trustworthy article count mismatch")
        self.assertEqual(7361 + 4825, 12186)

    def test_thai_verdict_counts(self):
        """TH-K1..K3: Thai AFNC verdict distributions."""
        v_counts = self.thai['verdict_en'].value_counts().to_dict()
        self.assertEqual(v_counts.get('Fake', 0), 3066, "Fake posts count must be 3,066")
        self.assertEqual(v_counts.get('True', 0), 1071, "True posts count must be 1,071")
        self.assertEqual(v_counts.get('Distorted', 0), 490, "Distorted posts count must be 490")
        total = 3066 + 1071 + 490
        self.assertEqual(total, 4627)

        # Share percentage
        share = (3066 + 490) / 4627 * 100
        self.assertAlmostEqual(share, 76.853, places=2)
        self.assertEqual(f"{share:.1f}%", "76.9%")

    def test_thai_small_multiples_categories(self):
        """TH-C4: Small Multiples 3 categories verification."""
        fakes = self.thai[self.thai['verdict_en'] == 'Fake']
        
        # Finance & stocks
        fin = fakes[fakes['category_en'] == 'Finance & stocks']
        self.assertEqual(len(fin), 502)
        fin_years = fin['year'].value_counts().to_dict()
        self.assertEqual(fin_years.get(2020, 0), 24)
        self.assertEqual(fin_years.get(2021, 0), 97)
        self.assertEqual(fin_years.get(2022, 0), 381)

        # Health products
        health = fakes[fakes['category_en'] == 'Health products']
        self.assertEqual(len(health), 1527)
        health_years = health['year'].value_counts().to_dict()
        self.assertEqual(health_years.get(2020, 0), 450)
        self.assertEqual(health_years.get(2021, 0), 420)
        self.assertEqual(health_years.get(2022, 0), 657)

        # Government policy & news
        gov = fakes[fakes['category_en'] == 'Government policy & news']
        self.assertEqual(len(gov), 668)
        gov_years = gov['year'].value_counts().to_dict()
        self.assertEqual(gov_years.get(2020, 0), 165)
        self.assertEqual(gov_years.get(2021, 0), 172)
        self.assertEqual(gov_years.get(2022, 0), 331)

if __name__ == '__main__':
    unittest.main()
