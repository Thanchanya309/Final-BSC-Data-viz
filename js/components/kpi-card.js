/**
 * kpi-card.js - Bento KPI Cards Component
 * Renders high-impact KPI cards with dynamic numbers and context badges.
 */

(function(window) {
  'use strict';

  const KPICard = {
    render(containerId, kpiList) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = kpiList.map(kpi => `
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-label">${kpi.label}</span>
            <span class="kpi-icon-pill">
              ${kpi.icon || `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20V10M18 20V4M6 20v-4"/>
                </svg>
              `}
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-value">${kpi.value !== null && kpi.value !== undefined ? kpi.value : 'ไม่มีข้อมูล'}</span>
            <span class="kpi-unit">${kpi.unit || ''}</span>
          </div>
          <div class="kpi-footer">
            <span class="kpi-badge" style="${kpi.badgeColor ? `color:${kpi.badgeColor}; border: 1px solid ${kpi.badgeColor}33;` : ''}">
              ${kpi.badge || 'อัปเดตตามตัวกรอง'}
            </span>
            <span>${kpi.subtext || ''}</span>
          </div>
        </div>
      `).join('');
    }
  };

  window.KPICard = KPICard;
})(window);
