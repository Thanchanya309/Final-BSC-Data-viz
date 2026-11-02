/**
 * tab-eu.js - Tab 2: Global Disinformation (EUvsDisinfo)
 * Strict distinction between Distinct Debunks and Article Associations.
 */

(function(window) {
  'use strict';

  let tableInstance = null;

  const TabEU = {
    render() {
      const state = window.AppStore.getState();
      const data = window.DataTransform.transformEU(state.filters);

      // 1. Render KPIs
      this.renderKPIs(data.kpis);

      // 2. Render Key Insights (Minimum 3 dynamic points)
      this.renderInsights(data.insights);

      // 3. Render Charts
      this.renderChartE1(data.chartE1);
      this.renderChartE2(data.chartE2);
      this.renderChartE3(data.chartE3);
      this.renderChartE4(data.chartE4);
      this.renderChartE5(data.chartE5);

      // 4. Render Table
      this.renderTable(data.tableRows);
    },

    renderKPIs(kpis) {
      window.KPICard.render('eu-kpi-container', [
        {
          label: 'จำนวนเรื่องตรวจสอบทั้งหมด (Total Debunked Cases)',
          value: kpis.totalDebunks.toLocaleString(),
          unit: 'เรื่อง',
          badge: 'Distinct debunk_id',
          badgeColor: 'var(--accent-eu)',
          subtext: 'ไม่คูณซ้ำตามจำนวนบทความ'
        },
        {
          label: 'ความสัมพันธ์บทความบิดเบือน (Disinformation Articles)',
          value: kpis.disinfoAssociations.toLocaleString(),
          unit: 'บทความ',
          badge: 'Article Associations',
          badgeColor: '#ef4444',
          subtext: 'article_class = disinformation'
        },
        {
          label: 'จำนวนภาษาที่ปรากฏ (Identified Languages)',
          value: kpis.uniqueLanguages.toLocaleString(),
          unit: 'ภาษา',
          badge: 'Distinct Languages',
          badgeColor: '#10b981',
          subtext: 'ภาษาที่ระบุได้ในบทความ'
        }
      ]);
    },

    renderInsights(insights) {
      window.Insights.render('eu-insights-container', 'eu', insights);
    },

    renderChartE1(chartData) {
      const chart = window.ChartManager.getOrCreate('chart-e1');
      if (!chart) return;

      const option = {
        ...window.ChartManager.getBaseOptions(),
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const p = params[0];
            return `<strong>${p.name}</strong><br/>เรื่องที่ตรวจสอบ: <strong>${p.value}</strong> เรื่อง<br/><span style="font-size: 11px; color:#94a3b8;">คลิกเพื่อกรองช่วงเวลา</span>`;
          }
        },
        xAxis: {
          type: 'category',
          data: chartData.categories,
          axisLabel: {
            color: '#94a3b8',
            fontSize: 10,
            interval: 2,
            rotate: 30
          },
          axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: '#94a3b8', fontSize: 11 },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        series: [{
          name: 'Debunk Cases',
          type: 'line',
          data: chartData.values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: { color: '#3b82f6' },
          lineStyle: { width: 2.5, color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.0)' }
            ])
          }
        }]
      };

      chart.setOption(option, true);

      chart.off('click');
      chart.on('click', (params) => {
        if (params.name) {
          const parts = params.name.split('-');
          if (parts.length === 2) {
            window.AppStore.setYear(parts[0]);
            window.AppStore.setMonth(parts[1]);
          }
        }
      });
    },

    renderChartE2(chartData) {
      const chart = window.ChartManager.getOrCreate('chart-e2');
      if (!chart) return;

      const names = chartData.map(d => d.name);
      const counts = chartData.map(d => d.count);

      const option = {
        ...window.ChartManager.getBaseOptions(),
        tooltip: {
          trigger: 'item',
          formatter: '{b}: <strong>{c}</strong> เรื่องตรวจสอบ (Distinct Debunks)'
        },
        grid: {
          left: '3%',
          right: '8%',
          bottom: '5%',
          top: '5%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        yAxis: {
          type: 'category',
          data: names,
          inverse: true,
          axisLabel: {
            color: '#f8fafc',
            fontSize: 11,
            formatter: (val) => val.length > 22 ? val.substring(0, 20) + '...' : val
          },
          axisLine: { lineStyle: { color: '#334155' } }
        },
        series: [{
          name: 'Keywords',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#2563eb' },
              { offset: 1, color: '#60a5fa' }
            ]),
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: '#f8fafc',
            fontSize: 11,
            fontWeight: 600
          }
        }]
      };

      chart.setOption(option, true);

      chart.off('click');
      chart.on('click', (params) => {
        if (params.name) {
          window.AppStore.setEUFilter('keyword', params.name);
        }
      });
    },

    renderChartE3(chartData) {
      const chart = window.ChartManager.getOrCreate('chart-e3');
      if (!chart) return;

      const option = {
        ...window.ChartManager.getBaseOptions(),
        legend: {
          top: '3%',
          textStyle: { color: '#94a3b8', fontSize: 11 }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params) => {
            let res = `<strong>ปี ${params[0].name}</strong><br/>`;
            params.forEach(p => {
              res += `${p.marker} ${p.seriesName}: <strong>${p.value.toLocaleString()}</strong> บทความ<br/>`;
            });
            res += `<span style="font-size: 10px; color:#94a3b8;">หน่วยนับ: ความสัมพันธ์บทความ (Article Associations)</span>`;
            return res;
          }
        },
        xAxis: {
          type: 'category',
          data: chartData.years,
          axisLabel: { color: '#94a3b8', fontSize: 12 },
          axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8', fontSize: 11 },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        series: chartData.series.map(s => ({
          name: s.name,
          type: 'bar',
          stack: 'total',
          data: s.data,
          itemStyle: { color: s.color },
          rawClass: s.rawClass
        }))
      };

      chart.setOption(option, true);

      chart.off('click');
      chart.on('click', (params) => {
        if (params.componentType === 'series') {
          const s = chartData.series[params.seriesIndex];
          if (s && s.rawClass) {
            window.AppStore.setEUFilter('articleClass', s.rawClass);
          }
        }
      });
    },

    renderChartE4(chartData) {
      const chart = window.ChartManager.getOrCreate('chart-e4');
      if (!chart) return;

      const names = chartData.map(d => d.name);
      const counts = chartData.map(d => d.count);

      const option = {
        ...window.ChartManager.getBaseOptions(),
        tooltip: {
          trigger: 'item',
          formatter: '{b}: <strong>{c}</strong> ความสัมพันธ์บทความ'
        },
        grid: {
          left: '3%',
          right: '8%',
          bottom: '5%',
          top: '5%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        yAxis: {
          type: 'category',
          data: names,
          inverse: true,
          axisLabel: { color: '#f8fafc', fontSize: 11 },
          axisLine: { lineStyle: { color: '#334155' } }
        },
        series: [{
          name: 'Languages',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#10b981',
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: '#f8fafc',
            fontSize: 11,
            fontWeight: 600
          }
        }]
      };

      chart.setOption(option, true);

      chart.off('click');
      chart.on('click', (params) => {
        if (params.name) {
          window.AppStore.setEUFilter('language', params.name);
        }
      });
    },

    renderChartE5(chartData) {
      const chart = window.ChartManager.getOrCreate('chart-e5');
      if (!chart) return;

      const names = chartData.map(d => d.name);
      const counts = chartData.map(d => d.count);

      const option = {
        ...window.ChartManager.getBaseOptions(),
        tooltip: {
          trigger: 'item',
          formatter: '{b}: <strong>{c}</strong> ความสัมพันธ์บทความ'
        },
        grid: {
          left: '3%',
          right: '8%',
          bottom: '5%',
          top: '5%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        yAxis: {
          type: 'category',
          data: names,
          inverse: true,
          axisLabel: {
            color: '#f8fafc',
            fontSize: 10,
            formatter: (val) => val.length > 24 ? val.substring(0, 22) + '...' : val
          },
          axisLine: { lineStyle: { color: '#334155' } }
        },
        series: [{
          name: 'Domains',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#f59e0b',
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: '#f8fafc',
            fontSize: 11,
            fontWeight: 600
          }
        }]
      };

      chart.setOption(option, true);

      chart.off('click');
      chart.on('click', (params) => {
        if (params.name) {
          window.AppStore.setEUFilter('domain', params.name);
        }
      });
    },

    renderTable(rows) {
      if (!tableInstance) {
        tableInstance = new window.DataTable({
          containerId: 'eu-table-container',
          defaultSortKey: 'date',
          defaultSortOrder: 'desc',
          exportFilename: 'euvsdisinfo_filtered.csv',
          columns: [
            { key: 'debunkId', label: 'Debunk ID', sortable: true, render: (val) => `<span style="font-family: var(--font-mono); font-size: 0.78rem;">${val.substring(0, 8)}...</span>` },
            { key: 'date', label: 'วันที่ตรวจสอบ', sortable: true },
            { key: 'keywords', label: 'คำสำคัญ (Keywords)', sortable: true, render: (val) => `<div style="max-width: 220px; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${val || '—'}</div>` },
            {
              key: 'articleClass',
              label: 'ประเภทบทความ',
              sortable: true,
              render: (val) => {
                if (val === 'disinformation') return `<span class="badge-verdict fake">Disinformation</span>`;
                if (val === 'trustworthy') return `<span class="badge-verdict true">Trustworthy</span>`;
                return `<span class="badge-verdict">${val}</span>`;
              }
            },
            { key: 'language', label: 'ภาษา', sortable: true },
            { key: 'domain', label: 'โดเมนผู้เผยแพร่', sortable: true, render: (val) => `<span style="font-family: var(--font-mono); font-size: 0.8rem;">${val}</span>` },
            {
              key: 'url',
              label: 'ลิงก์บทความ',
              sortable: false,
              render: (val) => val ? `<a href="${val}" target="_blank" rel="noopener noreferrer" class="table-link">อ่านบทความ <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg></a>` : 'N/A'
            }
          ]
        });
      }
      tableInstance.setData(rows);
    }
  };

  window.TabEU = TabEU;
})(window);
