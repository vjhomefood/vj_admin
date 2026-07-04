<template>
  <div>

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Billing Management</h2>
        <p class="page-subtitle">Auto-computed from daily orders — review, edit and download bills</p>
      </div>
      <button class="btn btn-primary" @click="generateBills" :disabled="generating" id="btn-generate" style="display: flex; align-items: center; gap: 6px;">
        <svg v-if="generating" width="14" height="14" class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="8"/></svg>
        <svg v-else width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>{{ generating ? 'Generating…' : 'Generate Bills' }}</span>
      </button>
    </div>

    <div class="page-body">
      <!-- Alert -->
    <div v-if="alert.msg" :class="['alert', 'alert-' + alert.type]" style="margin-bottom:16px">{{ alert.msg }}</div>

    <!-- Filter bar -->
    <div class="filter-bar card" style="margin-bottom:18px;padding:14px 20px">
      <div class="filter-row">
        <div class="filter-group">
          <label>Period</label>
          <select v-model="periodMode" class="form-input" id="period-mode">
            <option value="monthly">Monthly</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <template v-if="periodMode === 'monthly'">
          <div class="filter-group">
            <label>Month</label>
            <select v-model="filter.month" class="form-input" id="f-month">
              <option v-for="m in months" :key="m.v" :value="m.v">{{ m.l }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Year</label>
            <select v-model="filter.year" class="form-input" id="f-year">
              <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
        </template>

        <template v-else>
          <div class="filter-group">
            <label>From</label>
            <input type="date" v-model="filter.startDate" class="form-input" id="f-start" />
          </div>
          <div class="filter-group">
            <label>To</label>
            <input type="date" v-model="filter.endDate" class="form-input" id="f-end" />
          </div>
        </template>

        <div class="filter-group">
          <label>Batch</label>
          <select v-model="filter.batchId" class="form-input" id="f-batch">
            <option value="">All Batches</option>
            <option v-for="b in batches" :key="b.batchId" :value="b.batchId">
              {{ b.batchId }} – {{ b.batchName }}
            </option>
          </select>
        </div>

        <button class="btn btn-secondary" @click="loadBills" :disabled="loading" id="btn-load">
          {{ loading ? 'Loading…' : 'Load Bills' }}
        </button>
      </div>
    </div>

    <!-- Summary row -->
    <div class="summary-row" v-if="bills.length">
      <div class="sum-card">
        <span class="sum-label">Total Amount</span>
        <span class="sum-value">{{ formatRs(totalAmount) }}</span>
      </div>
      <div class="sum-card">
        <span class="sum-label">Amount Paid</span>
        <span class="sum-value green">{{ formatRs(totalPaid) }}</span>
      </div>
      <div class="sum-card">
        <span class="sum-label">Pending</span>
        <span class="sum-value red">{{ formatRs(totalPending) }}</span>
      </div>
      <div class="sum-card">
        <span class="sum-label">Bills Unpaid</span>
        <span class="sum-value">{{ bills.filter(b => b.paymentStatus !== 'Paid').length }}</span>
      </div>
    </div>

    <!-- No bills state -->
    <div v-if="!loading && !bills.length" class="empty-state card">
      <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto 12px; display: block; color: var(--text-light)">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p>No bills found for the selected period.</p>
      <p style="font-size:13px;color:#94a3b8">Click <strong>Generate Bills</strong> to compute from saved orders.</p>
    </div>

    <!-- Bills grouped by batch -->
    <div v-for="group in groupedBills" :key="group.batchId" class="batch-bill-card card">
      <div class="batch-bill-header">
        <div class="batch-bill-title">
          <span class="id-badge">{{ group.batchId }}</span>
          <span style="font-weight:700;color:#0f172a">{{ group.batchName }}</span>
          <span class="member-count">{{ group.bills.length }} members</span>
        </div>
        <div class="batch-bill-actions">
          <span class="batch-total">{{ formatRs(group.total) }}</span>
          <button class="btn btn-secondary btn-sm" @click="downloadBatchBill(group)" id="btn-dl-batch" style="display: inline-flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Batch Excel</span>
          </button>
        </div>
      </div>

      <!-- Member rows -->
      <div class="member-bills">
        <div
          v-for="bill in group.bills"
          :key="bill._id"
          class="member-bill-row"
        >
          <div class="mbr-info">
            <span class="id-badge sm">{{ bill.memberId }}</span>
            <span class="mbr-name">{{ bill.memberName }}</span>
            <span v-if="bill.isLead" class="lead-tag">Lead</span>
            <span v-if="bill.isManuallyEdited" class="edited-tag">Edited</span>
          </div>
          <div class="mbr-amount">{{ formatRs(bill.grandTotal) }}</div>
          <div class="mbr-status">
            <select
              :value="bill.paymentStatus"
              @change="patchPayment(bill, $event.target.value)"
              :class="['status-select', bill.paymentStatus.toLowerCase()]"
            >
              <option>Unpaid</option>
              <option>Paid</option>
              <option>Partial</option>
            </select>
          </div>
          <div class="mbr-actions">
            <button class="btn btn-secondary btn-sm" @click="openEditBill(bill)">Edit</button>
            <button class="btn btn-secondary btn-sm" @click="downloadMemberBill(bill)" style="display: inline-flex; align-items: center; gap: 4px;">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ Edit Bill Modal ════════════════════════════════════════════════ -->
    <div v-if="editBillData" class="modal-overlay" @click.self="editBillData=null">
      <div class="modal-card modal-xl">
        <div class="modal-header">
          <div>
            <h3 style="margin:0">Edit Bill — {{ editBillData.memberName }}</h3>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8">
              {{ editBillData.memberId }} | {{ editBillData.startDate }} → {{ editBillData.endDate }}
            </p>
          </div>
          <button class="modal-close" @click="editBillData=null">✕</button>
        </div>

        <div class="edit-bill-table-wrap">
          <table class="data-table edit-bill-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Breakfast Qty</th><th>Breakfast Price</th><th>Breakfast Total</th>
                <th>Lunch Qty</th><th>Lunch Price</th><th>Lunch Total</th>
                <th>Dinner Qty</th><th>Dinner Price</th><th>Dinner Total</th>
                <th>Day Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(line, idx) in editLines" :key="idx">
                <td>{{ formatDateShort(line.date) }}</td>
                <!-- Breakfast -->
                <td>
                  <input type="number" v-model.number="line.bfQty" class="num-input" min="0" @input="recalcLine(line)" />
                  <div style="font-size:9.5px;color:#6366f1;margin-top:2px;" v-if="line.bfMultiplier > 1">
                    Qty: {{ line.bfMultiplier }}
                  </div>
                </td>
                <td>
                  <input type="number" v-model.number="line.bfPrice" class="num-input" min="0" @input="recalcLine(line)" />
                  <div style="font-size:10px;color:#475569;margin-top:2px;max-width:80px;white-space:normal;line-height:1.2;font-weight:600;display:flex;align-items:center;gap:3px;">
                    <span class="type-badge-inline" :class="line.bfType === 'nonveg' ? 'nv-badge' : 'v-badge'">{{ line.bfType === 'nonveg' ? 'NV' : 'V' }}</span>
                    {{ getDishName(line.date, 'breakfast') }}
                  </div>
                  <div v-for="a in line.bfAddons" :key="a.name" style="font-size:9.5px;color:#0891b2;margin-top:1px;">
                    + {{ a.name }} (Rs. {{ a.price }})
                  </div>
                </td>
                <td class="total-cell">{{ line.bfTotal }}</td>
                <!-- Lunch -->
                <td>
                  <input type="number" v-model.number="line.lunchQty" class="num-input" min="0" @input="recalcLine(line)" />
                  <div style="font-size:9.5px;color:#6366f1;margin-top:2px;" v-if="line.lunchMultiplier > 1">
                    Qty: {{ line.lunchMultiplier }}
                  </div>
                </td>
                <td>
                  <input type="number" v-model.number="line.lunchPrice" class="num-input" min="0" @input="recalcLine(line)" />
                  <div style="font-size:10px;color:#475569;margin-top:2px;max-width:80px;white-space:normal;line-height:1.2;font-weight:600;display:flex;align-items:center;gap:3px;">
                    <span class="type-badge-inline" :class="line.lunchType === 'nonveg' ? 'nv-badge' : 'v-badge'">{{ line.lunchType === 'nonveg' ? 'NV' : 'V' }}</span>
                    {{ getDishName(line.date, 'lunch') }}
                  </div>
                  <div v-for="a in line.lunchAddons" :key="a.name" style="font-size:9.5px;color:#0891b2;margin-top:1px;">
                    + {{ a.name }} (Rs. {{ a.price }})
                  </div>
                </td>
                <td class="total-cell">{{ line.lunchTotal }}</td>
                <!-- Dinner -->
                <td>
                  <input type="number" v-model.number="line.dinnerQty" class="num-input" min="0" @input="recalcLine(line)" />
                  <div style="font-size:9.5px;color:#6366f1;margin-top:2px;" v-if="line.dinnerMultiplier > 1">
                    Qty: {{ line.dinnerMultiplier }}
                  </div>
                </td>
                <td>
                  <input type="number" v-model.number="line.dinnerPrice" class="num-input" min="0" @input="recalcLine(line)" />
                  <div style="font-size:10px;color:#475569;margin-top:2px;max-width:80px;white-space:normal;line-height:1.2;font-weight:600;display:flex;align-items:center;gap:3px;">
                    <span class="type-badge-inline" :class="line.dinnerType === 'nonveg' ? 'nv-badge' : 'v-badge'">{{ line.dinnerType === 'nonveg' ? 'NV' : 'V' }}</span>
                    {{ getDishName(line.date, 'dinner') }}
                  </div>
                  <div v-for="a in line.dinnerAddons" :key="a.name" style="font-size:9.5px;color:#0891b2;margin-top:1px;">
                    + {{ a.name }} (Rs. {{ a.price }})
                  </div>
                </td>
                <td class="total-cell">{{ line.dinnerTotal }}</td>
                <td class="day-total-cell">₹ {{ line.dayTotal }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="10" style="text-align:right;font-weight:700;padding:10px 8px">Grand Total</td>
                <td class="day-total-cell">₹ {{ editGrandTotal }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="form-group" style="margin-top:12px;max-width:400px">
          <label>Notes</label>
          <input v-model="editNotes" class="form-input" placeholder="Optional note…" id="edit-notes" />
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="editBillData=null">Cancel</button>
          <button class="btn btn-primary" @click="saveEditBill" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ExcelJS from 'exceljs'
import api from '../services/api'

// ── State ─────────────────────────────────────────────────────────────────────
const bills     = ref([])
const batches   = ref([])
const menusList = ref([])
const loading   = ref(false)
const generating= ref(false)
const saving    = ref(false)
const alert     = ref({ msg: '', type: 'success' })
const periodMode= ref('monthly')

const now = new Date()
const filter = ref({
  month: now.getMonth() + 1,
  year:  now.getFullYear(),
  startDate: '',
  endDate:   '',
  batchId: ''
})

const editBillData = ref(null)
const editLines    = ref([])
const editNotes    = ref('')

// ── Lookups ───────────────────────────────────────────────────────────────────
const months = [
  { v:1,l:'January' },{ v:2,l:'February' },{ v:3,l:'March' },
  { v:4,l:'April' },  { v:5,l:'May' },     { v:6,l:'June' },
  { v:7,l:'July' },   { v:8,l:'August' },  { v:9,l:'September' },
  { v:10,l:'October' },{ v:11,l:'November' },{ v:12,l:'December' }
]
const years = [2024, 2025, 2026, 2027]

// ── Computed ──────────────────────────────────────────────────────────────────
const groupedBills = computed(() => {
  const map = {}
  bills.value.forEach(b => {
    if (!map[b.batchId]) {
      const batch = batches.value.find(bt => bt.batchId === b.batchId)
      map[b.batchId] = { batchId: b.batchId, batchName: batch?.batchName || b.batchId, bills: [], total: 0 }
    }
    map[b.batchId].bills.push(b)
    map[b.batchId].total += b.grandTotal
  })
  // sort within each group: lead first
  Object.values(map).forEach(g => g.bills.sort((a,b) => (b.isLead ? 1 : 0) - (a.isLead ? 1 : 0)))
  return Object.values(map).sort((a,b) => a.batchId.localeCompare(b.batchId))
})

const totalAmount  = computed(() => bills.value.reduce((s,b) => s + b.grandTotal, 0))
const totalPaid    = computed(() => bills.value.reduce((s,b) => s + (b.paidAmount || 0), 0))
const totalPending = computed(() => totalAmount.value - totalPaid.value)
const editGrandTotal = computed(() => editLines.value.reduce((s,l) => s + (l.dayTotal||0), 0))

// ── Data loading ──────────────────────────────────────────────────────────────
onMounted(async () => {
  const res = await api.get('/batches')
  batches.value = res.data
  await loadBills()
})

async function loadBills() {
  loading.value = true
  try {
    const params = {}
    if (filter.value.batchId) params.batchId = filter.value.batchId
    let startDate, endDate
    if (periodMode.value === 'monthly') {
      params.month = filter.value.month
      params.year  = filter.value.year
      
      const y = parseInt(filter.value.year)
      const m = parseInt(filter.value.month)
      const startMonthStr = m < 10 ? `0${m}` : `${m}`
      startDate = `${y}-${startMonthStr}-01`
      const lastDay = new Date(y, m, 0).getDate()
      const lastDayStr = lastDay < 10 ? `0${lastDay}` : `${lastDay}`
      endDate = `${y}-${startMonthStr}-${lastDayStr}`
    } else {
      params.startDate = filter.value.startDate
      params.endDate   = filter.value.endDate
      startDate = filter.value.startDate
      endDate   = filter.value.endDate
    }
    const res = await api.get('/bills', { params })
    bills.value = res.data

    // Fetch menus for the range
    if (startDate && endDate) {
      const menuRes = await api.get('/menu/range', { params: { startDate, endDate } })
      menusList.value = menuRes.data
    } else {
      menusList.value = []
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Failed to load bills', 'error')
  } finally { loading.value = false }
}

function getDishName(date, mealType) {
  if (!date) return ''
  const menu = menusList.value.find(m => m.date === date)
  if (!menu) return ''
  const meal = menu[mealType]
  if (meal && typeof meal === 'object') {
    return meal.name || ''
  }
  return meal || ''
}

function getDishInfoForExcel(date, mealType, linesForDate) {
  let qtyKey = ''
  let priceKey = ''
  let addonsKey = ''
  let typeKey = ''
  if (mealType === 'breakfast') {
    qtyKey = 'bfQty'
    priceKey = 'bfPrice'
    addonsKey = 'bfAddons'
    typeKey = 'bfType'
  } else if (mealType === 'lunch') {
    qtyKey = 'lunchQty'
    priceKey = 'lunchPrice'
    addonsKey = 'lunchAddons'
    typeKey = 'lunchType'
  } else if (mealType === 'dinner') {
    qtyKey = 'dinnerQty'
    priceKey = 'dinnerPrice'
    addonsKey = 'dinnerAddons'
    typeKey = 'dinnerType'
  }

  const lineWithOrder = linesForDate.find(l => (l[qtyKey] || 0) > 0)
  const line = lineWithOrder || linesForDate[0]

  let baseName = ''
  const menu = menusList.value.find(m => m.date === date)
  if (menu) {
    const meal = menu[mealType]
    if (meal && typeof meal === 'object') {
      const isNonVeg = line && line[typeKey] === 'nonveg'
      if (isNonVeg && meal.nonVegEnabled && meal.nonVegName) {
        baseName = meal.nonVegName
      } else {
        baseName = meal.name || ''
      }
    } else {
      baseName = meal || ''
    }
  }

  if (!line) {
    return { name: baseName, price: 0 }
  }

  const basePrice = line[priceKey] || 0
  const addons = line[addonsKey] || []

  if (addons.length > 0) {
    const addonNames = addons.map(a => a.name).join('&')
    const addonPrices = addons.map(a => a.price).join('&')
    const finalName = baseName ? `${baseName}&${addonNames}` : addonNames
    const finalPrice = `${basePrice}&${addonPrices}`
    return { name: finalName, price: finalPrice }
  }

  return { name: baseName, price: basePrice }
}

async function generateBills() {
  const hasEdited = bills.value.some(b => b.isManuallyEdited)
  let force = false
  if (hasEdited) {
    const ok = confirm("Some bills in this period have manual edits. Do you want to overwrite them and recalculate from the latest orders? Click 'OK' to overwrite and recalculate, or 'Cancel' to preserve your manual edits while generating the rest.")
    force = ok
  }

  generating.value = true
  try {
    const payload = { force }
    if (periodMode.value === 'monthly') {
      payload.month = filter.value.month
      payload.year  = filter.value.year
    } else {
      payload.startDate = filter.value.startDate
      payload.endDate   = filter.value.endDate
    }

    if (filter.value.batchId) {
      // Single batch
      await api.post('/bills/generate', { ...payload, batchId: filter.value.batchId })
    } else {
      // All batches — run in parallel with Promise.allSettled
      if (!batches.value.length) {
        showAlert('No batches found to generate bills for.', 'error')
        return
      }
      const results = await Promise.allSettled(
        batches.value.map(b => api.post('/bills/generate', { ...payload, batchId: b.batchId }))
      )
      const failed = results.filter(r => r.status === 'rejected').length
      if (failed > 0) {
        showAlert(`Bills generated with ${failed} error(s). Check individual batches.`, 'error')
      } else {
        showAlert(`Bills generated successfully for ${batches.value.length} batch(es)!`, 'success')
      }
    }
    await loadBills()
  } catch (err) {
    showAlert(err.response?.data?.message || 'Generation failed', 'error')
  } finally {
    generating.value = false
  }
}

// ── Payment status ────────────────────────────────────────────────────────────
async function patchPayment(bill, status) {
  try {
    await api.patch(`/bills/${bill._id}/payment`, { paymentStatus: status })
    bill.paymentStatus = status
  } catch { showAlert('Failed to update payment', 'error') }
}

// ── Edit bill ─────────────────────────────────────────────────────────────────
function openEditBill(bill) {
  editBillData.value = bill
  editLines.value = bill.lines.map(l => ({ ...l }))
  editNotes.value = bill.notes || ''
}

function recalcLine(line) {
  const bfAddonSum = (line.bfAddons || []).reduce((s, a) => s + (Number(a.price) || 0), 0)
  const lunchAddonSum = (line.lunchAddons || []).reduce((s, a) => s + (Number(a.price) || 0), 0)
  const dinnerAddonSum = (line.dinnerAddons || []).reduce((s, a) => s + (Number(a.price) || 0), 0)

  // Base meal cost scales by count × plates; addon cost scales by count only (1 per person)
  line.bfTotal     = (line.bfQty || 0) * (line.bfMultiplier || 1) * (line.bfPrice || 0)         + (line.bfQty || 0) * bfAddonSum
  line.lunchTotal  = (line.lunchQty || 0) * (line.lunchMultiplier || 1) * (line.lunchPrice || 0) + (line.lunchQty || 0) * lunchAddonSum
  line.dinnerTotal = (line.dinnerQty || 0) * (line.dinnerMultiplier || 1) * (line.dinnerPrice || 0) + (line.dinnerQty || 0) * dinnerAddonSum
  line.dayTotal    = line.bfTotal + line.lunchTotal + line.dinnerTotal
}

async function saveEditBill() {
  saving.value = true
  try {
    const res = await api.put(`/bills/${editBillData.value._id}`, {
      lines: editLines.value,
      notes: editNotes.value
    })
    // Patch local state
    const idx = bills.value.findIndex(b => b._id === editBillData.value._id)
    if (idx !== -1) bills.value[idx] = res.data
    showAlert('Bill saved', 'success')
    editBillData.value = null
  } catch (err) {
    showAlert(err.response?.data?.message || 'Save failed', 'error')
  } finally { saving.value = false }
}

// ── Excel downloads ───────────────────────────────────────────────────────────
function borderStyle() {
  const thin = { style: 'thin', color: { argb: 'FF000000' } }
  return { top: thin, left: thin, bottom: thin, right: thin }
}

function buildBillingExcel(wb, groupBills, batchName, periodLabel) {
  const ws = wb.addWorksheet(batchName)

  // Collect all unique dates
  const allDates = [...new Set(
    groupBills.flatMap(b => b.lines.map(l => l.date))
  )].sort()

  const DELIVERY_RATE = 0.07   // 7%
  const FIXED_COLS = 2         // BatchID and name columns
  const MEAL_COLS  = 3         // BF, Lunch, Dinner per date
  // +1 for sub-total, +1 for delivery charge, +1 for grand total
  const NUM_COLS   = FIXED_COLS + allDates.length * MEAL_COLS + 3

  const totalCol    = FIXED_COLS + allDates.length * MEAL_COLS + 1  // sub-total col
  const deliveryCol = totalCol + 1                                   // delivery col
  const grandCol    = totalCol + 2                                   // grand total col

  // Build meal info map (names and prices with addons formatted)
  const mealInfoMap = {}
  allDates.forEach(d => {
    const linesForDate = groupBills.flatMap(b => b.lines).filter(l => l.date === d)
    mealInfoMap[d] = {
      breakfast: getDishInfoForExcel(d, 'breakfast', linesForDate),
      lunch:     getDishInfoForExcel(d, 'lunch',     linesForDate),
      dinner:    getDishInfoForExcel(d, 'dinner',    linesForDate)
    }
  })

  // Column widths: Col A (BatchID) is 14, Col B (name) is 22
  const colWidths = [{ width: 14 }, { width: 22 }]
  allDates.forEach(d => {
    const info = mealInfoMap[d]
    const bfWidth = Math.max(11, (info.breakfast.name || '').length + 3)
    const lnWidth = Math.max(9,  (info.lunch.name     || '').length + 3)
    const dnWidth = Math.max(9,  (info.dinner.name    || '').length + 3)
    colWidths.push({ width: bfWidth }, { width: lnWidth }, { width: dnWidth })
  })
  colWidths.push({ width: 12 })  // Sub-total
  colWidths.push({ width: 14 })  // Delivery charge
  colWidths.push({ width: 14 })  // Grand total
  ws.columns = colWidths

  const navy   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
  const slate  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
  const yellow = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } }
  const green  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }

  // ── Row 1: Title ────────────────────────────────────────────────────────
  const r1 = ws.addRow(['VJ Home Foods – Monthly Bill'])
  ws.mergeCells(r1.number, 1, r1.number, NUM_COLS)
  r1.getCell(1).font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }
  r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  r1.getCell(1).fill = navy
  r1.height = 36

  // ── Row 2: Batch + period ──────────────────────────────────────────────
  const r2 = ws.addRow([`Batch: ${batchName}   |   ${periodLabel}`])
  ws.mergeCells(r2.number, 1, r2.number, NUM_COLS)
  r2.getCell(1).font = { name: 'Calibri', size: 11, bold: true }
  r2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  r2.getCell(1).fill = slate
  r2.height = 20

  // ── Row 3: blank ──────────────────────────────────────────────────────
  ws.addRow([])

  // ── Row 4: DATE headers (merged per date, 3 cols each) ─────────────────
  const dateRow = ws.addRow(['Date & month', ''])
  ws.mergeCells(dateRow.number, 1, dateRow.number, 2)
  let col = 3
  allDates.forEach(d => {
    dateRow.getCell(col).value = formatDateLabel(d)
    ws.mergeCells(dateRow.number, col, dateRow.number, col + MEAL_COLS - 1)
    col += MEAL_COLS
  })
  dateRow.getCell(col).value = 'SUB-TOTAL'; col++
  dateRow.getCell(col).value = 'DELIVERY (7%)'; col++
  dateRow.getCell(col).value = 'GRAND TOTAL'

  // Style Date Row
  for (let c = 1; c <= NUM_COLS; c++) {
    dateRow.getCell(c).border = borderStyle()
    dateRow.getCell(c).fill = navy
    dateRow.getCell(c).font = { bold: true, name: 'Calibri', size: 10, color: { argb: 'FFFFFFFF' } }
    dateRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
  }
  dateRow.height = 22

  // ── Row 5: Dishes row ──────────────────────────────────────────────────
  const dishesRow = ws.addRow(['Dishes', ''])
  ws.mergeCells(dishesRow.number, 1, dishesRow.number, 2)

  // ── Row 6: PRICE row (labeled `& price`) ──────────────────────────────
  const priceRow = ws.addRow(['& price', ''])
  ws.mergeCells(priceRow.number, 1, priceRow.number, 2)

  col = 3
  allDates.forEach(d => {
    dishesRow.getCell(col).value = mealInfoMap[d].breakfast.name; col++
    dishesRow.getCell(col).value = mealInfoMap[d].lunch.name;     col++
    dishesRow.getCell(col).value = mealInfoMap[d].dinner.name;    col++
  })
  dishesRow.getCell(col).value = ''; col++
  dishesRow.getCell(col).value = ''; col++
  dishesRow.getCell(col).value = ''

  // Style Dishes Row
  for (let c = 1; c <= NUM_COLS; c++) {
    dishesRow.getCell(c).border = borderStyle()
    dishesRow.getCell(c).fill = slate
    dishesRow.getCell(c).font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } }
    dishesRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
  }
  dishesRow.height = 18

  col = 3
  allDates.forEach(d => {
    priceRow.getCell(col).value = mealInfoMap[d].breakfast.price; col++
    priceRow.getCell(col).value = mealInfoMap[d].lunch.price;     col++
    priceRow.getCell(col).value = mealInfoMap[d].dinner.price;    col++
  })
  priceRow.getCell(col).value = ''; col++
  priceRow.getCell(col).value = '7%'; col++
  priceRow.getCell(col).value = ''

  // Style Price Row
  for (let c = 1; c <= NUM_COLS; c++) {
    priceRow.getCell(c).border = borderStyle()
    priceRow.getCell(c).fill = yellow
    priceRow.getCell(c).font = { bold: true, name: 'Calibri', size: 9, italic: true }
    priceRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
  }
  priceRow.height = 18

  // ── Row 7: Column sub-headers row ────────────────────────────────────
  const subHeaderRow = ws.addRow(['BatchID', 'name'])
  col = 3
  allDates.forEach(() => {
    subHeaderRow.getCell(col).value = 'Breakfast'; col++
    subHeaderRow.getCell(col).value = 'Lunch'; col++
    subHeaderRow.getCell(col).value = 'Dinner'; col++
  })
  subHeaderRow.getCell(col).value = 'Sub-Total'; col++
  subHeaderRow.getCell(col).value = 'Delivery (7%)'; col++
  subHeaderRow.getCell(col).value = 'Grand Total'

  // Style Sub-header Row
  for (let c = 1; c <= NUM_COLS; c++) {
    subHeaderRow.getCell(c).border = borderStyle()
    subHeaderRow.getCell(c).fill = slate
    subHeaderRow.getCell(c).font = { bold: true, name: 'Calibri', size: 9, color: { argb: 'FF334155' } }
    subHeaderRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
  }
  subHeaderRow.height = 18

  // ── Data rows: one per member ──────────────────────────────────────────
  groupBills.forEach(bill => {
    const lineMap = {}
    bill.lines.forEach(l => { lineMap[l.date] = l })

    const rowValues = [bill.memberId, bill.memberName]
    allDates.forEach(d => {
      const l = lineMap[d]
      rowValues.push(l ? l.bfTotal : 0)
      rowValues.push(l ? l.lunchTotal : 0)
      rowValues.push(l ? l.dinnerTotal : 0)
    })
    const subTotal      = bill.grandTotal
    const deliveryCharge = Math.round(subTotal * DELIVERY_RATE * 100) / 100
    const grandTotal     = Math.round((subTotal + deliveryCharge) * 100) / 100
    rowValues.push(subTotal)
    rowValues.push(deliveryCharge)
    rowValues.push(grandTotal)

    const dataRow = ws.addRow(rowValues)
    for (let c = 1; c <= NUM_COLS; c++) {
      dataRow.getCell(c).font = { name: 'Calibri', size: 10 }
      dataRow.getCell(c).border = borderStyle()
      if (c > 2) dataRow.getCell(c).alignment = { horizontal: 'center' }
    }
    dataRow.getCell(1).alignment = { horizontal: 'center' }

    // Style delivery and grand total columns
    dataRow.getCell(deliveryCol).fill = yellow
    dataRow.getCell(grandCol).fill   = green
    dataRow.getCell(grandCol).font   = { name: 'Calibri', size: 10, bold: true }

    if (bill.isLead) {
      for (let c = 1; c <= NUM_COLS; c++) {
        dataRow.getCell(c).font = { name: 'Calibri', size: 10, bold: true }
      }
      dataRow.getCell(grandCol).fill = green
    }
    dataRow.height = 18
  })

  // ── Summary footer row ────────────────────────────────────────────────
  const footerValues = ['', 'TOTAL']
  const colCount = FIXED_COLS + allDates.length * MEAL_COLS
  for (let c = 2; c < colCount; c++) footerValues.push('')
  const totalSubTotal      = groupBills.reduce((s, b) => s + b.grandTotal, 0)
  const totalDelivery      = Math.round(totalSubTotal * DELIVERY_RATE * 100) / 100
  const totalGrand         = Math.round((totalSubTotal + totalDelivery) * 100) / 100
  footerValues.push(totalSubTotal)
  footerValues.push(totalDelivery)
  footerValues.push(totalGrand)

  const footerRow = ws.addRow(footerValues)
  for (let c = 1; c <= NUM_COLS; c++) {
    footerRow.getCell(c).border = borderStyle()
    footerRow.getCell(c).font = { name: 'Calibri', size: 10, bold: true }
    footerRow.getCell(c).fill = navy
    footerRow.getCell(c).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    footerRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
  }
  footerRow.height = 20
}

