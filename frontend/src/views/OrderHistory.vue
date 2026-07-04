<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>Order History</h2>
        <p>Browse and export daily order records</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" @click="openExport('full')" id="btn-export-full">
          Download Full History
        </button>
        <button class="btn btn-primary" @click="openExport('custom')" id="btn-export-custom">
          Download Custom Report
        </button>
      </div>
    </div>

    <div class="page-body">
      <!-- Alert -->
      <div v-if="alert.msg" class="alert" :class="'alert-'+alert.type" style="margin-bottom:14px">
        {{ alert.msg }}
      </div>

      <!-- Filters -->
      <div class="filter-bar" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:6px">
          <label style="font-size:12px;font-weight:600;color:#64748b;white-space:nowrap">Filter by Month:</label>
          <input v-model="filterMonth" type="month" id="history-filter-month" />
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <label style="font-size:12px;font-weight:600;color:#64748b;white-space:nowrap">Batch:</label>
          <select v-model="filterBatch" id="history-filter-batch">
            <option value="">All Batches</option>
            <option v-for="b in batches" :key="b._id" :value="b.batchId">{{ b.batchId }} – {{ b.batchName }}</option>
          </select>
        </div>
        <button class="btn btn-secondary btn-sm" @click="clearFilters" id="btn-clear-filters">Clear Filters</button>
      </div>

      <!-- Summary Table -->
      <div class="table-wrapper">
        <div class="table-header">
          <div>
            <h3>Order Summary</h3>
            <p>{{ filteredSummaries.length }} record{{ filteredSummaries.length !== 1 ? 's' : '' }}
              <span v-if="filterMonth || filterBatch" style="color:#0284c7;margin-left:6px">(filtered)</span>
            </p>
          </div>
        </div>

        <div v-if="loading" class="loading-spinner"><div class="spinner"></div> Loading records...</div>
        <table v-else>
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>Date</th>
              <th>Day</th>
              <th class="text-right">Breakfast</th>
              <th class="text-right">Lunch</th>
              <th class="text-right">Dinner</th>
              <th class="text-right">Total Meals</th>
              <th class="text-right">Income (Rs.)</th>
              <th style="width:80px">View</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredSummaries.length === 0">
              <td colspan="9">
                <div class="empty-state">
                  <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 10px;display:block;color:var(--text-light)">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9h4m-4 4h6"/>
                  </svg>
                  <h4>No records found</h4>
                  <p>Saved orders will appear here after using the Order Scheduler</p>
                </div>
              </td>
            </tr>
            <tr
              v-for="(s, i) in filteredSummaries"
              :key="s._id"
              class="history-row-clickable"
              @click="openDetail(s.date)"
              :id="`history-row-${s.date}`"
            >
              <td style="color:#94a3b8;font-size:12px;text-align:center">{{ i + 1 }}</td>
              <td>
                <span style="font-weight:700;font-size:13.5px">{{ formatDate(s.date) }}</span>
              </td>
              <td>
                <span class="day-badge">{{ getDayName(s.date) }}</span>
              </td>
              <td class="text-right">
                <span class="count-badge count-bf">{{ s.bfTotal }}</span>
              </td>
              <td class="text-right">
                <span class="count-badge count-lunch">{{ s.lunchTotal }}</span>
              </td>
              <td class="text-right">
                <span class="count-badge count-dinner">{{ s.dinnerTotal }}</span>
              </td>
              <td class="text-right">
                <strong style="font-size:13.5px">{{ s.bfTotal + s.lunchTotal + s.dinnerTotal }}</strong>
              </td>
              <td class="text-right">
                <strong style="color:#059669;font-size:13.5px">{{ formatIncome(s.income) }}</strong>
              </td>
              <td>
                <button
                  class="btn btn-secondary btn-sm"
                  @click.stop="openDetail(s.date)"
                  :id="`btn-view-${s.date}`"
                  style="font-size:12px"
                >View</button>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="filteredSummaries.length > 0">
            <tr class="totals-footer-row">
              <td colspan="3" style="padding:11px 14px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em">
                Period Total — {{ filteredSummaries.length }} Days
              </td>
              <td class="text-right" style="padding:11px 14px;font-weight:800;font-size:14px">
                {{ filteredSummaries.reduce((s,r) => s + r.bfTotal, 0) }}
              </td>
              <td class="text-right" style="padding:11px 14px;font-weight:800;font-size:14px">
                {{ filteredSummaries.reduce((s,r) => s + r.lunchTotal, 0) }}
              </td>
              <td class="text-right" style="padding:11px 14px;font-weight:800;font-size:14px">
                {{ filteredSummaries.reduce((s,r) => s + r.dinnerTotal, 0) }}
              </td>
              <td class="text-right" style="padding:11px 14px;font-weight:800;font-size:14px">
                {{ filteredSummaries.reduce((s,r) => s + r.bfTotal + r.lunchTotal + r.dinnerTotal, 0) }}
              </td>
              <td class="text-right" style="padding:11px 14px;font-weight:800;font-size:15px;color:#059669">
                {{ formatIncome(filteredSummaries.reduce((s,r) => s + (r.income || 0), 0)) }}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ───────── Detail Modal ───────── -->
    <div v-if="showDetail" class="modal-overlay" @click.self="showDetail = false">
      <div class="modal" style="max-width:820px;width:95vw;max-height:88vh;overflow-y:auto;padding:0">
        <!-- Modal Header -->
        <div style="padding:22px 28px 16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between">
          <div>
            <h3 style="font-size:17px;font-weight:700">Daily Order Detail</h3>
            <p style="font-size:13px;color:#64748b;margin-top:3px">
              {{ formatDate(detailDate) }} &nbsp;|&nbsp; {{ getDayName(detailDate) }} &nbsp;|&nbsp; Read-only
            </p>
          </div>
          <button
            class="btn btn-secondary btn-sm"
            @click="showDetail = false"
            id="btn-close-detail"
            style="font-size:12px"
          >Close</button>
        </div>

        <div style="padding:20px 28px">
          <!-- Menu strip -->
          <div v-if="detailMenu" class="detail-menu-strip">
            <div v-for="meal in ['breakfast','lunch','dinner']" :key="meal" class="detail-menu-cell">
              <div class="detail-menu-label">{{ meal.charAt(0).toUpperCase() + meal.slice(1) }}</div>
              <div class="detail-menu-name">{{ detailMenu[meal]?.name || '—' }}</div>
              <div class="detail-menu-price">Rs. {{ detailMenu[meal]?.price || 0 }}</div>
            </div>
          </div>

          <!-- Orders table -->
          <div v-if="detailLoading" class="loading-spinner"><div class="spinner"></div> Loading...</div>
          <div v-else class="table-wrapper" style="margin-bottom:16px;box-shadow:none;border:1px solid #e2e8f0">
            <table class="order-table" style="width:100%">
              <thead>
                <tr>
                  <th style="background:#f8fafc;color:#64748b">Batch</th>
                  <th style="background:#f8fafc;color:#64748b">Member ID</th>
                  <th style="background:#f8fafc;color:#64748b">Member Name</th>
                  <th class="col-num" style="background:#f8fafc;color:#64748b">Breakfast</th>
                  <th class="col-num" style="background:#f8fafc;color:#64748b">Lunch</th>
                  <th class="col-num" style="background:#f8fafc;color:#64748b">Dinner</th>
                  <th class="col-num" style="background:#f8fafc;color:#64748b">Total</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(group, batchId) in detailGrouped" :key="batchId">
                  <tr class="batch-row" style="background:#f1f5f9">
                    <td colspan="7" style="padding:7px 12px;font-size:12px;font-weight:700;color:#334155;letter-spacing:.04em;text-transform:uppercase">
                      Batch: {{ batchId }}
                    </td>
                  </tr>
                  <tr v-for="o in group" :key="o.memberId">
                    <td style="color:#64748b;font-size:12px">{{ o.batchId }}</td>
                    <td style="font-family:monospace;font-size:12px;color:#64748b">{{ o.memberId }}</td>
                    <td style="font-weight:600">{{ o.memberName }}</td>
                    <td style="text-align:center">
                      <div v-if="o.bf > 0">
                        <span style="font-weight:700">{{ o.bf }}</span>
                        <span style="font-size:11px;color:#64748b;margin-left:2px">({{ o.bfType === 'nonveg' ? 'NV' : 'V' }})</span>
                        <span style="font-size:11px;color:#475569;margin-left:2px">x{{ o.bfQty || 1 }}</span>
                      </div>
                      <span v-else style="color:#cbd5e1">—</span>
                    </td>
                    <td style="text-align:center">
                      <div v-if="o.lunch > 0">
                        <span style="font-weight:700">{{ o.lunch }}</span>
                        <span style="font-size:11px;color:#64748b;margin-left:2px">({{ o.lunchType === 'nonveg' ? 'NV' : 'V' }})</span>
                        <span style="font-size:11px;color:#475569;margin-left:2px">x{{ o.lunchQty || 1 }}</span>
                      </div>
                      <span v-else style="color:#cbd5e1">—</span>
                    </td>
                    <td style="text-align:center">
                      <div v-if="o.dinner > 0">
                        <span style="font-weight:700">{{ o.dinner }}</span>
                        <span style="font-size:11px;color:#64748b;margin-left:2px">({{ o.dinnerType === 'nonveg' ? 'NV' : 'V' }})</span>
                        <span style="font-size:11px;color:#475569;margin-left:2px">x{{ o.dinnerQty || 1 }}</span>
                      </div>
                      <span v-else style="color:#cbd5e1">—</span>
                    </td>
                    <td style="text-align:center;font-weight:800;color:#0284c7">{{ o.bf + o.lunch + o.dinner }}</td>
                  </tr>
                  <!-- Batch Summary Row -->
                  <tr style="background:rgba(2,132,199,0.03);font-size:11px;color:#475569;border-bottom:1.5px solid #cbd5e1">
                    <td colspan="3" style="font-weight:700;text-align:right;padding:6px 12px;color:#0369a1">Batch Total:</td>
                    <td style="padding:6px 12px">
                      <div v-if="getBatchSummary(group).bf.veg || getBatchSummary(group).bf.nv">
                        <div>Veg: {{ getBatchSummary(group).bf.veg }} | NV: {{ getBatchSummary(group).bf.nv }}</div>
                        <div style="color:#0284c7;font-weight:600">Qty: {{ getBatchSummary(group).bf.qty }}</div>
                      </div>
                      <span v-else style="color:#94a3b8">—</span>
                    </td>
                    <td style="padding:6px 12px">
                      <div v-if="getBatchSummary(group).lunch.veg || getBatchSummary(group).lunch.nv">
                        <div>Veg: {{ getBatchSummary(group).lunch.veg }} | NV: {{ getBatchSummary(group).lunch.nv }}</div>
                        <div style="color:#0284c7;font-weight:600">Qty: {{ getBatchSummary(group).lunch.qty }}</div>
                      </div>
                      <span v-else style="color:#94a3b8">—</span>
                    </td>
                    <td style="padding:6px 12px">
                      <div v-if="getBatchSummary(group).dinner.veg || getBatchSummary(group).dinner.nv">
                        <div>Veg: {{ getBatchSummary(group).dinner.veg }} | NV: {{ getBatchSummary(group).dinner.nv }}</div>
                        <div style="color:#0284c7;font-weight:600">Qty: {{ getBatchSummary(group).dinner.qty }}</div>
                      </div>
                      <span v-else style="color:#94a3b8">—</span>
                    </td>
                    <td style="text-align:center;font-weight:800;color:#0369a1;padding:6px 12px">
                      {{ getBatchSummary(group).bf.veg + getBatchSummary(group).bf.nv + getBatchSummary(group).lunch.veg + getBatchSummary(group).lunch.nv + getBatchSummary(group).dinner.veg + getBatchSummary(group).dinner.nv }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Detail summary row -->
          <div v-if="detailSummary" class="detail-summary-row">
            <div class="detail-stat">
              <div class="detail-stat-label">Breakfast</div>
              <div class="detail-stat-value">{{ detailSummary.bfTotal }}</div>
            </div>
            <div class="detail-stat">
              <div class="detail-stat-label">Lunch</div>
              <div class="detail-stat-value">{{ detailSummary.lunchTotal }}</div>
            </div>
            <div class="detail-stat">
              <div class="detail-stat-label">Dinner</div>
              <div class="detail-stat-value">{{ detailSummary.dinnerTotal }}</div>
            </div>
            <div class="detail-stat">
              <div class="detail-stat-label">Total Meals</div>
              <div class="detail-stat-value">{{ detailSummary.bfTotal + detailSummary.lunchTotal + detailSummary.dinnerTotal }}</div>
            </div>
            <div class="detail-stat detail-stat-income">
              <div class="detail-stat-label">Total Income</div>
              <div class="detail-stat-value">{{ formatIncome(detailSummary.income) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ───────── Export Modal ───────── -->
    <div v-if="showExport" class="modal-overlay" @click.self="showExport = false">
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3>{{ exportMode === 'full' ? 'Download Full History' : 'Download Custom Report' }}</h3>
          <p>
            {{ exportMode === 'full'
              ? 'Export all saved order summaries as an Excel file.'
              : 'Filter by batch, meal type and date range before exporting.' }}
          </p>
        </div>

        <!-- Full History fields -->
        <div v-if="exportMode === 'full'" class="form-grid">
          <div class="form-group full">
            <label>Date Range (optional — leave blank for all)</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <input type="date" v-model="exp.startDate" id="exp-start" placeholder="Start date" />
              <input type="date" v-model="exp.endDate" id="exp-end" placeholder="End date" />
            </div>
          </div>
          <div class="form-group full">
            <label>Content Includes</label>
            <div class="export-info-box">
              Date, Day, Breakfast Count, Lunch Count, Dinner Count, Total Meals, Total Income
            </div>
          </div>
        </div>

        <!-- Custom Report fields -->
        <div v-if="exportMode === 'custom'" class="form-grid">
          <div class="form-group full">
            <label>Batch</label>
            <select v-model="exp.batchId" id="exp-batch">
              <option value="">All Batches</option>
              <option v-for="b in batches" :key="b._id" :value="b.batchId">
                {{ b.batchId }} – {{ b.batchName }}
              </option>
            </select>
          </div>
          <div class="form-group full">
            <label>Meal Type</label>
            <select v-model="exp.mealType" id="exp-mealType">
              <option value="all">All Meals</option>
              <option value="breakfast">Breakfast Only</option>
              <option value="lunch">Lunch Only</option>
              <option value="dinner">Dinner Only</option>
            </select>
          </div>
          <div class="form-group full">
            <label>Select Date *</label>
            <input type="date" v-model="exp.date" id="exp-cust-date" required />
          </div>
        </div>

        <div v-if="exportError" class="alert alert-error" style="margin-top:12px">{{ exportError }}</div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showExport = false" id="btn-cancel-export">Cancel</button>
          <button
            class="btn btn-primary"
            @click="runExport"
            :disabled="exporting"
            id="btn-run-export"
          >
            {{ exporting ? 'Generating...' : 'Download Excel' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ExcelJS from 'exceljs'
import api from '../services/api'

// ─── State ───────────────────────────────────────────────────────────────────
const loading = ref(false)
const summaries = ref([])
const batches = ref([])
const filterMonth = ref(new Date().toISOString().slice(0, 7))
const filterBatch = ref('')
const alert = ref({ msg: '', type: 'success' })

// ─── Detail modal ─────────────────────────────────────────────────────────────
const showDetail = ref(false)
const detailDate = ref('')
const detailLoading = ref(false)
const detailOrders = ref([])
const detailSummary = ref(null)
const detailMenu = ref(null)

// ─── Export modal ─────────────────────────────────────────────────────────────
const showExport = ref(false)
const exportMode = ref('full')   // 'full' | 'custom'
const exporting = ref(false)
const exportError = ref('')
const exp = ref({ startDate: '', endDate: '', batchId: '', date: '' })

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredSummaries = computed(() => {
  return summaries.value.filter(s => {
    const matchMonth = !filterMonth.value || s.date.startsWith(filterMonth.value)
    // Note: summary has no batchId field (it's aggregated), so batch filter only applies in export
    return matchMonth
  })
})

const detailGrouped = computed(() => {
  const g = {}
  for (const o of detailOrders.value) {
    if (!g[o.batchId]) g[o.batchId] = []
    g[o.batchId].push(o)
  }
  return g
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  try {
    const [sumRes, batchRes] = await Promise.allSettled([
      api.get('/summary'),
      api.get('/batches')
    ])
    if (sumRes.status === 'fulfilled') summaries.value = sumRes.value.data
    if (batchRes.status === 'fulfilled') batches.value = batchRes.value.data
  } finally {
    loading.value = false
  }
})

// ─── Detail view ─────────────────────────────────────────────────────────────
async function openDetail(date) {
  detailDate.value = date
  showDetail.value = true
  detailLoading.value = true
  detailOrders.value = []
  detailSummary.value = null
  detailMenu.value = null
  try {
    const [ordRes, sumRes, menuRes] = await Promise.allSettled([
      api.get(`/orders/${date}`),
      api.get(`/summary/${date}`),
      api.get(`/menu/${date}`)
    ])
    if (ordRes.status === 'fulfilled') detailOrders.value = ordRes.value.data
    if (sumRes.status === 'fulfilled') detailSummary.value = sumRes.value.data
    if (menuRes.status === 'fulfilled') detailMenu.value = menuRes.value.data
  } finally {
    detailLoading.value = false
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────
function openExport(mode) {
  exportMode.value = mode
  exportError.value = ''
  exp.value = { startDate: '', endDate: '', date: new Date().toISOString().split('T')[0], batchId: '', mealType: 'all' }
  showExport.value = true
}

async function runExport() {
  exportError.value = ''
  exporting.value = true
  try {
    if (exportMode.value === 'full') {
      await exportFullHistory()
    } else {
      await exportCustomReport()
    }
    showExport.value = false
    showAlert('Excel file downloaded successfully.', 'success')
  } catch (e) {
    exportError.value = e.response?.data?.message || e.message || 'Export failed.'
  } finally {
    exporting.value = false
  }
}

function getLeadMemberName(batchId) {
  const b = batches.value.find(x => x.batchId === batchId)
  if (!b) return 'Unknown'
  return b.batchName.replace(/\s+batch\s*$/i, '').trim()
}

function getBatchSummary(orders) {
  const bfVeg = orders.reduce((s, o) => s + (o.bf > 0 && o.bfType !== 'nonveg' ? o.bf : 0), 0)
  const bfNonVeg = orders.reduce((s, o) => s + (o.bf > 0 && o.bfType === 'nonveg' ? o.bf : 0), 0)
  const bfQtys = orders.filter(o => o.bf > 0).map(o => o.bfQty || 1)
  
  const lunchVeg = orders.reduce((s, o) => s + (o.lunch > 0 && o.lunchType !== 'nonveg' ? o.lunch : 0), 0)
  const lunchNonVeg = orders.reduce((s, o) => s + (o.lunch > 0 && o.lunchType === 'nonveg' ? o.lunch : 0), 0)
  const lunchQtys = orders.filter(o => o.lunch > 0).map(o => o.lunchQty || 1)

  const dinnerVeg = orders.reduce((s, o) => s + (o.dinner > 0 && o.dinnerType !== 'nonveg' ? o.dinner : 0), 0)
  const dinnerNonVeg = orders.reduce((s, o) => s + (o.dinner > 0 && o.dinnerType === 'nonveg' ? o.dinner : 0), 0)
  const dinnerQtys = orders.filter(o => o.dinner > 0).map(o => o.dinnerQty || 1)

  function formatQtys(qtys) {
    if (qtys.length === 0) return ''
    const freq = {}
    qtys.forEach(q => { freq[q] = (freq[q] || 0) + 1 })
    const keys = Object.keys(freq).map(Number).sort((a, b) => a - b)
    if (keys.length === 1) return `${keys[0]}`
    return keys.map(k => `${freq[k]}x${k}`).join(', ')
  }

  return {
    bf: { veg: bfVeg, nv: bfNonVeg, qty: formatQtys(bfQtys) },
    lunch: { veg: lunchVeg, nv: lunchNonVeg, qty: formatQtys(lunchQtys) },
    dinner: { veg: dinnerVeg, nv: dinnerNonVeg, qty: formatQtys(dinnerQtys) }
  }
}

// ─── Shared ExcelJS style helpers ─────────────────────────────────────────────
function borderStyle() {
  const thin = { style: 'thin', color: { argb: 'FF000000' } }
  return { top: thin, left: thin, bottom: thin, right: thin }
}

function applyBorder(row, numCols) {
  for (let c = 1; c <= numCols; c++) {
    row.getCell(c).border = borderStyle()
  }
}

function styledTitleRow(ws, text, numCols, fontSize) {
  const row = ws.addRow([text])
  ws.mergeCells(row.number, 1, row.number, numCols)
  const cell = row.getCell(1)
  cell.value = text
  cell.font = { name: 'Calibri', size: fontSize, bold: fontSize >= 20 }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false }
  row.height = fontSize >= 20 ? 42 : 26
  applyBorder(row, numCols)
  return row
}

function styledMetaRow(ws, label, value, numCols) {
  const row = ws.addRow([label])
  row.getCell(2).value = value
  if (numCols > 1) {
    ws.mergeCells(row.number, 2, row.number, numCols)
  }
  row.getCell(1).font = { name: 'Calibri', size: 11, bold: true }
  row.getCell(2).font = { name: 'Calibri', size: 11 }
  row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
  row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }
  applyBorder(row, numCols)
  row.height = 20
  return row
}

function styledHeaderRow(ws, headers) {
  const row = ws.addRow(headers)
  // Use explicit loop — eachCell({includeEmpty:true}) iterates ALL ws.columnCount
  // columns (potentially 5) and would stamp borders on empty cols D & E.
  for (let c = 1; c <= headers.length; c++) {
    const cell = row.getCell(c)
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
    cell.alignment = c >= 3
      ? { horizontal: 'right', vertical: 'middle' }
      : { horizontal: 'left', vertical: 'middle' }
    cell.border = borderStyle()
  }
  row.height = 24
  return row
}
function styledDataRow(ws, values, numCols, opts = {}) {
  const row = ws.addRow(values)
  let maxNewlines = 0
  for (let c = 1; c <= values.length; c++) {
    const cell = row.getCell(c)
    cell.font = { name: 'Calibri', size: 11, bold: !!opts.bold }
    cell.border = borderStyle()
    
    const valStr = cell.value ? String(cell.value) : ''
    const newlines = (valStr.match(/\n/g) || []).length
    if (newlines > maxNewlines) maxNewlines = newlines

    cell.alignment = {
      horizontal: (c >= 3 && typeof cell.value === 'number') ? 'right' : 'left',
      vertical: 'middle',
      wrapText: newlines > 0
    }
    if (opts.fill) cell.fill = opts.fill
  }
  if (maxNewlines > 0) {
    row.height = 18 + maxNewlines * 15
  } else {
    row.height = 18
  }
  return row
}
async function triggerDownload(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Full History Export ───────────────────────────────────────────────────────
async function exportFullHistory() {
  const params = {}
  if (exp.value.startDate) params.startDate = exp.value.startDate
  if (exp.value.endDate)   params.endDate   = exp.value.endDate

  const res = await api.get('/orders/export', { params })
  const orders = res.data
  if (orders.length === 0) throw new Error('No records found for the selected date range.')

  // Group by date
  const ordersByDate = {}
  orders.forEach(o => {
    if (!ordersByDate[o.date]) ordersByDate[o.date] = []
    ordersByDate[o.date].push(o)
  })
  const sortedDates = Object.keys(ordersByDate).sort().reverse()

  const dateRangeText = (exp.value.startDate && exp.value.endDate)
    ? `${formatDate(exp.value.startDate)} to ${formatDate(exp.value.endDate)}`
    : 'All Saved Dates'

  const NUM_COLS = 5 // Batch ID | Member Name | BF | Lunch | Dinner

  const wb = new ExcelJS.Workbook()
  wb.creator = 'VJ Home Foods OMS'
  const ws = wb.addWorksheet('Orders')
  ws.columns = [
    { width: 16 }, { width: 24 }, { width: 32 }, { width: 32 }, { width: 32 }
  ]

  // Title rows
  styledTitleRow(ws, 'VJ Home Foods', NUM_COLS, 24)
  styledTitleRow(ws, 'Full Order Report', NUM_COLS, 14)
  styledMetaRow(ws, 'Date of Order:', dateRangeText, NUM_COLS)
  styledMetaRow(ws, 'Generated:', new Date().toLocaleString('en-IN'), NUM_COLS)

  // Helper: build smart qty string e.g. "2×4, 1×5, 1×6"
  function smartQtyStr(qtyCounts) {
    // qtyCounts is an array of qty values for orders that placed this meal
    if (qtyCounts.length === 0) return ''
    const freq = {}
    qtyCounts.forEach(q => { freq[q] = (freq[q] || 0) + 1 })
    const keys = Object.keys(freq).map(Number).sort((a, b) => a - b)
    if (keys.length === 1) return `Qty: ${keys[0]}` // all same
    return 'Qty: ' + keys.map(k => `${freq[k]}×${k}`).join(', ')
  }

  sortedDates.forEach(date => {
    const dayOrders = ordersByDate[date]
    dayOrders.sort((a, b) => {
      if (a.batchId !== b.batchId) return a.batchId.localeCompare(b.batchId)
      return a.memberName.localeCompare(b.memberName)
    })

    // Blank separator row
    ws.addRow([])

    // Date label row (merged)
    const dateLabelRow = ws.addRow([`Date: ${formatDate(date)} (${getDayName(date)})`])
    ws.mergeCells(dateLabelRow.number, 1, dateLabelRow.number, NUM_COLS)
    dateLabelRow.getCell(1).font = { name: 'Calibri', size: 11, bold: true }
    dateLabelRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    dateLabelRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
    applyBorder(dateLabelRow, NUM_COLS)
    dateLabelRow.height = 18

    const sample = dayOrders[0] || {}
    const bfCol    = sample.bfMenu    ? `Breakfast (${sample.bfMenu})`    : 'Breakfast'
    const lunchCol = sample.lunchMenu ? `Lunch (${sample.lunchMenu})`     : 'Lunch'
    const dinnerCol= sample.dinnerMenu? `Dinner (${sample.dinnerMenu})`   : 'Dinner'

    // Column headers
    styledHeaderRow(ws, ['Batch ID', 'Member Name', bfCol, lunchCol, dinnerCol])

    // Data rows
    let prevBatch = ''
    dayOrders.forEach(o => {
      const batchCell = o.batchId === prevBatch ? '' : o.batchId
      prevBatch = o.batchId

      // Format Breakfast
      let bfVal = ''
      if (o.bf > 0) {
        bfVal = `${o.bf} (${o.bfType === 'nonveg' ? 'NV' : 'V'}) × ${o.bfQty || 1}`
        if (o.bfAddons && o.bfAddons.length > 0) {
          bfVal += '\nAddons: ' + o.bfAddons.map(a => `${a.name} (Rs.${a.price})`).join(', ')
        }
      }

      // Format Lunch
      let lunchVal = ''
      if (o.lunch > 0) {
        lunchVal = `${o.lunch} (${o.lunchType === 'nonveg' ? 'NV' : 'V'}) × ${o.lunchQty || 1}`
        if (o.lunchAddons && o.lunchAddons.length > 0) {
          lunchVal += '\nAddons: ' + o.lunchAddons.map(a => `${a.name} (Rs.${a.price})`).join(', ')
        }
      }

      // Format Dinner
      let dinnerVal = ''
      if (o.dinner > 0) {
        dinnerVal = `${o.dinner} (${o.dinnerType === 'nonveg' ? 'NV' : 'V'}) × ${o.dinnerQty || 1}`
        if (o.dinnerAddons && o.dinnerAddons.length > 0) {
          dinnerVal += '\nAddons: ' + o.dinnerAddons.map(a => `${a.name} (Rs.${a.price})`).join(', ')
        }
      }

      styledDataRow(ws, [batchCell, o.memberName, bfVal, lunchVal, dinnerVal], NUM_COLS)
    })

    // Day totals row — Veg Count, NV Count, smart qty
    const bfVeg    = dayOrders.reduce((s, o) => s + (o.bfType !== 'nonveg' ? o.bf : 0), 0)
    const bfNonVeg = dayOrders.reduce((s, o) => s + (o.bfType === 'nonveg'  ? o.bf : 0), 0)
    const bfQtys   = dayOrders.filter(o => o.bf > 0).map(o => o.bfQty || 1)
    const bfTotal  = bfVeg + bfNonVeg
    const bfText   = bfTotal > 0
      ? `Total: ${bfTotal} | Veg: ${bfVeg} | NV: ${bfNonVeg}\n${smartQtyStr(bfQtys)}`
      : ''

    const lunchVeg    = dayOrders.reduce((s, o) => s + (o.lunchType !== 'nonveg' ? o.lunch : 0), 0)
    const lunchNonVeg = dayOrders.reduce((s, o) => s + (o.lunchType === 'nonveg'  ? o.lunch : 0), 0)
    const lunchQtys   = dayOrders.filter(o => o.lunch > 0).map(o => o.lunchQty || 1)
    const lunchTotal  = lunchVeg + lunchNonVeg
    const lunchText   = lunchTotal > 0
      ? `Total: ${lunchTotal} | Veg: ${lunchVeg} | NV: ${lunchNonVeg}\n${smartQtyStr(lunchQtys)}`
      : ''

    const dinnerVeg    = dayOrders.reduce((s, o) => s + (o.dinnerType !== 'nonveg' ? o.dinner : 0), 0)
    const dinnerNonVeg = dayOrders.reduce((s, o) => s + (o.dinnerType === 'nonveg'  ? o.dinner : 0), 0)
    const dinnerQtys   = dayOrders.filter(o => o.dinner > 0).map(o => o.dinnerQty || 1)
    const dinnerTotal  = dinnerVeg + dinnerNonVeg
    const dinnerText   = dinnerTotal > 0
      ? `Total: ${dinnerTotal} | Veg: ${dinnerVeg} | NV: ${dinnerNonVeg}\n${smartQtyStr(dinnerQtys)}`
      : ''

    styledDataRow(ws, ['Total Count', '', bfText, lunchText, dinnerText], NUM_COLS, {
      bold: true,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    })
  })

  // Remove any extra columns beyond NUM_COLS
  const extraFull = ws.columnCount - NUM_COLS
  if (extraFull > 0) ws.spliceColumns(NUM_COLS + 1, extraFull)

  await triggerDownload(wb, 'VJHomeFoods_Full_History')
}

// ─── Custom Report Export ─────────────────────────────────────────────────────
async function exportCustomReport() {
  if (!exp.value.date) throw new Error('Please select a date.')

  const params = {}
  params.date = exp.value.date
  if (exp.value.batchId) params.batchId = exp.value.batchId

  const res = await api.get('/orders/export', { params })
  const orders = res.data
  if (orders.length === 0) throw new Error('No records found for the selected filters.')

  const sample = orders[0] || {}
  const bfHeader    = sample.bfMenu ? `Breakfast (${sample.bfMenu})` : 'Breakfast'
  const lunchHeader = sample.lunchMenu ? `Lunch (${sample.lunchMenu})` : 'Lunch'
  const dinnerHeader= sample.dinnerMenu ? `Dinner (${sample.dinnerMenu})` : 'Dinner'

  // Smart qty string: if all same → "4", else "2×4, 1×5"
  function smartQtyStr(qtys) {
    if (!qtys || qtys.length === 0) return '—'
    const freq = {}
    qtys.forEach(q => { freq[q] = (freq[q] || 0) + 1 })
    const keys = Object.keys(freq).map(Number).sort((a, b) => a - b)
    if (keys.length === 1) return String(keys[0])
    return keys.map(k => `${freq[k]}×${k}`).join(', ')
  }

  // Aggregate counts and qtys by batchId
  const batchGroups = {}
  orders.forEach(o => {
    if (!batchGroups[o.batchId]) {
      batchGroups[o.batchId] = {
        bfVegCount: 0, bfVegQtys: [],
        bfNonVegCount: 0, bfNonVegQtys: [],
        lunchVegCount: 0, lunchVegQtys: [],
        lunchNonVegCount: 0, lunchNonVegQtys: [],
        dinnerVegCount: 0, dinnerVegQtys: [],
        dinnerNonVegCount: 0, dinnerNonVegQtys: []
      }
    }
    const g = batchGroups[o.batchId]
    if (o.bf > 0) {
      if (o.bfType === 'nonveg') {
        g.bfNonVegCount += o.bf
        for (let i = 0; i < o.bf; i++) g.bfNonVegQtys.push(o.bfQty || 1)
      } else {
        g.bfVegCount += o.bf
        for (let i = 0; i < o.bf; i++) g.bfVegQtys.push(o.bfQty || 1)
      }
    }
    if (o.lunch > 0) {
      if (o.lunchType === 'nonveg') {
        g.lunchNonVegCount += o.lunch
        for (let i = 0; i < o.lunch; i++) g.lunchNonVegQtys.push(o.lunchQty || 1)
      } else {
        g.lunchVegCount += o.lunch
        for (let i = 0; i < o.lunch; i++) g.lunchVegQtys.push(o.lunchQty || 1)
      }
    }
    if (o.dinner > 0) {
      if (o.dinnerType === 'nonveg') {
        g.dinnerNonVegCount += o.dinner
        for (let i = 0; i < o.dinner; i++) g.dinnerNonVegQtys.push(o.dinnerQty || 1)
      } else {
        g.dinnerVegCount += o.dinner
        for (let i = 0; i < o.dinner; i++) g.dinnerVegQtys.push(o.dinnerQty || 1)
      }
    }
  })
  const sortedBatchIds = Object.keys(batchGroups).sort()

  const mealType    = exp.value.mealType || 'all'
  const dateDayText = `${formatDate(exp.value.date)} (${getDayName(exp.value.date)})`

  // Decide which meals to include
  const mealsToShow = []
  if (mealType === 'all' || mealType === 'breakfast') mealsToShow.push({ key: 'bf',     label: bfHeader })
  if (mealType === 'all' || mealType === 'lunch')     mealsToShow.push({ key: 'lunch',  label: lunchHeader })
  if (mealType === 'all' || mealType === 'dinner')    mealsToShow.push({ key: 'dinner', label: dinnerHeader })

  // Layout: 2 fixed cols + 4 sub-cols per meal (Veg Count | Veg Qty | NV Count | NV Qty)
  const FIXED = 2      // Batch ID, Lead Member Name
  const SUB   = 4      // sub-columns per meal
  const NUM_COLS = FIXED + mealsToShow.length * SUB

  // ── Build workbook ─────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator = 'VJ Home Foods OMS'
  const ws = wb.addWorksheet('Custom Report')

  // Column widths
  const colWidths = [{ width: 16 }, { width: 28 }]
  mealsToShow.forEach(() => {
    colWidths.push({ width: 11 }, { width: 11 }, { width: 11 }, { width: 11 })
  })
  ws.columns = colWidths

  // ── Colours ─────────────────────────────────────────────────────────────────
  const navy   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
  const green  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } }
  const amber  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }
  const vegFill= { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }
  const nvFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } }
  const totFill= { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
  const white  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }

  function border() {
    return { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } }
  }
  function applyBorder(row, cols) {
    for (let c = 1; c <= cols; c++) row.getCell(c).border = border()
  }

  // ── Title rows ──────────────────────────────────────────────────────────────
  const titleRow = ws.addRow(['VJ Home Foods'])
  ws.mergeCells(titleRow.number, 1, titleRow.number, NUM_COLS)
  titleRow.getCell(1).fill = navy
  titleRow.getCell(1).font = { name: 'Calibri', bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  titleRow.height = 28

  const subTitleRow = ws.addRow(['Custom Order Report'])
  ws.mergeCells(subTitleRow.number, 1, subTitleRow.number, NUM_COLS)
  subTitleRow.getCell(1).fill = navy
  subTitleRow.getCell(1).font = { name: 'Calibri', bold: true, size: 13, color: { argb: 'FFFFFFFF' } }
  subTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  subTitleRow.height = 22

  const metaDate = ws.addRow(['Date of Order:', dateDayText])
  ws.mergeCells(metaDate.number, 2, metaDate.number, NUM_COLS)
  metaDate.getCell(1).font = { name: 'Calibri', bold: true, size: 10 }
  metaDate.getCell(2).font = { name: 'Calibri', size: 10 }
  metaDate.height = 16

  const metaGen = ws.addRow(['Generated:', new Date().toLocaleString('en-IN')])
  ws.mergeCells(metaGen.number, 2, metaGen.number, NUM_COLS)
  metaGen.getCell(1).font = { name: 'Calibri', bold: true, size: 10 }
  metaGen.getCell(2).font = { name: 'Calibri', size: 10 }
  metaGen.height = 16

  ws.addRow([]) // spacer

  // ── Header row 1: Meal names (merged across 4 sub-cols each) ────────────────
  const mealHeaderRow = ws.addRow([])
  mealHeaderRow.getCell(1).value = 'Batch ID'
  mealHeaderRow.getCell(2).value = 'Lead Member Name'
  mealsToShow.forEach((meal, i) => {
    const startCol = FIXED + i * SUB + 1
    mealHeaderRow.getCell(startCol).value = meal.label
    ws.mergeCells(mealHeaderRow.number, startCol, mealHeaderRow.number, startCol + SUB - 1)
  })
  for (let c = 1; c <= NUM_COLS; c++) {
    mealHeaderRow.getCell(c).fill = navy
    mealHeaderRow.getCell(c).font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
    mealHeaderRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    mealHeaderRow.getCell(c).border = border()
  }
  mealHeaderRow.height = 22

  // ── Header row 2: Veg / Non-Veg group labels (merged across 2 sub-cols each) ─
  const typeHeaderRow = ws.addRow([])
  typeHeaderRow.getCell(1).value = ''
  typeHeaderRow.getCell(2).value = ''
  mealsToShow.forEach((_, i) => {
    const vegStart = FIXED + i * SUB + 1
    const nvStart  = FIXED + i * SUB + 3
    typeHeaderRow.getCell(vegStart).value = 'Veg'
    ws.mergeCells(typeHeaderRow.number, vegStart, typeHeaderRow.number, vegStart + 1)
    typeHeaderRow.getCell(nvStart).value  = 'Non-Veg'
    ws.mergeCells(typeHeaderRow.number, nvStart,  typeHeaderRow.number, nvStart + 1)
  })
  for (let c = 1; c <= NUM_COLS; c++) {
    const col = typeHeaderRow.getCell(c)
    // Alternate veg/nv fill per sub-col group
    const mealIdx = Math.floor((c - FIXED - 1) / SUB)
    const subIdx  = (c - FIXED - 1) % SUB
    if (c > FIXED) {
      col.fill = subIdx < 2 ? vegFill : nvFill
      col.font = { name: 'Calibri', bold: true, size: 9, color: { argb: subIdx < 2 ? 'FF166534' : 'FF92400E' } }
    } else {
      col.fill = white
      col.font = { name: 'Calibri', bold: true, size: 9 }
    }
    col.alignment = { horizontal: 'center', vertical: 'middle' }
    col.border = border()
  }
  typeHeaderRow.height = 18

  // ── Header row 3: Count / Qty sub-labels ────────────────────────────────────
  const subLabelRow = ws.addRow([])
  subLabelRow.getCell(1).value = ''
  subLabelRow.getCell(2).value = ''
  mealsToShow.forEach((_, i) => {
    const base = FIXED + i * SUB + 1
    subLabelRow.getCell(base).value     = 'Count'
    subLabelRow.getCell(base + 1).value = 'Qty'
    subLabelRow.getCell(base + 2).value = 'Count'
    subLabelRow.getCell(base + 3).value = 'Qty'
  })
  for (let c = 1; c <= NUM_COLS; c++) {
    const col = subLabelRow.getCell(c)
    const subIdx = (c - FIXED - 1) % SUB
    if (c > FIXED) {
      col.fill = subIdx < 2 ? vegFill : nvFill
      col.font = { name: 'Calibri', bold: true, size: 9, italic: true, color: { argb: subIdx < 2 ? 'FF166534' : 'FF92400E' } }
    } else {
      col.fill = white
      col.font = { name: 'Calibri', bold: true, size: 9 }
    }
    col.alignment = { horizontal: 'center', vertical: 'middle' }
    col.border = border()
  }
  subLabelRow.height = 16

  // ── Data rows ────────────────────────────────────────────────────────────────
  sortedBatchIds.forEach(bId => {
    const g    = batchGroups[bId]
    const name = getLeadMemberName(bId)

    const rowValues = [bId, name]
    mealsToShow.forEach(meal => {
      const vegCount = g[`${meal.key}VegCount`]
      const vegQtys  = g[`${meal.key}VegQtys`]
      const nvCount  = g[`${meal.key}NonVegCount`]
      const nvQtys   = g[`${meal.key}NonVegQtys`]
      rowValues.push(
        vegCount || 0,
        vegCount > 0 ? smartQtyStr(vegQtys) : '—',
        nvCount  || 0,
        nvCount  > 0 ? smartQtyStr(nvQtys)  : '—'
      )
    })

    const dataRow = ws.addRow(rowValues)
    for (let c = 1; c <= NUM_COLS; c++) {
      const col = dataRow.getCell(c)
      const subIdx = (c - FIXED - 1) % SUB
      col.font = { name: 'Calibri', size: 10 }
      col.border = border()
      col.alignment = { horizontal: 'center', vertical: 'middle' }
      if (c > FIXED) {
        col.fill = subIdx < 2
          ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }
          : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } }
      }
    }
    dataRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
    dataRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }
    dataRow.height = 18
  })

  // ── Totals row ────────────────────────────────────────────────────────────────
  const totValues = ['TOTAL', '']
  mealsToShow.forEach(meal => {
    const vegCount = sortedBatchIds.reduce((s, id) => s + batchGroups[id][`${meal.key}VegCount`], 0)
    const nvCount  = sortedBatchIds.reduce((s, id) => s + batchGroups[id][`${meal.key}NonVegCount`], 0)
    const vegQtys  = sortedBatchIds.reduce((s, id) => s.concat(batchGroups[id][`${meal.key}VegQtys`]), [])
    const nvQtys   = sortedBatchIds.reduce((s, id) => s.concat(batchGroups[id][`${meal.key}NonVegQtys`]), [])
    totValues.push(
      vegCount || 0,
      vegCount > 0 ? smartQtyStr(vegQtys) : '—',
      nvCount  || 0,
      nvCount  > 0 ? smartQtyStr(nvQtys)  : '—'
    )
  })
  const totRow = ws.addRow(totValues)
  for (let c = 1; c <= NUM_COLS; c++) {
    totRow.getCell(c).fill = totFill
    totRow.getCell(c).font = { name: 'Calibri', size: 10, bold: true }
    totRow.getCell(c).border = border()
    totRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
  }
  totRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
  totRow.height = 20

  const batchTag = exp.value.batchId || 'AllBatches'
  const mealTag  = mealType === 'all' ? 'AllMeals' : mealType.charAt(0).toUpperCase() + mealType.slice(1)
  await triggerDownload(wb, `VJHomeFoods_Custom_${batchTag}_${mealTag}`)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clearFilters() {
  filterMonth.value = ''
  filterBatch.value = ''
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getDayName(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })
}

