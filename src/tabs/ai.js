// Tab 1 — AI Risks (REQUIREMENTS §5 Tab 1)
import { CONFIG, AI_GROUPS, AI_SUBDOMAIN_TH, SOURCES } from '../config.js';
import { filterAI, countBy, ranked, monthAxis, series, yearCompare, matchGroup } from '../data.js';
import { C, fade, fmt, draw, hbar, line, stacked } from '../charts.js';
import { setKpi, emptyState, table, esc, pickCell } from '../ui.js';

const GROUP_COLOR = { misinformation: C.v, disinformation_influence: C.lav, fraud_scams: C.hot };
const subTh = (s) => AI_SUBDOMAIN_TH[s] || s;

export const AI_FILTER_LABELS = {
  group: ['กลุ่มความเสี่ยง', (v) => (v === 'info' ? 'ข้อมูลเท็จ + บิดเบือน' : AI_GROUPS[v])],
  subdomain: ['Risk subdomain', subTh],
  harmed: ['ผู้ได้รับผลกระทบ', (v) => v],
};

export function aiInsights(rows, f) {
  const now = filterAI(rows, f);
  if (!now.length) return ['ไม่มีเหตุการณ์ AI ที่เข้าเกณฑ์ตามตัวกรองที่เลือก'];
  const axis = monthAxis(f).filter((ym) => f.month === 'all' || Number(ym.slice(5)) === Number(f.month));
  const covered = new Set(now.map((r) => r.ym)).size;
  const out = [`มี ${fmt(now.length)} เหตุการณ์ที่เข้าเกณฑ์ โดยมีรายการใน ${covered} จาก ${axis.length} เดือนที่เลือก (เดือนที่ไม่มีรายการไม่ได้แปลว่าไม่มีเหตุการณ์จริง)`];
  const [topG, topN] = ranked(countBy(now, (r) => r.group))[0];
  out.push(`กลุ่มที่บันทึกมากที่สุดคือ ${AI_GROUPS[topG]} ${fmt(topN)} เหตุการณ์ (${Math.round((topN / now.length) * 100)}%)`);
  const cmp = yearCompare((y) => filterAI(rows, { ...f, year: y }).length, f);
  if (cmp) out.push(`เทียบช่วงเดือนเดียวกัน: ปี ${cmp.a} มี ${fmt(cmp.va)} เหตุการณ์ ปี ${cmp.b} มี ${fmt(cmp.vb)} เหตุการณ์`);
  else out.push('ปี 2020 เป็นปีแรกของช่วงศึกษา จึงไม่มีปีก่อนหน้าให้เทียบ');
  return out;
}

