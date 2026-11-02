// Small DOM components: KPI counters, empty states, filter chips, data tables.
import { CONFIG } from './config.js';
import { fmt } from './charts.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const shown = new Map();
/** Animate a number from its last shown value; text values are set directly. */
export function setKpi(id, value, { suffix = '', dec = 0 } = {}) {
  const el = document.getElementById(id);
  if (value === null || value === undefined || Number.isNaN(value)) { el.textContent = 'ไม่มีข้อมูล'; el.classList.add('na'); shown.delete(id); return; }
  el.classList.remove('na');
  const from = shown.get(id) ?? 0;
  shown.set(id, value);
  const text = (v) => (dec ? v.toFixed(dec) : fmt(Math.round(v))) + suffix;
  // The final value is written up front for screen readers and background tabs
  // (where requestAnimationFrame never fires); the count-up is decoration only.
  el.textContent = text(value);
  el.dataset.value = String(value);
  if (document.hidden || from === value) return;
  const t0 = performance.now();
  const step = (t) => {
    if (el.dataset.value !== String(value)) return;
    const p = Math.min(1, (t - t0) / 700);
    el.textContent = text(from + (value - from) * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Show/hide an empty-state overlay on a chart card body. */
export function emptyState(canvasId, message) {
  const box = document.getElementById(canvasId).parentElement;
  let ov = box.querySelector('.empty');
  if (!message) { ov?.remove(); return false; }
  if (!ov) { ov = document.createElement('div'); ov.className = 'empty'; box.appendChild(ov); }
  ov.innerHTML = `<p>${esc(message)}</p><button type="button" data-clear-tab>ล้างตัวกรองแท็บนี้</button>`;
  return true;
}

export function chips(container, items) {
  container.innerHTML = items.length
    ? items.map((c) => `<span class="chip"><span>${esc(c.label)}: <b>${esc(c.value)}</b></span><button type="button" aria-label="ล้าง ${esc(c.label)}" data-chip="${esc(c.key)}">×</button></span>`).join('')
    : '<span class="chip-none">ยังไม่ได้เลือกตัวกรอง · คลิกกราฟ การ์ด หรือป้ายในตารางเพื่อกรอง</span>';
}

/**
 * Filter-aware table with search, sort, pagination and CSV export.
 * columns: [{key, label, width, render?(row) -> html, text?(row) -> string}]
 */
export function table(root, { columns, rows, state, onChange, provenance }) {
  const q = state.q.trim().toLowerCase();
  const textOf = (c, r) => (c.text ? c.text(r) : r[c.key]) ?? '';
  let data = q ? rows.filter((r) => columns.some((c) => String(textOf(c, r)).toLowerCase().includes(q))) : rows.slice();
  const sc = columns.find((c) => c.key === state.sort);
  if (sc) data.sort((a, b) => String(textOf(sc, a)).localeCompare(String(textOf(sc, b)), 'th', { numeric: true }) * state.dir);
  const pages = Math.max(1, Math.ceil(data.length / CONFIG.pageSize));
  state.page = Math.min(state.page, pages - 1);
  const slice = data.slice(state.page * CONFIG.pageSize, (state.page + 1) * CONFIG.pageSize);

  root.innerHTML = `
    <div class="tbar">
      <input type="search" placeholder="ค้นหาในตาราง" value="${esc(state.q)}" aria-label="ค้นหาในตาราง">
      <span class="tcount">${fmt(data.length)} รายการ</span>
      <button type="button" class="ghost" data-export>ดาวน์โหลด CSV</button>
    </div>
    <div class="tscroll"><table>
      <thead><tr>${columns.map((c) => `<th style="width:${c.width || 'auto'}"><button type="button" data-sort="${c.key}" aria-sort="${state.sort === c.key ? (state.dir > 0 ? 'ascending' : 'descending') : 'none'}">${esc(c.label)}${state.sort === c.key ? (state.dir > 0 ? ' ↑' : ' ↓') : ''}</button></th>`).join('')}</tr></thead>
      <tbody>${slice.length ? slice.map((r) => `<tr>${columns.map((c) => `<td>${c.render ? c.render(r) : esc(r[c.key])}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${columns.length}" class="tempty">ไม่พบข้อมูลตามตัวกรองที่เลือก</td></tr>`}</tbody>
    </table></div>
    <div class="pager">
      <button type="button" class="ghost" data-page="-1" ${state.page === 0 ? 'disabled' : ''} aria-label="หน้าก่อน">‹</button>
      <span>หน้า ${state.page + 1} / ${pages}</span>
      <button type="button" class="ghost" data-page="1" ${state.page >= pages - 1 ? 'disabled' : ''} aria-label="หน้าถัดไป">›</button>
    </div>`;

  const input = root.querySelector('input');
  input.oninput = () => { state.q = input.value; state.page = 0; onChange(); root.querySelector('input').focus(); root.querySelector('input').setSelectionRange(state.q.length, state.q.length); };
  root.querySelectorAll('[data-sort]').forEach((b) => b.onclick = () => {
    state.dir = state.sort === b.dataset.sort ? -state.dir : 1;
    state.sort = b.dataset.sort; onChange();
  });
  root.querySelectorAll('[data-page]').forEach((b) => b.onclick = () => { state.page += Number(b.dataset.page); onChange(); });
  root.querySelector('[data-export]').onclick = () => exportCsv(columns, data, provenance);
}

function exportCsv(columns, rows, provenance) {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    ...provenance.map((p) => cell(p)),
    columns.map((c) => cell(c.label)).join(','),
    ...rows.map((r) => columns.map((c) => cell(c.text ? c.text(r) : r[c.key])).join(',')),
  ];
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'dashboard_filtered.csv' });
  a.click();
  URL.revokeObjectURL(a.href);
}

/** A table cell value that filters the tab when clicked. */
export const pickCell = (dim, value, label = value, cls = '') =>
  `<button type="button" class="cellpick ${cls}" data-pick-dim="${esc(dim)}" data-pick-val="${esc(value)}" title="กรองด้วยค่านี้">${esc(label)}</button>`;
