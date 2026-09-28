/**
 * KEV PatchOps — app.js
 * Vulnerability Remediation Command Center
 * Dataset: CISA Known Exploited Vulnerabilities
 * Reference Date: 2026-09-28
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const DATASET_PATH    = './dataset/known_exploited_vulnerabilities.json';
const REF_DATE_STR    = '2026-09-28';
const REF_DATE        = new Date(REF_DATE_STR + 'T00:00:00Z');
const DUE_SOON_DAYS   = 14;
const PAGE_SIZE       = 50;
const TOP_VENDORS     = 8;

/* ═══════════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════════ */

const state = {
  allData:     [],      // full enriched dataset
  filtered:    [],      // current filtered+sorted result
  currentPage: 1,
  selectedCve: null,
  loadStatus: 'loading',
  drawerTrigger: null,
  searchQuery: '',
  filters: {
    attention:  '',
    ransomware: '',
    forensic:   '',
    vendor:     '',
  },
};

/* ═══════════════════════════════════════════════════════════════════
   DOM REFS
   ═══════════════════════════════════════════════════════════════════ */

const el = {
  main:           document.getElementById('main'),
  stateLoading:   document.getElementById('state-loading'),
  stateError:     document.getElementById('state-error'),
  statePopulated: document.getElementById('state-populated'),
  errorMessage:   document.getElementById('error-message'),
  btnRetry:       document.getElementById('btn-retry'),

  kpiTotal:       document.getElementById('kpi-total'),
  kpiRansomware:  document.getElementById('kpi-ransomware'),
  kpiOverdue:     document.getElementById('kpi-overdue'),
  kpiDueSoon:     document.getElementById('kpi-duesoon'),
  kpiForensic:    document.getElementById('kpi-forensic'),

  attentionBars:  document.getElementById('attention-bars'),
  vendorBars:     document.getElementById('vendor-bars'),
  activityChart:  document.getElementById('activity-chart'),
  activityPeriod: document.getElementById('activity-period'),

  searchInput:    document.getElementById('search-input'),
  filterAttention:document.getElementById('filter-attention'),
  filterRansom:   document.getElementById('filter-ransomware'),
  filterForensic: document.getElementById('filter-forensic'),
  filterVendor:   document.getElementById('filter-vendor'),
  resultCount:    document.getElementById('result-count'),
  btnReset:       document.getElementById('btn-reset'),
  btnResetEmpty:  document.getElementById('btn-reset-empty'),

  vulnTable:      document.getElementById('vuln-table'),
  vulnTbody:      document.getElementById('vuln-tbody'),
  stateEmpty:     document.getElementById('state-empty'),

  pgInfo:         document.getElementById('pg-info'),
  pgRange:        document.getElementById('pg-range'),
  btnPrev:        document.getElementById('btn-prev'),
  btnNext:        document.getElementById('btn-next'),

  drawer:         document.getElementById('detail-drawer'),
  drawerBackdrop: document.getElementById('drawer-backdrop'),
  drawerCve:      document.getElementById('drawer-cve'),
  drawerBody:     document.getElementById('drawer-body'),
  btnCloseDrawer: document.getElementById('btn-close-drawer'),
};

/* ═══════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Parse a YYYY-MM-DD date string as UTC midnight Date object.
 */
function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a Date (UTC) to readable string: "28 Sep 2026"
 */
function fmtDate(d) {
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
  });
}

/**
 * Escape HTML special characters to prevent injection in innerHTML.
 */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Classify Operational Attention Level.
 * URGENT  > HIGH > PRIORITY
 */
function classifyAttention(vuln) {
  const isKnown = vuln.knownRansomwareCampaignUse === 'Known';
  if (isKnown) return 'URGENT';
  const due = parseDate(vuln.dueDate);
  if (!due || due <= REF_DATE) return 'HIGH';
  return 'PRIORITY';
}

/**
 * Due-date status relative to reference date.
 * Returns: 'overdue' | 'soon' | 'ok'
 */
