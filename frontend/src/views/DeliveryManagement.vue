<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Deliveries</h2>
        <p class="page-subtitle">Add delivery partners, bulk allot customer batches, and track statuses</p>
      </div>
      <div class="tab-group">
        <button :class="['tab-btn', tab === 'status' ? 'active' : '']" @click="tab='status'">
          Delivery Status
        </button>
        <button :class="['tab-btn', tab === 'allot' ? 'active' : '']" @click="tab='allot'">
          Allot Batches
        </button>
        <button :class="['tab-btn', tab === 'partners' ? 'active' : '']" @click="tab='partners'">
          Partners List
        </button>
      </div>
    </div>

    <div class="page-body">
      <!-- Alert -->
      <div v-if="alert.msg" :class="['alert', 'alert-' + alert.type]" style="margin-bottom:16px">
        {{ alert.msg }}
      </div>

      <!-- TAB: DELIVERY STATUS -->
      <template v-if="tab === 'status'">
        <!-- Date Selector and Stats Summary -->
        <div class="card filter-card" style="margin-bottom:18px">
          <div class="filter-row" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div class="filter-group" style="display:flex; align-items:center; gap:8px;">
              <label style="font-weight:700; color:#64748b; font-size:12px; text-transform:uppercase;">Select Date:</label>
              <input 
                type="date" 
                v-model="selectedDate" 
                @change="loadStatus"
                class="form-input" 
                style="width:160px; height:36px; padding:0 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-weight:600; outline:none;" 
              />
            </div>
            
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <div 
                @click="statusFilter = 'all'" 
                :class="['stat-mini-badge', 'total', statusFilter === 'all' ? 'active' : 'inactive']"
                style="cursor:pointer; transition:all 0.2s;"
              >
                Total: {{ stats.total }}
              </div>
              <div 
                @click="statusFilter = statusFilter === 'delivered' ? 'all' : 'delivered'" 
                :class="['stat-mini-badge', 'delivered', statusFilter === 'delivered' ? 'active' : 'inactive']"
                style="cursor:pointer; transition:all 0.2s;"
              >
                Delivered: {{ stats.delivered }}
              </div>
              <div 
                @click="statusFilter = statusFilter === 'pending' ? 'all' : 'pending'" 
                :class="['stat-mini-badge', 'pending', statusFilter === 'pending' ? 'active' : 'inactive']"
                style="cursor:pointer; transition:all 0.2s;"
              >
                Pending: {{ stats.pending }}
              </div>
              <div 
                @click="statusFilter = statusFilter === 'unassigned' ? 'all' : 'unassigned'" 
                :class="['stat-mini-badge', 'unassigned', statusFilter === 'unassigned' ? 'active' : 'inactive']"
                style="cursor:pointer; transition:all 0.2s;"
              >
                Unassigned: {{ stats.unassigned }}
              </div>
            </div>
          </div>
        </div>

        <!-- Deliveries Table -->
        <div class="card">
          <div v-if="loading" class="loading-state">Loading status details…</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Batch Name</th>
                  <th>Location</th>
                  <th>Delivery Partner</th>
                  <th>Meal Counts</th>
                  <th>Meal Delivery Statuses</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in filteredDeliveryStatuses" :key="d.batchId">
                  <td><span class="id-badge">{{ d.batchId }}</span></td>
                  <td>{{ d.batchName }}</td>
                  <td>{{ d.location || '—' }}</td>
                  <td>
                    <span v-if="d.deliveryPartner" class="partner-tag">{{ d.deliveryPartner }}</span>
                    <span v-else style="color:#94a3b8; font-style:italic">Unallotted</span>
                  </td>
                  <td>
                    <span class="meal-mini-pill bf">B: {{ d.mealSummary.bf }}</span>
                    <span class="meal-mini-pill lunch">L: {{ d.mealSummary.lunch }}</span>
                    <span class="meal-mini-pill dinner">D: {{ d.mealSummary.dinner }}</span>
                  </td>
                  <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                      <!-- Breakfast -->
                      <div class="meal-status-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                        <span class="meal-label-pill bf">B</span>
                        <span v-if="d.deliveryStatus?.bf" :class="['status-badge', d.deliveryStatus.bf.status.toLowerCase().replace(' ', '-')]">
                          {{ d.deliveryStatus.bf.status }}
                          <span v-if="d.deliveryStatus.bf.status === 'Delivered' && d.deliveryStatus.bf.deliveredAt" class="time-text">
                            ({{ formatTime(d.deliveryStatus.bf.deliveredAt) }})
                          </span>
                        </span>
                        <span v-else class="status-badge pending">Pending</span>
                      </div>
                      <!-- Lunch -->
                      <div class="meal-status-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                        <span class="meal-label-pill lunch">L</span>
                        <span v-if="d.deliveryStatus?.lunch" :class="['status-badge', d.deliveryStatus.lunch.status.toLowerCase().replace(' ', '-')]">
                          {{ d.deliveryStatus.lunch.status }}
                          <span v-if="d.deliveryStatus.lunch.status === 'Delivered' && d.deliveryStatus.lunch.deliveredAt" class="time-text">
                            ({{ formatTime(d.deliveryStatus.lunch.deliveredAt) }})
                          </span>
                        </span>
                        <span v-else class="status-badge pending">Pending</span>
                      </div>
                      <!-- Dinner -->
                      <div class="meal-status-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                        <span class="meal-label-pill dinner">D</span>
                        <span v-if="d.deliveryStatus?.dinner" :class="['status-badge', d.deliveryStatus.dinner.status.toLowerCase().replace(' ', '-')]">
                          {{ d.deliveryStatus.dinner.status }}
                          <span v-if="d.deliveryStatus.dinner.status === 'Delivered' && d.deliveryStatus.dinner.deliveredAt" class="time-text">
                            ({{ formatTime(d.deliveryStatus.dinner.deliveredAt) }})
                          </span>
                        </span>
                        <span v-else class="status-badge pending">Pending</span>
                      </div>
                    </div>
                  </td>
                  <!-- Received column -->
                  <td>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                      <!-- BF Received -->
                      <div class="meal-status-item" style="display:flex; align-items:center; gap:8px;">
                        <span class="meal-label-pill bf">B</span>
                        <button
                          v-if="d.deliveryStatus?.bf?.status === 'Delivered' || d.deliveryStatus?.bf?.received"
                          :class="['recv-btn', d.deliveryStatus?.bf?.received ? 'recv-yes' : 'recv-no']"
                          @click="markReceived(d, 'bf')"
                          :disabled="receivingKey === d.batchId + '_bf'"
                          :title="d.deliveryStatus?.bf?.received ? 'Click to un-mark received' : 'Mark as received'"
                        >
                          <svg v-if="d.deliveryStatus?.bf?.received" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                          {{ d.deliveryStatus?.bf?.received ? 'Received' : 'Mark Received' }}
                        </button>
                        <span v-else class="recv-na">—</span>
                      </div>
                      <!-- Lunch Received -->
                      <div class="meal-status-item" style="display:flex; align-items:center; gap:8px;">
                        <span class="meal-label-pill lunch">L</span>
                        <button
                          v-if="d.deliveryStatus?.lunch?.status === 'Delivered' || d.deliveryStatus?.lunch?.received"
                          :class="['recv-btn', d.deliveryStatus?.lunch?.received ? 'recv-yes' : 'recv-no']"
                          @click="markReceived(d, 'lunch')"
                          :disabled="receivingKey === d.batchId + '_lunch'"
                          :title="d.deliveryStatus?.lunch?.received ? 'Click to un-mark received' : 'Mark as received'"
                        >
                          <svg v-if="d.deliveryStatus?.lunch?.received" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                          {{ d.deliveryStatus?.lunch?.received ? 'Received' : 'Mark Received' }}
                        </button>
                        <span v-else class="recv-na">—</span>
                      </div>
                      <!-- Dinner Received -->
                      <div class="meal-status-item" style="display:flex; align-items:center; gap:8px;">
                        <span class="meal-label-pill dinner">D</span>
                        <button
                          v-if="d.deliveryStatus?.dinner?.status === 'Delivered' || d.deliveryStatus?.dinner?.received"
                          :class="['recv-btn', d.deliveryStatus?.dinner?.received ? 'recv-yes' : 'recv-no']"
                          @click="markReceived(d, 'dinner')"
                          :disabled="receivingKey === d.batchId + '_dinner'"
                          :title="d.deliveryStatus?.dinner?.received ? 'Click to un-mark received' : 'Mark as received'"
                        >
                          <svg v-if="d.deliveryStatus?.dinner?.received" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                          {{ d.deliveryStatus?.dinner?.received ? 'Received' : 'Mark Received' }}
                        </button>
                        <span v-else class="recv-na">—</span>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr v-if="!filteredDeliveryStatuses.length">
                  <td colspan="7" class="empty-row">No active batches match the selected filter.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- TAB: ALLOT BATCHES -->
      <template v-if="tab === 'allot'">
        <div class="grid-layout">
          <!-- Selection & Available Batches -->
          <div class="card" style="flex:1">
            <h3 class="section-title">Allot Batches to Delivery Partner</h3>
            
            <div class="form-group" style="max-width:400px; margin-bottom:24px">
              <label style="font-weight:700; color:#64748b; font-size:12px; text-transform:uppercase;">Select Delivery Partner:</label>
              <select v-model="selectedPartner" class="form-input" style="margin-top:6px; font-weight:600">
                <option value="">-- Choose Partner --</option>
                <option v-for="p in partners" :key="p._id" :value="p.username">
                  {{ p.username }}
                </option>
              </select>
            </div>

            <template v-if="selectedPartner">
              <div v-if="loading" class="loading-state">Loading active batches…</div>
              <div v-else>
                <h4 style="font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; margin-bottom:12px">
                  Available Batches (Showing unallotted batches and batches assigned to {{ selectedPartner }}):
                </h4>
                
                <div class="batch-checkbox-grid" style="display:flex; flex-direction:column; gap:10px; margin-bottom:24px">
                  <div 
                    v-for="b in eligibleBatches" 
                    :key="b.batchId"
                    class="batch-checkbox-item"
                    style="background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; padding:12px 16px; display:flex; align-items:center; gap:12px; cursor:pointer;"
                    @click="toggleBatchCheck(b.batchId)"
                  >
                    <input 
                      type="checkbox" 
                      :value="b.batchId" 
                      v-model="checkedBatches" 
                      @click.stop
                      style="width:18px; height:18px; cursor:pointer;"
                    />
                    <div style="flex:1">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span class="id-badge" style="font-size:11px; font-weight:800; background:#e2e8f0; padding:1px 6px; border-radius:4px; font-family:monospace">{{ b.batchId }}</span>
                        <strong style="color:#0f172a; font-size:14px">{{ b.batchName }}</strong>
                      </div>
                      <div style="font-size:12.5px; color:#64748b; margin-top:2px">
                        Location: {{ b.location || 'No location set' }}
                      </div>
                    </div>
                    <span v-if="b.deliveryPartner === selectedPartner" style="font-size:10px; background:#f3e8ff; color:#6b21a8; font-weight:800; padding:2px 8px; border-radius:20px; text-transform:uppercase;">Allotted</span>
                    <span v-else style="font-size:10px; background:#f1f5f9; color:#64748b; font-weight:800; padding:2px 8px; border-radius:20px; text-transform:uppercase;">Unallotted</span>
                  </div>
                  
                  <div v-if="!eligibleBatches.length" style="padding:24px; text-align:center; color:#94a3b8; font-style:italic">
                    No available or unallotted batches found.
                  </div>
                </div>

                <div v-if="eligibleBatches.length" style="display:flex; gap:12px">
                  <button @click="saveAllotments" :disabled="saving" class="btn btn-primary" style="height:40px; min-width:160px; font-weight:700">
                    {{ saving ? 'Saving…' : 'Save Allotments' }}
                  </button>
                </div>
              </div>
            </template>
            
            <div v-else style="padding:32px; text-align:center; color:#94a3b8; font-style:italic; border:1px dashed #e2e8f0; border-radius:12px;">
              Please select a delivery partner from the dropdown above to manage their batch assignments.
            </div>
          </div>
        </div>
      </template>

      <!-- TAB: PARTNERS LIST -->
      <template v-if="tab === 'partners'">
        <div class="grid-layout">
          <!-- Partners List -->
          <div class="card" style="flex:1">
            <h3 class="section-title">Delivery Partners</h3>
            <div v-if="loading" class="loading-state">Loading partners…</div>
            <div v-else class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in partners" :key="p._id">
                    <td><strong>{{ p.username }}</strong></td>
                    <td><span class="role-badge">{{ p.role }}</span></td>
                    <td style="color:#64748b; font-size:12px">{{ formatDate(p.createdAt) }}</td>
                  </tr>
                  <tr v-if="!partners.length">
                    <td colspan="3" class="empty-row">No delivery partners registered yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Add Partner Form -->
          <div class="card" style="width:320px; flex-shrink:0;">
            <h3 class="section-title">Add Partner</h3>
            <form @submit.prevent="addPartner" class="batch-form">
              <div class="form-group">
                <label>Username *</label>
                <input v-model="form.username" class="form-input" placeholder="e.g. delivery_john" required />
              </div>
              <div class="form-group">
                <label>Login Password *</label>
                <input v-model="form.password" type="password" class="form-input" placeholder="Min 6 characters" required />
              </div>
              <div class="form-actions" style="margin-top:10px">
                <button type="submit" class="btn btn-primary" :disabled="saving" style="width:100%">
                  {{ saving ? 'Saving…' : 'Create Account' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import api from '../services/api'

const tab = ref('status')
const loading = ref(false)
const saving = ref(false)
const alert = ref({ msg: '', type: 'success' })
const receivingKey = ref('') // tracks which meal cell is being toggled

const selectedDate = ref(new Date().toISOString().split('T')[0])
const deliveryStatuses = ref([])
const statusFilter = ref('all')
const partners = ref([])
const batches = ref([])

const filteredDeliveryStatuses = computed(() => {
  if (statusFilter.value === 'all') return deliveryStatuses.value
  
  return deliveryStatuses.value.filter(d => {
    const bfStatus = d.deliveryStatus?.bf?.status || 'Pending'
    const lunchStatus = d.deliveryStatus?.lunch?.status || 'Pending'
    const dinnerStatus = d.deliveryStatus?.dinner?.status || 'Pending'
    
    const isUnassigned = bfStatus === 'Unassigned' || lunchStatus === 'Unassigned' || dinnerStatus === 'Unassigned'
    
    if (statusFilter.value === 'unassigned') {
      return isUnassigned
    }
    
    if (statusFilter.value === 'pending') {
      if (isUnassigned) return false
      const statuses = [bfStatus, lunchStatus, dinnerStatus]
      return statuses.includes('Pending')
    }
    
    if (statusFilter.value === 'delivered') {
      if (isUnassigned) return false
      const statuses = [bfStatus, lunchStatus, dinnerStatus]
      return !statuses.includes('Pending')
    }
    
    return true
  })
})

const selectedPartner = ref('')
const checkedBatches = ref([])

const form = ref({ username: '', password: '' })

// Filter active batches to show only unallotted or allotted to the current selected partner
const eligibleBatches = computed(() => {
  if (!selectedPartner.value) return []
  return batches.value.filter(b => b.status === 'Active' && (!b.deliveryPartner || b.deliveryPartner === selectedPartner.value))
})

const stats = computed(() => {
  let total = deliveryStatuses.value.length
  let delivered = 0
  let pending = 0
  let unassigned = 0

  deliveryStatuses.value.forEach(d => {
    const bfStatus = d.deliveryStatus?.bf?.status || 'Pending'
    const lunchStatus = d.deliveryStatus?.lunch?.status || 'Pending'
    const dinnerStatus = d.deliveryStatus?.dinner?.status || 'Pending'

    if (bfStatus === 'Unassigned' || lunchStatus === 'Unassigned' || dinnerStatus === 'Unassigned') {
      unassigned++
    } else {
      const statuses = [bfStatus, lunchStatus, dinnerStatus]
      const hasPending = statuses.includes('Pending')
      const hasDelivered = statuses.includes('Delivered')
      
      if (hasPending) {
        pending++
      } else if (hasDelivered) {
        delivered++
      } else {
        // All meals are 'No Orders' but partner is assigned
        delivered++
      }
    }
  })

  return { total, delivered, pending, unassigned }
})

// Sync initially allotted batches for selected partner when selectedPartner changes
watch(selectedPartner, (newVal) => {
  if (newVal) {
    checkedBatches.value = batches.value
      .filter(b => b.deliveryPartner === newVal && b.status === 'Active')
      .map(b => b.batchId)
  } else {
    checkedBatches.value = []
  }
})

async function loadStatus() {
  loading.value = true
  try {
    const res = await api.get(`/deliveries/status?date=${selectedDate.value}`)
    deliveryStatuses.value = res.data
  } catch (err) {
    showAlert('Failed to load daily status details', 'error')
  } finally {
    loading.value = false
  }
}

async function markReceived(d, meal) {
  const key = `${d.batchId}_${meal}`
  receivingKey.value = key
  try {
    const res = await api.patch('/deliveries/receive', {
      date: selectedDate.value,
      batchId: d.batchId,
      meal
    })
    // Update local state optimistically
    if (d.deliveryStatus && d.deliveryStatus[meal]) {
      d.deliveryStatus[meal].received   = res.data.received
      d.deliveryStatus[meal].receivedAt = res.data.receivedAt
    }
  } catch (err) {
    showAlert(err.response?.data?.message || 'Failed to update received status', 'error')
  } finally {
    receivingKey.value = ''
  }
}

async function loadPartners() {
  loading.value = true
  try {
    const res = await api.get('/deliveries/partners')
    partners.value = res.data
  } catch (err) {
    showAlert('Failed to load delivery partners', 'error')
  } finally {
    loading.value = false
  }
}

async function loadBatches() {
  loading.value = true
  try {
    const res = await api.get('/batches')
    batches.value = res.data
  } catch (err) {
    showAlert('Failed to load batches list', 'error')
  } finally {
    loading.value = false
  }
}

async function addPartner() {
  if (form.value.password.length < 6) {
    showAlert('Password must be at least 6 characters long', 'error')
    return
  }
  saving.value = true
  try {
    await api.post('/deliveries/partners', form.value)
    showAlert('Delivery partner account created successfully!', 'success')
    form.value = { username: '', password: '' }
    await loadPartners()
  } catch (err) {
    showAlert(err.response?.data?.message || 'Failed to create partner account', 'error')
  } finally {
    saving.value = false
  }
}

function toggleBatchCheck(batchId) {
  const index = checkedBatches.value.indexOf(batchId)
  if (index === -1) {
    checkedBatches.value.push(batchId)
  } else {
    checkedBatches.value.splice(index, 1)
  }
}

async function saveAllotments() {
  if (!selectedPartner.value) return
  saving.value = true
  try {
    await api.put('/deliveries/assign', {
      deliveryPartner: selectedPartner.value,
      batchIds: checkedBatches.value
    })
    showAlert(`Successfully updated allotments for ${selectedPartner.value}!`, 'success')
    
    // Reload data so states align
    await loadBatches()
    await loadStatus()
    
    // Reset checked state
    checkedBatches.value = batches.value
      .filter(b => b.deliveryPartner === selectedPartner.value && b.status === 'Active')
      .map(b => b.batchId)
  } catch (err) {
    showAlert(err.response?.data?.message || 'Failed to save allotments', 'error')
  } finally {
    saving.value = false
  }
}

function showAlert(msg, type = 'success') {
  alert.value = { msg, type }
  setTimeout(() => { alert.value.msg = '' }, 4000)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await Promise.all([loadStatus(), loadPartners(), loadBatches()])
})
</script>

<style scoped>
.grid-layout { display: flex; gap: 20px; flex-wrap: wrap; }
.batch-form  { display: flex; flex-direction: column; gap: 14px; }
.loading-state { text-align: center; padding: 32px; color: #94a3b8; }
.empty-row { text-align: center; color: #94a3b8; padding: 24px 0; }

.stat-mini-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
  border: 2px solid transparent;
  transition: all 0.2s;
}
.stat-mini-badge.total { background: #f1f5f9; color: #475569; }
.stat-mini-badge.delivered { background: #dcfce7; color: #166534; }
.stat-mini-badge.pending { background: #fef9c3; color: #854d0e; }
.stat-mini-badge.unassigned { background: #fee2e2; color: #991b1b; }

.stat-mini-badge.inactive {
  opacity: 0.5;
}
.stat-mini-badge.inactive:hover {
  opacity: 0.85;
}
.stat-mini-badge.active {
  opacity: 1;
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px currentColor;
}

.role-badge {
  font-size: 11px; font-weight: 700; background: #e0f2fe; color: #0369a1;
  padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
}

.partner-tag {
  background: #f3e8ff; color: #6b21a8; font-weight: 600; font-size: 12px;
  padding: 2px 8px; border-radius: 4px;
}

.meal-mini-pill {
  font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-right: 4px;
}
.meal-mini-pill.bf { background: #fef3c7; color: #d97706; }
.meal-mini-pill.lunch { background: #e0f2fe; color: #0284c7; }
.meal-mini-pill.dinner { background: #fae8ff; color: #c084fc; }

.status-pill {
  font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: uppercase;
}
.status-pill.delivered { background: #dcfce7; color: #15803d; }
.status-pill.pending { background: #fef9c3; color: #a16207; }
.status-pill.unassigned { background: #fee2e2; color: #b91c1c; }

.batch-checkbox-item {
  transition: all 0.2s ease;
}
.batch-checkbox-item:hover {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
  transform: translateY(-1px);
}

.meal-label-pill {
  font-size: 10px;
  font-weight: 800;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.meal-label-pill.bf { background: #fef3c7; color: #d97706; }
.meal-label-pill.lunch { background: #e0f2fe; color: #0284c7; }
.meal-label-pill.dinner { background: #fae8ff; color: #c084fc; }

.status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}
.status-badge.delivered { background: #dcfce7; color: #15803d; }
.status-badge.pending { background: #fef9c3; color: #a16207; }
.status-badge.unassigned { background: #fee2e2; color: #b91c1c; }
.status-badge.no-orders { background: #f1f5f9; color: #94a3b8; text-transform: uppercase; font-weight: 500; }

.recv-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 700; padding: 3px 10px;
  border-radius: 6px; border: 1.5px solid transparent;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.recv-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.recv-yes {
  background: #dcfce7; color: #15803d; border-color: #86efac;
}
.recv-yes:hover:not(:disabled) { background: #bbf7d0; }
.recv-no {
  background: #f8fafc; color: #64748b; border-color: #cbd5e1;
}
.recv-no:hover:not(:disabled) { background: #e2e8f0; color: #0f172a; border-color: #94a3b8; }
.recv-na { font-size: 12px; color: #cbd5e1; }
</style>
