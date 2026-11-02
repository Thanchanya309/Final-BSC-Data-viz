/**
 * tab-ai.js - Tab 1: AI Risks
 * Visualizes AI incidents related to misinformation, disinformation, and fraud.
 */

(function(window) {
  'use strict';

  let tableInstance = null;

  const TabAI = {
    render() {
      const state = window.AppStore.getState();
      const data = window.DataTransform.transformAI(state.filters);

      // 1. Render KPIs
      this.renderKPIs(data.kpis);

      // 2. Render Key Insights
      this.renderInsights(data);

      // 3. Render Charts
      this.renderChartA1(data.chartA1);
      this.renderChartA2(data.chartA2);
      this.renderChartA3(data.chartA3);
      this.renderChartA4Fallback(data.chartA4Fallback, data.chartA4DraftGroups);

      // 4. Render Table
      this.renderTable(data.tableRows);
    },

    renderKPIs(kpis) {
      window.KPICard.render('ai-kpi-container', [
        {
          label: 'จำนวนเหตุการณ์ AI ที่เข้าเกณฑ์ทั้งหมด (Total Incidents)',
          value: kpis.totalIncidents.toLocaleString(),
          unit: 'เหตุการณ์',
          badge: 'Distinct incident_id',
          badgeColor: 'var(--accent-ai)',
          subtext: '3 Risk Subdomains ที่ศึกษา'
        },
        {
          label: 'เหตุการณ์ข้อมูลผิดและข้อมูลบิดเบือน (Mis/Disinformation)',
          value: kpis.misinfoCount.toLocaleString(),
          unit: 'เหตุการณ์',
          badge: `${kpis.totalIncidents > 0 ? ((kpis.misinfoCount / kpis.totalIncidents) * 100).toFixed(1) : 0}% ของที่เลือก`,
          badgeColor: '#3b82f6',
          subtext: 'ข้อมูลเท็จ + อิทธิพลบิดเบือน'
        },
        {
          label: 'เหตุการณ์หลอกลวงและฉ้อโกง (Fraud & Scams)',
          value: kpis.fraudCount.toLocaleString(),
          unit: 'เหตุการณ์',
          badge: `${kpis.totalIncidents > 0 ? ((kpis.fraudCount / kpis.totalIncidents) * 100).toFixed(1) : 0}% ของที่เลือก`,
          badgeColor: '#ec4899',
          subtext: 'Deepfake & กลโกงชี้นำเป้าหมาย'
        }
      ]);
    },

    renderInsights(data) {
      const kpis = data.kpis;
      const topSubdomain = data.chartA3.length > 0 ? data.chartA3[0] : null;

      const insightsList = [
        {
          text: `ในชุดข้อมูลเหตุการณ์ AI ที่เลือก <strong>${kpis.totalIncidents} เหตุการณ์</strong> พบความเสี่ยงกลุ่มการหลอกลวงและฉ้อโกง (Fraud & Scams) จำนวน <strong>${kpis.fraudCount} เหตุการณ์</strong> และกลุ่มข้อมูลผิด/บิดเบือน <strong>${kpis.misinfoCount} เหตุการณ์</strong>`
        },
        {
          text: topSubdomain ? `หมวดย่อยความเสี่ยงที่ถูกบันทึกมากที่สุดคือ <strong>"${topSubdomain.name}"</strong> มีจำนวน <strong>${topSubdomain.count} เหตุการณ์</strong>` : `ไม่มีข้อมูลหมวดย่อยความเสี่ยงในตัวกรองปัจจุบัน`
        },
        {
          text: `ข้อมูลเป็นเหตุการณ์ย่อย (Subset) จำนวน 59 รายการที่เข้าเกณฑ์ โดยมีการบันทึกใน 27 จาก 36 เดือน การไม่มีรายการในบางเดือนสะท้อนการบันทึกในฐานข้อมูล ไม่ใช่หลักฐานว่าไม่มีความเสี่ยงเกิดขึ้นจริงในโลก`
        }
      ];

      window.Insights.render('ai-insights-container', 'ai', insightsList);
    },

    renderChartA1(chartData) {
      const chart = window.ChartManager.getOrCreate('chart-a1');
      if (!chart) return;

      const option = {
        ...window.ChartManager.getBaseOptions(),
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const p = params[0];
            return `<strong>${p.name}</strong><br/>จำนวนเหตุการณ์ AI: <strong>${p.value}</strong> เหตุการณ์<br/><span style="font-size: 11px; color:#94a3b8;">คลิกเพื่อกรองช่วงเวลา</span>`;
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
          name: 'AI Incidents',
          type: 'line',
          data: chartData.values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#8b5cf6' },
          lineStyle: { width: 3, color: '#8b5cf6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(139, 92, 246, 0.35)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.0)' }
            ])
          }
        }]
      };

      chart.setOption(option, true);

      // Click to filter by year/month
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

    renderChartA2(chartData) {
      const chart = window.ChartManager.getOrCreate('chart-a2');
      if (!chart) return;

      const colors = ['#3b82f6', '#06b6d4', '#ec4899'];

      const option = {
        ...window.ChartManager.getBaseOptions(),
        legend: {
          top: '3%',
          textStyle: { color: '#94a3b8', fontSize: 11 }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        xAxis: {
          type: 'category',
          data: chartData.years,
          axisLabel: { color: '#94a3b8', fontSize: 12 },
          axisLine: { lineStyle: { color: '#334155' } }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: '#94a3b8', fontSize: 11 },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        series: chartData.series.map((s, idx) => ({
          name: s.name,
          type: 'bar',
          stack: 'total',
          data: s.data,
          itemStyle: { color: colors[idx % colors.length] },
          rawType: s.rawType
        }))
      };

      chart.setOption(option, true);

      chart.off('click');
      chart.on('click', (params) => {
        if (params.componentType === 'series') {
          const s = chartData.series[params.seriesIndex];
          if (s && s.rawType) {
            window.AppStore.setAIFilter('topicGroup', s.rawType);
          }
        }
      });
    },

    renderChartA3(chartData) {
      const chart = window.ChartManager.getOrCreate('chart-a3');
      if (!chart) return;

      const names = chartData.map(d => d.name);
      const counts = chartData.map(d => d.count);

      const option = {
        ...window.ChartManager.getBaseOptions(),
        tooltip: {
          trigger: 'item',
          formatter: '{b}: <strong>{c}</strong> เหตุการณ์'
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
            formatter: (val) => {
              if (val.length > 32) return val.substring(0, 30) + '...';
              return val;
            }
          },
          axisLine: { lineStyle: { color: '#334155' } }
        },
        series: [{
          name: 'Incidents',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#8b5cf6' },
              { offset: 1, color: '#a78bfa' }
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
          window.AppStore.setAIFilter('riskSubdomain', params.name);
        }
      });
    },

    renderChartA4Fallback(entities, draftGroups) {
      const container = document.getElementById('chart-a4-fallback-content');
      if (!container) return;

      const currentMode = this.a4Mode || 'raw'; // 'raw' | 'draft'

      container.innerHTML = `
        <div class="fallback-entity-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.78rem; font-weight: 600; color: #a78bfa;">
              ${currentMode === 'raw' ? 'โหมด: ข้อความจริงจากฐานข้อมูล (Verified Raw Text)' : 'โหมด: ร่างจัดกลุ่ม 5 หมวด (Draft Taxonomy - ยังไม่ผ่านการรับรอง)'}
            </span>
            <div class="chart-toggle-group">
              <button class="chart-toggle-btn ${currentMode === 'raw' ? 'active' : ''}" id="toggle-a4-raw">Recorded Text</button>
              <button class="chart-toggle-btn ${currentMode === 'draft' ? 'active' : ''}" id="toggle-a4-draft">Draft 5 Groups</button>
            </div>
          </div>

          ${currentMode === 'raw' ? `
            <p style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 0.5rem; line-height: 1.45;">
              <strong>หมายเหตุความโปร่งใสทางข้อมูล (Data Transparency):</strong>
              ข้อมูลกลุ่มผู้ได้รับผลกระทบใน AIID บันทึกเป็นข้อความอิสระและยังไม่มีอนุกรมวิธานมาตรฐานที่ผ่านการตรวจรับรอง จึงแสดงรายการตามบันทึกจริงเพื่อป้องกันการจัดกลุ่มผิดพลาด (คลิกป้ายเพื่อค้นหาในตาราง):
            </p>
            <div class="entity-list-tags">
              ${entities.map(e => `
                <span class="entity-tag" style="cursor: pointer;" title="คลิกเพื่อค้นหาในตาราง">
                  <strong>${e.name}</strong> (${e.count})
                </span>
              `).join('')}
            </div>
          ` : `
            <p style="font-size: 0.8rem; color: #fbbf24; margin-bottom: 0.5rem; line-height: 1.45;">
              <strong>คำเตือน (Audit Gate Alert):</strong>
              ร่างการจัดกลุ่มนี้มาจากไฟล์ <code>mappings/ai_harmed_mapping_draft.csv</code> ซึ่งอยู่ในสถานะ Draft ยังไม่ผ่านการตรวจรับรองทางวิชาการ ห้ามนำไปอ้างอิงเป็นข้อเท็จจริงสรุป:
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.5rem;">
              ${draftGroups.map(g => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 0.35rem 0.65rem; border-radius: 4px; font-size: 0.82rem;">
                  <span>${g.name}</span>
                  <span style="font-weight: 600; color: #a78bfa;">${g.count} เหตุการณ์</span>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;

      // Event listeners for toggle
      const btnRaw = container.querySelector('#toggle-a4-raw');
      const btnDraft = container.querySelector('#toggle-a4-draft');

      if (btnRaw) {
        btnRaw.addEventListener('click', () => {
          this.a4Mode = 'raw';
          this.renderChartA4Fallback(entities, draftGroups);
        });
      }
      if (btnDraft) {
        btnDraft.addEventListener('click', () => {
          this.a4Mode = 'draft';
          this.renderChartA4Fallback(entities, draftGroups);
        });
      }

      // Clicking tag filters search in table
      container.querySelectorAll('.entity-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          const text = tag.querySelector('strong').innerText;
          if (tableInstance) {
            tableInstance.setSearch(text);
            const tableElem = document.getElementById('ai-table-container');
            if (tableElem) tableElem.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });
    },

    renderTable(rows) {
      if (!tableInstance) {
        tableInstance = new window.DataTable({
          containerId: 'ai-table-container',
          defaultSortKey: 'date',
          defaultSortOrder: 'desc',
          exportFilename: 'ai_incidents_filtered.csv',
          columns: [
            { key: 'id', label: 'Incident ID', sortable: true, render: (val, r) => `<span style="font-family: var(--font-mono); font-weight: 600;">#${val}</span>` },
            { key: 'date', label: 'วันที่บันทึก', sortable: true },
            { key: 'title', label: 'ชื่อเหตุการณ์', sortable: true, render: (val) => `<strong>${val}</strong>` },
            { key: 'riskSubdomain', label: 'หมวดย่อยความเสี่ยง', sortable: true },
            { key: 'harmed', label: 'ผู้ได้รับผลกระทบ (ตามบันทึก)', sortable: true, render: (val) => val ? `<span style="font-size: 0.8rem; color: var(--text-secondary);">${val}</span>` : '—' },
            { key: 'description', label: 'รายละเอียด', sortable: false, render: (val) => `<div style="max-width: 320px; font-size: 0.8rem; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${val}</div>` },
            {
              key: 'url',
              label: 'แหล่งอ้างอิง',
              sortable: false,
              render: (val) => val ? `<a href="${val}" target="_blank" rel="noopener noreferrer" class="table-link">AIID <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg></a>` : 'N/A'
            }
          ]
        });
      }
      tableInstance.setData(rows);
    }
  };

  window.TabAI = TabAI;
})(window);
