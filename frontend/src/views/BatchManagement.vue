<template>
  <div>
    <!-- ── Page Header ─────────────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Batch Management</h2>
        <p class="page-subtitle">Create and manage customer batches</p>
      </div>
      <div class="tab-group">
        <button :class="['tab-btn', tab === 'view' ? 'active' : '']" @click="goBackToList">
          All Batches
        </button>
        <button :class="['tab-btn', tab === 'add' ? 'active' : '']" @click="tab='add'; resetForm()">
          + Add Batch
        </button>
      </div>
    </div>

    <div class="page-body">
      <!-- Alert -->
      <div v-if="alert.msg" :class="['alert', 'alert-' + alert.type]" style="margin-bottom:16px">
        {{ alert.msg }}
      </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         TAB: VIEW ALL BATCHES
    ══════════════════════════════════════════════════════════════════════ -->
    <template v-if="tab === 'view'">

      <!-- Detail view (when batch row is clicked) -->
      <div v-if="selectedBatch" class="card">
        <div class="detail-header">
          <button class="btn btn-secondary btn-sm" @click="goBackToList" id="btn-back-batches">
            ← Back to All Batches
          </button>
          <h3 style="margin:0;font-size:16px;color:#0f172a">
            {{ selectedBatch.batchId }} — {{ selectedBatch.batchName }}
          </h3>
          <span :class="['status-badge', (selectedBatch.paymentStatus || 'unpaid').toLowerCase()]">
            {{ selectedBatch.paymentStatus || 'Unpaid' }}
          </span>
        </div>

        <!-- Members table -->
        <div class="table-wrap" style="margin-top:16px">
          <table class="data-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in detailMembers" :key="m._id">
                <td><span class="id-badge">{{ m.memberId }}</span></td>
                <td>{{ m.name }} <span v-if="m.isLead" class="lead-tag">Lead</span></td>
                <td>{{ m.isLead ? 'Leader' : 'Member' }}</td>
                <td @click.stop>
                  <select
                    :value="memberPaymentMap[m.memberId]?.status || 'Unpaid'"
                    @change="patchMemberPayment(m.memberId, $event.target.value)"
                    :class="['status-select', (memberPaymentMap[m.memberId]?.status || 'unpaid').toLowerCase()]"
                    :disabled="!memberPaymentMap[m.memberId]?.billId"
                    :title="!memberPaymentMap[m.memberId]?.billId ? 'Generate a bill first to update payment status' : ''"
                  >
                    <option>Unpaid</option>
                    <option>Paid</option>
                    <option>Partial</option>
                  </select>
                </td>
                <td>
                  <span :class="['status-dot', m.status === 'Active' ? 'active' : 'inactive']">
                    {{ m.status }}
                  </span>
                </td>
                <td>
                  <button class="icon-btn" @click="openEditMember(m)" title="Edit">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="icon-btn danger" @click="deleteMember(m)" title="Delete" v-if="!m.isLead">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </td>
              </tr>
              <tr v-if="!detailMembers.length">
                <td colspan="6" class="empty-row">No members found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Add member to existing batch -->
        <div class="add-member-inline" style="margin-top:24px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <h3 class="section-subtitle" style="font-size:13px; margin-bottom:14px">Add Member</h3>
          <div class="batch-form" style="max-width: 700px;">
            <div class="form-row">
              <div class="form-group">
                <label>Member ID</label>
                <input :value="newMemberId" class="form-input" disabled />
              </div>
              <div class="form-group">
                <label>Member Name *</label>
                <input v-model="newMember.name" placeholder="Member's full name" class="form-input" id="nm-name" required @keyup.enter="addMemberToBatch" />
              </div>
              <div class="form-group" style="display:flex; align-items:flex-end;">
                <button class="btn btn-primary" @click="addMemberToBatch" :disabled="!newMember.name.trim() || saving" style="width: 100%; height: 38px;">
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary table (no batch selected) -->
      <div v-else class="card">
        <div class="card-toolbar">
          <input v-model="search" class="search-input" placeholder="Search batch ID or name… (press / to focus)" id="batch-search" ref="searchInputRef" />
          <select v-model="mealFilter" class="meal-filter-select" id="meal-filter">
            <option value="">All Schedules</option>
            <option value="BF">BF — Breakfast</option>
            <option value="BLD">BLD — All Meals</option>
            <option value="BL">BL — Breakfast &amp; Lunch</option>
            <option value="BD">BD — Breakfast &amp; Dinner</option>
            <option value="LD">LD — Lunch &amp; Dinner</option>
            <option value="L">L — Lunch Only</option>
          </select>
          <span class="count-badge">{{ filteredBatches.length }} batches</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Batch Name</th>
                <th>Contact</th>
                <th>Members</th>
                <th>Meal Schedule</th>
                <th>Payment</th>
                <th>Complaints</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="b in filteredBatches" :key="b._id"
                class="clickable-row"
                :class="{ 'last-selected-row': lastSelectedBatchId === b.batchId }"
                :data-batchid="b.batchId"
                @click="openDetail(b)"
              >
                <td><span class="id-badge">{{ b.batchId }}</span></td>
                <td>{{ b.batchName }}</td>
                <td>{{ b.phone || '—' }}</td>
                <td>{{ b.memberCount || '—' }}</td>
                <td @click.stop>
                  <span :class="['schedule-badge', 'schedule-' + (b.mealSchedule || 'BLD').toLowerCase()]">
                    {{ b.mealSchedule || 'BLD' }}
                    <span class="schedule-desc">{{ mealScheduleLabel(b.mealSchedule || 'BLD') }}</span>
                  </span>
                </td>
                <td @click.stop>
                  <span :class="['status-badge', (b.computedPaymentStatus || 'unpaid').toLowerCase()]">
                    {{ b.computedPaymentStatus || 'Unpaid' }}
                  </span>
                </td>
                <td @click.stop>
                  <span
                    :class="['complaint-count', (complaintMap[b.batchId] || 0) > 0 ? 'has-complaints' : 'no-complaints']"
                    @click="openComplaints(b)"
                  >
                    {{ complaintMap[b.batchId] || 0 }}
                    {{ (complaintMap[b.batchId] || 0) === 1 ? 'complaint' : 'complaints' }}
                  </span>
                </td>
                <td @click.stop>
                  <button class="icon-btn" @click="openEditBatch(b)" title="Edit">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="icon-btn danger" @click="deleteBatch(b)" title="Delete">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredBatches.length">
                <td colspan="8" class="empty-row">No batches found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════════════════
         TAB: ADD NEW BATCH
    ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="tab === 'add'" class="card">
      <h3 class="section-title">New Batch</h3>
      <form @submit.prevent="createBatch" class="batch-form">

        <div class="form-row">
          <div class="form-group">
            <label>Batch ID *</label>
            <input v-model="form.batchId" id="f-batchId" class="form-input" disabled />
          </div>
          <div class="form-group">
            <label>Batch Name *</label>
            <input v-model="form.batchName" id="f-batchName" class="form-input" placeholder="e.g. AJAY Batch" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Leader Name *</label>
            <input v-model="form.leadName" id="f-leadName" class="form-input" placeholder="Leader's full name" required />
          </div>
          <div class="form-group">
            <label>Meal Schedule</label>
            <select v-model="form.mealSchedule" id="f-mealSchedule" class="form-input">
              <option value="BF">BF — Breakfast only</option>
              <option value="BLD">BLD — Breakfast, Lunch &amp; Dinner</option>
              <option value="BL">BL — Breakfast &amp; Lunch only</option>
              <option value="BD">BD — Breakfast &amp; Dinner only</option>
              <option value="LD">LD — Lunch &amp; Dinner only</option>
              <option value="L">L — Lunch only</option>
            </select>
            <small style="color:#94a3b8">Sets default meal values when orders are initialized</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Batch Password</label>
            <input type="password" v-model="form.password" id="f-password" class="form-input" placeholder="Provide a password for the batch (optional)" />
          </div>
          <div class="form-group">
            <!-- Empty column for layout alignment -->
          </div>
        </div>

        <!-- Extra members -->
        <div class="extra-members">
          <div class="section-subtitle">
            Additional Members
            <span style="color:#94a3b8;font-weight:400;font-size:12px">(optional)</span>
          </div>

          <div
            v-for="(em, idx) in form.extraMembers"
            :key="idx"
            class="member-row"
          >
            <span class="member-seq">M{{ idx + 2 }}</span>
            <input v-model="em.name" :id="'em-name-'+idx" class="form-input" placeholder="Member name" />
            <button type="button" class="icon-btn danger" @click="form.extraMembers.splice(idx,1)">✕</button>
          </div>

          <button type="button" class="btn btn-secondary btn-sm" @click="form.extraMembers.push({name:''})">
            + Add Member
          </button>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="resetForm">Reset</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Creating…' : 'Create Batch' }}
          </button>
        </div>
      </form>
    </div>

    <!-- ══ Edit Batch Modal ════════════════════════════════════════════════ -->
    <div v-if="editBatch" class="modal-overlay" @click.self="editBatch=null">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Edit Batch — {{ editBatch.batchId }}</h3>
          <button class="modal-close" @click="editBatch=null">✕</button>
        </div>
        <form @submit.prevent="saveEditBatch" class="batch-form">
          <div class="form-group">
            <label>Batch Name</label>
            <input v-model="editForm.batchName" class="form-input" id="eb-name" />
          </div>
          <div class="form-group">
            <label>Contact</label>
            <input v-model="editForm.phone" @input="editForm.phone = editForm.phone.replace(/\D/g, '').slice(0, 10)" class="form-input" id="eb-phone" />
          </div>
          <div class="form-group">
            <label>Meal Schedule</label>
            <select v-model="editForm.mealSchedule" class="form-input" id="eb-mealSchedule">
              <option value="BF">BF — Breakfast only</option>
              <option value="BLD">BLD — Breakfast, Lunch &amp; Dinner</option>
              <option value="BL">BL — Breakfast &amp; Lunch only</option>
              <option value="BD">BD — Breakfast &amp; Dinner only</option>
              <option value="LD">LD — Lunch &amp; Dinner only</option>
              <option value="L">L — Lunch only</option>
            </select>
            <small style="color:#94a3b8">Sets default meal values when orders are initialized</small>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="editForm.status" class="form-input" id="eb-status">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div class="form-group">
            <label>Batch Password (leave empty to keep unchanged)</label>
            <input type="password" v-model="editForm.password" class="form-input" placeholder="New batch password" />
          </div>
          <div class="form-group">
            <label>Location</label>
            <input v-model="editForm.location" class="form-input" id="eb-location" placeholder="e.g. Anna Nagar, Chennai" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="editBatch=null">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ══ Edit Member Modal ═══════════════════════════════════════════════ -->
    <div v-if="editMemberData" class="modal-overlay" @click.self="editMemberData=null">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Edit Member — {{ editMemberData.memberId }}</h3>
          <button class="modal-close" @click="editMemberData=null">✕</button>
        </div>
        <form @submit.prevent="saveEditMember" class="batch-form">
          <div class="form-group">
            <label>Name</label>
            <input v-model="editMemberForm.name" class="form-input" id="emf-name" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="editMemberForm.status" class="form-input" id="emf-status">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="editMemberData=null">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ══ Complaints Modal ════════════════════════════════════════════════ -->
    <div v-if="complaintsModal.show" class="modal-overlay" @click.self="complaintsModal.show=false">
      <div class="modal-card modal-wide">
        <div class="modal-header">
          <h3>Complaints — {{ complaintsModal.batchId }}</h3>
          <button class="modal-close" @click="complaintsModal.show=false">✕</button>
        </div>
        <div v-if="complaintsModal.loading" class="loading-state">Loading…</div>
        <div v-else>
          <div v-if="!complaintsModal.list.length" class="empty-state" style="padding:32px">No complaints for this batch.</div>
          <div v-for="c in complaintsModal.list" :key="c._id" class="complaint-card">
            <div class="complaint-meta">
              <span class="complaint-date">{{ formatDate(c.createdAt) }}</span>
              <span :class="['complaint-status', c.status.toLowerCase()]">{{ c.status }}</span>
            </div>
            <p class="complaint-msg">{{ c.message }}</p>
            <div v-if="c.adminNote" class="admin-note">Admin: {{ c.adminNote }}</div>
            <div class="complaint-actions" v-if="c.status === 'Open'">
              <input v-model="c._adminNote" placeholder="Resolution note…" class="form-input" style="font-size:12px" />
              <button class="btn btn-primary btn-sm" @click="resolveComplaint(c)">Mark Resolved</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import api from '../services/api'

