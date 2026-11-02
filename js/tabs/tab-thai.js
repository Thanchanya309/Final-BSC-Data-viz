/**
 * tab-thai.js - Tab 3: Thai Fake News (AFNC)
 * Visualizes verified posts, verdict proportions, fake categories, and small multiples.
 */

(function(window) {
  'use strict';

  let tableInstance = null;

  const TabThai = {
    render() {
      const state = window.AppStore.getState();
      const data = window.DataTransform.transformThai({
        ...state.filters,
        toggles: state.toggles
      });

      // 1. Render KPIs
      this.renderKPIs(data.kpis);

      // 2. Render Key Insights
      this.renderInsights(data);

      // 3. Render Charts
      this.renderChartT1(data.chartT1);
      this.renderChartT2(data.chartT2);
      this.renderChartT3(data.chartT3);
      this.renderChartT4(data.chartT4);

      // 4. Render Table
      this.renderTable(data.tableRows);
    },

    renderKPIs(kpis) {
      window.KPICard.render('thai-kpi-container', [
        {
          label: 'จำนวนโพสต์ที่ตรวจสอบทั้งหมด (Total Verified Posts)',
          value: kpis.totalPosts.toLocaleString(),
          unit: 'โพสต์',
          badge: 'Distinct post_id',
          badgeColor: 'var(--accent-thai)',
          subtext: 'ผลการตรวจสอบโดย AFNC'
        },
        {
          label: 'ข่าวที่ได้รับผล "ข่าวปลอม" (Fake News Posts)',
          value: kpis.fakePosts.toLocaleString(),
          unit: 'โพสต์',
          badge: `${kpis.totalPosts > 0 ? ((kpis.fakePosts / kpis.totalPosts) * 100).toFixed(1) : 0}% ของทั้งหมด`,
          badgeColor: '#ef4444',
          subtext: 'verdict = Fake'
        },
        {
          label: 'สัดส่วนข่าวปลอม + ข่าวบิดเบือน (Fake + Distorted Share)',
          value: kpis.fakeDistortedShare !== null ? `${kpis.fakeDistortedShare}%` : 'ไม่มีข้อมูล',
          unit: '',
          badge: '(Fake + Distorted) / Total',
          badgeColor: '#f59e0b',
          subtext: 'สัดส่วนต่อโพสต์คำตัดสิน'
        }
      ]);
    },

    renderInsights(data) {
      const kpis = data.kpis;
      const topCat = data.chartT3.categories.length > 0 ? data.chartT3.categories[0] : null;

      const insightsList = [
        {
          text: `ในชุดข้อมูลข่าวที่ AFNC ตรวจสอบที่เลือก <strong>${kpis.totalPosts.toLocaleString()} รายการ</strong> มีข่าวที่ถูกตัดสินเป็นข่าวปลอม (Fake) สูงถึง <strong>${kpis.fakePosts.toLocaleString()} รายการ</strong> (สัดส่วนข่าวปลอมรวมบิดเบือนอยู่ที่ <strong>${kpis.fakeDistortedShare || 'N/A'}%</strong>)`
        },
        {
          text: topCat ? `หมวดที่พบข่าวปลอมมากที่สุดในชุดข้อมูลที่เลือกคือ <strong>"${topCat.th}"</strong> มีจำนวน <strong>${topCat.count.toLocaleString()} ข่าว</strong>` : `ไม่มีข้อมูลหมวดหมู่ข่าวปลอมตามเงื่อนไขตัวกรอง`
        },
        {
          text: `เมื่อวิเคราะห์เปรียบเทียบ 3 หมวดสำคัญ (T4) ข่าวปลอมด้านการเงิน-หุ้นเพิ่มขึ้นอย่างก้าวกระโดดในปี 2022 (จาก 24 ข่าวในปี 2020 เป็น 381 ข่าวในปี 2022) โดยตัวเลขนี้สะท้อนปริมาณที่ได้รับคำตัดสิน ไม่ใช่มูลค่าความเสียหายหรือจำนวนผู้เสียหายทั้งหมด`
        }
      ];

      window.Insights.render('thai-insights-container', 'thai', insightsList);
    },

    renderChartT1(chartData) {
      const chartDom = document.getElementById('chart-t1');
      if (!chartDom) return;

      if (chartData.isConflict) {
        chartDom.innerHTML = `
          <div class="empty-state-container">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div class="empty-state-title">ไม่พบข้อมูลตามเงื่อนไขตัวกรอง</div>
            <div class="empty-state-desc">ขณะนี้เลือกผลการตรวจสอบเป็น "ข่าวจริง (True)" กราฟนี้แสดงเฉพาะรายการ "ข่าวปลอม (Fake)" จึงไม่มีข้อมูลตรงเงื่อนไข</div>
            <button class="btn-secondary" onclick="window.AppStore.setThaiFilter('verdictEn', 'all')">แสดงข่าวทุกคำตัดสิน</button>
          </div>
        `;
        return;
      }

      const chart = window.ChartManager.getOrCreate('chart-t1');
      if (!chart) return;

      const option = {
        ...window.ChartManager.getBaseOptions(),
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const p = params[0];
            return `<strong>${p.name}</strong><br/>ข่าวปลอม: <strong>${p.value}</strong> ข่าว<br/><span style="font-size: 11px; color:#94a3b8;">คลิกเพื่อกรองช่วงเวลา</span>`;
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
          name: 'Fake News',
          type: 'line',
          data: chartData.values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: { color: '#ef4444' },
          lineStyle: { width: 2.5, color: '#ef4444' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(239, 68, 68, 0.35)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.0)' }
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

    renderChartT2(chartData) {
      const chart = window.ChartManager.getOrCreate('chart-t2');
      if (!chart) return;

      const isPercent = chartData.isPercentMode;

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
              const s = chartData.series[p.seriesIndex];
              const rawCount = s.rawCounts ? s.rawCounts[p.dataIndex] : p.value;
              if (isPercent) {
                res += `${p.marker} ${p.seriesName}: <strong>${p.value}%</strong> (${rawCount.toLocaleString()} โพสต์)<br/>`;
              } else {
                res += `${p.marker} ${p.seriesName}: <strong>${p.value.toLocaleString()}</strong> โพสต์<br/>`;
              }
            });
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
          max: isPercent ? 100 : null,
          axisLabel: {
            color: '#94a3b8',
            fontSize: 11,
            formatter: isPercent ? '{value}%' : '{value}'
          },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        series: chartData.series.map(s => ({
          name: s.name,
          type: 'bar',
          stack: 'total',
          data: s.data,
          itemStyle: { color: s.color },
          rawVerdict: s.rawVerdict
        }))
      };

      chart.setOption(option, true);

      chart.off('click');
      chart.on('click', (params) => {
        if (params.componentType === 'series') {
          const s = chartData.series[params.seriesIndex];
          if (s && s.rawVerdict) {
            window.AppStore.setThaiFilter('verdictEn', s.rawVerdict);
          }
        }
      });
    },

    renderChartT3(chartData) {
      const chartDom = document.getElementById('chart-t3');
      if (!chartDom) return;

      if (chartData.isConflict) {
        chartDom.innerHTML = `
          <div class="empty-state-container">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div class="empty-state-title">ไม่พบข้อมูลตามเงื่อนไขตัวกรอง</div>
            <div class="empty-state-desc">ขณะนี้เลือกผลการตรวจสอบเป็น "ข่าวจริง (True)" จึงไม่มีอันดับหมวดหมู่ข่าวปลอม (Fake) ให้แสดงผล</div>
          </div>
        `;
        return;
      }

      const chart = window.ChartManager.getOrCreate('chart-t3');
      if (!chart) return;

      const names = chartData.categories.map(c => c.th);
      const counts = chartData.categories.map(c => c.count);

      const option = {
        ...window.ChartManager.getBaseOptions(),
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            const item = chartData.categories[params.dataIndex];
            return `<strong>${item.th}</strong> (${item.en})<br/>ข่าวปลอม: <strong>${item.count.toLocaleString()}</strong> โพสต์<br/><span style="font-size: 11px; color:#94a3b8;">คลิกเพื่อกรองหมวดหมู่</span>`;
          }
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
          axisLabel: { color: '#f8fafc', fontSize: 11 },
          axisLine: { lineStyle: { color: '#334155' } }
        },
        series: [{
          name: 'Fake Categories',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#dc2626' },
              { offset: 1, color: '#f87171' }
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
        const item = chartData.categories[params.dataIndex];
        if (item && item.en) {
          // Important: Filters by category ONLY, does NOT force verdict=Fake on whole tab!
          window.AppStore.setThaiFilter('categoryEn', item.en);
        }
      });
    },

    renderChartT4(chartData) {
      const containerDom = document.getElementById('chart-t4-container');
      if (!containerDom) return;

      if (chartData.isConflict) {
        containerDom.innerHTML = `
          <div class="empty-state-container" style="grid-column: 1 / -1;">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div class="empty-state-title">ไม่พบข้อมูลตามเงื่อนไขตัวกรอง</div>
            <div class="empty-state-desc">การเปรียบเทียบ 3 หมวด (Small Multiples) นับเฉพาะข่าวปลอม (Fake) ซึ่งไม่มีข้อมูลภายใต้ตัวกรอง "ข่าวจริง (True)"</div>
          </div>
        `;
        return;
      }

      containerDom.innerHTML = `
        <div class="bento-chart-grid-3col" style="margin-bottom: 0;">
          ${chartData.multiples.map((m, idx) => `
            <div class="chart-card" style="padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 0.95rem; font-weight: 600; color: #f8fafc;">${m.categoryTh}</span>
                <span class="badge-tag" style="font-size: 0.72rem; margin: 0; background: ${m.color}22; color: ${m.color}; border-color: ${m.color}44;">
                  ${m.categoryEn}
                </span>
              </div>
              <div id="chart-t4-sub-${idx}" style="height: 220px; width: 100%;"></div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary); margin-top: 0.5rem; text-align: right;">
                แกน Y สูงสุดร่วมกัน: ${chartData.globalMaxY}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Render 3 synchronized mini line charts with IDENTICAL Y-scale
      chartData.multiples.forEach((m, idx) => {
        const domId = `chart-t4-sub-${idx}`;
        const subChart = window.echarts.init(document.getElementById(domId), 'dark', { renderer: 'svg' });

        const subOption = {
          ...window.ChartManager.getBaseOptions(),
          grid: {
            left: '8%',
            right: '5%',
            bottom: '18%',
            top: '12%',
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            formatter: (params) => {
              const p = params[0];
              return `<strong>${m.categoryTh}</strong> (${p.name})<br/>ข่าวปลอม: <strong>${p.value}</strong> ข่าว`;
            }
          },
          xAxis: {
            type: 'category',
            data: m.timeline,
            axisLabel: {
              color: '#94a3b8',
              fontSize: 9,
              interval: 4,
              rotate: 30
            },
            axisLine: { lineStyle: { color: '#334155' } }
          },
          yAxis: {
            type: 'value',
            min: 0,
            max: chartData.globalMaxY, // SHARED Y-SCALE ACROSS ALL THREE!
            axisLabel: { color: '#94a3b8', fontSize: 10 },
            splitLine: { lineStyle: { color: '#1e293b' } }
          },
          series: [{
            name: m.categoryTh,
            type: 'line',
            data: m.values,
            smooth: true,
            symbol: 'circle',
            symbolSize: 4,
            itemStyle: { color: m.color },
            lineStyle: { width: 2, color: m.color },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: `${m.color}44` },
                { offset: 1, color: `${m.color}00` }
              ])
            }
          }]
        };

        subChart.setOption(subOption);

        subChart.on('click', () => {
          window.AppStore.setThaiFilter('categoryEn', m.categoryEn);
        });

        window.addEventListener('resize', () => subChart.resize());
      });
    },

    renderTable(rows) {
      if (!tableInstance) {
        tableInstance = new window.DataTable({
          containerId: 'thai-table-container',
          defaultSortKey: 'date',
          defaultSortOrder: 'desc',
          exportFilename: 'thai_afnc_filtered.csv',
          columns: [
            { key: 'id', label: 'Post ID', sortable: true, render: (val) => `<span style="font-family: var(--font-mono); font-weight: 600;">#${val}</span>` },
            { key: 'date', label: 'วันที่เผยแพร่', sortable: true },
            { key: 'title', label: 'หัวข้อข่าวที่ตรวจสอบ', sortable: true, render: (val) => `<strong>${val}</strong>` },
            { key: 'categoryTh', label: 'หมวดหมู่ข่าว', sortable: true },
            {
              key: 'verdictEn',
              label: 'ผลการตรวจสอบ',
              sortable: true,
              render: (val, r) => {
                if (val === 'Fake') return `<span class="badge-verdict fake">ข่าวปลอม (Fake)</span>`;
                if (val === 'Distorted') return `<span class="badge-verdict distorted">ข่าวบิดเบือน (Distorted)</span>`;
                if (val === 'True') return `<span class="badge-verdict true">ข่าวจริง (True)</span>`;
                return `<span class="badge-verdict">${r.verdictTh || val}</span>`;
              }
            },
            { key: 'agency', label: 'หน่วยงานร่วมตรวจสอบ', sortable: true },
            {
              key: 'url',
              label: 'แหล่งอ้างอิง',
              sortable: false,
              render: (val) => val ? `<a href="${val}" target="_blank" rel="noopener noreferrer" class="table-link">AFNC <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg></a>` : 'N/A'
            }
          ]
        });
      }
      tableInstance.setData(rows);
    }
  };

  window.TabThai = TabThai;
})(window);
