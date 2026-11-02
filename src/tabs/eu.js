// Tab 2 — Global Disinformation / EUvsDisinfo (REQUIREMENTS §5 Tab 2)
import { CONFIG, SOURCES } from '../config.js';
import { filterEU, countBy, ranked, monthAxis, series, yearCompare } from '../data.js';
import { C, fade, fmt, draw, hbar, line, stacked } from '../charts.js';
import { setKpi, emptyState, table, esc, pickCell } from '../ui.js';

const CLS_TH = { disinformation: 'disinformation', trustworthy: 'trustworthy' };
const CLS_COLOR = { disinformation: C.v, trustworthy: C.grey };
const LANG_TH = { Arabic: 'อาหรับ', Russian: 'รัสเซีย', Spanish: 'สเปน', English: 'อังกฤษ', German: 'เยอรมัน', French: 'ฝรั่งเศส', Ukrainian: 'ยูเครน', Italian: 'อิตาลี', Georgian: 'จอร์เจีย', Armenian: 'อาร์เมเนีย', Polish: 'โปแลนด์', Czech: 'เช็ก', Hungarian: 'ฮังการี', Lithuanian: 'ลิทัวเนีย', Latvian: 'ลัตเวีย', Estonian: 'เอสโตเนีย', Bulgarian: 'บัลแกเรีย', Romanian: 'โรมาเนีย', Slovak: 'สโลวัก', Serbian: 'เซอร์เบีย', Belarusian: 'เบลารุส', Azerbaijani: 'อาเซอร์ไบจาน', Finnish: 'ฟินแลนด์', Swedish: 'สวีเดน', Dutch: 'ดัตช์', Portuguese: 'โปรตุเกส' };
const langTh = (l) => (LANG_TH[l] ? `${LANG_TH[l]} (${l})` : l);
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : 'ไม่มีข้อมูล');

export const EU_FILTER_LABELS = {
  keyword: ['คำสำคัญ', (v) => v],
  language: ['ภาษา', langTh],
  domain: ['โดเมน', (v) => v],
  cls: ['ประเภทบทความ', (v) => v],
};

export function euInsights(eu, f) {
  const { debunks, articles } = filterEU(eu, f);
  if (!debunks.length) return ['ไม่มีเรื่องตรวจสอบตามตัวกรองที่เลือก จึงยังสรุปข้อค้นพบไม่ได้'];
  const out = [];
  const kw = f.local.eu.keyword;
  if (kw) {
    const base = filterEU(eu, f, 'keyword').debunks.length;
    out.push(`เรื่องที่มีคำสำคัญ "${kw}" มี ${fmt(debunks.length)} เรื่อง หรือ ${pct(debunks.length, base)} ของเรื่องตรวจสอบในตัวกรองอื่นเดียวกัน`);
  } else {
    const top = ranked(countBy(debunks, (d) => d.keywords))[0];
    if (top) out.push(`คำสำคัญที่พบบ่อยที่สุดคือ "${top[0]}" ใน ${fmt(top[1])} จาก ${fmt(debunks.length)} เรื่อง (${pct(top[1], debunks.length)})`);
  }
  const cmp = yearCompare((y) => filterEU(eu, { ...f, year: y }).debunks.length, f);
  if (cmp) {
    const ch = cmp.va ? Math.round(((cmp.vb - cmp.va) / cmp.va) * 100) : null;
    out.push(`เทียบช่วงเดือนเดียวกัน: ปี ${cmp.a} มี ${fmt(cmp.va)} เรื่อง ปี ${cmp.b} มี ${fmt(cmp.vb)} เรื่อง${ch === null ? '' : ` (${ch > 0 ? '+' : ''}${ch}%)`}`);
  } else {
    out.push('ปี 2020 เป็นปีแรกของช่วงศึกษา จึงไม่มีปีก่อนหน้าให้เทียบ');
  }
  if (articles.length) {
    const [lang, ln] = ranked(countBy(articles, (a) => a.language))[0];
    const [dom, dn] = ranked(countBy(articles, (a) => a.domain))[0];
    out.push(`บทความที่เชื่อมโยงเป็นภาษา${langTh(lang)} มากที่สุด ${pct(ln, articles.length)} และโดเมน ${dom} มากที่สุด ${pct(dn, articles.length)} ของ ${fmt(articles.length)} ความสัมพันธ์บทความ`);
  }
  return out;
}