function dueDateStatus(dueDateStr) {
  const d = parseDate(dueDateStr);
  if (!d) return 'ok';
  if (d <= REF_DATE) return 'overdue';
  const soonLimit = new Date(REF_DATE.getTime() + DUE_SOON_DAYS * 86400 * 1000);
  if (d <= soonLimit) return 'soon';
  return 'ok';
}

/**
 * Debounce helper
 */
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/* ═══════════════════════════════════════════════════════════════════
   DATA LOADING
   ═══════════════════════════════════════════════════════════════════ */

async function loadData() {
  if (state.selectedCve) closeDrawer();
  state.allData = [];
  state.filtered = [];
  state.currentPage = 1;
  el.vulnTbody.replaceChildren();
  [el.kpiTotal, el.kpiRansomware, el.kpiOverdue, el.kpiDueSoon, el.kpiForensic]
    .forEach(node => { node.textContent = '—'; });
  showState('loading');
  let loaded = false;
  try {
    const res = await fetch(DATASET_PATH);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();

    if (!json.vulnerabilities || !Array.isArray(json.vulnerabilities)) {
      throw new Error('Dataset format unexpected: missing vulnerabilities array');
    }

    // Enrich each record
    state.allData = json.vulnerabilities.map(v => ({
      ...v,
      _attention: classifyAttention(v),
      _dueDateParsed: parseDate(v.dueDate),
      _dateAddedParsed: parseDate(v.dateAdded),
    }));
    loaded = true;
    init();
  } catch (err) {
    state.allData = [];
    state.filtered = [];
    el.stateError.querySelector('h2').textContent = loaded
      ? 'Workspace could not be displayed' : 'Dataset failed to load';
    el.errorMessage.textContent = loaded
      ? `The dataset was received, but the view could not be rendered. Retry loading. ${err.message}`
      : `Unable to load the local KEV catalog. Check that the server is running from langflow/web and the dataset file is present. ${err.message}`;
    showState('error');
  }
}

/* ═══════════════════════════════════════════════════════════════════
   INITIALIZATION
   ═══════════════════════════════════════════════════════════════════ */

function init() {
  computeKPIs();
  renderAttentionOverview();
  renderVendorExposure();
  populateVendorFilter();
  applyFilters();
  showState('populated');
  renderActivityChart();
}

/* ═══════════════════════════════════════════════════════════════════
   KPI CALCULATIONS
   ═══════════════════════════════════════════════════════════════════ */

function computeKPIs() {
  const data = state.allData;
  const soonLimit = new Date(REF_DATE.getTime() + DUE_SOON_DAYS * 86400 * 1000);

  let ransomware = 0, overdue = 0, soon = 0, forensic = 0;

  for (const v of data) {
    if (v.knownRansomwareCampaignUse === 'Known') ransomware++;
    const d = v._dueDateParsed;
    if (d) {
      if (d <= REF_DATE) overdue++;
      else if (d <= soonLimit) soon++;
    }
    if (v.forensicTriage === 'Yes') forensic++;
  }

  el.kpiTotal.textContent     = data.length.toLocaleString();
  el.kpiRansomware.textContent= ransomware.toLocaleString();
  el.kpiOverdue.textContent   = overdue.toLocaleString();
  el.kpiDueSoon.textContent   = soon.toLocaleString();
  el.kpiForensic.textContent  = forensic.toLocaleString();
}

/* ═══════════════════════════════════════════════════════════════════
   OPERATIONAL ATTENTION OVERVIEW
   ═══════════════════════════════════════════════════════════════════ */

