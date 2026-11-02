// App state and wiring: shared year/month across tabs, local filters per tab,
// click-to-filter from charts, KPI cards, legends and table cells.
import { CONFIG, MONTHS_TH } from './config.js';
import { loadAll } from './data.js';
import { initCharts } from './charts.js';
import { $, esc, chips } from './ui.js';
import { renderAI, aiTemplate, AI_FILTER_LABELS } from './tabs/ai.js';
import { renderEU, euTemplate, EU_FILTER_LABELS } from './tabs/eu.js';
import { renderTH, thTemplate, TH_FILTER_LABELS } from './tabs/th.js';

const TABS = {
  ai: { label: 'ความเสี่ยงจาก AI', render: renderAI, template: aiTemplate, labels: AI_FILTER_LABELS },
  eu: { label: 'ข่าวบิดเบือนต่างประเทศ', render: renderEU, template: euTemplate, labels: EU_FILTER_LABELS },
  th: { label: 'ข่าวปลอมในไทย', render: renderTH, template: thTemplate, labels: TH_FILTER_LABELS },
};

const emptyLocal = () => ({
  ai: { group: null, subdomain: null, harmed: null },
  eu: { keyword: null, language: null, domain: null, cls: null },
  th: { verdict: null, category: null },
});
const newTable = () => ({ q: '', sort: 'date', dir: -1, page: 0 });

const state = {
  tab: 'ai', year: 'all', month: 'all', local: emptyLocal(),
  tables: { ai: newTable(), eu: newTable(), th: newTable() },
  thUi: { mode: 'count', top: 'top5' },
};
let data;

const periodText = () => {
  const y = state.year === 'all' ? '2020–2022' : state.year;
  return state.month === 'all' ? `ปี ${y}` : `${MONTHS_TH[state.month - 1]} ปี ${y}`;
};

function filterItems(tab = state.tab) {
  return Object.entries(state.local[tab]).filter(([, v]) => v).map(([k, v]) => {
    const [label, fmtv] = TABS[tab].labels[k];
    return { key: k, label, value: fmtv(v) };
  });
}
const filterText = () => [periodText(), ...filterItems().map((c) => `${c.label}=${c.value}`)].join(' · ');

const act = {
  /** Toggle a tab-local filter; clicking the same value again clears it. */
  local(dim, value) {
    const l = state.local[state.tab];
    l[dim] = l[dim] === value ? null : value;
    state.tables[state.tab].page = 0;
    render();
  },
  /** Chart point -> shared year + month for every tab; same point again clears both. */
  time(ym) {
    const y = ym.slice(0, 4);
    const m = Number(ym.slice(5));
    const same = state.year === y && Number(state.month) === m;
    state.year = same ? 'all' : y;
    state.month = same ? 'all' : m;
    Object.values(state.tables).forEach((t) => { t.page = 0; });
    render();
  },
  tableState: (tab) => state.tables[tab],
  rerender: () => render(),
  ui: () => state.thUi,
  periodText,
  filterText,
};

function clearTab() {
  state.local[state.tab] = emptyLocal()[state.tab];
  state.tables[state.tab].page = 0;
  render();
}
function clearAll() {
  state.year = 'all'; state.month = 'all'; state.local = emptyLocal();
  Object.values(state.tables).forEach((t) => { t.page = 0; t.q = ''; });
  render();
}