async function downloadBatchBill(group) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'VJ Home Foods OMS'
  const periodLabel = periodMode.value === 'monthly'
    ? `${months.find(m => m.v === filter.value.month)?.l} ${filter.value.year}`
    : `${filter.value.startDate} to ${filter.value.endDate}`
  buildBillingExcel(wb, group.bills, group.batchName, periodLabel)
  await triggerDownload(wb, `Bill_${group.batchId}_${periodLabel.replace(/ /g,'_')}`)
}

function applyBorder(row, numCols) {
  for (let c = 1; c <= numCols; c++) {
    row.getCell(c).border = borderStyle()
  }
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

function buildMemberBillingExcel(wb, bill, periodLabel) {
  const ws = wb.addWorksheet(bill.memberName)

  // Collect unique dates
  const allDates = [...new Set(bill.lines.map(l => l.date))].sort()

  const DELIVERY_RATE = 0.07   // 7%
  const FIXED_COLS = 2         // BatchID and name columns
  const MEAL_COLS  = 3         // BF, Lunch, Dinner per date
  const NUM_COLS   = FIXED_COLS + allDates.length * MEAL_COLS + 3

  const totalCol    = FIXED_COLS + allDates.length * MEAL_COLS + 1  // sub-total col
  const deliveryCol = totalCol + 1                                   // delivery col
  const grandCol    = totalCol + 2                                   // grand total col

  // Build meal info map (names and prices with addons formatted)
  const mealInfoMap = {}
  allDates.forEach(d => {
    const linesForDate = bill.lines.filter(l => l.date === d)
    mealInfoMap[d] = {
      breakfast: getDishInfoForExcel(d, 'breakfast', linesForDate),
      lunch:     getDishInfoForExcel(d, 'lunch',     linesForDate),
      dinner:    getDishInfoForExcel(d, 'dinner',    linesForDate)
    }
  })

  // Column widths
  const colWidths = [{ width: 14 }, { width: 22 }]
  allDates.forEach(d => {
    const info = mealInfoMap[d]
    const bfWidth = Math.max(11, (info.breakfast.name || '').length + 3)
    const lnWidth = Math.max(9,  (info.lunch.name     || '').length + 3)
    const dnWidth = Math.max(9,  (info.dinner.name    || '').length + 3)
    colWidths.push({ width: bfWidth }, { width: lnWidth }, { width: dnWidth })
  })
  colWidths.push({ width: 12 })  // Sub-total
  colWidths.push({ width: 14 })  // Delivery charge
  colWidths.push({ width: 14 })  // Grand total
  ws.columns = colWidths

  const navy   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
  const slate  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
  const yellow = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } }
  const green  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }

  // ── Row 1: Title ────────────────────────────────────────────────────────
  const r1 = ws.addRow(['VJ Home Foods – Statement of Account'])
  ws.mergeCells(r1.number, 1, r1.number, NUM_COLS)
  r1.getCell(1).font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }
  r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  r1.getCell(1).fill = navy
  r1.height = 36

  // ── Row 2: Member + period ──────────────────────────────────────────────
  const r2 = ws.addRow([`Member Name: ${bill.memberName}   |   Member ID: ${bill.memberId}   |   Batch: ${bill.batchId}   |   ${periodLabel}`])
  ws.mergeCells(r2.number, 1, r2.number, NUM_COLS)
  r2.getCell(1).font = { name: 'Calibri', size: 11, bold: true }
  r2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  r2.getCell(1).fill = slate
  r2.height = 20

  // ── Row 3: blank ──────────────────────────────────────────────────────
  ws.addRow([])

  // ── Row 4: DATE headers (merged per date, 3 cols each) ─────────────────
  const dateRow = ws.addRow(['Date & month', ''])
  ws.mergeCells(dateRow.number, 1, dateRow.number, 2)
  let col = 3
  allDates.forEach(d => {
    dateRow.getCell(col).value = formatDateLabel(d)
    ws.mergeCells(dateRow.number, col, dateRow.number, col + MEAL_COLS - 1)
    col += MEAL_COLS
  })
  dateRow.getCell(col).value = 'SUB-TOTAL'; col++
  dateRow.getCell(col).value = 'DELIVERY (7%)'; col++
  dateRow.getCell(col).value = 'GRAND TOTAL'

  // Style Date Row
  for (let c = 1; c <= NUM_COLS; c++) {
    dateRow.getCell(c).border = borderStyle()
    dateRow.getCell(c).fill = navy
    dateRow.getCell(c).font = { bold: true, name: 'Calibri', size: 10, color: { argb: 'FFFFFFFF' } }
    dateRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
  }
  dateRow.height = 22

  // ── Row 5: Dishes row ──────────────────────────────────────────────────
  const dishesRow = ws.addRow(['Dishes', ''])
  ws.mergeCells(dishesRow.number, 1, dishesRow.number, 2)

  // ── Row 6: PRICE row (labeled `& price`) ──────────────────────────────
  const priceRow = ws.addRow(['& price', ''])
  ws.mergeCells(priceRow.number, 1, priceRow.number, 2)

  col = 3
  allDates.forEach(d => {
    dishesRow.getCell(col).value = mealInfoMap[d].breakfast.name; col++
    dishesRow.getCell(col).value = mealInfoMap[d].lunch.name;     col++
    dishesRow.getCell(col).value = mealInfoMap[d].dinner.name;    col++
  })
  dishesRow.getCell(col).value = ''; col++
  dishesRow.getCell(col).value = ''; col++
  dishesRow.getCell(col).value = ''

  // Style Dishes Row
  for (let c = 1; c <= NUM_COLS; c++) {
    dishesRow.getCell(c).border = borderStyle()
    dishesRow.getCell(c).fill = slate
    dishesRow.getCell(c).font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } }
    dishesRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
  }
  dishesRow.height = 18

  col = 3
  allDates.forEach(d => {
    priceRow.getCell(col).value = mealInfoMap[d].breakfast.price; col++
    priceRow.getCell(col).value = mealInfoMap[d].lunch.price;     col++
    priceRow.getCell(col).value = mealInfoMap[d].dinner.price;    col++
  })
  priceRow.getCell(col).value = ''; col++
  priceRow.getCell(col).value = '7%'; col++
  priceRow.getCell(col).value = ''

  // Style Price Row
  for (let c = 1; c <= NUM_COLS; c++) {
    priceRow.getCell(c).border = borderStyle()
    priceRow.getCell(c).fill = yellow
    priceRow.getCell(c).font = { bold: true, name: 'Calibri', size: 9, italic: true }
    priceRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
  }
  priceRow.height = 18

  // ── Row 7: Column sub-headers row ────────────────────────────────────
  const subHeaderRow = ws.addRow(['BatchID', 'name'])
  col = 3
  allDates.forEach(() => {
    subHeaderRow.getCell(col).value = 'Breakfast'; col++
    subHeaderRow.getCell(col).value = 'Lunch'; col++
    subHeaderRow.getCell(col).value = 'Dinner'; col++
  })
  subHeaderRow.getCell(col).value = 'Sub-Total'; col++
  subHeaderRow.getCell(col).value = 'Delivery (7%)'; col++
  subHeaderRow.getCell(col).value = 'Grand Total'

  // Style Sub-header Row
  for (let c = 1; c <= NUM_COLS; c++) {
    subHeaderRow.getCell(c).border = borderStyle()
    subHeaderRow.getCell(c).fill = slate
    subHeaderRow.getCell(c).font = { bold: true, name: 'Calibri', size: 9, color: { argb: 'FF334155' } }
    subHeaderRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
  }
  subHeaderRow.height = 18

  // ── Row 8: Data row ────────────────────────────────────────────────────
  const lineMap = {}
  bill.lines.forEach(l => { lineMap[l.date] = l })

  const rowValues = [bill.memberId, bill.memberName]
  allDates.forEach(d => {
    const l = lineMap[d]
    rowValues.push(l ? l.bfTotal : 0)
    rowValues.push(l ? l.lunchTotal : 0)
    rowValues.push(l ? l.dinnerTotal : 0)
  })
  const subTotal      = bill.grandTotal
  const deliveryCharge = Math.round(subTotal * DELIVERY_RATE * 100) / 100
  const grandTotal     = Math.round((subTotal + deliveryCharge) * 100) / 100
  rowValues.push(subTotal)
  rowValues.push(deliveryCharge)
  rowValues.push(grandTotal)

  const dataRow = ws.addRow(rowValues)
  for (let c = 1; c <= NUM_COLS; c++) {
    dataRow.getCell(c).font = { name: 'Calibri', size: 10 }
    dataRow.getCell(c).border = borderStyle()
    if (c > 2) dataRow.getCell(c).alignment = { horizontal: 'center' }
  }
  dataRow.getCell(1).alignment = { horizontal: 'center' }

  // Style delivery and grand total columns
  dataRow.getCell(deliveryCol).fill = yellow
  dataRow.getCell(grandCol).fill   = green
  dataRow.getCell(grandCol).font   = { name: 'Calibri', size: 10, bold: true }

  if (bill.isLead) {
    for (let c = 1; c <= NUM_COLS; c++) {
      dataRow.getCell(c).font = { name: 'Calibri', size: 10, bold: true }
    }
    dataRow.getCell(grandCol).fill = green
  }
  dataRow.height = 18
}

