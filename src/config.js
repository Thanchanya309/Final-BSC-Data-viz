// Central settings. Change the gates here once the team has reviewed a mapping.
export const CONFIG = {
  period: { start: '2020-01', end: '2022-12', years: ['2020', '2021', '2022'] },
  files: {
    ai: 'Data/ai_incidents_clean.csv',
    euDebunks: 'Data/euvsdisinfo_debunks_clean.csv',
    euArticles: 'Data/euvsdisinfo_articles_clean.csv',
    th: 'Data/thai_afnc_verdicts_clean.csv',
    report: 'Data/cleaning_report.json',
    aiHarmedMapping: 'mappings/ai_harmed_mapping_draft.csv',
  },
  // HANDOFF 2.1 / DATA-09, DATA-10: charts that depend on a grouping stay on
  // their fallback until the team marks the mapping as reviewed.
  gates: {
    aiHarmedMappingApproved: false,
    euTopicMappingApproved: false,
  },
  pageSize: 8,
};

export const SOURCES = {
  ai: 'AI Incident Database (Responsible AI Collaborative) · 3 risk subdomains',
  eu: 'EUvsDisinfo (Leite et al., 2024)',
  th: 'ศูนย์ต่อต้านข่าวปลอม (AFNC)',
};

export const AI_GROUPS = {
  misinformation: 'ข้อมูลเท็จ',
  disinformation_influence: 'บิดเบือน / ชี้นำ',
  fraud_scams: 'หลอกลวง / ฉ้อโกง',
};

export const AI_SUBDOMAIN_TH = {
  'False or misleading information': 'ข้อมูลเท็จหรือชวนเข้าใจผิด',
  'Disinformation, surveillance, and influence at scale': 'บิดเบือน สอดแนม และชี้นำวงกว้าง',
  'Fraud, scams, and targeted manipulation': 'ฉ้อโกง หลอกลวง และชักจูงเฉพาะเป้าหมาย',
};

export const VERDICTS = [
  { key: 'Fake', th: 'ข่าวปลอม' },
  { key: 'Distorted', th: 'ข่าวบิดเบือน' },
  { key: 'True', th: 'ข่าวจริง' },
];

// Thai small multiples (BRD T4): source category names, shown in Thai.
export const TH_FOCUS = [
  { en: 'Finance & stocks', th: 'การเงิน-หุ้น' },
  { en: 'Health products', th: 'ผลิตภัณฑ์สุขภาพ' },
  { en: 'Government policy & news', th: 'นโยบายรัฐบาล-ข่าวสาร' },
];

export const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