function renderHeader() {
  document.querySelectorAll('#tabs [data-tab]').forEach((b) => {
    const on = b.dataset.tab === state.tab;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
    const n = filterItems(b.dataset.tab).length;
    b.querySelector('.count').textContent = n ? n : '';
  });
  document.querySelectorAll('#years [data-year]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.year === state.year)));
  $('#month').value = String(state.month);
  $('#period').textContent = periodText();
  document.querySelectorAll('.period').forEach((el) => { el.textContent = periodText(); });
  chips($('#chips'), filterItems());
  renderLocalSelects();
}

/** Keyboard-friendly dropdowns for the same local filters the charts set. */
function renderLocalSelects() {
  const box = $('#local');
  const opts = localOptions();
  box.innerHTML = Object.entries(opts).map(([dim, values]) => {
    const [label, fmtv] = TABS[state.tab].labels[dim];
    const cur = state.local[state.tab][dim];
    return `<label>${esc(label)}<select data-local="${dim}"><option value="">ทั้งหมด</option>${values.map((v) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(fmtv(v))}</option>`).join('')}</select></label>`;
  }).join('');
}

function localOptions() {
  const uniq = (arr) => [...new Set(arr)].sort((a, b) => String(a).localeCompare(String(b), 'th'));
  const top = (arr, n) => { const m = new Map(); arr.forEach((v) => m.set(v, (m.get(v) || 0) + 1)); return [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([v]) => v); };
  if (state.tab === 'ai') {
    const o = { group: ['info', ...uniq(data.ai.map((r) => r.group))], subdomain: uniq(data.ai.map((r) => r.subdomain)) };
    if (CONFIG.gates.aiHarmedMappingApproved) o.harmed = uniq(data.ai.map((r) => r.harmedGroup));
    return o;
  }
  if (state.tab === 'eu') {
    return {
      keyword: top(data.eu.debunks.flatMap((d) => d.keywords), 40),
      language: top(data.eu.articles.map((a) => a.language), 40),
      domain: top(data.eu.articles.map((a) => a.domain), 40),
      cls: uniq(data.eu.articles.map((a) => a.cls)),
    };
  }
  return { verdict: ['Fake', 'Distorted', 'True'], category: uniq(data.th.map((r) => r.category)) };
}

let rendering = false;
function render() {
  if (rendering) return;
  rendering = true;
  try {
    renderHeader();
    document.querySelectorAll('.tab').forEach((s) => { s.hidden = s.id !== `tab-${state.tab}`; });
    const f = { year: state.year, month: state.month, local: state.local };
    TABS[state.tab].render($(`#tab-${state.tab}`), data, f, act);
  } finally {
    rendering = false;
  }
}

function wire() {
  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) { state.tab = b.dataset.tab; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  $('#years').addEventListener('click', (e) => {
    const b = e.target.closest('[data-year]');
    if (b) { state.year = b.dataset.year; render(); }
  });
  $('#month').addEventListener('change', (e) => { state.month = e.target.value === 'all' ? 'all' : Number(e.target.value); render(); });
  $('#local').addEventListener('change', (e) => {
    const s = e.target.closest('[data-local]');
    if (s) { state.local[state.tab][s.dataset.local] = s.value || null; state.tables[state.tab].page = 0; render(); }
  });
  $('#clear-tab').onclick = clearTab;
  $('#clear-all').onclick = clearAll;
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-chip]');
    if (b) { state.local[state.tab][b.dataset.chip] = null; render(); }
  });

  // Everything inside a tab that carries data-pick-* filters that tab:
  // KPI cards, legend items, table cells, small-multiple titles, harmed list.
  document.querySelector('main').addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick-dim]');
    if (pick) { act.local(pick.dataset.pickDim, pick.dataset.pickVal); return; }
    if (e.target.closest('[data-act="clear-tab"], [data-clear-tab]')) { clearTab(); return; }
    const mode = e.target.closest('[data-th-mode]');
    if (mode) { state.thUi.mode = mode.dataset.thMode; render(); return; }
    const top = e.target.closest('[data-th-top]');
    if (top) { state.thUi.top = top.dataset.thTop; render(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    const i = ['1', '2', '3'].indexOf(e.key);
    if (i >= 0) { state.tab = Object.keys(TABS)[i]; render(); }
    if (e.key === 'Escape') clearAll();
  });
}

async function start() {
  for (const [k, t] of Object.entries(TABS)) $(`#tab-${k}`).innerHTML = t.template();
  try {
    data = await loadAll();
  } catch (err) {
    $('#loading').innerHTML = `<p>โหลดข้อมูลไม่สำเร็จ: ${esc(err.message || err)}<br>ต้องเปิดผ่านเว็บเซิร์ฟเวอร์ (ดู README) ไม่ใช่ดับเบิลคลิกไฟล์ HTML</p>`;
    return;
  }
  initCharts();
  $('#loading').remove();
  wire();
  const want = new URLSearchParams(location.search).get('tab');
  if (TABS[want]) state.tab = want;
  await document.fonts.ready;
  render();
  window.__dashboard = { state, data, render };
}

start();
