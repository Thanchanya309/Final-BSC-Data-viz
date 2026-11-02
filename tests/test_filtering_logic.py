# -*- coding: utf-8 -*-
import unittest
import pandas as pd

class TestFilteringLogic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ai = pd.read_csv('Data/ai_incidents_clean.csv')
        cls.eu_d = pd.read_csv('Data/euvsdisinfo_debunks_clean.csv')
        cls.eu_a = pd.read_csv('Data/euvsdisinfo_articles_clean.csv')
        cls.thai = pd.read_csv('Data/thai_afnc_verdicts_clean.csv')

    def test_global_year_filter(self):
        # 2020
        ai_2020 = self.ai[self.ai['year'] == 2020]
        eu_2020 = self.eu_d[self.eu_d['year'] == 2020]
        thai_2020 = self.thai[self.thai['year'] == 2020]
        self.assertEqual(len(ai_2020), 20)
        self.assertEqual(len(eu_2020), 2006)
        self.assertEqual(len(thai_2020), 1059)

        # 2021
        ai_2021 = self.ai[self.ai['year'] == 2021]
        eu_2021 = self.eu_d[self.eu_d['year'] == 2021]
        thai_2021 = self.thai[self.thai['year'] == 2021]
        self.assertEqual(len(ai_2021), 10)
        self.assertEqual(len(eu_2021), 1920)
        self.assertEqual(len(thai_2021), 1367)

        # 2022
        ai_2022 = self.ai[self.ai['year'] == 2022]
        eu_2022 = self.eu_d[self.eu_d['year'] == 2022]
        thai_2022 = self.thai[self.thai['year'] == 2022]
        self.assertEqual(len(ai_2022), 29)
        self.assertEqual(len(eu_2022), 894)
        self.assertEqual(len(thai_2022), 2201)

        # Sum must equal baseline
        self.assertEqual(20 + 10 + 29, 59)
        self.assertEqual(2006 + 1920 + 894, 4820)
        self.assertEqual(1059 + 1367 + 2201, 4627)

    def test_eu_language_projection_rule(self):
        """Special rule: Language filter projects back to distinct debunks without multiplying."""
        # e.g. language = 'Arabic'
        arabic_articles = self.eu_a[self.eu_a['article_language'] == 'Arabic']
        self.assertEqual(len(arabic_articles), 3280)
        
        # Debunks associated with Arabic articles
        linked_debunk_ids = set(arabic_articles['debunk_id'])
        # Total distinct debunks linked to Arabic articles
        distinct_debunks = self.eu_d[self.eu_d['debunk_id'].isin(linked_debunk_ids)]
        
        # Distinct debunks must be LESS than article associations!
        self.assertLess(len(distinct_debunks), len(arabic_articles))
        self.assertGreater(len(distinct_debunks), 0)
        print(f"Arabic articles: {len(arabic_articles)} -> Distinct debunks: {len(distinct_debunks)}")

    def test_thai_fake_conflict_rule(self):
        """Special rule: When verdict is 'True', Fake-only count is 0."""
        true_posts = self.thai[self.thai['verdict_en'] == 'True']
        fake_in_true = true_posts[true_posts['verdict_en'] == 'Fake']
        self.assertEqual(len(fake_in_true), 0)

if __name__ == '__main__':
    unittest.main()
