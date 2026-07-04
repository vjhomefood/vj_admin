<template>
  <div class="page-container">

    <div class="page-header">
      <div>
        <h2 class="page-title">My Bills</h2>
        <p class="page-subtitle">View your billing details, payment status and download bills</p>
      </div>
    </div>

    <!-- Alert -->
    <div v-if="alert.msg" :class="['alert', 'alert-' + alert.type]" style="margin-bottom:16px">
      {{ alert.msg }}
    </div>

    <!-- Period selector -->
    <div class="card filter-card" style="margin-bottom:18px">
      <div class="filter-row">
        <div class="filter-group">
          <label>Month</label>
          <select v-model="filter.month" class="form-input" id="p-month">
            <option v-for="m in months" :key="m.v" :value="m.v">{{ m.l }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Year</label>
          <select v-model="filter.year" class="form-input" id="p-year">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <button class="btn btn-primary" @click="loadBills" :disabled="loading">
          <svg v-if="loading" class="btn-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span v-else>Load Bills</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div> Loading bills…
    </div>

    <template v-if="!loading">
      <!-- Payment status banner -->
      <div v-if="bills.length" class="status-banner" :class="overallStatus" style="margin-bottom:18px">
        <div class="banner-icon">
          <svg v-if="overallStatus === 'paid'" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else-if="overallStatus === 'partial'" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <svg v-else width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
        <div>
          <div class="banner-title">Payment Status: {{ overallStatusLabel }}</div>
          <div class="banner-sub">Total: {{ formatRs(totalAmount) }} &nbsp;|&nbsp; Paid: {{ formatRs(totalPaid) }} &nbsp;|&nbsp; Pending: {{ formatRs(totalPending) }}</div>
        </div>
      </div>

      <!-- Bill cards -->
      <div v-if="bills.length">
        <div v-for="bill in bills" :key="bill._id" class="bill-card card">
          <!-- Bill card header -->
          <div class="bill-card-header">
            <div class="bill-card-title-row">
              <div>
                <span class="id-badge">{{ bill.memberId }}</span>
                <span class="bill-member-name">{{ bill.memberName }}</span>
                <span v-if="bill.isLead" class="lead-tag">Lead</span>
              </div>
              <div class="bill-header-right">
                <span :class="['status-badge', bill.paymentStatus.toLowerCase()]">{{ bill.paymentStatus }}</span>
                <button class="btn btn-secondary btn-sm download-btn" @click="downloadBill(bill)" title="Download PDF">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Bill
                </button>
              </div>
            </div>
            <div class="bill-card-period">
              {{ periodLabel }} &nbsp;·&nbsp;
              Grand Total: <strong>{{ formatRs(bill.grandTotal) }}</strong>
              <span v-if="bill.paidAmount"> &nbsp;·&nbsp; Paid: <strong class="paid-amt">{{ formatRs(bill.paidAmount) }}</strong></span>
            </div>
          </div>

          <!-- Line items table -->
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Breakfast</th>
                  <th>Lunch</th>
                  <th>Dinner</th>
                  <th class="text-right">Day Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in bill.lines" :key="line.date">
                  <td>{{ formatDate(line.date) }}</td>
                  <td>
                    <div v-if="line.bfQty > 0">
                      <div style="font-weight:600;">
                        {{ line.bfQty }} ({{ line.bfType === 'nonveg' ? 'NV' : 'V' }})
                        <span v-if="line.bfMultiplier > 1" style="color:#6366f1;">[Qty: {{ line.bfMultiplier }}]</span>
                        × ₹{{ line.bfPrice }}
                      </div>
                      <div v-for="a in line.bfAddons" :key="a.name" style="font-size:11px;color:#0891b2;padding-left:8px;">
                        + {{ a.name }} (₹{{ a.price }})
                      </div>
                      <div style="font-size:11px;color:#64748b;margin-top:2px;">
                        Total: ₹{{ line.bfTotal }}
                      </div>
                    </div>
                    <span v-else>—</span>
                  </td>
                  <td>
                    <div v-if="line.lunchQty > 0">
                      <div style="font-weight:600;">
                        {{ line.lunchQty }} ({{ line.lunchType === 'nonveg' ? 'NV' : 'V' }})
                        <span v-if="line.lunchMultiplier > 1" style="color:#6366f1;">[Qty: {{ line.lunchMultiplier }}]</span>
                        × ₹{{ line.lunchPrice }}
                      </div>
                      <div v-for="a in line.lunchAddons" :key="a.name" style="font-size:11px;color:#0891b2;padding-left:8px;">
                        + {{ a.name }} (₹{{ a.price }})
                      </div>
                      <div style="font-size:11px;color:#64748b;margin-top:2px;">
                        Total: ₹{{ line.lunchTotal }}
                      </div>
                    </div>
                    <span v-else>—</span>
                  </td>
                  <td>
                    <div v-if="line.dinnerQty > 0">
                      <div style="font-weight:600;">
                        {{ line.dinnerQty }} ({{ line.dinnerType === 'nonveg' ? 'NV' : 'V' }})
                        <span v-if="line.dinnerMultiplier > 1" style="color:#6366f1;">[Qty: {{ line.dinnerMultiplier }}]</span>
                        × ₹{{ line.dinnerPrice }}
                      </div>
                      <div v-for="a in line.dinnerAddons" :key="a.name" style="font-size:11px;color:#0891b2;padding-left:8px;">
                        + {{ a.name }} (₹{{ a.price }})
                      </div>
                      <div style="font-size:11px;color:#64748b;margin-top:2px;">
                        Total: ₹{{ line.dinnerTotal }}
                      </div>
                    </div>
                    <span v-else>—</span>
                  </td>
                  <td class="text-right day-total">₹{{ line.dayTotal }}</td>
                </tr>
                <!-- Grand total row -->
                <tr class="grand-total-row">
                  <td colspan="4"><strong>Grand Total</strong></td>
                  <td class="text-right"><strong>{{ formatRs(bill.grandTotal) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!bills.length" class="empty-state card">
        <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;color:var(--text-light)">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>No bills found for {{ periodLabel }}.</p>
        <p style="font-size:13px;color:#94a3b8;margin-top:6px">Bills are generated by your administrator. Contact them if you believe this is incorrect.</p>
      </div>

      <!-- Submit complaint -->
      <div class="card complaint-section">
        <h3 class="section-title">Submit a Complaint</h3>
        <textarea
          v-model="complaintMsg"
          class="complaint-textarea"
          placeholder="Describe your issue…"
          rows="4"
          id="complaint-msg"
        ></textarea>
        <button
          class="btn btn-primary"
          @click="submitComplaint"
          :disabled="!complaintMsg.trim() || submitting"
          id="btn-submit-complaint"
        >
          {{ submitting ? 'Submitting…' : 'Submit Complaint' }}
        </button>

        <!-- Past complaints -->
        <div v-if="myComplaints.length" style="margin-top:24px">
          <h4 style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">My Complaints</h4>
          <div v-for="c in myComplaints" :key="c._id" class="complaint-card">
            <div class="complaint-meta">
              <span class="complaint-date">{{ formatDate(c.createdAt) }}</span>
              <span :class="['complaint-status', c.status.toLowerCase()]">{{ c.status }}</span>
            </div>
            <p class="complaint-msg">{{ c.message }}</p>
            <!-- Admin Reply block -->
            <div v-if="c.adminNote" class="admin-reply-block">
              <div class="admin-reply-label">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                Admin Reply
              </div>
              <p class="admin-reply-text">{{ c.adminNote }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Hidden printable bill ──────────────────────────────────────────────── -->
    <div id="printable-bill" class="print-only" v-if="printBill">
      <div class="print-header">
        <div class="print-logo-row">
          <img src="/vj-logo-transparent.png" alt="VJ Home Foods" class="print-logo" />
          <div>
            <h1 class="print-company">VJ Home Foods</h1>
            <p class="print-tagline">Order Management System</p>
          </div>
        </div>
        <div class="print-bill-meta">
          <div><strong>Bill for:</strong> {{ printBill.memberName }}</div>
          <div><strong>Member ID:</strong> {{ printBill.memberId }}</div>
          <div><strong>Period:</strong> {{ periodLabel }}</div>
          <div><strong>Status:</strong> {{ printBill.paymentStatus }}</div>
          <div><strong>Generated:</strong> {{ formatDate(new Date().toISOString()) }}</div>
        </div>
      </div>

      <table class="print-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Breakfast</th>
            <th>Lunch</th>
            <th>Dinner</th>
            <th style="text-align:right">Day Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in printBill.lines" :key="line.date">
            <td>{{ formatDate(line.date) }}</td>
             <td>
               <div v-if="line.bfQty > 0">
                 <div style="font-weight:600;">
                   {{ line.bfQty }} ({{ line.bfType === 'nonveg' ? 'NV' : 'V' }})
                   <span v-if="line.bfMultiplier > 1" style="color:#6366f1;">[Qty: {{ line.bfMultiplier }}]</span>
                   × ₹{{ line.bfPrice }}
                 </div>
                 <div v-for="a in line.bfAddons" :key="a.name" style="font-size:11px;color:#0891b2;padding-left:8px;">
                   + {{ a.name }} (₹{{ a.price }})
                 </div>
                 <div style="font-size:11px;color:#64748b;margin-top:2px;">
                   Total: ₹{{ line.bfTotal }}
                 </div>
               </div>
               <span v-else>—</span>
             </td>
             <td>
               <div v-if="line.lunchQty > 0">
                 <div style="font-weight:600;">
                   {{ line.lunchQty }} ({{ line.lunchType === 'nonveg' ? 'NV' : 'V' }})
                   <span v-if="line.lunchMultiplier > 1" style="color:#6366f1;">[Qty: {{ line.lunchMultiplier }}]</span>
                   × ₹{{ line.lunchPrice }}
                 </div>
                 <div v-for="a in line.lunchAddons" :key="a.name" style="font-size:11px;color:#0891b2;padding-left:8px;">
                   + {{ a.name }} (₹{{ a.price }})
                 </div>
                 <div style="font-size:11px;color:#64748b;margin-top:2px;">
                   Total: ₹{{ line.lunchTotal }}
                 </div>
               </div>
               <span v-else>—</span>
             </td>
             <td>
               <div v-if="line.dinnerQty > 0">
                 <div style="font-weight:600;">
                   {{ line.dinnerQty }} ({{ line.dinnerType === 'nonveg' ? 'NV' : 'V' }})
                   <span v-if="line.dinnerMultiplier > 1" style="color:#6366f1;">[Qty: {{ line.dinnerMultiplier }}]</span>
                   × ₹{{ line.dinnerPrice }}
                 </div>
                 <div v-for="a in line.dinnerAddons" :key="a.name" style="font-size:11px;color:#0891b2;padding-left:8px;">
                   + {{ a.name }} (₹{{ a.price }})
                 </div>
                 <div style="font-size:11px;color:#64748b;margin-top:2px;">
                   Total: ₹{{ line.dinnerTotal }}
                 </div>
               </div>
               <span v-else>—</span>
             </td>
            <td style="text-align:right">{{ line.dayTotal }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="print-total-row">
            <td colspan="4"><strong>Grand Total</strong></td>
            <td style="text-align:right"><strong>₹{{ printBill.grandTotal }}</strong></td>
          </tr>
          <tr v-if="printBill.paidAmount" class="print-paid-row">
            <td colspan="4">Amount Paid</td>
            <td style="text-align:right">₹{{ printBill.paidAmount }}</td>
          </tr>
          <tr v-if="printBill.paidAmount" class="print-pending-row">
            <td colspan="4">Balance Pending</td>
            <td style="text-align:right">₹{{ printBill.grandTotal - (printBill.paidAmount || 0) }}</td>
          </tr>
        </tfoot>
      </table>

      <div class="print-footer">
        <p>Thank you for being a valued member of VJ Home Foods.</p>
        <p style="font-size:11px;color:#64748b;margin-top:4px">This is a computer-generated bill. For queries, contact your batch administrator.</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'

const auth = useAuthStore()

const bills        = ref([])
const myComplaints = ref([])
const loading      = ref(false)
const submitting   = ref(false)
const complaintMsg = ref('')
const alert        = ref({ msg: '', type: 'success' })
const printBill    = ref(null)

const now    = new Date()
const filter = ref({ month: now.getMonth() + 1, year: now.getFullYear() })

const months = [
  { v:1,  l:'January'   }, { v:2,  l:'February' }, { v:3,  l:'March'     },
  { v:4,  l:'April'     }, { v:5,  l:'May'       }, { v:6,  l:'June'      },
  { v:7,  l:'July'      }, { v:8,  l:'August'    }, { v:9,  l:'September' },
  { v:10, l:'October'   }, { v:11, l:'November'  }, { v:12, l:'December'  }
]
const years = [2024, 2025, 2026, 2027]

const totalAmount  = computed(() => bills.value.reduce((s, b) => s + b.grandTotal, 0))
const totalPaid    = computed(() => bills.value.reduce((s, b) => s + (b.paidAmount || 0), 0))
const totalPending = computed(() => totalAmount.value - totalPaid.value)
const periodLabel  = computed(() => {
  const m = months.find(m => m.v === filter.value.month)?.l
  return `${m} ${filter.value.year}`
})

const overallStatus = computed(() => {
  if (!bills.value.length) return 'unpaid'
  const allPaid = bills.value.every(b => b.paymentStatus === 'Paid')
  const anyPaid = bills.value.some(b => b.paymentStatus !== 'Unpaid')
  return allPaid ? 'paid' : anyPaid ? 'partial' : 'unpaid'
})
const overallStatusLabel = computed(() =>
  ({ paid: 'Fully Paid', partial: 'Partially Paid', unpaid: 'Unpaid' })[overallStatus.value]
)

onMounted(async () => {
  await loadBills()
  await loadComplaints()
})

async function loadBills() {
  loading.value = true
  try {
    const res = await api.get('/bills/my', {
      params: { month: filter.value.month, year: filter.value.year }
    })
    bills.value = res.data
  } catch {
    showAlert('Failed to load bills', 'error')
  } finally {
    loading.value = false
  }
}

async function loadComplaints() {
  try {
    const res = await api.get('/complaints')
    myComplaints.value = res.data
  } catch {}
}

async function submitComplaint() {
  if (!complaintMsg.value.trim()) return
  submitting.value = true
  try {
    const res = await api.post('/complaints', { message: complaintMsg.value.trim() })
    myComplaints.value.unshift(res.data)
    complaintMsg.value = ''
    showAlert('Complaint submitted. Admin will review it soon.', 'success')
  } catch (err) {
    showAlert(err.response?.data?.message || 'Failed to submit', 'error')
  } finally {
    submitting.value = false }
}

async function downloadBill(bill) {
  printBill.value = bill
  await nextTick()
  window.print()
  // Clear after print dialog closes
  setTimeout(() => { printBill.value = null }, 1000)
}

function formatRs(v)  { return '₹ ' + (v || 0).toLocaleString('en-IN') }
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function showAlert(msg, type = 'success') {
  alert.value = { msg, type }
  setTimeout(() => { alert.value.msg = '' }, 4000)
}
</script>

<style scoped>
.filter-card { padding: 16px 20px; }
.filter-row  { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-group label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }

@keyframes spin { to { transform: rotate(360deg); } }
.btn-spin { animation: spin 0.8s linear infinite; }

/* Status banner */
.status-banner { display: flex; gap: 16px; align-items: center; border-radius: 12px; padding: 16px 20px; }
.status-banner.paid    { background: #dcfce7; border: 1.5px solid #16a34a; }
.status-banner.partial { background: #fef9c3; border: 1.5px solid #ca8a04; }
.status-banner.unpaid  { background: #fee2e2; border: 1.5px solid #dc2626; }
.banner-icon  { display: flex; align-items: center; justify-content: center; }
.banner-title { font-weight: 700; font-size: 15px; color: #0f172a; }
.banner-sub   { font-size: 12px; color: #475569; margin-top: 2px; }

/* Bill card */
.bill-card { padding: 0; overflow: hidden; }
.bill-card-header {
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
}
.bill-card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 10px;
}
.bill-member-name { font-weight: 700; font-size: 15px; color: #0f172a; margin-left: 4px; }
.lead-tag { font-size: 10px; font-weight: 700; background: #ede9fe; color: #5b21b6; padding: 2px 7px; border-radius: 999px; margin-left: 6px; }
.id-badge { font-size: 12px; font-weight: 700; font-family: monospace; background: #e2e8f0; padding: 2px 8px; border-radius: 6px; margin-right: 4px; }
.bill-header-right { display: flex; align-items: center; gap: 10px; }

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.download-btn:hover {
  background: #0f172a;
  color: #fff;
  border-color: #0f172a;
}

.bill-card-period { font-size: 13px; color: #64748b; }
.paid-amt { color: #16a34a; }

/* Table inside card */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table thead th {
  background: #f1f5f9;
  padding: 10px 14px;
  text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
  color: #64748b; border-bottom: 1px solid var(--border);
}
.data-table thead th.text-right { text-align: right; }
.data-table tbody td { padding: 10px 14px; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; color: #334155; }
.data-table tbody td.text-right { text-align: right; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #fafafa; }

.day-total { font-weight: 700; color: #0f172a; }
.grand-total-row td { background: #f8fafc; font-size: 14px; padding: 12px 14px; border-top: 2px solid var(--border); }

/* Complaint */
.complaint-section   { margin-top: 18px; }
.complaint-textarea  { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 14px; resize: vertical; outline: none; font-family: inherit; margin-bottom: 10px; }
.complaint-textarea:focus { border-color: #0f172a; }
.complaint-card  { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 10px; }
.complaint-meta  { display: flex; justify-content: space-between; margin-bottom: 6px; }
.complaint-date  { font-size: 11px; color: #94a3b8; }
.complaint-status.open     { color: #dc2626; font-size: 11px; font-weight: 700; }
.complaint-status.resolved { color: #16a34a; font-size: 11px; font-weight: 700; }
.complaint-msg  { font-size: 13px; color: #334155; margin: 0 0 6px; }
.admin-reply-block {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 8px;
}
.admin-reply-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; color: #16a34a; margin-bottom: 5px;
}
.admin-reply-text { font-size: 13px; color: #166534; margin: 0; line-height: 1.6; }
.admin-note     { font-size: 12px; color: #6366f1; font-style: italic; }

.empty-state { text-align: center; padding: 60px; color: #94a3b8; }

/* ── Print styles ──────────────────────────────────────────────────────────── */
.print-only { display: none; }

@media print {
  /* Hide everything except the printable bill */
  body > * { display: none !important; }
  #app      { display: none !important; }

  #printable-bill {
    display: block !important;
    position: fixed;
    inset: 0;
    background: #fff;
    z-index: 99999;
    padding: 32px 40px;
    font-family: 'Inter', sans-serif;
    color: #0f172a;
  }

  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 2px solid #0f172a;
  }
  .print-logo-row { display: flex; align-items: center; gap: 14px; }
  .print-logo { width: 48px; height: 48px; object-fit: contain; }
  .print-company { font-size: 20px; font-weight: 800; margin: 0; }
  .print-tagline { font-size: 12px; color: #64748b; margin: 2px 0 0; }

  .print-bill-meta {
    text-align: right;
    font-size: 13px;
    line-height: 1.7;
    color: #334155;
  }

  .print-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    font-size: 13px;
  }
  .print-table th {
    background: #0f172a;
    color: #fff;
    padding: 10px 14px;
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .print-table td {
    padding: 9px 14px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }
  .print-total-row td {
    background: #f8fafc;
    font-size: 14px;
    padding: 12px 14px;
    border-top: 2px solid #0f172a;
  }
  .print-paid-row td    { background: #f0fdf4; color: #065f46; padding: 8px 14px; }
  .print-pending-row td { background: #fef2f2; color: #991b1b; padding: 8px 14px; }

  .print-footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 13px;
    color: #334155;
  }
}
</style>
