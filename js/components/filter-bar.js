/**
 * filter-bar.js - Global & Local Filter Controls and Active Filter Chips
 */

(function(window) {
  'use strict';

  const FilterBar = {
    init() {
      this.bindEvents();
      this.render();
    },

    bindEvents() {
      // Listen to store updates
      window.AppStore.subscribe((state, changeType, payload) => {
        this.render();
      });
    },

    render() {
      const state = window.AppStore.getState();
      const { filters, activeTab } = state;

      // Update Year select & buttons
      const yearSelect = document.getElementById('global-year-select');
      if (yearSelect) {
        yearSelect.value = filters.year.toString();
      }

      document.querySelectorAll('.quick-year-btn').forEach(btn => {
        const y = btn.getAttribute('data-year');
        if (y === filters.year.toString()) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Update Month select
      const monthSelect = document.getElementById('global-month-select');
      if (monthSelect) {
        monthSelect.value = filters.month.toString();
      }

      // Render Active Chips
      this.renderChips();
    },

    renderChips() {
      const chipsContainer = document.getElementById('active-chips-list');
      if (!chipsContainer) return;

      const chips = window.AppStore.getActiveFilterChips();

      if (chips.length === 0) {
        chipsContainer.innerHTML = `<span style="font-size: 0.78rem; color: var(--text-muted);">ไม่มีตัวกรองเพิ่มเติม (แสดงข้อมูลทั้งหมดในช่วงปี 2020–2022)</span>`;
        return;
      }

      chipsContainer.innerHTML = chips.map(chip => `
        <span class="filter-chip">
          <span>${chip.label}</span>
          <span class="filter-chip-remove" data-chip-id="${chip.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </span>
        </span>
      `).join('');

      // Add click listeners to chip remove buttons
      chipsContainer.querySelectorAll('.filter-chip-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const chipId = btn.getAttribute('data-chip-id');
          const chip = chips.find(c => c.id === chipId);
          if (chip) {
            window.AppStore.removeFilterChip(chip);
          }
        });
      });
    }
  };

  window.FilterBar = FilterBar;
})(window);
