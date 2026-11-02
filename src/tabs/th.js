// Tab 3 — Thai Fake News / AFNC (REQUIREMENTS §5 Tab 3)
import { CONFIG, SOURCES, VERDICTS, TH_FOCUS } from '../config.js';
import { filterTH, countBy, ranked, monthAxis, series, yearCompare } from '../data.js';
import { C, fade, fmt, draw, hbar, line, stacked } from '../charts.js';
import { setKpi, emptyState, table, esc, pickCell } from '../ui.js';

const VERDICT_COLOR = { Fake: C.v, Distorted: C.hot, True: C.grey };
const verdictTh = (k) => VERDICTS.find((v) => v.key === k)?.th || k;
const FOCUS_COLOR = [C.hot, C.v, '#3F7BE0'];

export const TH_FILTER_LABELS = {
  verdict: ['ผลตรวจสอบ', verdictTh],
  category: ['หมวดข่าว', (v) => v],
};

/** Fake-only charts cannot show a non-Fake verdict filter: say so instead of ignoring it. */
const fakeOnlyBlocked = (l) => (l.verdict && l.verdict !== 'Fake'
  ? `กราฟนี้นับเฉพาะข่าวปลอม (Fake) แต่ตัวกรองผลตรวจสอบคือ "${verdictTh(l.verdict)}" จึงไม่มีข้อมูลที่ตรงกัน` : '');

export function thInsights(rows, f) {
  const now = filterTH(rows, f);
  if (!now.length) return ['ไม่มีโพสต์ที่มีผลตรวจสอบตามตัวกรองที่เลือก'];
  const out = [];
  // Insights describe Fake posts unless the user picked another verdict.
  const v = f.local.th.verdict || 'Fake';
  const name = verdictTh(v);
  const sel = now.filter((r) => r.verdict === v);
  if (sel.length) {
    const [cat, n] = ranked(countBy(sel, (r) => r.category))[0];
    out.push(`หมวดที่มี${name}มากที่สุดคือ ${cat} ${fmt(n)} จาก ${fmt(sel.length)} โพสต์ (${Math.round((n / sel.length) * 100)}%)`);
  } else {
    out.push(`ไม่มีโพสต์ผลตรวจสอบ "${name}" ในตัวกรองนี้`);
  }
  const countIn = (y, cat) => filterTH(rows, { ...f, year: y, local: { th: { ...f.local.th, category: cat ?? f.local.th.category } } })
    .filter((r) => r.verdict === v).length;
  const cmp = yearCompare((y) => countIn(y), f);
  if (cmp) out.push(`${name}ช่วงเดือนเดียวกัน: ปี ${cmp.a} มี ${fmt(cmp.va)} โพสต์ ปี ${cmp.b} มี ${fmt(cmp.vb)} โพสต์`);
  else out.push('ปี 2020 เป็นปีแรกของช่วงศึกษา จึงไม่มีปีก่อนหน้าให้เทียบ');
  const fin = yearCompare((y) => countIn(y, TH_FOCUS[0].th), f);
  const hea = yearCompare((y) => countIn(y, TH_FOCUS[1].th), f);
  if (fin && hea && !f.local.th.category && (fin.va || fin.vb || hea.va || hea.vb)) {
    const ratio = (c) => (c.va ? `${(c.vb / c.va).toFixed(1)} เท่า` : 'เริ่มจาก 0');
    out.push(`${name}หมวดการเงิน-หุ้น ปี ${fin.a} → ${fin.b}: ${fmt(fin.va)} → ${fmt(fin.vb)} (${ratio(fin)}) เทียบกับผลิตภัณฑ์สุขภาพ ${fmt(hea.va)} → ${fmt(hea.vb)} (${ratio(hea)})`);
  }
  return out;
}