// ── State ─────────────────────────────────────────────────────────────────────
const tab              = ref('view')
const batches          = ref([])
const search           = ref('')
const mealFilter       = ref('')
const selectedBatch    = ref(null)
const detailMembers    = ref([])
const memberPaymentMap = ref({})        // memberId -> paymentStatus from bills
const complaintMap     = ref({})
const saving           = ref(false)
const searchInputRef   = ref(null)
const lastSelectedBatchId = ref(null)   // tracks which row to highlight on back
const savedScrollY     = ref(0)         // saves window scroll before entering detail

const alert         = ref({ msg: '', type: 'success' })

const editBatch     = ref(null)
const editForm      = ref({})
const editMemberData  = ref(null)
const editMemberForm  = ref({})
const newMember     = ref({ name: '' })
const newMemberId   = ref('')

const complaintsModal = ref({ show: false, batchId: '', list: [], loading: false })

const MEAL_SCHEDULES = [
  { value: 'BF',  label: 'Breakfast only' },
  { value: 'BLD', label: 'Breakfast, Lunch & Dinner' },
  { value: 'BL',  label: 'Breakfast & Lunch' },
  { value: 'BD',  label: 'Breakfast & Dinner' },
  { value: 'LD',  label: 'Lunch & Dinner' },
  { value: 'L',   label: 'Lunch only' },
]