function formatIncome(val) {
  return 'Rs. ' + (val || 0).toLocaleString('en-IN')
}

function showAlert(msg, type) {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg = '', 4000)
}
</script>

<style scoped>
.day-badge {
  display: inline-block;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 9px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.count-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
  min-width: 36px;
  text-align: center;
}
.count-bf     { background: #eff6ff; color: #1d4ed8; }
.count-lunch  { background: #f0fdf4; color: #15803d; }
.count-dinner { background: #faf5ff; color: #7c3aed; }

.totals-footer-row {
  background: #f8fafc;
  border-top: 2px solid #e2e8f0;
}

/* Detail modal */
.detail-menu-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.detail-menu-cell {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
}
.detail-menu-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #94a3b8;
  margin-bottom: 4px;
}
.detail-menu-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
}
.detail-menu-price {
  font-size: 15px;
  font-weight: 800;
  color: #059669;
}

.detail-summary-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}
.detail-stat {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
  text-align: center;
}
.detail-stat-income {
  background: #f0fdf4;
  border-color: #a7f3d0;
}
.detail-stat-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: #94a3b8;
  margin-bottom: 6px;
}
.detail-stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}
.detail-stat-income .detail-stat-value {
  color: #059669;
  font-size: 16px;
}

/* Export modal */
.export-info-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}
</style>