export function renderTH(root, data, f, act) {
  const all = data.th;
  const l = f.local.th;
  const ui = act.ui();
  const rows = filterTH(all, f);
  const n = (v) => rows.filter((r) => r.verdict === v).length;
  const total = n('Fake') + n('Distorted') + n('True');

  setKpi('th-k1', rows.length);
  setKpi('th-k2', n('Fake'));
  setKpi('th-k3', total ? ((n('Fake') + n('Distorted')) / total) * 100 : null, { suffix: '%', dec: 1 });
  root.querySelector('[data-kpi="th-k2"]').classList.toggle('sel', l.verdict === 'Fake');
  root.querySelector('#th-insights').innerHTML = thInsights(all, f).map((t) => `<li>${esc(t)}</li>`).join('');

  // T1 Fake per month
  const axis = monthAxis(f);
  const hl = (ym) => f.month !== 'all' && Number(ym.slice(5)) === Number(f.month);
  const fakeBase = filterTH(all, f, 'verdict').filter((r) => r.verdict === 'Fake');
  const blocked = fakeOnlyBlocked(l);
  if (!emptyState('th-c1', blocked || (fakeBase.length ? '' : 'ไม่พบข่าวปลอมตามตัวกรองที่เลือก'))) {
    draw('th-c1', line({
      axis, unit: 'โพสต์', highlight: hl,
      datasets: [{ label: 'ข่าวปลอม', data: series(fakeBase, axis), color: C.v, fill: 'rgba(109,63,224,.10)' }],
      onPick: (ym) => act.time(ym),
    }));
  }

  // T2 verdicts by year, Count / 100%
  const years = f.year === 'all' ? CONFIG.period.years : [f.year];
  const exV = filterTH(all, f, 'verdict');
  const per = years.map((y) => { const yr = exV.filter((r) => r.year === y); return Object.fromEntries(VERDICTS.map((v) => [v.key, yr.filter((r) => r.verdict === v.key).length])); });
  const yTot = per.map((p) => p.Fake + p.Distorted + p.True);
  root.querySelectorAll('[data-th-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.thMode === ui.mode)));
  if (!emptyState('th-c2', yTot.some(Boolean) ? '' : 'ไม่พบโพสต์ตามตัวกรองที่เลือก')) {
    draw('th-c2', stacked({
      labels: years, unit: 'โพสต์', percent: ui.mode === 'pct',
      datasets: VERDICTS.map((v) => ({
        label: v.th,
        data: per.map((p, i) => (ui.mode === 'pct' ? (yTot[i] ? (p[v.key] / yTot[i]) * 100 : 0) : p[v.key])),
        backgroundColor: !l.verdict || l.verdict === v.key ? VERDICT_COLOR[v.key] : fade(VERDICT_COLOR[v.key]),
      })),
      onPick: (_i, di) => act.local('verdict', VERDICTS[di].key),
    }));
  }
  root.querySelector('#th-c2-unit').textContent = ui.mode === 'pct' ? 'ร้อยละของโพสต์ที่มีผลตรวจสอบในปีนั้น' : 'โพสต์ (distinct post_id)';

  // T3 Fake by category, Top 5 / All
  const catBase = filterTH(all, f, 'category').filter((r) => r.verdict === 'Fake');
  const cats = ranked(countBy(catBase, (r) => r.category));
  const shownCats = ui.top === 'top5' ? cats.slice(0, 5) : cats;
  root.querySelectorAll('[data-th-top]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.thTop === ui.top)));
  if (!emptyState('th-c3', blocked || (cats.length ? '' : 'ไม่พบข่าวปลอมตามตัวกรองที่เลือก'))) {
    draw('th-c3', hbar({
      labels: shownCats.map(([c]) => c), values: shownCats.map(([, v]) => v), unit: 'โพสต์', thickness: ui.top === 'top5' ? 22 : 15,
      colors: shownCats.map(([c]) => (l.category && l.category !== c ? fade(C.v) : c === TH_FOCUS[0].th ? C.hot : C.v)),
      onPick: (i) => act.local('category', shownCats[i][0]),
    }));
  }

  // T4 small multiples, shared Y scale
  const smBase = filterTH(all, f, 'category').filter((r) => r.verdict === 'Fake');
  const sm = TH_FOCUS.map((c) => series(smBase.filter((r) => r.category === c.th), axis));
  const yMax = Math.max(1, ...sm.flat());
  const note = root.querySelector('#th-sm-note');
  note.textContent = l.category && !TH_FOCUS.some((c) => c.th === l.category)
    ? `หมวดที่เลือก (${l.category}) ไม่อยู่ใน 3 หมวดนี้ · แสดง 3 หมวดไว้เพื่อเปรียบเทียบ` : '';
  TH_FOCUS.forEach((c, i) => {
    const id = `th-sm${i}`;
    root.querySelector(`[data-sm="${i}"]`).classList.toggle('sel', l.category === c.th);
    root.querySelector(`[data-sm="${i}"] .smv`).textContent = fmt(sm[i].reduce((a, b) => a + b, 0));
    if (!emptyState(id, blocked)) {
      draw(id, line({
        axis, unit: 'โพสต์', yMax, compact: true, highlight: hl,
        datasets: [{ label: c.th, data: sm[i], color: !l.category || l.category === c.th || !TH_FOCUS.some((x) => x.th === l.category) ? FOCUS_COLOR[i] : fade(FOCUS_COLOR[i]), width: 2.2 }],
        onPick: (ym) => act.time(ym),
      }));
    }
  });

  table(root.querySelector('#th-table'), {
    rows, state: act.tableState('th'), onChange: act.rerender,
    provenance: [`แหล่ง: ${SOURCES.th}`, `ช่วง: ${act.periodText()}`, `ตัวกรอง: ${act.filterText()}`, 'หน่วย: โพสต์ที่มีผลตรวจสอบ (distinct post_id)'],
    columns: [
      { key: 'date', label: 'วันที่', width: '10%' },
      { key: 'title', label: 'หัวข้อข่าว', width: '42%' },
      { key: 'category', label: 'หมวด', width: '15%', render: (r) => pickCell('category', r.category) },
      { key: 'verdict', label: 'ผลตรวจสอบ', width: '11%', render: (r) => pickCell('verdict', r.verdict, verdictTh(r.verdict), `v-${r.verdict}`), text: (r) => verdictTh(r.verdict) },
      { key: 'agency', label: 'หน่วยงานตรวจสอบ', width: '14%', render: (r) => esc(r.agency || 'ไม่ระบุ') },
      { key: 'url', label: 'URL', width: '8%', render: (r) => (r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">เปิด ↗</a>` : 'N/A') },
    ],
  });
}

export const thTemplate = () => `
<div class="hero">
  <div class="hero-q"><p class="eyebrow">แท็บ 3 · THAI FAKE NEWS · AFNC</p><h2>ผลการตรวจสอบข่าวไทยเปลี่ยนอย่างไร หมวดข่าวปลอมใดเด่น และการเงินต่างจากสุขภาพและนโยบายรัฐอย่างไร?</h2>
    <ul class="insights" id="th-insights" aria-live="polite"></ul></div>
  <div class="kpis">
    <button type="button" class="kpi big" data-kpi="th-k1" data-act="clear-tab" title="ล้างตัวกรองของแท็บนี้"><span class="kl">โพสต์ที่มีผลตรวจสอบ</span><span class="kv" id="th-k1">0</span><span class="kd">distinct post_id</span></button>
    <button type="button" class="kpi" data-kpi="th-k2" data-pick-dim="verdict" data-pick-val="Fake" title="กรองเฉพาะข่าวปลอม"><span class="kl"><i class="sw" style="background:${C.v}"></i>ข่าวปลอม (Fake)</span><span class="kv" id="th-k2">0</span><span class="kd">distinct post_id</span></button>
    <div class="kpi"><span class="kl">ปลอม + บิดเบือน</span><span class="kv" id="th-k3">0</span><span class="kd">ของโพสต์ที่มีผลตรวจสอบ</span></div>
  </div>
</div>
<div class="grid">
  <article class="card s8"><h3>แนวโน้มข่าวปลอมรายเดือน</h3><p class="sub">นับเฉพาะผลตรวจสอบ Fake · คลิกจุดเพื่อเลือกเดือนนั้น (ใช้ร่วมทุกแท็บ)</p>
    <div class="cv"><canvas id="th-c1" role="img" aria-label="กราฟเส้นข่าวปลอมรายเดือน"></canvas></div>
    <p class="src">ที่มา: ${SOURCES.th} · <span class="period"></span> · หน่วย: โพสต์ Fake (subset ของโพสต์ที่มีผลตรวจสอบ)</p></article>
  <article class="card s4"><div class="ch"><h3>ผลการตรวจสอบจำแนกตามปี</h3>
      <div class="seg" role="group" aria-label="หน่วยของกราฟ"><button type="button" data-th-mode="count">จำนวน</button><button type="button" data-th-mode="pct">100%</button></div></div>
    <p class="sub">คลิกส่วนของแท่งเพื่อกรองผลตรวจสอบ</p>
    <div class="lg">${VERDICTS.map((v) => `<button type="button" class="lgb" data-pick-dim="verdict" data-pick-val="${v.key}"><i class="sq" style="background:${VERDICT_COLOR[v.key]}"></i>${v.th}</button>`).join('')}</div>
    <div class="cv"><canvas id="th-c2" role="img" aria-label="กราฟแท่งซ้อนผลตรวจสอบแยกปี"></canvas></div>
    <p class="src">ที่มา: ${SOURCES.th} · <span class="period"></span> · หน่วย: <span id="th-c2-unit"></span></p></article>
  <article class="card s5"><div class="ch"><h3>อันดับหมวดข่าวปลอม</h3>
      <div class="seg" role="group" aria-label="จำนวนหมวดที่แสดง"><button type="button" data-th-top="top5">Top 5</button><button type="button" data-th-top="all">ทั้งหมด</button></div></div>
    <p class="sub">คลิกแท่งเพื่อกรองหมวด (ไม่บังคับผลตรวจสอบ Fake กับทั้งแท็บ)</p>
    <div class="cv tall"><canvas id="th-c3" role="img" aria-label="กราฟแท่งอันดับหมวดข่าวปลอม"></canvas></div>
    <p class="src">ที่มา: ${SOURCES.th} · <span class="period"></span> · หน่วย: โพสต์ Fake</p></article>
  <article class="card s7"><h3>การเงิน สุขภาพ และนโยบายรัฐ</h3><p class="sub">Small multiples ใช้แกน Y เดียวกัน · คลิกชื่อหมวดเพื่อกรอง · คลิกจุดเพื่อเลือกเดือน</p>
    <p class="note" id="th-sm-note"></p>
    <div class="sm">${TH_FOCUS.map((c, i) => `<div class="smc" data-sm="${i}"><button type="button" class="smh" data-pick-dim="category" data-pick-val="${c.th}"><i class="sw" style="background:${FOCUS_COLOR[i]}"></i>${c.th}<span class="smv"></span></button>
      <div class="cv mini"><canvas id="th-sm${i}" role="img" aria-label="กราฟเส้นข่าวปลอมหมวด${c.th}"></canvas></div></div>`).join('')}</div>
    <p class="src">ที่มา: ${SOURCES.th} · <span class="period"></span> · หน่วย: โพสต์ Fake ต่อเดือน · ตัวเลขข้างชื่อ = รวมในช่วงที่เลือก</p></article>
  <article class="card s12"><h3>รายละเอียดโพสต์ที่มีผลตรวจสอบ</h3><p class="sub">ค้นหา เรียง แบ่งหน้า · คลิกหมวดหรือผลตรวจสอบเพื่อกรอง</p>
    <div id="th-table"></div>
    <p class="src">ที่มา: ${SOURCES.th} · URL ของโพสต์ต้นทาง</p></article>
  <details class="card s12 limits"><summary>ข้อจำกัดของแท็บนี้</summary><ul>
    <li>ตัวเลขคือโพสต์ที่ AFNC มีผลตรวจสอบ ไม่ใช่จำนวนข่าวปลอมทั้งหมดในไทย และไม่ใช่จำนวนผู้หลงเชื่อหรือผู้เสียหาย</li>
    <li>"การเงิน" คือหมวดข่าวที่ถูกตรวจสอบ ไม่ใช่มูลค่าความเสียหาย</li>
    <li>ไม่มีข้อมูลคดีหลอกลวง (ACSC) ในช่วงปี 2020–2022 จึงไม่ได้ใช้</li></ul></details>
</div>`;