async function downloadMemberBill(bill) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'VJ Home Foods OMS'
  const periodLabel = periodMode.value === 'monthly'
    ? `${months.find(m => m.v === filter.value.month)?.l} ${filter.value.year}`
    : `${bill.startDate} to ${bill.endDate}`
  buildMemberBillingExcel(wb, bill, periodLabel)
  await triggerDownload(wb, `Bill_${bill.memberId}_${bill.memberName.replace(/ /g,'_')}_${periodLabel.replace(/ /g,'_')}`)
}

async function triggerDownload(wb, filename) {
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `${filename}.xlsx`; a.click()
  URL.revokeObjectURL(url)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatRs(v) { return '₹ ' + (v || 0).toLocaleString('en-IN') }
function formatDateLabel(d) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}
function formatDateShort(d) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}
function showAlert(msg, type = 'success') {
  alert.value = { msg, type }
  setTimeout(() => { alert.value.msg = '' }, 4000)
}
</script>

<style scoped>
/* ── Type Badges instead of Emojis ───────────────────────────────────────── */
.type-badge-inline {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .02em;
  margin-right: 4px;
}
.type-badge-inline.v-badge {
  background: #dcfce7;
  color: #15803d;
}
.type-badge-inline.nv-badge {
  background: #fef3c7;
  color: #b45309;
}

