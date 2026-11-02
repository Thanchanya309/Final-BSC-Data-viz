/**
 * data-table.js - Interactive Evidence Data Table Component
 * Supports search, sorting, pagination, CSV export, and safe links.
 */

(function(window) {
  'use strict';

  class DataTable {
    constructor(options) {
      this.containerId = options.containerId;
      this.columns = options.columns; // [{ key, label, sortable, render }]
      this.pageSize = options.pageSize || 10;
      this.currentPage = 1;
      this.searchQuery = '';
      this.sortKey = options.defaultSortKey || '';
      this.sortOrder = options.defaultSortOrder || 'desc'; // 'asc' | 'desc'
      this.rawData = [];
      this.filteredData = [];
      this.exportFilename = options.exportFilename || 'filtered_data.csv';
    }

    setData(data) {
      this.rawData = data || [];
      this.currentPage = 1;
      this.applyFilterAndSort();
      this.render();
    }

    setSearch(query) {
      this.searchQuery = (query || '').toLowerCase().trim();
      this.currentPage = 1;
      this.applyFilterAndSort();
      this.render();
    }

    setSort(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
      this.applyFilterAndSort();
      this.render();
    }

    setPage(page) {
      this.currentPage = page;
      this.render();
    }

    applyFilterAndSort() {
      let result = [...this.rawData];

      // Search filter
      if (this.searchQuery) {
        result = result.filter(row => {
          return this.columns.some(col => {
            const val = row[col.key];
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(this.searchQuery);
          });
        });
      }

      // Sort
      if (this.sortKey) {
        result.sort((a, b) => {
          let valA = a[this.sortKey];
          let valB = b[this.sortKey];
          if (valA === undefined || valA === null) valA = '';
          if (valB === undefined || valB === null) valB = '';

          if (typeof valA === 'number' && typeof valB === 'number') {
            return this.sortOrder === 'asc' ? valA - valB : valB - valA;
          }
          return this.sortOrder === 'asc'
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
        });
      }

      this.filteredData = result;
    }

    exportCSV() {
      if (this.filteredData.length === 0) {
        alert('ไม่มีข้อมูลสำหรับส่งออก');
        return;
      }

      const headers = this.columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
      const rows = this.filteredData.map(row => {
        return this.columns.map(c => {
          let val = row[c.key];
          if (val === null || val === undefined) val = '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',');
      });

      const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', this.exportFilename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    render() {
      const container = document.getElementById(this.containerId);
      if (!container) return;

      const totalItems = this.filteredData.length;
      const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
      if (this.currentPage > totalPages) this.currentPage = totalPages;
      if (this.currentPage < 1) this.currentPage = 1;

      const startIndex = (this.currentPage - 1) * this.pageSize;
      const pageItems = this.filteredData.slice(startIndex, startIndex + this.pageSize);

      // Render outer structure
      container.innerHTML = `
        <div class="table-header">
          <div class="table-title-group">
            <span class="table-title">ตารางหลักฐานอ้างอิง (Detailed Evidence Records)</span>
            <span class="table-count-badge">${totalItems.toLocaleString()} รายการ</span>
          </div>
          <div class="table-controls">
            <div class="search-input-wrapper">
              <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" class="search-input" placeholder="ค้นหาในตาราง..." value="${this.searchQuery}">
            </div>
            <button class="btn-secondary export-csv-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                ${this.columns.map(c => `
                  <th data-sort-key="${c.key}">
                    ${c.label}
                    ${this.sortKey === c.key ? (this.sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${pageItems.length > 0 ? pageItems.map(row => `
                <tr>
                  ${this.columns.map(col => {
                    if (col.render) {
                      return `<td>${col.render(row[col.key], row)}</td>`;
                    }
                    const text = row[col.key] !== null && row[col.key] !== undefined ? row[col.key] : '—';
                    return `<td>${text}</td>`;
                  }).join('')}
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="${this.columns.length}" style="text-align: center; padding: 2.5rem; color: var(--text-tertiary);">
                    ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <div class="table-pagination">
          <span>แสดง ${totalItems > 0 ? startIndex + 1 : 0} ถึง ${Math.min(startIndex + this.pageSize, totalItems)} จากทั้งหมด ${totalItems.toLocaleString()} รายการ</span>
          <div class="pagination-pages">
            <button class="page-btn prev-btn" ${this.currentPage <= 1 ? 'disabled' : ''}>ก่อนหน้า</button>
            <span style="font-weight: 500; padding: 0 0.5rem; color: var(--text-secondary);">หน้า ${this.currentPage} / ${totalPages}</span>
            <button class="page-btn next-btn" ${this.currentPage >= totalPages ? 'disabled' : ''}>ถัดไป</button>
          </div>
        </div>
      `;

      // Event listeners
      const searchInput = container.querySelector('.search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.setSearch(e.target.value);
        });
      }

      const exportBtn = container.querySelector('.export-csv-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          this.exportCSV();
        });
      }

      container.querySelectorAll('th[data-sort-key]').forEach(th => {
        th.addEventListener('click', () => {
          const key = th.getAttribute('data-sort-key');
          this.setSort(key);
        });
      });

      const prevBtn = container.querySelector('.prev-btn');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (this.currentPage > 1) this.setPage(this.currentPage - 1);
        });
      }

      const nextBtn = container.querySelector('.next-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (this.currentPage < totalPages) this.setPage(this.currentPage + 1);
        });
      }
    }
  }

  window.DataTable = DataTable;
})(window);