export function renderEU(root, data, f, act) {
  const eu = data.eu;
  const l = f.local.eu;
  const { debunks, articles } = filterEU(eu, f);

  setKpi('eu-k1', debunks.length);
  setKpi('eu-k2', articles.filter((a) => a.cls === 'disinformation').length);
  setKpi('eu-k3', new Set(articles.map((a) => a.language).filter((x) => x !== 'ไม่ระบุ')).size);
  root.querySelector('[data-kpi="eu-k2"]').classList.toggle('sel', l.cls === 'disinformation');
  root.querySelector('#eu-insights').innerHTML = euInsights(eu, f).map((t) => `<li>${esc(t)}</li>`).join('');

  // E1 debunks per month
  const axis = monthAxis(f);
  if (!emptyState('eu-c1', debunks.length ? '' : 'ไม่พบเรื่องตรวจสอบตามตัวกรองที่เลือก')) {
    draw('eu-c1', line({
      axis, unit: 'เรื่อง', highlight: (ym) => f.month !== 'all' && Number(ym.slice(5)) === Number(f.month),
      datasets: [{ label: 'เรื่องตรวจสอบ', data: series(debunks, axis), color: C.v, fill: 'rgba(109,63,224,.10)' }],
      onPick: (ym) => act.time(ym),
    }));
  }

  // E2 top 10 keywords (distinct debunks)
  const exK = filterEU(eu, f, 'keyword').debunks;
  const kw = ranked(countBy(exK, (d) => d.keywords)).slice(0, 10);
  const noKw = exK.filter((d) => !d.keywords.length).length;
  root.querySelector('#eu-nokw').textContent = noKw ? ` · ${fmt(noKw)} เรื่องไม่มีคำสำคัญ (ไม่ระบุ) ไม่ถูกนับในกราฟนี้` : '';
  if (!emptyState('eu-c2', kw.length ? '' : 'ไม่พบคำสำคัญตามตัวกรองที่เลือก')) {
    draw('eu-c2', hbar({
      labels: kw.map(([k]) => k), values: kw.map(([, n]) => n), unit: 'เรื่อง', thickness: 15,
      colors: kw.map(([k], i) => (l.keyword && l.keyword !== k ? fade(C.v) : i === 0 ? C.hot : C.v)),
      onPick: (i) => act.local('keyword', kw[i][0]),
    }));
  }

  // E3: topic mapping not approved -> article classes by year (association level)
  const years = f.year === 'all' ? CONFIG.period.years : [f.year];
  const exC = filterEU(eu, f, 'cls').articles;
  const classes = ['disinformation', 'trustworthy'];
  if (!emptyState('eu-c3', exC.length ? '' : 'ไม่พบบทความตามตัวกรองที่เลือก')) {
    draw('eu-c3', stacked({
      labels: years, unit: 'ความสัมพันธ์บทความ',
      datasets: classes.map((c) => ({ label: CLS_TH[c], data: years.map((y) => exC.filter((a) => a.year === y && a.cls === c).length), backgroundColor: !l.cls || l.cls === c ? CLS_COLOR[c] : fade(CLS_COLOR[c]) })),
      onPick: (_i, di) => act.local('cls', classes[di]),
    }));
  }

  // E4 languages, E5 domains (article associations)
  const lang = ranked(countBy(filterEU(eu, f, 'language').articles, (a) => a.language)).slice(0, 10);
  if (!emptyState('eu-c4', lang.length ? '' : 'ไม่พบบทความตามตัวกรองที่เลือก')) {
    draw('eu-c4', hbar({
      labels: lang.map(([x]) => langTh(x)), values: lang.map(([, n]) => n), unit: 'ความสัมพันธ์บทความ', thickness: 15,
      colors: lang.map(([x], i) => (l.language && l.language !== x ? fade(C.v) : i === 0 ? C.hot : C.v)),
      onPick: (i) => act.local('language', lang[i][0]),
    }));
  }
  const dom = ranked(countBy(filterEU(eu, f, 'domain').articles, (a) => a.domain)).slice(0, 10);
  if (!emptyState('eu-c5', dom.length ? '' : 'ไม่พบบทความตามตัวกรองที่เลือก')) {
    draw('eu-c5', hbar({
      labels: dom.map(([x]) => x), values: dom.map(([, n]) => n), unit: 'ความสัมพันธ์บทความ', thickness: 15,
      colors: dom.map(([x], i) => (l.domain && l.domain !== x ? fade(C.lav) : i === 0 ? C.hot : C.lav)),
      onPick: (i) => act.local('domain', dom[i][0]),
    }));
  }

  table(root.querySelector('#eu-table'), {
    rows: articles, state: act.tableState('eu'), onChange: act.rerender,
    provenance: [`แหล่ง: ${SOURCES.eu}`, `ช่วง: ${act.periodText()}`, `ตัวกรอง: ${act.filterText()}`, 'หน่วย: ความสัมพันธ์ (debunk_id, article_id, article_class)'],
    columns: [
      { key: 'date', label: 'วันที่', width: '10%' },
      { key: 'debunkId', label: 'debunk ID', width: '10%', render: (r) => `<span title="${esc(r.debunkId)}">${esc(r.debunkId.slice(0, 8))}…</span>` },
      { key: 'keywordsText', label: 'คำสำคัญ', width: '28%', render: (r) => (eu.debById.get(r.debunkId)?.keywords || []).map((k) => pickCell('keyword', k)).join(' ') || 'ไม่ระบุ' },
      { key: 'cls', label: 'ประเภทบทความ', width: '12%', render: (r) => pickCell('cls', r.cls, r.cls, `c-${r.cls}`) },
      { key: 'language', label: 'ภาษา', width: '12%', render: (r) => pickCell('language', r.language, langTh(r.language)) },
      { key: 'domain', label: 'โดเมน', width: '18%', render: (r) => pickCell('domain', r.domain) },
      { key: 'url', label: 'URL', width: '10%', render: (r) => (r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">เปิด ↗</a>` : 'N/A') },
    ],
  });
}

export const euTemplate = () => `
<div class="hero">
  <div class="hero-q"><p class="eyebrow">แท็บ 2 · GLOBAL DISINFORMATION · EUVSDISINFO</p><h2>เรื่องที่ EUvsDisinfo ตรวจสอบเปลี่ยนตามเวลาอย่างไร และคำสำคัญ ภาษา โดเมนใดปรากฏมาก?</h2>
    <p class="ins-h">Key Insights · คำนวณจากตัวกรองปัจจุบัน</p><ul class="insights" id="eu-insights" aria-live="polite"></ul></div>
  <div class="kpis">
    <button type="button" class="kpi big" data-kpi="eu-k1" data-act="clear-tab" title="ล้างตัวกรองของแท็บนี้"><span class="kl">เรื่องที่ถูกตรวจสอบ</span><span class="kv" id="eu-k1">0</span><span class="kd">distinct debunk_id</span></button>
    <button type="button" class="kpi" data-kpi="eu-k2" data-pick-dim="cls" data-pick-val="disinformation" title="กรองเฉพาะบทความ disinformation"><span class="kl"><i class="sw" style="background:${C.v}"></i>บทความ class disinformation</span><span class="kv" id="eu-k2">0</span><span class="kd">ความสัมพันธ์บทความ ไม่ใช่ข่าวปลอมทั้งหมด</span></button>
    <div class="kpi"><span class="kl">จำนวนภาษา</span><span class="kv" id="eu-k3">0</span><span class="kd">ในบทความที่ผ่านตัวกรอง</span></div>
  </div>
</div>
<div class="grid">
  <article class="card s8"><h3>แนวโน้มจำนวนเรื่องตรวจสอบรายเดือน</h3><p class="sub">คลิกจุดเพื่อเลือกเดือนนั้น (ใช้ร่วมทุกแท็บ)</p>
    <div class="cv"><canvas id="eu-c1" role="img" aria-label="กราฟเส้นจำนวนเรื่องตรวจสอบรายเดือน"></canvas></div>
    <p class="src">ที่มา: ${SOURCES.eu} · <span class="period"></span> · หน่วย: เรื่อง (distinct debunk_id)</p></article>
  <article class="card s4"><h3>Top 10 คำสำคัญ</h3><p class="sub">คลิกแท่งเพื่อกรอง</p>
    <div class="cv tall"><canvas id="eu-c2" role="img" aria-label="กราฟแท่ง 10 คำสำคัญ"></canvas></div>
    <p class="src">ที่มา: ${SOURCES.eu} · <span class="period"></span> · หน่วย: เรื่อง (1 เรื่องมีได้หลายคำ)<span id="eu-nokw"></span></p></article>
  <article class="card s4"><h3>ประเภทบทความที่เชื่อมโยงแยกปี</h3><p class="sub"><span class="badge">กราฟสำรอง</span> ยังไม่มี topic mapping ที่ตรวจแล้ว จึงแสดง article class แทน</p>
    <div class="lg"><button type="button" class="lgb" data-pick-dim="cls" data-pick-val="disinformation"><i class="sq" style="background:${C.v}"></i>disinformation</button><button type="button" class="lgb" data-pick-dim="cls" data-pick-val="trustworthy"><i class="sq" style="background:${C.grey}"></i>trustworthy</button></div>
    <div class="cv"><canvas id="eu-c3" role="img" aria-label="กราฟแท่งซ้อนประเภทบทความแยกปี"></canvas></div>
    <p class="src">ที่มา: ${SOURCES.eu} · <span class="period"></span> · หน่วย: ความสัมพันธ์บทความ · class เป็นป้ายระดับบทความ ไม่ใช่คำตัดสินของเรื่อง</p></article>
  <article class="card s4"><h3>Top 10 ภาษา</h3><p class="sub">คลิกแท่งเพื่อกรอง</p>
    <div class="cv tall"><canvas id="eu-c4" role="img" aria-label="กราฟแท่ง 10 ภาษา"></canvas></div>
    <p class="src">ที่มา: ${SOURCES.eu} · <span class="period"></span> · หน่วย: ความสัมพันธ์บทความ</p></article>
  <article class="card s4"><h3>Top 10 โดเมนที่เผยแพร่</h3><p class="sub">คลิกแท่งเพื่อกรอง</p>
    <div class="cv tall"><canvas id="eu-c5" role="img" aria-label="กราฟแท่ง 10 โดเมน"></canvas></div>
    <p class="src">ที่มา: ${SOURCES.eu} · <span class="period"></span> · หน่วย: ความสัมพันธ์บทความ</p></article>
  <article class="card s12"><h3>รายละเอียดเรื่องตรวจสอบและบทความ</h3><p class="sub">1 แถว = 1 ความสัมพันธ์ระหว่างเรื่องกับบทความ · คลิกคำสำคัญ ประเภท ภาษา หรือโดเมนเพื่อกรอง</p>
    <div id="eu-table"></div>
    <p class="src">ที่มา: ${SOURCES.eu} · URL ของบทความต้นทาง</p></article>
  <details class="card s12 limits"><summary>ข้อจำกัดของแท็บนี้</summary><ul>
    <li>EUvsDisinfo มีขอบเขตเฉพาะของแหล่งนี้ ไม่ใช่ตัวแทนข่าวปลอมทั่วโลก</li>
    <li>1 เรื่องตรวจสอบเชื่อมได้หลายบทความ และบทความมีได้ทั้ง class disinformation และ trustworthy</li>
    <li>ภาษาหรือโดเมนที่พบมากไม่ใช่การกล่าวหาผู้ใช้ภาษานั้นหรือทุกเนื้อหาในโดเมนนั้น</li>
    <li>คำสำคัญแยกด้วยเครื่องหมายจุลภาค ตัดช่องว่าง และรวมตัวพิมพ์เล็ก/ใหญ่เป็นคำเดียว</li></ul></details>
</div>`;