.filter-bar .filter-row { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-group label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }
.filter-group .form-input { min-width: 120px; }

.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.sum-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
.sum-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
.sum-value { font-size: 22px; font-weight: 800; color: #0f172a; }
.sum-value.green { color: #16a34a; }
.sum-value.red   { color: #dc2626; }

.batch-bill-card { margin-bottom: 16px; padding: 0; overflow: hidden; }
.batch-bill-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.batch-bill-title  { display: flex; align-items: center; gap: 10px; }
.batch-bill-actions{ display: flex; align-items: center; gap: 12px; }
.batch-total { font-size: 16px; font-weight: 800; color: #0f172a; }
.member-count { font-size: 12px; color: #94a3b8; background: #f1f5f9; padding: 2px 8px; border-radius: 999px; }

.member-bills { padding: 0 20px 12px; }
.member-bill-row { display: flex; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
.member-bill-row:last-child { border-bottom: none; }
.mbr-info    { flex: 1; display: flex; align-items: center; gap: 8px; }
.mbr-name    { font-size: 14px; font-weight: 600; color: #1e293b; }
.mbr-amount  { font-size: 14px; font-weight: 700; color: #0f172a; min-width: 90px; text-align: right; }
.mbr-status  { min-width: 100px; }
.mbr-actions { display: flex; gap: 6px; }

.lead-tag    { font-size: 10px; font-weight: 700; background: #ede9fe; color: #5b21b6; padding: 1px 6px; border-radius: 999px; }
.edited-tag  { font-size: 10px; font-weight: 700; background: #fef9c3; color: #854d0e; padding: 1px 6px; border-radius: 999px; }
.id-badge    { font-size: 12px; font-weight: 700; font-family: monospace; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; }
.id-badge.sm { font-size: 11px; padding: 1px 6px; }



.edit-bill-table-wrap { overflow-x: auto; max-height: 420px; overflow-y: auto; }
.edit-bill-table th, .edit-bill-table td { font-size: 11px; padding: 6px 8px; white-space: nowrap; }
.num-input   { width: 56px; border: 1px solid #e2e8f0; border-radius: 4px; padding: 3px 5px; font-size: 11px; text-align: center; }
.total-cell  { color: #0f172a; font-weight: 600; text-align: center; }
.day-total-cell { color: #0f172a; font-weight: 700; text-align: right; background: #f1f5f9; }

.modal-xl { max-width: 1100px; width: 95vw; }
.btn-sm { padding: 6px 14px; font-size: 12px; }
.empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
</style>
