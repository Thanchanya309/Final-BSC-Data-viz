// Chart.js wrappers: shared look, value labels, click-to-filter and in-place updates.
import { MONTHS_TH } from './config.js';

export const C = {
  ink: '#1C1240', mu: '#6B5E92', grid: '#EFEAF7', axis: '#DCD0F2',
  v: '#6D3FE0', lav: '#A88BFA', hot: '#D63A8F', grey: '#D6CDEB',
  years: ['#CDBEF4', '#8F6CEB', '#3F1E9E'],
};
export const fade = (hex) => hex + '40';
export const fmt = (n) => Number(n).toLocaleString('en-US');

const charts = new Map();

export function initCharts() {
  const Chart = window.Chart;
  Chart.defaults.font.family = "'Kanit', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = C.mu;
  Chart.register(valueLabels, markers);
}

export const tooltip = (unit, extra = {}) => ({
  backgroundColor: '#1A0E45', titleColor: '#fff', bodyColor: '#E4DCFB', padding: 11, cornerRadius: 10,
  boxWidth: 9, boxHeight: 9, boxPadding: 4, usePointStyle: true, titleFont: { weight: '500' },
  callbacks: { label: (c) => ` ${c.dataset.label ? c.dataset.label + ': ' : ''}${fmt(c.raw)} ${unit}`, ...extra },
});

const valueLabels = {
  id: 'vl',
  afterDatasetsDraw(chart, _a, o) {
    if (!o.on) return;
    const k = chart.ctx;
    chart.data.datasets.forEach((d, di) => chart.getDatasetMeta(di).data.forEach((el, i) => {
      const v = d.data[i];
      if (!v) return;
      k.save();
      k.fillStyle = C.ink;
      k.font = `${o.small ? '400 11px' : '500 12px'} Kanit`;
      k.textBaseline = 'middle';
      k.fillText(o.format ? o.format(v) : fmt(v), el.x + 6, el.y);
      k.restore();
    }));
  },
};

// Dashed vertical context markers (COVID-19, war) — context only, not causes.
const markers = {
  id: 'mk',
  beforeDatasetsDraw(chart, _a, o) {
    if (!o.list?.length) return;
    const { x, y } = chart.scales;
    const k = chart.ctx;
    o.list.forEach(({ index, label }, n) => {
      if (index < 0) return;
      const px = x.getPixelForValue(index);
      k.save();
      k.setLineDash([2, 3]);
      k.strokeStyle = '#B9A8E8';
      k.beginPath(); k.moveTo(px, y.top + 14 + n * 14); k.lineTo(px, y.bottom); k.stroke();
      k.fillStyle = C.mu; k.font = '11px Kanit';
      k.textAlign = px > (x.left + x.right) / 2 ? 'right' : 'left';
      k.fillText(label, px + (k.textAlign === 'right' ? -4 : 4), y.top + 10 + n * 14);
      k.restore();
    });
  },
};

export function contextMarkers(axis) {
  return [
    { ym: '2020-03', label: 'โควิด-19 ระบาด' },
    { ym: '2022-02', label: 'สงครามรัสเซีย–ยูเครน' },
  ].map((m) => ({ index: axis.indexOf(m.ym), label: m.label })).filter((m) => m.index >= 0);
}

