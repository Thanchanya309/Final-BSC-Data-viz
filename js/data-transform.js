/**
 * data-transform.js - Data Aggregation and Transformation Layer
 * Strict adherence to Data Grain, reconciliation baselines, and cross-filter rules.
 */

(function(window) {
  'use strict';

  const DataTransform = {
    // Generate 36-month timeline (or filtered year/month timeline)
    getTimeline(filterYear, filterMonth) {
      const years = filterYear && filterYear !== 'all' ? [parseInt(filterYear, 10)] : [2020, 2021, 2022];
      const months = filterMonth && filterMonth !== 'all' ? [parseInt(filterMonth, 10)] : Array.from({length: 12}, (_, i) => i + 1);

      const timeline = [];
      years.forEach(y => {
        months.forEach(m => {
          const mStr = m < 10 ? `0${m}` : `${m}`;
          timeline.push({
            year: y,
            month: m,
            yearMonth: `${y}-${mStr}`,
            label: `${y}/${mStr}`
          });
        });
      });
      return timeline;
    },

    // ==========================================
    // TAB 1: AI INCIDENTS TRANSFORMATION
    // ==========================================
    transformAI(filters) {
      const raw = window.DATA_STORE ? window.DATA_STORE.aiIncidents : [];
      const { year, month, ai } = filters;

      // Filter rows
      const filtered = raw.filter(item => {
        if (year !== 'all' && item.year !== year) return false;
        if (month !== 'all' && item.month !== month) return false;
        if (ai.topicGroup !== 'all' && item.topicGroup !== ai.topicGroup) return false;
        if (ai.riskSubdomain !== 'all' && item.riskSubdomain !== ai.riskSubdomain) return false;
        return true;
      });

      // KPIs
      const distinctIds = new Set(filtered.map(r => r.id));
      const totalIncidents = distinctIds.size;
      const misinfoCount = filtered.filter(r => r.topicGroup === 'misinformation' || r.topicGroup === 'disinformation_influence').length;
      const fraudCount = filtered.filter(r => r.topicGroup === 'fraud_scams').length;

      // Chart A1: Monthly Trend (Full continuous timeline)
      const timeline = this.getTimeline(year, month);
      const monthlyCounts = {};
      timeline.forEach(t => monthlyCounts[t.yearMonth] = 0);
      filtered.forEach(r => {
        if (monthlyCounts[r.yearMonth] !== undefined) {
          monthlyCounts[r.yearMonth]++;
        }
      });
      const a1Data = {
        categories: timeline.map(t => t.yearMonth),
        values: timeline.map(t => monthlyCounts[t.yearMonth])
      };

      // Chart A2: Stacked Column by Year & Risk Type
      const years = year !== 'all' ? [year] : [2020, 2021, 2022];
      const riskTypes = ['misinformation', 'disinformation_influence', 'fraud_scams'];
      const riskTypeLabels = {
        'misinformation': 'ข้อมูลเท็จ/ชวนเข้าใจผิด',
        'disinformation_influence': 'ข้อมูลบิดเบือน/ปฏิบัติการอิทธิพล',
        'fraud_scams': 'การหลอกลวง/ฉ้อโกง'
      };
      const a2Series = riskTypes.map(rt => {
        return {
          name: riskTypeLabels[rt] || rt,
          rawType: rt,
          data: years.map(y => {
            return filtered.filter(r => r.year === y && r.topicGroup === rt).length;
          })
        };
      });

      // Chart A3: Ranked Risk Subdomains
      const subdomainsMap = {};
      filtered.forEach(r => {
        subdomainsMap[r.riskSubdomain] = (subdomainsMap[r.riskSubdomain] || 0) + 1;
      });
      const a3Data = Object.keys(subdomainsMap)
        .map(k => ({ name: k, count: subdomainsMap[k] }))
        .sort((a, b) => b.count - a.count);

      // Harmed Entities Frequency (Fallback view for A4)
      const harmedMap = {};
      const draftGroupMap = {};
      filtered.forEach(r => {
        if (r.harmed) {
          const parts = r.harmed.split(',').map(s => s.trim()).filter(Boolean);
          parts.forEach(p => {
            harmedMap[p] = (harmedMap[p] || 0) + 1;
          });
        }
        if (r.draftHarmedGroup) {
          draftGroupMap[r.draftHarmedGroup] = (draftGroupMap[r.draftHarmedGroup] || 0) + 1;
        }
      });
      const harmedRanked = Object.keys(harmedMap)
        .map(k => ({ name: k, count: harmedMap[k] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const draftGroupsRanked = Object.keys(draftGroupMap)
        .map(k => ({ name: k, count: draftGroupMap[k] }))
        .sort((a, b) => b.count - a.count);

      return {
        kpis: {
          totalIncidents,
          misinfoCount,
          fraudCount
        },
        chartA1: a1Data,
        chartA2: { years: years.map(String), series: a2Series },
        chartA3: a3Data,
        chartA4Fallback: harmedRanked,
        chartA4DraftGroups: draftGroupsRanked,
        tableRows: filtered
      };
    },

    // ==========================================
    // TAB 2: EUVSDISINFO TRANSFORMATION
    // ==========================================
    transformEU(filters) {
      const rawDebunks = window.DATA_STORE ? window.DATA_STORE.euDebunks : [];
      const rawArticles = window.DATA_STORE ? window.DATA_STORE.euArticles : [];
      const { year, month, eu } = filters;

      // Filter articles first according to filters
      let matchingArticles = rawArticles.filter(art => {
        if (year !== 'all' && art.year !== year) return false;
        if (month !== 'all' && art.month !== month) return false;
        if (eu.language !== 'all' && art.language !== eu.language) return false;
        if (eu.domain !== 'all' && art.domain !== eu.domain) return false;
        if (eu.articleClass !== 'all' && art.articleClass !== eu.articleClass) return false;
        return true;
      });

      // If language, domain, or articleClass is filtered, restrict debunks to those linked to matched articles
      const articleFilteredDebunkIds = (eu.language !== 'all' || eu.domain !== 'all' || eu.articleClass !== 'all')
        ? new Set(matchingArticles.map(a => a.debunkId))
        : null;

      // Filter debunks
      const filteredDebunks = rawDebunks.filter(deb => {
        if (year !== 'all' && deb.year !== year) return false;
        if (month !== 'all' && deb.month !== month) return false;
        if (eu.keyword !== 'all' && !deb.keywordsList.includes(eu.keyword)) return false;
        if (articleFilteredDebunkIds && !articleFilteredDebunkIds.has(deb.id)) return false;
        return true;
      });

      // Distinct debunk IDs
      const matchingDebunkIds = new Set(filteredDebunks.map(d => d.id));

      // Now ensure matchingArticles only contains articles linked to the filteredDebunks
      matchingArticles = matchingArticles.filter(art => matchingDebunkIds.has(art.debunkId));

      // KPIs
      // KPI 1: Distinct debunk count (NEVER multiplied by articles!)
      const totalDebunks = filteredDebunks.length;
      // KPI 2: Disinformation Article Associations
      const disinfoAssociations = matchingArticles.filter(a => a.articleClass === 'disinformation').length;
      // KPI 3: Distinct Languages
      const uniqueLanguages = new Set(matchingArticles.map(a => a.language).filter(l => l && l !== 'Unknown')).size;

      // Chart E1: Monthly Debunk Trend (Strictly distinct debunks)
      const timeline = this.getTimeline(year, month);
      const monthlyDebunks = {};
      timeline.forEach(t => monthlyDebunks[t.yearMonth] = 0);
      filteredDebunks.forEach(d => {
        if (monthlyDebunks[d.yearMonth] !== undefined) {
          monthlyDebunks[d.yearMonth]++;
        }
      });
      const e1Data = {
        categories: timeline.map(t => t.yearMonth),
        values: timeline.map(t => monthlyDebunks[t.yearMonth])
      };

      // Chart E2: Top 10 Keywords (Distinct debunks per keyword token)
      const keywordMap = {};
      filteredDebunks.forEach(d => {
        d.keywordsList.forEach(k => {
          keywordMap[k] = (keywordMap[k] || 0) + 1;
        });
      });
      const e2Data = Object.keys(keywordMap)
        .map(k => ({ name: k, count: keywordMap[k] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Chart E3: Article Classes by Year (Fallback: Article Associations by Class)
      const years = year !== 'all' ? [year] : [2020, 2021, 2022];
      const disinfoByYear = years.map(y => matchingArticles.filter(a => a.year === y && a.articleClass === 'disinformation').length);
      const trustworthyByYear = years.map(y => matchingArticles.filter(a => a.year === y && a.articleClass === 'trustworthy').length);
      const e3Data = {
        years: years.map(String),
        series: [
          { name: 'Disinformation (ข้อมูลบิดเบือน)', rawClass: 'disinformation', data: disinfoByYear, color: '#ef4444' },
          { name: 'Trustworthy (แหล่งเชื่อถือได้/อ้างอิง)', rawClass: 'trustworthy', data: trustworthyByYear, color: '#10b981' }
        ]
      };

      // Chart E4: Top 10 Languages (Article Associations)
      const langMap = {};
      matchingArticles.forEach(a => {
        if (a.language && a.language !== 'Unknown') {
          langMap[a.language] = (langMap[a.language] || 0) + 1;
        }
      });
      const e4Data = Object.keys(langMap)
        .map(k => ({ name: k, count: langMap[k] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Chart E5: Top 10 Domains (Article Associations)
      const domainMap = {};
      matchingArticles.forEach(a => {
        if (a.domain && a.domain !== 'Unknown') {
          domainMap[a.domain] = (domainMap[a.domain] || 0) + 1;
        }
      });
      const e5Data = Object.keys(domainMap)
        .map(k => ({ name: k, count: domainMap[k] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Build Table Rows: Join debunks with article details
      // Create debunk lookup for fast mapping
      const debunkMap = {};
      filteredDebunks.forEach(d => debunkMap[d.id] = d);

      const tableRows = matchingArticles.map(art => {
        const parentDebunk = debunkMap[art.debunkId];
        return {
          debunkId: art.debunkId,
          date: art.date,
          keywords: parentDebunk ? parentDebunk.keywords : '',
          articleClass: art.articleClass,
          language: art.language,
          domain: art.domain,
          url: art.url
        };
      });

      // Dynamic Insights for Tab 2
      const insights = this.generateEUInsights(filteredDebunks, matchingArticles, e2Data, e4Data, e5Data, filters);

      return {
        kpis: {
          totalDebunks,
          disinfoAssociations,
          uniqueLanguages
        },
        chartE1: e1Data,
        chartE2: e2Data,
        chartE3: e3Data,
        chartE4: e4Data,
        chartE5: e5Data,
        insights,
        tableRows
      };
    },

    generateEUInsights(debunks, articles, topKws, topLangs, topDomains, filters) {
      const insights = [];

      // 1. Keyword Insight
      if (topKws.length > 0) {
        const topKw = topKws[0];
        insights.push({
          title: 'คำสำคัญที่พบมากที่สุด',
          text: `คำสำคัญ <strong>"${topKw.name}"</strong> ปรากฏในเรื่องตรวจสอบมากที่สุดจำนวน <strong>${topKw.count.toLocaleString()} เรื่อง</strong> (คิดเป็น ${(topKw.count / Math.max(debunks.length, 1) * 100).toFixed(1)}% ของชุดข้อมูลที่เลือก)`
        });
      } else {
        insights.push({
          title: 'คำสำคัญ',
          text: 'ไม่พบคำสำคัญที่บันทึกไว้ตามเงื่อนไขตัวกรองปัจจุบัน'
        });
      }

      // 2. Trend Insight
      if (debunks.length > 0) {
        const byYear = {};
        debunks.forEach(d => byYear[d.year] = (byYear[d.year] || 0) + 1);
        const yKeys = Object.keys(byYear).sort();
        if (yKeys.length > 1) {
          const peakYear = yKeys.reduce((a, b) => byYear[a] > byYear[b] ? a : b);
          insights.push({
            title: 'แนวโน้มการตรวจสอบตามช่วงเวลา',
            text: `ปี <strong>${peakYear}</strong> มีจำนวนเรื่องที่ EUvsDisinfo ตรวจสอบสูงสุดจำนวน <strong>${byYear[peakYear].toLocaleString()} เรื่อง</strong> ภายในช่วงเวลาที่กรอง`
          });
        } else {
          insights.push({
            title: 'แนวโน้มการตรวจสอบ',
            text: `ในปี <strong>${yKeys[0]}</strong> มีจำนวนเรื่องที่ได้รับการตรวจสอบรวม <strong>${(byYear[yKeys[0]] || 0).toLocaleString()} เรื่อง</strong>`
          });
        }
      } else {
        insights.push({
          title: 'แนวโน้มการตรวจสอบ',
          text: 'ไม่มีเรื่องตรวจสอบในชุดข้อมูลตามเงื่อนไขที่เลือก'
        });
      }

      // 3. Language & Domain Insight
      if (topLangs.length > 0 && topDomains.length > 0) {
        insights.push({
          title: 'ภาษาและโดเมนในบทความที่เชื่อมโยง',
          text: `ภาษาที่พบมากที่สุดคือ <strong>${topLangs[0].name}</strong> (${topLangs[0].count.toLocaleString()} บทความ) และโดเมนที่ถูกบันทึกบ่อยที่สุดคือ <strong>${topDomains[0].name}</strong> (${topDomains[0].count.toLocaleString()} บทความ) โดยเป็นหน่วยนับความสัมพันธ์บทความ`
        });
      } else {
        insights.push({
          title: 'ภาษาและโดเมน',
          text: 'ไม่มีข้อมูลบทความที่ตรงกับตัวกรองเพื่อวิเคราะห์ภาษาและโดเมน'
        });
      }

      return insights;
    },

    // ==========================================
    // TAB 3: THAI AFNC TRANSFORMATION
    // ==========================================
    transformThai(filters) {
      const raw = window.DATA_STORE ? window.DATA_STORE.thaiVerdicts : [];
      const { year, month, thai, toggles } = filters;

      // Filter rows
      const filtered = raw.filter(post => {
        if (year !== 'all' && post.year !== year) return false;
        if (month !== 'all' && post.month !== month) return false;
        if (thai.verdictEn !== 'all' && post.verdictEn !== thai.verdictEn) return false;
        if (thai.categoryEn !== 'all' && post.categoryEn !== thai.categoryEn) return false;
        return true;
      });

      // KPIs
      const totalPosts = filtered.length;
      const fakePosts = filtered.filter(p => p.verdictEn === 'Fake').length;
      const distortedPosts = filtered.filter(p => p.verdictEn === 'Distorted').length;
      const truePosts = filtered.filter(p => p.verdictEn === 'True').length;

      const fakeDistortedShare = totalPosts > 0
        ? ((fakePosts + distortedPosts) / totalPosts * 100).toFixed(1)
        : null;

      // Special rule for Fake-only charts:
      // If user selected Verdict = 'True' or 'Distorted', fakePosts = 0 and fake-only charts should display warning
      const isFakeFilterConflict = thai.verdictEn === 'True';

      // Chart T1: Monthly Fake News Trend (Distinct fake posts)
      const timeline = this.getTimeline(year, month);
      const monthlyFakes = {};
      timeline.forEach(t => monthlyFakes[t.yearMonth] = 0);
      filtered.filter(p => p.verdictEn === 'Fake').forEach(p => {
        if (monthlyFakes[p.yearMonth] !== undefined) {
          monthlyFakes[p.yearMonth]++;
        }
      });
      const t1Data = {
        categories: timeline.map(t => t.yearMonth),
        values: timeline.map(t => monthlyFakes[t.yearMonth]),
        isConflict: isFakeFilterConflict
      };

      // Chart T2: Verdict Distribution by Year (Count ↔ 100% Stacked)
      const years = year !== 'all' ? [year] : [2020, 2021, 2022];
      const isPercentMode = toggles && toggles.thaiT2Mode === 'percent';

      const verdicts = [
        { en: 'Fake', th: 'ข่าวปลอม', color: '#ef4444' },
        { en: 'Distorted', th: 'ข่าวบิดเบือน', color: '#f59e0b' },
        { en: 'True', th: 'ข่าวจริง', color: '#10b981' }
      ];

      const t2Series = verdicts.map(v => {
        const counts = years.map(y => {
          return filtered.filter(p => p.year === y && p.verdictEn === v.en).length;
        });

        if (isPercentMode) {
          const percents = years.map((y, idx) => {
            const yearTotal = filtered.filter(p => p.year === y).length;
            if (yearTotal === 0) return 0;
            return parseFloat(((counts[idx] / yearTotal) * 100).toFixed(1));
          });
          return {
            name: `${v.th} (${v.en})`,
            rawVerdict: v.en,
            color: v.color,
            data: percents,
            rawCounts: counts
          };
        } else {
          return {
            name: `${v.th} (${v.en})`,
            rawVerdict: v.en,
            color: v.color,
            data: counts
          };
        }
      });

      // Chart T3: Most Common Fake News Categories
      const fakeOnlyList = filtered.filter(p => p.verdictEn === 'Fake');
      const catFakeMap = {};
      const catThMap = {};
      fakeOnlyList.forEach(p => {
        catFakeMap[p.categoryEn] = (catFakeMap[p.categoryEn] || 0) + 1;
        catThMap[p.categoryEn] = p.categoryTh;
      });

      let t3List = Object.keys(catFakeMap).map(k => ({
        en: k,
        th: catThMap[k] || k,
        count: catFakeMap[k]
      })).sort((a, b) => b.count - a.count);

      if (toggles && toggles.thaiT3Mode === 'top5') {
        t3List = t3List.slice(0, 5);
      }

      // Chart T4: Small Multiples for 3 Target Categories
      // 1. Finance & stocks, 2. Health products, 3. Government policy & news
      const targetCats = [
        { en: 'Finance & stocks', th: 'การเงิน-หุ้น', color: '#ec4899' },
        { en: 'Health products', th: 'ผลิตภัณฑ์สุขภาพ', color: '#06b6d4' },
        { en: 'Government policy & news', th: 'นโยบายรัฐบาล-ข่าวสาร', color: '#8b5cf6' }
      ];

      const t4Multiples = targetCats.map(cat => {
        const monthlyData = {};
        timeline.forEach(t => monthlyData[t.yearMonth] = 0);

        filtered.filter(p => p.verdictEn === 'Fake' && p.categoryEn === cat.en).forEach(p => {
          if (monthlyData[p.yearMonth] !== undefined) {
            monthlyData[p.yearMonth]++;
          }
        });

        return {
          categoryEn: cat.en,
          categoryTh: cat.th,
          color: cat.color,
          timeline: timeline.map(t => t.yearMonth),
          values: timeline.map(t => monthlyData[t.yearMonth])
        };
      });

      // Find global max across all 3 small multiples so they share identical Y-axis scale!
      let globalMaxY = 10;
      t4Multiples.forEach(m => {
        const maxVal = Math.max(...m.values, 0);
        if (maxVal > globalMaxY) globalMaxY = maxVal;
      });
      // Round up to nice number
      globalMaxY = Math.ceil(globalMaxY * 1.15);

      return {
        kpis: {
          totalPosts,
          fakePosts,
          distortedPosts,
          truePosts,
          fakeDistortedShare
        },
        chartT1: t1Data,
        chartT2: {
          years: years.map(String),
          series: t2Series,
          isPercentMode
        },
        chartT3: {
          categories: t3List,
          isConflict: isFakeFilterConflict
        },
        chartT4: {
          multiples: t4Multiples,
          globalMaxY,
          isConflict: isFakeFilterConflict
        },
        tableRows: filtered
      };
    }
  };

  window.DataTransform = DataTransform;
})(window);