function mealScheduleLabel(code) {
  const found = MEAL_SCHEDULES.find(s => s.value === code)
  return found ? found.label : 'All Meals'
}

const form = ref({
  batchId: '', batchName: '', leadName: '', phone: '',
  mealSchedule: 'BF',
  password: '',
  extraMembers: []
})

// ── Computed ─────────────────────────────────────────────────────────────────
const filteredBatches = computed(() => {
  const q  = search.value.toLowerCase()
  const ms = mealFilter.value
  return batches.value.filter(b => {
    const matchSearch = !q ||
      b.batchId.toLowerCase().includes(q) ||
      (b.leadName || b.batchName).toLowerCase().includes(q)
    const matchMeal = !ms || (b.mealSchedule || 'BF') === ms
    return matchSearch && matchMeal
  })
})

const nextBatchId = computed(() => {
  let maxNum = 0
  batches.value.forEach(b => {
    const match = b.batchId.match(/^B(\d+)$/i)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const nextNum = maxNum + 1
  return 'B' + String(nextNum).padStart(3, '0')
})

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadBatches() {
  const res = await api.get('/batches')
  batches.value = res.data

  // Compute batch payment status from member bills
  try {
    const billsRes = await api.get('/bills')
    const allBills = billsRes.data
    batches.value = batches.value.map(b => {
      const batchBills = allBills.filter(bill => bill.batchId === b.batchId)
      let computedPaymentStatus = 'Unpaid'
      if (batchBills.length > 0) {
        const allPaid   = batchBills.every(bill => bill.paymentStatus === 'Paid')
        const allUnpaid = batchBills.every(bill => bill.paymentStatus === 'Unpaid')
        if (allPaid)        computedPaymentStatus = 'Paid'
        else if (allUnpaid) computedPaymentStatus = 'Unpaid'
        else                computedPaymentStatus = 'Partial'
      }
      return { ...b, computedPaymentStatus }
    })
  } catch {}

  await loadComplaintCounts()
}

async function fetchNextMemberId() {
  try {
    const res = await api.get('/members/next-id')
    newMemberId.value = res.data.nextMemberId
  } catch {
    newMemberId.value = ''
  }
}

async function loadComplaintCounts() {
  try {
    const res = await api.get('/complaints')
    const map = {}
    res.data.forEach(c => {
      if (c.status === 'Open') map[c.batchId] = (map[c.batchId] || 0) + 1
    })
    complaintMap.value = map
  } catch {}
}

onMounted(() => {
  loadBatches()
  window.addEventListener('keydown', handleKeyboard)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboard)
})

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
function handleKeyboard(e) {
  // Ignore when typing in an input/textarea/select
  const tag = document.activeElement?.tagName?.toLowerCase()
  const inInput = tag === 'input' || tag === 'textarea' || tag === 'select'

  // Escape — close any open modal first, then go back
  if (e.key === 'Escape') {
    if (complaintsModal.value.show) { complaintsModal.value.show = false; return }
    if (editMemberData.value)       { editMemberData.value = null; return }
    if (editBatch.value)            { editBatch.value = null; return }
    if (selectedBatch.value)        { goBackToList(); return }
  }

  if (inInput) return  // don't fire shortcuts when user is typing

  // / — focus search box
  if (e.key === '/' && tab.value === 'view' && !selectedBatch.value) {
    e.preventDefault()
    searchInputRef.value?.focus()
    return
  }

  // n — open Add Batch tab
  if ((e.key === 'n' || e.key === 'N') && tab.value !== 'add') {
    tab.value = 'add'
    resetForm()
    return
  }

  // b — go back to batch list from detail view
  if ((e.key === 'b' || e.key === 'B') && selectedBatch.value) {
    goBackToList()
    return
  }
}

// ── Create batch ──────────────────────────────────────────────────────────────
async function createBatch() {
  if (form.value.phone && form.value.phone.length !== 10) {
    showAlert('Leader contact must be exactly 10 digits.', 'error')
    return
  }
  saving.value = true
  try {
    const payload = {
      batchId:      form.value.batchId.trim(),
      batchName:    form.value.batchName.trim(),
      phone:        form.value.phone.trim(),
      mealSchedule: form.value.mealSchedule || 'BLD',
      password:     form.value.password || '',
      extraMembers: form.value.extraMembers.filter(m => m.name.trim())
    }
    if (!payload.batchName) payload.batchName = payload.batchId + ' Batch'

    await api.post('/batches', payload)
    showAlert('Batch created successfully!', 'success')
    resetForm()
    tab.value = 'view'
    await loadBatches()
  } catch (err) {
    showAlert(err.response?.data?.message || 'Failed to create batch', 'error')
  } finally { saving.value = false }
}

function resetForm() {
  form.value = { batchId: nextBatchId.value, batchName: '', leadName: '', phone: '', mealSchedule: 'BF', password: '', extraMembers: [] }
}

// ── Detail view ───────────────────────────────────────────────────────────────
async function openDetail(batch) {
  savedScrollY.value = window.scrollY          // save scroll before entering detail
  lastSelectedBatchId.value = batch.batchId
  selectedBatch.value = batch
  // Do NOT scroll to top — stay in place; the card replaces the list in-view
  const [detailRes, billsRes] = await Promise.allSettled([
    api.get(`/batches/${batch.batchId}/detail`),
    api.get('/bills', { params: { batchId: batch.batchId } })
  ])
  if (detailRes.status === 'fulfilled') {
    detailMembers.value = detailRes.value.data.members
  }
  // Build memberId -> { billId, status } map from bills
  if (billsRes.status === 'fulfilled') {
    const bills = billsRes.value.data
    const map = {}
    bills.forEach(b => { map[b.memberId] = { billId: b._id, status: b.paymentStatus || 'Unpaid' } })
    memberPaymentMap.value = map
  } else {
    memberPaymentMap.value = {}
  }
  await fetchNextMemberId()
}

function goBackToList() {
  selectedBatch.value = null
  memberPaymentMap.value = {}
  // Restore scroll position instantly (no smooth scroll to avoid drift)
  nextTick(() => {
    window.scrollTo({ top: savedScrollY.value, behavior: 'instant' })
    // brief flash highlight on the row the user came from
    const row = document.querySelector(`[data-batchid="${lastSelectedBatchId.value}"]`)
    if (row) {
      row.classList.add('flash-highlight')
      setTimeout(() => row.classList.remove('flash-highlight'), 1400)
    }
  })
}

// ── Patch individual member payment status ────────────────────────────────────────
async function patchMemberPayment(memberId, newStatus) {
  const entry = memberPaymentMap.value[memberId]
  if (!entry?.billId) return
  try {
    await api.patch(`/bills/${entry.billId}/payment`, { paymentStatus: newStatus })
    // Update local map reactively
    memberPaymentMap.value = {
      ...memberPaymentMap.value,
      [memberId]: { ...entry, status: newStatus }
    }
    // Recompute the batch-level aggregate in the batches list
    const allStatuses = Object.values(memberPaymentMap.value).map(e => e.status)
    const allPaid   = allStatuses.every(s => s === 'Paid')
    const allUnpaid = allStatuses.every(s => s === 'Unpaid')
    const computed  = allPaid ? 'Paid' : allUnpaid ? 'Unpaid' : 'Partial'
    // Patch the batch entry in the local list so the list view stays in sync
    batches.value = batches.value.map(b =>
      b.batchId === selectedBatch.value?.batchId
        ? { ...b, computedPaymentStatus: computed }
        : b
    )
  } catch {
    showAlert('Failed to update payment status', 'error')
  }
}

async function addMemberToBatch() {
  if (!newMember.value.name.trim()) return
  saving.value = true
  try {
    await api.post('/members', {
      batchId: selectedBatch.value.batchId,
      name:    newMember.value.name.trim(),
      memberId: newMemberId.value
    })
    newMember.value = { name: '' }
    const res = await api.get(`/batches/${selectedBatch.value.batchId}/detail`)
    detailMembers.value = res.data.members
    await fetchNextMemberId()
    await loadBatches()
  } catch (err) {
    showAlert(err.response?.data?.message || 'Failed to add member', 'error')
  } finally { saving.value = false }
}

async function deleteMember(m) {
  if (!confirm(`Delete member ${m.name}?`)) return
  try {
    await api.delete(`/members/${m._id}`)
    detailMembers.value = detailMembers.value.filter(x => x._id !== m._id)
    await loadBatches()
  } catch (err) {
    showAlert(err.response?.data?.message || 'Failed to delete member', 'error')
  }
}

// ── Edit batch ────────────────────────────────────────────────────────────────
function openEditBatch(b) {
  editBatch.value = b
  editForm.value = { batchName: b.batchName, phone: b.phone, status: b.status, mealSchedule: b.mealSchedule || 'BLD', password: '', location: b.location || '' }
}

async function saveEditBatch() {
  if (editForm.value.phone && editForm.value.phone.length !== 10) {
    showAlert('Contact must be exactly 10 digits.', 'error')
    return
  }
  saving.value = true
  try {
    await api.put(`/batches/${editBatch.value._id}`, editForm.value)
    showAlert('Batch updated', 'success')
    editBatch.value = null
    await loadBatches()
  } catch (err) {
    showAlert(err.response?.data?.message || 'Update failed', 'error')
  } finally { saving.value = false }
}

async function deleteBatch(b) {
  if (!confirm(`Delete batch ${b.batchId}? This cannot be undone.`)) return
  try {
    await api.delete(`/batches/${b._id}`)
    showAlert('Batch deleted', 'success')
    await loadBatches()
  } catch (err) {
    showAlert(err.response?.data?.message || 'Delete failed', 'error')
  }
}

// ── Edit member ───────────────────────────────────────────────────────────────
function openEditMember(m) {
  editMemberData.value = m
  editMemberForm.value = { name: m.name, phone: m.phone, status: m.status }
}

async function saveEditMember() {
  if (editMemberForm.value.phone && editMemberForm.value.phone.length !== 10) {
    showAlert('Contact must be exactly 10 digits.', 'error')
    return
  }
  saving.value = true
  try {
    await api.put(`/members/${editMemberData.value._id}`, editMemberForm.value)
    showAlert('Member updated', 'success')
    editMemberData.value = null
    const res = await api.get(`/batches/${selectedBatch.value.batchId}/detail`)
    detailMembers.value = res.data.members
  } catch (err) {
    showAlert(err.response?.data?.message || 'Update failed', 'error')
  } finally { saving.value = false }
}

// ── Payment status (batch level — computed from member bills, read-only display) ──────────────────
// No manual patch needed; status is derived automatically in loadBatches.

// ── Complaints ────────────────────────────────────────────────────────────────
async function openComplaints(b) {
  complaintsModal.value = { show: true, batchId: b.batchId, list: [], loading: true }
  try {
    const res = await api.get(`/complaints?batchId=${b.batchId}`)
    complaintsModal.value.list = res.data.map(c => ({ ...c, _adminNote: '' }))
  } finally {
    complaintsModal.value.loading = false
  }
}

async function resolveComplaint(c) {
  try {
    await api.patch(`/complaints/${c._id}`, { status: 'Resolved', adminNote: c._adminNote })
    c.status = 'Resolved'
    c.adminNote = c._adminNote
    await loadComplaintCounts()
  } catch { showAlert('Failed to resolve complaint', 'error') }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function showAlert(msg, type = 'success') {
  alert.value = { msg, type }
  setTimeout(() => { alert.value.msg = '' }, 4000)
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
/* ── Last-selected row highlight ─────────────────────────────────────────── */
.last-selected-row {
  outline: 2px solid rgba(99,102,241,0.35);
  outline-offset: -2px;
}
.flash-highlight {
  animation: rowFlash 1.4s ease-out forwards;
}
@keyframes rowFlash {
  0%   { background: rgba(99,102,241,0.18); }
  60%  { background: rgba(99,102,241,0.10); }
  100% { background: transparent; }
}

.batch-form { display: flex; flex-direction: column; gap: 18px; max-width: 700px; }
.form-row    { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.section-subtitle {
  font-size: 13px; font-weight: 600; color: #334155;
  text-transform: uppercase; letter-spacing: .05em; margin-bottom: 10px;
}
.extra-members { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
.member-row  { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.member-seq  { font-size: 12px; font-weight: 700; color: #64748b; width: 30px; flex-shrink: 0; }
.pw-wrap     { position: relative; }
.pw-toggle   { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; }
.form-actions { display: flex; gap: 10px; margin-top: 8px; }

.card-toolbar    { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.search-input    { flex: 1; max-width: 260px; height: 36px; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 12px; font-size: 13px; outline: none; }
.search-input:focus { border-color: #6366f1; }
.meal-filter-select { height: 36px; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 10px; font-size: 13px; outline: none; background: #fff; color: #334155; cursor: pointer; }
.meal-filter-select:focus { border-color: #6366f1; }
.count-badge     { background: #f1f5f9; color: #64748b; border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 600; }

.clickable-row:hover { background: #f8fafc; cursor: pointer; }

.lead-tag   { font-size: 10px; font-weight: 700; background: #ede9fe; color: #5b21b6; padding: 1px 6px; border-radius: 999px; margin-left: 4px; vertical-align: middle; }
.id-badge   { font-size: 12px; font-weight: 700; font-family: monospace; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; }

.detail-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.inline-form   { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.complaint-count {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}
.complaint-count.no-complaints {
  background: var(--surface2);
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.complaint-count.no-complaints:hover {
  background: var(--border);
  color: var(--text);
}
.complaint-count.has-complaints {
  background: var(--danger-light);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.complaint-count.has-complaints:hover {
  background: #fee2e2;
  color: #b91c1c;
}
.complaint-card  { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
.complaint-meta  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.complaint-date  { font-size: 11px; color: #94a3b8; }
.complaint-status.open     { color: #dc2626; font-size: 11px; font-weight: 700; }
.complaint-status.resolved { color: #16a34a; font-size: 11px; font-weight: 700; }
.complaint-msg   { font-size: 13px; color: #334155; margin: 0 0 8px; }
.admin-note      { font-size: 12px; color: #6366f1; font-style: italic; margin-bottom: 8px; }
.complaint-actions { display: flex; gap: 8px; align-items: center; }

.modal-wide { max-width: 600px; }
.btn-sm     { padding: 6px 14px; font-size: 12px; }
.loading-state { text-align: center; padding: 32px; color: #94a3b8; }

/* ── Meal Schedule Badge ─────────────────────────────────────────────── */
.schedule-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .04em;
  white-space: nowrap;
}
.schedule-desc {
  font-weight: 400;
  font-size: 10px;
  opacity: .8;
}
.schedule-badge.schedule-bf  { background: #fff7ed; color: #c2410c; }
.schedule-badge.schedule-bld { background: #dcfce7; color: #15803d; }
.schedule-badge.schedule-bl  { background: #dbeafe; color: #1d4ed8; }
.schedule-badge.schedule-bd  { background: #ede9fe; color: #6d28d9; }
.schedule-badge.schedule-ld  { background: #fef9c3; color: #92400e; }
.schedule-badge.schedule-l   { background: #fee2e2; color: #b91c1c; }
</style>