function renderAttentionOverview() {
  const counts = { URGENT: 0, HIGH: 0, PRIORITY: 0 };
  for (const v of state.allData) counts[v._attention]++;

  const total = state.allData.length;

  const levels = Object.keys(counts);
  // Keep unrounded proportions; even a very small category retains its true width.
  el.attentionBars.innerHTML = `
    <div class="distribution-bar" aria-hidden="true">${levels.map(level =>
      `<span class="distribution-segment segment-${level.toLowerCase()}" style="width:${total ? counts[level] / total * 100 : 0}%"></span>`
    ).join('')}</div>
    <dl class="distribution-legend">${levels.map(level => `
      <div><dt class="distribution-label"><span class="status-dot dot-${level.toLowerCase()}" aria-hidden="true"></span>${level}</dt>
        <dd><span class="distribution-count mono">${counts[level].toLocaleString()}</span>
        <span class="distribution-pct mono">${total ? (counts[level] / total * 100).toFixed(1) : '0.0'}%</span></dd>
      </div>`).join('')}</dl>`;
}

/** Twelve calendar months ending at the latest valid dateAdded in this catalog. */
function monthlyActivity(data) {
  const dates = data.map(v => v._dateAddedParsed).filter(Boolean);
  if (!dates.length) return [];
  const latest = new Date(Math.max(...dates.map(d => d.getTime())));
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth() - 11 + i, 1));
    return { key: date.toISOString().slice(0, 7), date, count: 0 };
  });
  const byKey = new Map(months.map(month => [month.key, month]));
  dates.forEach(date => {
    const month = byKey.get(date.toISOString().slice(0, 7));
    if (month) month.count++;
  });
  return months;
}

function renderActivityChart() {
  const months = monthlyActivity(state.allData);
  if (!months.length) {
    el.activityPeriod.textContent = 'No dated entries';
    el.activityChart.innerHTML = '<p class="chart-empty">No date-added values available.</p>';
    return;
  }
  const monthLabel = date => date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  el.activityPeriod.textContent = `${monthLabel(months[0].date)} — ${monthLabel(months[11].date)}`;
  // A zero baseline, evenly spaced months, and unsmoothed points preserve the data.
  const ceiling = Math.max(4, Math.ceil(Math.max(...months.map(m => m.count)) / 4) * 4);
  const width = Math.max(280, el.activityChart.clientWidth);
  const x = i => 34 + i * ((width - 58) / 11);
  const y = count => 98 - count / ceiling * 82;
  const ticks = [0, ceiling / 2, ceiling];
  const summary = months.map(m => `${monthLabel(m.date)}: ${m.count}`).join('; ');
  el.activityChart.innerHTML = `
    <svg viewBox="0 0 ${width} 124" role="img" aria-labelledby="activity-title activity-description">
      <title id="activity-title">Monthly KEV catalog additions</title>
      <desc id="activity-description">${esc(summary)}. The last month includes only dates present in the dataset.</desc>
      ${ticks.map(n => `<line class="chart-grid" x1="34" y1="${y(n)}" x2="${width - 24}" y2="${y(n)}"/><text class="chart-label" x="24" y="${y(n) + 3}" text-anchor="end">${n}</text>`).join('')}
      <polyline class="chart-line" points="${months.map((m, i) => `${x(i)},${y(m.count)}`).join(' ')}"/>
      ${months.map((m, i) => `<circle class="chart-point" cx="${x(i)}" cy="${y(m.count)}" r="2.5"><title>${esc(monthLabel(m.date))}: ${m.count} additions</title></circle>
        ${width >= 520 || i % 3 === 0 || i === 11 ? `<text class="chart-label" x="${x(i)}" y="120" text-anchor="middle">${esc(m.date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }))}</text>` : ''}`).join('')}
    </svg>`;
}

/* ═══════════════════════════════════════════════════════════════════
   VENDOR EXPOSURE
   ═══════════════════════════════════════════════════════════════════ */