export function renderAI(root, data, f, act) {
  const all = data.ai;
  const l = f.local.ai;
  const rows = filterAI(all, f);

  // KPIs (AI-K1..K3)
  setKpi('ai-k1', rows.length);
  setKpi('ai-k2', rows.filter((r) => r.group !== 'fraud_scams').length);
  setKpi('ai-k3', rows.filter((r) => r.group === 'fraud_scams').length);
  root.querySelector('[data-kpi="ai-k2"]').classList.toggle('sel', l.group === 'info');
  root.querySelector('[data-kpi="ai-k3"]').classList.toggle('sel', l.group === 'fraud_scams');
  root.querySelector('#ai-insights').innerHTML = aiInsights(all, f).map((t) => `<li>${esc(t)}</li>`).join('');

  // A1 monthly line
  const axis = monthAxis(f);
  const isPicked = (ym) => f.month !== 'all' && Number(ym.slice(5)) === Number(f.month);
  if (!emptyState('ai-c1', rows.length ? '' : 'ไม่พบเหตุการณ์ตามตัวกรองที่เลือก')) {
    draw('ai-c1', line({
      axis, unit: 'เหตุการณ์', highlight: isPicked,
      datasets: [{ label: 'เหตุการณ์', data: series(rows, axis), color: C.v, fill: 'rgba(109,63,224,.10)', points: true }],
      onPick: (ym) => act.time(ym),
    }));
  }

  // A2 stacked year × topic_group (ignores its own group filter, highlights the selection)
  const exG = filterAI(all, f, 'group');
  const years = f.year === 'all' ? CONFIG.period.years : [f.year];
  const groups = Object.keys(AI_GROUPS);
  const groupOn = (g) => !l.group || matchGroup(g, l.group);
  if (!emptyState('ai-c2', exG.length ? '' : 'ไม่พบเหตุการณ์ตามตัวกรองที่เลือก')) {
    draw('ai-c2', stacked({
      labels: years, unit: 'เหตุการณ์',
      datasets: groups.map((g) => ({ label: AI_GROUPS[g], data: years.map((y) => exG.filter((r) => r.year === y && r.group === g).length), backgroundColor: groupOn(g) ? GROUP_COLOR[g] : fade(GROUP_COLOR[g]) })),
      onPick: (_i, di) => act.local('group', groups[di]),
    }));
  }

  // A3 ranked risk_subdomain
  const exS = ranked(countBy(filterAI(all, f, 'subdomain'), (r) => r.subdomain));
  if (!emptyState('ai-c3', exS.length ? '' : 'ไม่พบเหตุการณ์ตามตัวกรองที่เลือก')) {
    draw('ai-c3', hbar({
      labels: exS.map(([s]) => subTh(s)), values: exS.map(([, n]) => n), unit: 'เหตุการณ์', thickness: 26,
      colors: exS.map(([s]) => (!l.subdomain || l.subdomain === s ? C.v : fade(C.v))),
      onPick: (i) => act.local('subdomain', exS[i][0]),
    }));
  }

  // A4 harmed groups — chart only once the mapping is approved (DATA-10)
  const a4 = root.querySelector('#ai-a4');
  if (CONFIG.gates.aiHarmedMappingApproved) {
    if (!a4.querySelector('#ai-c4')) a4.innerHTML = '<div class="cv"><canvas id="ai-c4" role="img" aria-label="กราฟกลุ่มผู้ได้รับผลกระทบ"></canvas></div>';
    const exH = ranked(countBy(filterAI(all, f, 'harmed'), (r) => r.harmedGroup));
    draw('ai-c4', hbar({
      labels: exH.map(([g]) => g), values: exH.map(([, n]) => n), unit: 'เหตุการณ์',
      colors: exH.map(([g]) => (!l.harmed || l.harmed === g ? C.lav : fade(C.lav))),
      onPick: (i) => act.local('harmed', exH[i][0]),
    }));
  } else {
    a4.innerHTML = `<p class="gate">อยู่ระหว่างตรวจสอบการจัดกลุ่ม · ยังไม่จัดอันดับกลุ่มผู้ได้รับผลกระทบ จึงแสดงข้อความจากแหล่งต้นฉบับแทน</p>
      <ul class="harmed">${rows.length ? rows.map((r) => `<li><button type="button" class="cellpick plain" data-pick-dim="subdomain" data-pick-val="${esc(r.subdomain)}" title="กรองด้วย risk subdomain ของเหตุการณ์นี้"><span class="dot" style="background:${GROUP_COLOR[r.group]}"></span>${esc(r.harmedText)}</button><small>${esc(r.date)} · #${esc(r.id)}</small></li>`).join('') : '<li class="tempty">ไม่พบข้อมูลตามตัวกรองที่เลือก</li>'}</ul>`;
  }

  // Detail table (AI-T1)
  table(root.querySelector('#ai-table'), {
    rows, state: act.tableState('ai'), onChange: act.rerender,
    provenance: [`แหล่ง: ${SOURCES.ai}`, `ช่วง: ${act.periodText()}`, `ตัวกรอง: ${act.filterText()}`],
    columns: [
      { key: 'date', label: 'วันที่', width: '11%' },
      { key: 'id', label: 'ID', width: '6%', render: (r) => `#${esc(r.id)}` },
      { key: 'title', label: 'เหตุการณ์', width: '33%', render: (r) => `<b>${esc(r.title)}</b><span class="desc">${esc(r.description)}</span>`, text: (r) => `${r.title} ${r.description}` },
      { key: 'group', label: 'กลุ่ม', width: '13%', render: (r) => pickCell('group', r.group, r.groupTh, `g-${r.group}`), text: (r) => r.groupTh },
      { key: 'subdomain', label: 'Risk subdomain', width: '15%', render: (r) => pickCell('subdomain', r.subdomain, subTh(r.subdomain)), text: (r) => subTh(r.subdomain) },
      { key: 'harmedText', label: 'ผู้ได้รับผลกระทบ (ต้นฉบับ)', width: '16%' },
      { key: 'url', label: 'แหล่ง', width: '6%', render: (r) => (r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">เปิด ↗</a>` : 'N/A') },
    ],
  });
}

export const aiTemplate = () => `
<div class="hero">
  <div class="hero-q"><p class="eyebrow">แท็บ 1 · AI RISKS</p><h2>เหตุการณ์ AI ที่เกี่ยวข้องกับข้อมูลผิดและการหลอกลวงเปลี่ยนอย่างไร และประเภทใดโดดเด่น?</h2>
    <ul class="insights" id="ai-insights" aria-live="polite"></ul></div>
  <div class="kpis">
    <button type="button" class="kpi big" data-kpi="ai-k1" data-act="clear-tab" title="ล้างตัวกรองของแท็บนี้"><span class="kl">เหตุการณ์ที่เข้าเกณฑ์</span><span class="kv" id="ai-k1">0</span><span class="kd">distinct incident_id</span></button>
    <button type="button" class="kpi" data-kpi="ai-k2" data-pick-dim="group" data-pick-val="info" title="กรองเฉพาะข้อมูลเท็จและบิดเบือน"><span class="kl"><i class="sw" style="background:${C.v}"></i>ข้อมูลเท็จ + บิดเบือน</span><span class="kv" id="ai-k2">0</span><span class="kd">misinformation + disinformation</span></button>
    <button type="button" class="kpi" data-kpi="ai-k3" data-pick-dim="group" data-pick-val="fraud_scams" title="กรองเฉพาะการหลอกลวง"><span class="kl"><i class="sw" style="background:${C.hot}"></i>หลอกลวง / ฉ้อโกง</span><span class="kv" id="ai-k3">0</span><span class="kd">fraud_scams</span></button>
  </div>
</div>
<div class="grid">
  <article class="card s8"><h3>แนวโน้มเหตุการณ์ AI รายเดือน</h3><p class="sub">คลิกจุดเพื่อเลือกเดือนนั้น (ใช้ร่วมทุกแท็บ) · จุดเด่น = เดือนที่เลือก</p>
    <div class="cv"><canvas id="ai-c1" role="img" aria-label="กราฟเส้นจำนวนเหตุการณ์ AI รายเดือน"></canvas></div>
    <p class="src">ที่มา: ${SOURCES.ai} · <span class="period"></span> · หน่วย: เหตุการณ์ (distinct incident_id)</p></article>
  <article class="card s4"><h3>ประเภทความเสี่ยงจำแนกตามปี</h3><p class="sub">คลิกส่วนของแท่งเพื่อกรองกลุ่ม</p>
    <div class="lg">${Object.entries(AI_GROUPS).map(([g, n]) => `<button type="button" class="lgb" data-pick-dim="group" data-pick-val="${g}"><i class="sq" style="background:${GROUP_COLOR[g]}"></i>${n}</button>`).join('')}</div>
    <div class="cv"><canvas id="ai-c2" role="img" aria-label="กราฟแท่งซ้อนประเภทความเสี่ยงแยกปี"></canvas></div>
    <p class="src">ที่มา: ${SOURCES.ai} · <span class="period"></span> · หน่วย: เหตุการณ์</p></article>
  <article class="card s6"><h3>Risk subdomain ที่ถูกบันทึก</h3><p class="sub">คลิกแท่งเพื่อกรอง · จำกัด 3 subdomain ตาม Data contract</p>
    <div class="cv short"><canvas id="ai-c3" role="img" aria-label="กราฟแท่งแนวนอน risk subdomain"></canvas></div>
    <p class="src">ที่มา: ${SOURCES.ai} · <span class="period"></span> · หน่วย: เหตุการณ์</p></article>
  <article class="card s6"><h3>ผู้ได้รับผลกระทบ</h3><p class="sub">ตามข้อความในฐานข้อมูล · คลิกรายการเพื่อกรองด้วยประเภทความเสี่ยงของเหตุการณ์นั้น</p>
    <div id="ai-a4" class="a4"></div>
    <p class="src">ที่มา: ${SOURCES.ai} · <span class="period"></span> · หน่วย: เหตุการณ์ · คอลัมน์ harmed เป็นข้อความอิสระ</p></article>
  <article class="card s12"><h3>รายละเอียดเหตุการณ์</h3><p class="sub">ค้นหา เรียง แบ่งหน้า · คลิกป้ายกลุ่มหรือ subdomain เพื่อกรอง</p>
    <div id="ai-table"></div>
    <p class="src">ที่มา: ${SOURCES.ai} · ลิงก์ไปยังหน้าเหตุการณ์ใน incidentdatabase.ai</p></article>
  <details class="card s12 limits"><summary>ข้อจำกัดของแท็บนี้</summary><ul>
    <li>ใช้เฉพาะ 3 risk subdomain ที่เกี่ยวกับข้อมูลผิดและการหลอกลวง (59 เหตุการณ์ในปี 2020–2022) ไม่ใช่เหตุการณ์ AI ทั้งหมด และไม่ใช่อัตราการเกิดจริงทั้งโลก</li>
    <li>subset นี้มีรายการเพียง 27 จาก 36 เดือน เดือนที่เป็น 0 ไม่ได้แปลว่าไม่มีเหตุการณ์จริง</li>
    <li>บางเหตุการณ์มีวันที่เป็นวันที่ 1 ของเดือน ซึ่งอาจเป็นวันที่โดยประมาณ</li>
    <li>ไม่ได้แสดงว่า AI เป็นสาเหตุของข่าวปลอมในแท็บอื่น</li></ul></details>
</div>`;
