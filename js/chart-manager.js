/**
 * chart-manager.js - Central ECharts Helper and Manager
 * Configures theme, responsive behavior, click listeners, and formatting.
 */

(function(window) {
  'use strict';

  const ChartManager = {
    instances: {},

    getOrCreate(domId) {
      const el = document.getElementById(domId);
      if (!el) return null;

      if (this.instances[domId]) {
        return this.instances[domId];
      }

      if (!window.echarts) {
        console.warn('ECharts library not loaded yet');
        return null;
      }

      const instance = window.echarts.init(el, 'dark', {
        renderer: 'svg'
      });
      this.instances[domId] = instance;

      // Handle window resize
      window.addEventListener('resize', () => {
        instance.resize();
      });

      return instance;
    },

    disposeAll() {
      Object.keys(this.instances).forEach(id => {
        try {
          this.instances[id].dispose();
        } catch(e) {}
      });
      this.instances = {};
    },

    resizeAll() {
      Object.keys(this.instances).forEach(id => {
        try {
          this.instances[id].resize();
        } catch(e) {}
      });
    },

    // Standard dark theme base options
    getBaseOptions() {
      return {
        backgroundColor: 'transparent',
        textStyle: {
          fontFamily: 'Kanit, sans-serif'
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#1e293b',
          borderColor: '#475569',
          borderWidth: 1,
          textStyle: {
            color: '#f8fafc',
            fontFamily: 'Kanit, sans-serif',
            fontSize: 13
          },
          padding: [8, 12],
          confine: true
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          top: '15%',
          containLabel: true
        }
      };
    }
  };

  window.ChartManager = ChartManager;
})(window);