function renderVendorExposure() {
  const counts = Object.create(null);
  for (const v of state.allData) {
    const vendor = v.vendorProject || 'Unknown';
    counts[vendor] = (counts[vendor] || 0) + 1;
  }

  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_VENDORS);

  const maxCount = top[0]?.[1] || 1;

  el.vendorBars.innerHTML = top.map(([name, count]) => {
    const pct = (count / maxCount * 100).toFixed(1);
    return `
      <div class="vendor-bar-row" role="listitem">
        <div class="vendor-bar-name" title="${esc(name)}">${esc(name)}</div>
        <div class="vendor-bar-track" role="presentation">
          <div class="vendor-bar-fill" style="width:${pct}%" aria-hidden="true"></div>
        </div>
        <div class="vendor-bar-count">${count}</div>
      </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   VENDOR FILTER POPULATION
   ═══════════════════════════════════════════════════════════════════ */

function populateVendorFilter() {
  const vendors = [...new Set(state.allData.map(v => v.vendorProject).filter(Boolean))];
  vendors.sort((a, b) => a.localeCompare(b));

  const opts = vendors.map(v =>
    `<option value="${esc(v)}">${esc(v)}</option>`
  ).join('');

  el.filterVendor.innerHTML = '<option value="">All vendors</option>' + opts;
  el.filterVendor.value = state.filters.vendor;
}

/* ═══════════════════════════════════════════════════════════════════
   FILTERING & SORTING
   ═══════════════════════════════════════════════════════════════════ */

const ATTENTION_ORDER = { URGENT: 0, HIGH: 1, PRIORITY: 2 };

function applyFilters() {
  const q   = state.searchQuery.trim().toLowerCase();
  const { attention, ransomware, forensic, vendor } = state.filters;

  let result = [...state.allData];

  // Text search
  if (q) {
    result = result.filter(v => {
      const cwes = Array.isArray(v.cwes) ? v.cwes.join(' ') : (v.cwes || '');
      return (
        (v.cveID             || '').toLowerCase().includes(q) ||
        (v.vendorProject     || '').toLowerCase().includes(q) ||
        (v.product           || '').toLowerCase().includes(q) ||
        (v.vulnerabilityName || '').toLowerCase().includes(q) ||
        cwes.toLowerCase().includes(q)
      );
    });
  }

  // Dropdown filters
  if (attention)  result = result.filter(v => v._attention === attention);
  if (ransomware) result = result.filter(v => v.knownRansomwareCampaignUse === ransomware);
  if (forensic)   result = result.filter(v => v.forensicTriage === forensic);
  if (vendor)     result = result.filter(v => v.vendorProject === vendor);

  // Sort: attention order, then due date ascending
  result.sort((a, b) => {
    const ao = ATTENTION_ORDER[a._attention];
    const bo = ATTENTION_ORDER[b._attention];
    if (ao !== bo) return ao - bo;
    // Null dates sort last
    const da = a._dueDateParsed ? a._dueDateParsed.getTime() : Infinity;
    const db = b._dueDateParsed ? b._dueDateParsed.getTime() : Infinity;
    return da - db;
  });

  state.filtered    = result;
  state.currentPage = 1;

  updateResultCount();
  updateResetButton();
  renderTable();
  renderPagination();
}

function updateResultCount() {
  const n = state.filtered.length;
  el.resultCount.textContent = `${n.toLocaleString()} vulnerabilit${n !== 1 ? 'ies' : 'y'}`;
}

function updateResetButton() {
  const active =
    state.searchQuery ||
    state.filters.attention ||
    state.filters.ransomware ||
    state.filters.forensic ||
    state.filters.vendor;
  el.btnReset.disabled = !active;
  [el.filterAttention, el.filterRansom, el.filterForensic, el.filterVendor]
    .forEach(select => select.classList.toggle('is-active', Boolean(select.value)));
}

function resetFilters() {
  state.searchQuery = '';
  state.filters = { attention: '', ransomware: '', forensic: '', vendor: '' };

  el.searchInput.value         = '';
  el.filterAttention.value     = '';
  el.filterRansom.value        = '';
  el.filterForensic.value      = '';
  el.filterVendor.value        = '';

  applyFilters();
}

/* ═══════════════════════════════════════════════════════════════════
   TABLE RENDERING
   ═══════════════════════════════════════════════════════════════════ */

function renderTable() {
  const data = state.filtered;

  if (data.length === 0) {
    el.vulnTbody.innerHTML = '';
    el.stateEmpty.hidden   = false;
    el.vulnTable.hidden    = true;
    return;
  }

  el.stateEmpty.hidden = true;
  el.vulnTable.hidden  = false;

  const start = (state.currentPage - 1) * PAGE_SIZE;
  const page  = data.slice(start, start + PAGE_SIZE);

  el.vulnTbody.innerHTML = page.map(v => buildTableRow(v)).join('');

  // Restore selected row highlight
  if (state.selectedCve) {
    const row = el.vulnTbody.querySelector(`[data-cve="${CSS.escape(state.selectedCve)}"]`);
    if (row) row.classList.add('is-selected');
  }
}

function buildTableRow(v) {
  const dsClass     = dueDateStatus(v.dueDate);
  const dateLabel   = fmtDate(v._dueDateParsed);
  const attBadge    = buildAttentionBadge(v._attention);
  const ransomBadge = v.knownRansomwareCampaignUse === 'Known'
    ? `<span class="badge badge-ransomware-known">Known</span>`
    : `<span class="text-muted-sm">${esc(v.knownRansomwareCampaignUse || '—')}</span>`;
  const forensicCell = v.forensicTriage === 'Yes'
    ? `<span class="badge badge-forensic-yes">Yes</span>`
    : `<span class="text-muted-sm">${esc(v.forensicTriage || '—')}</span>`;
  const cweText = Array.isArray(v.cwes) && v.cwes.length
    ? v.cwes.join(', ')
    : (v.cwes || '');

  return `
    <tr
      role="row"
      data-cve="${esc(v.cveID)}"
      tabindex="0"
      aria-label="${esc(v.cveID)}: ${esc(v.vulnerabilityName)}. Attention: ${v._attention}. Open details."
    >
      <td class="cell-cve">${esc(v.cveID)}</td>
      <td><span class="cell-truncate" title="${esc(v.vendorProject)}">${esc(v.vendorProject || '—')}</span></td>
      <td><span class="cell-truncate" title="${esc(v.product)}">${esc(v.product || '—')}</span></td>
      <td>
        <span class="cell-vuln-name" title="${esc(v.vulnerabilityName)}">${esc(v.vulnerabilityName || '—')}</span>
        ${cweText ? `<span class="cell-cwe mono">${esc(cweText)}</span>` : ''}
      </td>
      <td class="cell-date cell-date--${dsClass}" title="${dsClass === 'overdue' ? 'Overdue at reference date' : dsClass === 'soon' ? 'Due within 14 days' : 'Due date'}">${esc(dateLabel)}</td>
      <td>${ransomBadge}</td>
      <td>${forensicCell}</td>
      <td>${attBadge}</td>
    </tr>`;
}

function buildAttentionBadge(level) {
  switch (level) {
    case 'URGENT':
      return `<span class="badge badge-urgent"><span class="status-dot dot-urgent" aria-hidden="true"></span>Urgent</span>`;
    case 'HIGH':
      return `<span class="badge badge-high"><span class="status-dot dot-high" aria-hidden="true"></span>High</span>`;
    case 'PRIORITY':
      return `<span class="badge badge-priority"><span class="status-dot dot-priority" aria-hidden="true"></span>Priority</span>`;
    default:
      return `<span class="badge">${esc(level)}</span>`;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PAGINATION
   ═══════════════════════════════════════════════════════════════════ */

function renderPagination() {
  const total = state.filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const cur   = state.currentPage;

  el.pgInfo.textContent = `Page ${cur} of ${pages}`;
  el.pgRange.textContent = total
    ? `${((cur - 1) * PAGE_SIZE + 1).toLocaleString()}–${Math.min(cur * PAGE_SIZE, total).toLocaleString()} of ${total.toLocaleString()}`
    : '0 results';
  el.btnPrev.disabled = cur <= 1;
  el.btnNext.disabled = cur >= pages;
}

function goPage(delta) {
  const pages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
  const newPage = Math.min(Math.max(1, state.currentPage + delta), pages);
  if (newPage === state.currentPage) return;
  state.currentPage = newPage;
  renderTable();
  renderPagination();
  const container = el.vulnTable.closest('.table-container');
  container.scrollTop = 0;
  container.scrollIntoView({ behavior: 'auto', block: 'nearest' });
}

/* ═══════════════════════════════════════════════════════════════════
   DETAIL DRAWER
   ═══════════════════════════════════════════════════════════════════ */

function openDrawer(cveID) {
  const vuln = state.allData.find(v => v.cveID === cveID);
  if (!vuln) return;

  state.drawerTrigger = document.activeElement;
  state.selectedCve = cveID;

  // Update table highlight
  document.querySelectorAll('#vuln-tbody tr.is-selected')
    .forEach(r => r.classList.remove('is-selected'));
  const row = el.vulnTbody.querySelector(`[data-cve="${CSS.escape(cveID)}"]`);
  if (row) row.classList.add('is-selected');

  // Populate drawer
  el.drawerCve.textContent  = vuln.cveID;
  el.drawerBody.innerHTML   = buildDrawerContent(vuln);

  el.drawer.classList.add('is-open');
  el.drawer.removeAttribute('aria-hidden');
  el.drawer.inert = false;
  el.drawerBackdrop.hidden = false;
  el.main.inert = true;
  document.querySelector('.app-header').inert = true;
  document.querySelector('.skip-link').inert = true;
  el.drawerBody.parentElement.scrollTop = 0;

  // Focus the close button
  requestAnimationFrame(() => {
    el.btnCloseDrawer.focus();
  });

  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  el.main.inert = false;
  document.querySelector('.app-header').inert = false;
  document.querySelector('.skip-link').inert = false;
  const trigger = state.drawerTrigger;
  const row = el.vulnTbody.querySelector(`[data-cve="${CSS.escape(state.selectedCve || '')}"]`);
  const focusTarget = trigger?.isConnected && trigger !== document.body ? trigger : row || el.searchInput;
  focusTarget.focus({ preventScroll: true });
  el.drawer.classList.remove('is-open');
  el.drawer.setAttribute('aria-hidden', 'true');
  el.drawer.inert = true;
  el.drawerBackdrop.hidden = true;
  document.body.style.overflow = '';
  state.selectedCve = null;
  state.drawerTrigger = null;

  // Remove highlight
  document.querySelectorAll('#vuln-tbody tr.is-selected')
    .forEach(r => r.classList.remove('is-selected'));
}

function buildDrawerContent(v) {
  const missing = '<span class="dl-value--muted">Not provided</span>';
  const value = (text, mono = false) => text
    ? `<span class="dl-value${mono ? ' mono' : ''}">${esc(text)}</span>` : missing;
  const field = (label, content, wide = false) => `<div class="dl-item${wide ? ' dl-wide' : ''}"><dt class="dl-label">${label}</dt><dd>${content}</dd></div>`;
  const cwes = Array.isArray(v.cwes) ? v.cwes : v.cwes ? [v.cwes] : [];
  const dueStatus = dueDateStatus(v.dueDate);
  const dueNote = dueStatus === 'overdue' ? '<span class="date-note badge badge-urgent">Overdue</span>'
    : dueStatus === 'soon' ? '<span class="date-note badge badge-high">Due within 14 days</span>' : '';
  const prose = text => text?.trim() ? `<p class="dl-value--longtext">${esc(text)}</p>` : missing;
  return `
    <section class="drawer-section">
      <h3 class="detail-product-name">${esc(v.vulnerabilityName || 'Not provided')}</h3>
      <div class="detail-attention"><span>Operational attention</span>${buildAttentionBadge(v._attention)}</div>
    </section>
    <section class="drawer-section" aria-label="Vendor and product"><dl class="dl-grid">
      ${field('Vendor', value(v.vendorProject))}${field('Product', value(v.product))}
    </dl></section>
    <section class="drawer-section" aria-label="Metadata"><dl class="dl-grid">
      ${field('Date added', v._dateAddedParsed ? value(fmtDate(v._dateAddedParsed), true) : missing)}
      ${field('Due date', v._dueDateParsed ? value(fmtDate(v._dueDateParsed), true) + dueNote : missing)}
      ${field('Ransomware use', value(v.knownRansomwareCampaignUse))}
      ${field('Forensic triage', value(v.forensicTriage === 'Yes' ? 'Required' : v.forensicTriage))}
      ${field('CWE', cwes.length ? cwes.map(c => `<span class="cwe-tag">${esc(c)}</span>`).join('') : missing, true)}
    </dl></section>
    <section class="drawer-section"><h3 class="drawer-section-title">Description</h3>${prose(v.shortDescription)}</section>
    <section class="drawer-section"><h3 class="drawer-section-title">Required action</h3>${prose(v.requiredAction)}</section>
    <section class="drawer-section"><h3 class="drawer-section-title">References / notes</h3>
      ${v.notes?.trim() ? `<div class="notes-content">${linkifyNotes(v.notes)}</div>` : missing}
    </section>`;
}

/** Escape all source text; link only complete HTTP(S) URLs, preserving query strings. */
function linkifyNotes(text) {
  return text.split(/(https?:\/\/[^\s<>"']+)/g).map(part => {
    if (!/^https?:\/\//.test(part)) return esc(part);
    const url = part.replace(/[.,;)>\]]+$/, '');
    const suffix = part.slice(url.length);
    return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>${esc(suffix)}`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   UI STATE MANAGEMENT
   ═══════════════════════════════════════════════════════════════════ */

function showState(which) {
  state.loadStatus = which;
  el.main.setAttribute('aria-busy', String(which === 'loading'));
  el.stateLoading.hidden   = which !== 'loading';
  el.stateError.hidden     = which !== 'error';
  el.statePopulated.hidden = which !== 'populated';
}

/* ═══════════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════════════════════════════ */

function bindEvents() {
  window.addEventListener('resize', debounce(() => {
    if (state.loadStatus === 'populated') renderActivityChart();
  }, 100));
  // Retry
  el.btnRetry.addEventListener('click', () => loadData());

  // Search — debounced
  const onSearch = debounce(() => {
    state.searchQuery = el.searchInput.value;
    applyFilters();
  }, 200);
  el.searchInput.addEventListener('input', onSearch);

  // Dropdown filters
  el.filterAttention.addEventListener('change', () => {
    state.filters.attention = el.filterAttention.value;
    applyFilters();
  });
  el.filterRansom.addEventListener('change', () => {
    state.filters.ransomware = el.filterRansom.value;
    applyFilters();
  });
  el.filterForensic.addEventListener('change', () => {
    state.filters.forensic = el.filterForensic.value;
    applyFilters();
  });
  el.filterVendor.addEventListener('change', () => {
    state.filters.vendor = el.filterVendor.value;
    applyFilters();
  });

  // Reset buttons
  el.btnReset.addEventListener('click', resetFilters);
  el.btnResetEmpty.addEventListener('click', resetFilters);

  // Pagination
  el.btnPrev.addEventListener('click', () => goPage(-1));
  el.btnNext.addEventListener('click', () => goPage(1));

  // Table row click / keyboard
  el.vulnTbody.addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-cve]');
    if (row) openDrawer(row.dataset.cve);
  });

  el.vulnTbody.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const row = e.target.closest('tr[data-cve]');
      if (row) {
        e.preventDefault();
        openDrawer(row.dataset.cve);
      }
    }
  });

  // Drawer close
  el.btnCloseDrawer.addEventListener('click', closeDrawer);
  el.drawerBackdrop.addEventListener('click', closeDrawer);

  // Keyboard: Escape to close drawer
  document.addEventListener('keydown', (e) => {
    if (!el.drawer.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDrawer();
    }
    if (e.key === 'Tab') {
      const focusable = [...el.drawer.querySelectorAll('button, a[href]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════
   BOOTSTRAP
   ═══════════════════════════════════════════════════════════════════ */

bindEvents();
loadData();
