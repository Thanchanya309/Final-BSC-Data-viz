/**
 * state.js - Centralized Filter State & Event Dispatcher
 * Manages shared Year/Month filters and tab-specific local filters.
 */

(function(window) {
  'use strict';

  const initialState = {
    activeTab: 'ai', // 'ai' | 'eu' | 'thai'
    filters: {
      // Shared Global Filters (Persist across tabs)
      year: 'all',  // 'all' | 2020 | 2021 | 2022
      month: 'all', // 'all' | 1 .. 12

      // Local Tab 1 Filters (AI Risks)
      ai: {
        topicGroup: 'all',
        riskSubdomain: 'all'
      },

      // Local Tab 2 Filters (EU Disinformation)
      eu: {
        keyword: 'all',
        language: 'all',
        domain: 'all',
        articleClass: 'all'
      },

      // Local Tab 3 Filters (Thai AFNC)
      thai: {
        verdictEn: 'all',  // 'Fake' | 'Distorted' | 'True'
        categoryEn: 'all'  // Category name
      }
    },
    // View Toggles
    toggles: {
      thaiT2Mode: 'count', // 'count' | 'percent' (100% stacked)
      thaiT3Mode: 'top5'   // 'top5' | 'all'
    }
  };

  class StateStore {
    constructor() {
      this.state = JSON.parse(JSON.stringify(initialState));
      this.listeners = [];
    }

    getState() {
      return this.state;
    }

    subscribe(fn) {
      this.listeners.push(fn);
      return () => {
        this.listeners = this.listeners.filter(l => l !== fn);
      };
    }

    notify(changeType, payload) {
      this.listeners.forEach(fn => fn(this.state, changeType, payload));
    }

    setActiveTab(tabName) {
      if (this.state.activeTab !== tabName) {
        this.state.activeTab = tabName;
        this.notify('TAB_CHANGED', tabName);
      }
    }

    setYear(year) {
      this.state.filters.year = year === 'all' ? 'all' : parseInt(year, 10);
      this.notify('FILTER_CHANGED', { filter: 'year', value: this.state.filters.year });
    }

    setMonth(month) {
      this.state.filters.month = month === 'all' ? 'all' : parseInt(month, 10);
      this.notify('FILTER_CHANGED', { filter: 'month', value: this.state.filters.month });
    }

    setAIFilter(key, value) {
      if (this.state.filters.ai[key] === value) {
        // Clicking same value toggles off (cross-filter reset)
        this.state.filters.ai[key] = 'all';
      } else {
        this.state.filters.ai[key] = value;
      }
      this.notify('FILTER_CHANGED', { tab: 'ai', filter: key, value: this.state.filters.ai[key] });
    }

    setEUFilter(key, value) {
      if (this.state.filters.eu[key] === value) {
        // Toggle off
        this.state.filters.eu[key] = 'all';
      } else {
        this.state.filters.eu[key] = value;
      }
      this.notify('FILTER_CHANGED', { tab: 'eu', filter: key, value: this.state.filters.eu[key] });
    }

    setThaiFilter(key, value) {
      if (this.state.filters.thai[key] === value) {
        // Toggle off
        this.state.filters.thai[key] = 'all';
      } else {
        this.state.filters.thai[key] = value;
      }
      this.notify('FILTER_CHANGED', { tab: 'thai', filter: key, value: this.state.filters.thai[key] });
    }

    setToggle(key, value) {
      this.state.toggles[key] = value;
      this.notify('TOGGLE_CHANGED', { toggle: key, value });
    }

    clearTabFilters(tabName) {
      const targetTab = tabName || this.state.activeTab;
      if (targetTab === 'ai') {
        this.state.filters.ai = { topicGroup: 'all', riskSubdomain: 'all' };
      } else if (targetTab === 'eu') {
        this.state.filters.eu = { keyword: 'all', language: 'all', domain: 'all', articleClass: 'all' };
      } else if (targetTab === 'thai') {
        this.state.filters.thai = { verdictEn: 'all', categoryEn: 'all' };
      }
      this.notify('TAB_FILTERS_CLEARED', targetTab);
    }

    clearAllFilters() {
      this.state.filters.year = 'all';
      this.state.filters.month = 'all';
      this.state.filters.ai = { topicGroup: 'all', riskSubdomain: 'all' };
      this.state.filters.eu = { keyword: 'all', language: 'all', domain: 'all', articleClass: 'all' };
      this.state.filters.thai = { verdictEn: 'all', categoryEn: 'all' };
      this.notify('ALL_FILTERS_CLEARED');
    }

    getActiveFilterChips() {
      const chips = [];
      const { filters, activeTab } = this.state;

      // Global filters
      if (filters.year !== 'all') {
        chips.push({ id: 'year', label: `ปี: ${filters.year}`, type: 'global', key: 'year' });
      }
      if (filters.month !== 'all') {
        const monthNames = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        chips.push({ id: 'month', label: `เดือน: ${monthNames[filters.month]} (${filters.month})`, type: 'global', key: 'month' });
      }

      // Tab specific chips
      if (activeTab === 'ai') {
        if (filters.ai.topicGroup !== 'all') {
          chips.push({ id: 'ai-group', label: `กลุ่มความเสี่ยง: ${filters.ai.topicGroup}`, tab: 'ai', key: 'topicGroup' });
        }
        if (filters.ai.riskSubdomain !== 'all') {
          chips.push({ id: 'ai-subdomain', label: `หมวดย่อย: ${filters.ai.riskSubdomain}`, tab: 'ai', key: 'riskSubdomain' });
        }
      } else if (activeTab === 'eu') {
        if (filters.eu.keyword !== 'all') {
          chips.push({ id: 'eu-keyword', label: `คำสำคัญ: ${filters.eu.keyword}`, tab: 'eu', key: 'keyword' });
        }
        if (filters.eu.language !== 'all') {
          chips.push({ id: 'eu-language', label: `ภาษา: ${filters.eu.language}`, tab: 'eu', key: 'language' });
        }
        if (filters.eu.domain !== 'all') {
          chips.push({ id: 'eu-domain', label: `โดเมน: ${filters.eu.domain}`, tab: 'eu', key: 'domain' });
        }
        if (filters.eu.articleClass !== 'all') {
          chips.push({ id: 'eu-class', label: `ประเภทบทความ: ${filters.eu.articleClass}`, tab: 'eu', key: 'articleClass' });
        }
      } else if (activeTab === 'thai') {
        if (filters.thai.verdictEn !== 'all') {
          const vMap = { 'Fake': 'ข่าวปลอม', 'Distorted': 'ข่าวบิดเบือน', 'True': 'ข่าวจริง' };
          chips.push({ id: 'thai-verdict', label: `ผลตรวจสอบ: ${vMap[filters.thai.verdictEn] || filters.thai.verdictEn}`, tab: 'thai', key: 'verdictEn' });
        }
        if (filters.thai.categoryEn !== 'all') {
          chips.push({ id: 'thai-category', label: `หมวด: ${filters.thai.categoryEn}`, tab: 'thai', key: 'categoryEn' });
        }
      }

      return chips;
    }

    removeFilterChip(chip) {
      if (chip.type === 'global') {
        if (chip.key === 'year') this.setYear('all');
        if (chip.key === 'month') this.setMonth('all');
      } else if (chip.tab === 'ai') {
        this.setAIFilter(chip.key, 'all');
      } else if (chip.tab === 'eu') {
        this.setEUFilter(chip.key, 'all');
      } else if (chip.tab === 'thai') {
        this.setThaiFilter(chip.key, 'all');
      }
    }
  }

  window.AppStore = new StateStore();
})(window);
