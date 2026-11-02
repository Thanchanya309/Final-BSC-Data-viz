# -*- coding: utf-8 -*-
import sys
import io
import json
import pandas as pd

# Load 4 clean CSVs
ai = pd.read_csv('Data/ai_incidents_clean.csv')
eu_d = pd.read_csv('Data/euvsdisinfo_debunks_clean.csv')
eu_a = pd.read_csv('Data/euvsdisinfo_articles_clean.csv')
thai = pd.read_csv('Data/thai_afnc_verdicts_clean.csv')

# Verify baseline counts
assert len(ai) == 59 and ai['incident_id'].nunique() == 59, f"AI count mismatch: {len(ai)}"
assert len(eu_d) == 4820 and eu_d['debunk_id'].nunique() == 4820, f"EU debunks count mismatch: {len(eu_d)}"
assert len(eu_a) == 12186, f"EU articles count mismatch: {len(eu_a)}"
assert len(thai) == 4627 and thai['post_id'].nunique() == 4627, f"Thai count mismatch: {len(thai)}"

print("All baseline counts verified successfully!")

# Load draft harmed mapping if exists
draft_harmed_map = {}
try:
    draft_df = pd.read_csv('mappings/ai_harmed_mapping_draft.csv')
    for _, r in draft_df.iterrows():
        draft_harmed_map[int(r['incident_id'])] = str(r['harmed_group'])
except Exception as e:
    print("No draft harmed mapping found:", e)

# Format AI Incidents
ai_records = []
for _, r in ai.iterrows():
    inc_id = int(r['incident_id'])
    ai_records.append({
        'id': inc_id,
        'date': str(r['event_date']),
        'year': int(r['year']),
        'month': int(r['month']),
        'yearMonth': str(r['year_month']),
        'topicGroup': str(r['topic_group']),
        'riskDomain': str(r['risk_domain']),
        'riskSubdomain': str(r['risk_subdomain']),
        'title': str(r['title']) if pd.notna(r['title']) else '',
        'description': str(r['description']) if pd.notna(r['description']) else '',
        'harmed': str(r['harmed']) if pd.notna(r['harmed']) else '',
        'draftHarmedGroup': draft_harmed_map.get(inc_id, 'ไม่ระบุ'),
        'deployer': str(r['deployer']) if pd.notna(r['deployer']) else '',
        'developer': str(r['developer']) if pd.notna(r['developer']) else '',
        'url': f"https://incidentdatabase.ai/cite/{inc_id}"
    })

# Format EU Debunks
eu_debunk_records = []
for _, r in eu_d.iterrows():
    raw_kw = str(r['keywords']) if pd.notna(r['keywords']) and str(r['keywords']).strip() != '' and str(r['keywords']) != 'nan' else ''
    kw_tokens = [k.strip() for k in raw_kw.split(',') if k.strip()] if raw_kw else []
    eu_debunk_records.append({
        'id': str(r['debunk_id']),
        'date': str(r['event_date']),
        'year': int(r['year']),
        'month': int(r['month']),
        'yearMonth': str(r['year_month']),
        'keywords': raw_kw,
        'keywordsList': kw_tokens,
        'articleRows': int(r['article_rows']),
        'disinfoArticles': int(r['disinformation_articles']),
        'trustworthyArticles': int(r['trustworthy_articles'])
    })

# Format EU Articles
eu_article_records = []
for _, r in eu_a.iterrows():
    eu_article_records.append({
        'debunkId': str(r['debunk_id']),
        'articleId': str(r['article_id']),
        'date': str(r['event_date']),
        'year': int(r['year']),
        'month': int(r['month']),
        'yearMonth': str(r['year_month']),
        'publisher': str(r['article_publisher']) if pd.notna(r['article_publisher']) else 'Unknown',
        'domain': str(r['article_domain']) if pd.notna(r['article_domain']) else 'Unknown',
        'url': str(r['article_url']) if pd.notna(r['article_url']) else '',
        'language': str(r['article_language']) if pd.notna(r['article_language']) else 'Unknown',
        'articleClass': str(r['article_class']) if pd.notna(r['article_class']) else 'unknown'
    })

# Format Thai AFNC
thai_records = []
for _, r in thai.iterrows():
    thai_records.append({
        'id': int(r['post_id']),
        'date': str(r['event_date']),
        'year': int(r['year']),
        'month': int(r['month']),
        'yearMonth': str(r['year_month']),
        'verdictTh': str(r['verdict_th']),
        'verdictEn': str(r['verdict_en']),
        'categoryTh': str(r['category_th']),
        'categoryEn': str(r['category_en']),
        'title': str(r['title']) if pd.notna(r['title']) else '',
        'agency': str(r['checked_by_agency']) if pd.notna(r['checked_by_agency']) else 'ไม่ระบุ',
        'url': str(r['url']) if pd.notna(r['url']) else ''
    })

# Metadata and baselines
metadata = {
    'period': '2020-01-01 to 2022-12-31',
    'baselines': {
        'aiIncidents': len(ai_records),
        'euDebunks': len(eu_debunk_records),
        'euArticles': len(eu_article_records),
        'thaiVerdicts': len(thai_records)
    },
    'categoriesThai': [
        {'en': 'Health products', 'th': 'ผลิตภัณฑ์สุขภาพ'},
        {'en': 'Government policy & news', 'th': 'นโยบายรัฐบาล-ข่าวสาร'},
        {'en': 'Finance & stocks', 'th': 'การเงิน-หุ้น'},
        {'en': 'Disasters', 'th': 'ภัยพิบัติ'},
        {'en': 'Public order & security', 'th': 'ความสงบและความมั่นคง'},
        {'en': 'Other news', 'th': 'ข่าวอื่นๆ'},
        {'en': 'Economy', 'th': 'เศรษฐกิจ'}
    ],
    'verdictsThai': [
        {'en': 'Fake', 'th': 'ข่าวปลอม', 'color': '#e11d48'},
        {'en': 'Distorted', 'th': 'ข่าวบิดเบือน', 'color': '#d97706'},
        {'en': 'True', 'th': 'ข่าวจริง', 'color': '#059669'}
    ],
    'riskSubdomainsAI': [
        {'en': 'Fraud, scams, and targeted manipulation', 'group': 'fraud_scams', 'th': 'การหลอกลวง ฉ้อโกง และการชี้นำพฤติกรรมเป้าหมาย'},
        {'en': 'False or misleading information', 'group': 'misinformation', 'th': 'ข้อมูลเท็จหรือข้อมูลชวนให้เข้าใจผิด'},
        {'en': 'Disinformation, surveillance, and influence at scale', 'group': 'disinformation_influence', 'th': 'ข้อมูลบิดเบือน การสอดแนม และปฏิบัติการอิทธิพลเป็นวงกว้าง'}
    ]
}

data_store = {
    'metadata': metadata,
    'aiIncidents': ai_records,
    'euDebunks': eu_debunk_records,
    'euArticles': eu_article_records,
    'thaiVerdicts': thai_records
}

# Write js/data-store.js as UMD/global
output_path = 'js/data-store.js'
with io.open(output_path, 'w', encoding='utf-8') as f:
    f.write('// Auto-generated derived data store strictly preserved from Data/*.csv\n')
    f.write('// Baseline counts: AI=59, EU Debunks=4820, EU Articles=12186, Thai=4627\n')
    f.write('window.DATA_STORE = ')
    json.dump(data_store, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')

print(f"Data store successfully created at {output_path}!")
