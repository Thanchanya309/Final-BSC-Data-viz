// Loading, normalising and filtering. Pure functions only: no DOM access here,
// so the same logic is reused by the audit page.
import { CONFIG, AI_GROUPS } from './config.js';

const UNKNOWN = 'ไม่ระบุ';

function parseCsv(url) {
  return new Promise((resolve, reject) => {
    window.Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data),
      error: reject,
    });
  });
}

const clean = (v) => (v ?? '').toString().trim();
const ymOf = (r) => clean(r.year_month) || clean(r.event_date).slice(0, 7);

function timeFields(r) {
  const ym = ymOf(r);
  return { ym, year: ym.slice(0, 4), month: Number(ym.slice(5, 7)) };
}

// EU keyword rule (HANDOFF 2.1-1): split on commas, trim, merge case variants
// ("War crimes" / "war crimes") under the most frequent spelling.
function keywordTokens(text) {
  return [...new Set(clean(text).split(',').map((t) => t.trim()).filter(Boolean))];
}

export async function loadAll() {
  const [ai, deb, art, th, harmedMap, report] = await Promise.all([
    parseCsv(CONFIG.files.ai),
    parseCsv(CONFIG.files.euDebunks),
    parseCsv(CONFIG.files.euArticles),
    parseCsv(CONFIG.files.th),
    parseCsv(CONFIG.files.aiHarmedMapping).catch(() => []),
    fetch(CONFIG.files.report).then((r) => r.json()).catch(() => null),
  ]);

  const harmedOf = new Map(harmedMap.map((m) => [clean(m.incident_id), clean(m.harmed_group)]));
  const aiRows = ai.map((r) => ({
    id: clean(r.incident_id),
    date: clean(r.event_date),
    ...timeFields(r),
    group: clean(r.topic_group),
    groupTh: AI_GROUPS[clean(r.topic_group)] || clean(r.topic_group),
    subdomain: clean(r.risk_subdomain) || UNKNOWN,
    harmedText: clean(r.harmed) || UNKNOWN,
    harmedGroup: harmedOf.get(clean(r.incident_id)) || UNKNOWN,
    title: clean(r.title),
    description: clean(r.description),
    url: clean(r.incident_id) ? `https://incidentdatabase.ai/cite/${clean(r.incident_id)}/` : '',
  }));

  const spelling = new Map();
  const tally = new Map();
  for (const r of deb) for (const t of keywordTokens(r.keywords)) tally.set(t, (tally.get(t) || 0) + 1);
  for (const [t, n] of tally) {
    const k = t.toLowerCase();
    if (!spelling.has(k) || tally.get(spelling.get(k)) < n) spelling.set(k, t);
  }
  const canon = (t) => spelling.get(t.toLowerCase());

  const debRows = deb.map((r) => ({
    id: clean(r.debunk_id),
    date: clean(r.event_date),
    ...timeFields(r),
    keywordsText: clean(r.keywords),
    keywords: [...new Set(keywordTokens(r.keywords).map(canon))],
  }));
  const debById = new Map(debRows.map((d) => [d.id, d]));
  const artRows = art.map((r) => ({
    debunkId: clean(r.debunk_id),
    articleId: clean(r.article_id),
    date: clean(r.event_date),
    ...timeFields(r),
    keywordsText: clean(r.keywords),
    language: clean(r.article_language) || UNKNOWN,
    domain: clean(r.article_domain) || UNKNOWN,
    cls: clean(r.article_class) || UNKNOWN,
    url: clean(r.article_url),
  }));

  const thRows = th.map((r) => ({
    id: clean(r.post_id),
    date: clean(r.event_date),
    ...timeFields(r),
    verdict: clean(r.verdict_en),
    verdictTh: clean(r.verdict_th),
    category: clean(r.category_th) || UNKNOWN,
    categoryEn: clean(r.category_en),
    agency: clean(r.checked_by_agency),
    title: clean(r.title),
    url: clean(r.url),
  }));

  return { ai: aiRows, eu: { debunks: debRows, articles: artRows, debById }, th: thRows, report };
}

// ---------- filtering ----------

export function passTime(r, f) {
  return (f.year === 'all' || r.year === f.year) && (f.month === 'all' || r.month === Number(f.month));
}

/** 'info' is the KPI-2 shortcut: misinformation + disinformation_influence. */
export const matchGroup = (group, sel) => (sel === 'info' ? group !== 'fraud_scams' : group === sel);

/** AI incidents passing shared + local filters, optionally ignoring one local dimension. */
export function filterAI(rows, f, except) {
  const l = f.local.ai;
  return rows.filter((r) => passTime(r, f)
    && (except === 'group' || !l.group || matchGroup(r.group, l.group))
    && (except === 'subdomain' || !l.subdomain || r.subdomain === l.subdomain)
    && (except === 'harmed' || !l.harmed || r.harmedGroup === l.harmed));
}

/**
 * EU: keyword filter lives on debunks; language/domain/class live on article
 * associations. Article filters are projected back to distinct debunk_ids
 * (REQUIREMENTS Tab 2 key rule) so a debunk is never counted once per article.
 */
export function filterEU(eu, f, except) {
  const l = f.local.eu;
  const kwOk = (keywords) => except === 'keyword' || !l.keyword || keywords.includes(l.keyword);
  const debunks = eu.debunks.filter((d) => passTime(d, f) && kwOk(d.keywords));
  const debIds = new Set(debunks.map((d) => d.id));
  const articles = eu.articles.filter((a) => debIds.has(a.debunkId)
    && (except === 'language' || !l.language || a.language === l.language)
    && (except === 'domain' || !l.domain || a.domain === l.domain)
    && (except === 'cls' || !l.cls || a.cls === l.cls));
  const articleFilterOn = ['language', 'domain', 'cls'].some((k) => k !== except && l[k]);
  const finalDebunks = articleFilterOn
    ? (() => { const ids = new Set(articles.map((a) => a.debunkId)); return debunks.filter((d) => ids.has(d.id)); })()
    : debunks;
  return { debunks: finalDebunks, articles };
}

export function filterTH(rows, f, except) {
  const l = f.local.th;
  return rows.filter((r) => passTime(r, f)
    && (except === 'verdict' || !l.verdict || r.verdict === l.verdict)
    && (except === 'category' || !l.category || r.category === l.category));
}

// ---------- aggregation helpers ----------

export function countBy(rows, key) {
  const m = new Map();
  for (const r of rows) {
    const ks = Array.isArray(key(r)) ? key(r) : [key(r)];
    for (const k of ks) m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

export const ranked = (map) => [...map.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));

/** Months in the selected shared range: always a full calendar, zero-filled. */
export function monthAxis(f) {
  const years = f.year === 'all' ? CONFIG.period.years : [f.year];
  return years.flatMap((y) => Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`));
}

export function series(rows, axis) {
  const c = countBy(rows, (r) => r.ym);
  return axis.map((m) => c.get(m) || 0);
}

export const distinct = (rows, key) => new Set(rows.map(key)).size;

/**
 * Equal-length comparison for insights: counts per year under every filter
 * except the year itself, so the months compared always match.
 */
export function yearCompare(countForYear, f) {
  const ys = CONFIG.period.years;
  if (f.year === 'all') return { a: ys[0], b: ys[ys.length - 1], va: countForYear(ys[0]), vb: countForYear(ys[ys.length - 1]) };
  const i = ys.indexOf(f.year);
  if (i <= 0) return null;
  return { a: ys[i - 1], b: f.year, va: countForYear(ys[i - 1]), vb: countForYear(f.year) };
}