export function monthLabels(axis) {
  return axis.map((ym, i) => {
    const m = Number(ym.slice(5));
    if (axis.length <= 12) return MONTHS_TH[m - 1];
    return m === 1 ? [MONTHS_TH[0], ym.slice(0, 4)] : (i % 3 === 0 ? MONTHS_TH[m - 1] : '');
  });
}
export const ymLabel = (ym) => `${MONTHS_TH[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;

/** Create or update in place (destroying inside a click handler breaks Chart.js). */
export function draw(id, cfg) {
  const el = document.getElementById(id);
  const existing = charts.get(id);
  if (existing) {
    existing.data = cfg.data;
    existing.options = cfg.options;
    existing.update();
    return existing;
  }
  const chart = new window.Chart(el, cfg);
  charts.set(id, chart);
  return chart;
}

/** Click handler factory: calls pick(index, datasetIndex) after Chart.js finishes the event. */
export function clickable(pick) {
  return {
    onClick: (_e, els) => { if (els.length) { const { index, datasetIndex } = els[0]; setTimeout(() => pick(index, datasetIndex)); } },
    onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; },
  };
}

const base = { responsive: true, maintainAspectRatio: false, animation: { duration: 650, easing: 'easeOutQuart' } };

export function hbar({ labels, values, colors, unit, onPick, format, thickness = 18 }) {
  return {
    type: 'bar',
    data: { labels, datasets: [{ label: '', data: values, backgroundColor: colors, borderRadius: 6, borderSkipped: 'start', barThickness: thickness, maxBarThickness: thickness }] },
    options: {
      ...base, indexAxis: 'y', layout: { padding: { right: 54 } },
      plugins: { legend: { display: false }, tooltip: tooltip(unit, format ? { label: (c) => ` ${format(c.raw)}` } : {}), vl: { on: true, format } },
      scales: { x: { display: false, beginAtZero: true }, y: { grid: { display: false }, border: { display: false }, ticks: { color: C.ink, autoSkip: false } } },
      ...(onPick ? clickable((i) => onPick(i)) : {}),
    },
  };
}

export function line({ axis, datasets, unit, onPick, highlight, yMax, compact }) {
  return {
    type: 'line',
    data: {
      labels: monthLabels(axis),
      datasets: datasets.map((d) => ({
        label: d.label, data: d.data, borderColor: d.color, backgroundColor: d.fill || d.color, fill: !!d.fill,
        borderWidth: d.width || 2.5, borderDash: d.dash || [], cubicInterpolationMode: 'monotone',
        pointRadius: axis.map((ym) => (highlight?.(ym) ? 5 : d.points ? 2.5 : 0)),
        pointBackgroundColor: d.color, pointBorderColor: '#fff', pointBorderWidth: 1.5,
        pointHoverRadius: 6, pointHitRadius: 10,
      })),
    },
    options: {
      ...base, interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: compact ? 2 : 6, right: 10 } },
      plugins: {
        legend: { display: false },
        tooltip: tooltip(unit, { title: (c) => ymLabel(axis[c[0].dataIndex]) }),
        mk: { list: compact ? [] : contextMarkers(axis) },
      },
      scales: {
        x: { grid: { display: false }, border: { color: C.axis }, ticks: { autoSkip: false, maxRotation: 0, font: { size: compact ? 10 : 11 } } },
        y: { beginAtZero: true, max: yMax, grid: { color: C.grid }, border: { display: false }, ticks: { maxTicksLimit: compact ? 3 : 5, precision: 0, padding: 6 } },
      },
      ...(onPick ? clickable((i) => onPick(axis[i])) : {}),
    },
  };
}

export function stacked({ labels, datasets, unit, onPick, horizontal, percent }) {
  return {
    type: 'bar',
    data: { labels, datasets: datasets.map((d) => ({ ...d, borderColor: '#fff', borderWidth: horizontal ? { right: 2 } : { top: 2 }, borderRadius: 4, borderSkipped: false, maxBarThickness: horizontal ? 22 : 56 })) },
    options: {
      ...base, indexAxis: horizontal ? 'y' : 'x', interaction: { mode: 'nearest', intersect: true },
      plugins: {
        legend: { display: false },
        tooltip: tooltip(unit, percent ? { label: (c) => ` ${c.dataset.label}: ${c.raw.toFixed(1)}%` } : {}),
      },
      scales: {
        [horizontal ? 'x' : 'y']: { stacked: true, beginAtZero: true, max: percent ? 100 : undefined, grid: { color: C.grid }, border: { display: false }, ticks: { maxTicksLimit: 5, precision: 0, callback: percent ? (v) => v + '%' : undefined } },
        [horizontal ? 'y' : 'x']: { stacked: true, grid: { display: false }, border: { color: C.axis }, ticks: { color: C.ink } },
      },
      ...(onPick ? clickable(onPick) : {}),
    },
  };
}
