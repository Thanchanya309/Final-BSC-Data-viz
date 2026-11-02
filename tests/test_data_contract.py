# -*- coding: utf-8 -*-
"""
test_data_contract.py - Reconciliation and Data Contract Tests
Validates baseline counts, date spans, unique IDs, and data integrity.
"""

import unittest
import pandas as pd
import json

class TestDataContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ai = pd.read_csv('Data/ai_incidents_clean.csv')
        cls.eu_debunks = pd.read_csv('Data/euvsdisinfo_debunks_clean.csv')
        cls.eu_articles = pd.read_csv('Data/euvsdisinfo_articles_clean.csv')
        cls.thai = pd.read_csv('Data/thai_afnc_verdicts_clean.csv')
        with open('Data/cleaning_report.json', 'r', encoding='utf-8') as f:
            cls.report = json.load(f)

    def test_reconciliation_baselines(self):
        # AI baseline: exactly 59 distinct incident_ids
        self.assertEqual(len(self.ai), 59)
        self.assertEqual(self.ai['incident_id'].nunique(), 59)
        self.assertEqual(self.report['AI_Incident']['selected_relevant_rows'], 59)

        # EU debunks baseline: exactly 4,820 distinct debunk_ids
        self.assertEqual(len(self.eu_debunks), 4820)
        self.assertEqual(self.eu_debunks['debunk_id'].nunique(), 4820)
        self.assertEqual(self.report['EUvsDisinfo']['unique_debunk_ids'], 4820)

        # EU articles baseline: exactly 12,186 associations
        self.assertEqual(len(self.eu_articles), 12186)
        self.assertEqual(self.report['EUvsDisinfo']['clean_article_rows'], 12186)

        # Thai AFNC baseline: exactly 4,627 distinct post_ids
        self.assertEqual(len(self.thai), 4627)
        self.assertEqual(self.thai['post_id'].nunique(), 4627)
        self.assertEqual(self.report['Thai_AFNC']['clean_verdict_rows'], 4627)

    def test_monthly_presence_calendar(self):
        # AI has 27 active months out of 36
        ai_months = self.ai['year_month'].nunique()
        self.assertEqual(ai_months, 27)
        self.assertEqual(self.report['coverage_months']['AI_filtered'], 27)

        # EU has debunks in all 36 months
        eu_months = self.eu_debunks['year_month'].nunique()
        self.assertEqual(eu_months, 36)
        self.assertEqual(self.report['coverage_months']['EU_debunks'], 36)

        # Thai has verdicts in all 36 months
        thai_months = self.thai['year_month'].nunique()
        self.assertEqual(thai_months, 36)
        self.assertEqual(self.report['coverage_months']['Thai_verdicts'], 36)

    def test_verdict_totals(self):
        # Fake + Distorted + True == 4627
        vc = self.thai['verdict_en'].value_counts()
        self.assertEqual(vc['Fake'], 3066)
        self.assertEqual(vc['True'], 1071)
        self.assertEqual(vc['Distorted'], 490)
        self.assertEqual(vc['Fake'] + vc['True'] + vc['Distorted'], 4627)

if __name__ == '__main__':
    unittest.main()
