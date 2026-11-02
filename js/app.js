/**
 * app.js - Main Application Controller
 * Manages tab switching, UI initialization, and event routing.
 */

(function(window) {
  'use strict';

  const App = {
    init() {
      console.log('Initializing Dashboard Application...');

      // 1. Initialize Filter Bar
      window.FilterBar.init();

      // 2. Bind DOM Navigation and Global Controls
      this.bindNavTabs();
      this.bindGlobalFilterInputs();
      this.bindToggleButtons();
      this.bindKeyboardShortcuts();

      // 3. Subscribe to Store Updates
      window.AppStore.subscribe((state, changeType, payload) => {
        this.renderActiveTab();
      });

      // 4. Initial Render
      this.renderActiveTab();
    },

    bindNavTabs() {
      const tabButtons = document.querySelectorAll('.tab-btn');
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabName = btn.getAttribute('data-tab');
          if (tabName) {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Switch view in DOM
            document.querySelectorAll('.tab-view-panel').forEach(panel => {
              panel.style.display = 'none';
            });
            const targetPanel = document.getElementById(`tab-panel-${tabName}`);
            if (targetPanel) {
              targetPanel.style.display = 'block';
            }

            // Update state
            window.AppStore.setActiveTab(tabName);

            // Trigger chart resize after panel becomes visible
            setTimeout(() => {
              window.ChartManager.resizeAll();
            }, 50);
          }
        });
      });
    },

    bindGlobalFilterInputs() {
      // Year Select
      const yearSelect = document.getElementById('global-year-select');
      if (yearSelect) {
        yearSelect.addEventListener('change', (e) => {
          window.AppStore.setYear(e.target.value);
        });
      }

      // Quick Year Buttons
      document.querySelectorAll('.quick-year-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const yr = btn.getAttribute('data-year');
          window.AppStore.setYear(yr);
        });
      });

      // Month Select
      const monthSelect = document.getElementById('global-month-select');
      if (monthSelect) {
        monthSelect.addEventListener('change', (e) => {
          window.AppStore.setMonth(e.target.value);
        });
      }

      // Clear Tab Filters Button
      const clearTabBtn = document.getElementById('btn-clear-tab-filters');
      if (clearTabBtn) {
        clearTabBtn.addEventListener('click', () => {
          window.AppStore.clearTabFilters();
        });
      }

      // Clear All Filters Button
      const clearAllBtn = document.getElementById('btn-clear-all-filters');
      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
          window.AppStore.clearAllFilters();
        });
      }
    },

    bindToggleButtons() {
      // Thai T2 Count vs 100% Stacked toggle
      const t2CountBtn = document.getElementById('toggle-t2-count');
      const t2PercentBtn = document.getElementById('toggle-t2-percent');

      if (t2CountBtn && t2PercentBtn) {
        t2CountBtn.addEventListener('click', () => {
          t2CountBtn.classList.add('active');
          t2PercentBtn.classList.remove('active');
          window.AppStore.setToggle('thaiT2Mode', 'count');
        });
        t2PercentBtn.addEventListener('click', () => {
          t2PercentBtn.classList.add('active');
          t2CountBtn.classList.remove('active');
          window.AppStore.setToggle('thaiT2Mode', 'percent');
        });
      }

      // Thai T3 Top 5 vs All toggle
      const t3Top5Btn = document.getElementById('toggle-t3-top5');
      const t3AllBtn = document.getElementById('toggle-t3-all');

      if (t3Top5Btn && t3AllBtn) {
        t3Top5Btn.addEventListener('click', () => {
          t3Top5Btn.classList.add('active');
          t3AllBtn.classList.remove('active');
          window.AppStore.setToggle('thaiT3Mode', 'top5');
        });
        t3AllBtn.addEventListener('click', () => {
          t3AllBtn.classList.add('active');
          t3Top5Btn.classList.remove('active');
          window.AppStore.setToggle('thaiT3Mode', 'all');
        });
      }
    },

    bindKeyboardShortcuts() {
      window.addEventListener('keydown', (e) => {
        // Do not trigger if user is typing in a search or input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
          return;
        }

        if (e.key === '1') {
          const btn = document.querySelector('.tab-btn[data-tab="ai"]');
          if (btn) btn.click();
        } else if (e.key === '2') {
          const btn = document.querySelector('.tab-btn[data-tab="eu"]');
          if (btn) btn.click();
        } else if (e.key === '3') {
          const btn = document.querySelector('.tab-btn[data-tab="thai"]');
          if (btn) btn.click();
        } else if (e.key === 'Escape') {
          window.AppStore.clearAllFilters();
        }
      });
    },

    renderActiveTab() {
      const state = window.AppStore.getState();
      const tab = state.activeTab;

      if (tab === 'ai') {
        window.TabAI.render();
      } else if (tab === 'eu') {
        window.TabEU.render();
      } else if (tab === 'thai') {
        window.TabThai.render();
      }
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    App.init();
  });

  window.App = App;
})(window);
