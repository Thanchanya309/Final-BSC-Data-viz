/**
 * insights.js - Dynamic Key Insights Component
 * Generates editorial insights based on currently filtered data.
 */

(function(window) {
  'use strict';

  const Insights = {
    render(containerId, tabKey, insightsList) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.setAttribute('data-tab', tabKey);

      container.innerHTML = `
        <div class="insights-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span class="insights-title">ข้อค้นพบสำคัญเชิงพรรณนา (Key Analytical Findings)</span>
        </div>
        <ul class="insights-list">
          ${insightsList.map(item => `
            <li class="insight-item">
              ${item.text}
            </li>
          `).join('')}
        </ul>
      `;
    }
  };

  window.Insights = Insights;
})(window);
