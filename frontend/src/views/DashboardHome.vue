<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Dashboard</h2>
        <p>Welcome back, {{ auth.user?.username }} &mdash; {{ todayFormatted }}</p>
      </div>
    </div>

    <div class="page-body">
      <!-- Stat Cards -->
      <div class="stat-cards dashboard-stat-cards">
        <!-- Batches Card -->
        <div class="stat-card">
          <div class="stat-icon dark">
            <svg width="22" height="22" fill="none" stroke="#ffffff" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div style="flex: 1">
            <div class="stat-label" style="text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; margin-bottom: 4px;">Batches</div>
            <div style="display: flex; align-items: baseline; gap: 8px;">
              <span class="stat-value">{{ stats.batches.total }}</span>
              <span style="font-size: 13px; color: var(--text-muted)">total</span>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 8px; font-size: 12px; border-top: 1px solid var(--border); padding-top: 6px;">
              <div><span style="color: var(--success); font-weight: 600">{{ stats.batches.active }}</span> <span style="color: var(--text-muted)">Active</span></div>
              <div><span style="color: var(--danger); font-weight: 600">{{ stats.batches.inactive }}</span> <span style="color: var(--text-muted)">Inactive</span></div>
            </div>
          </div>
        </div>

        <!-- Orders Card -->
        <div class="stat-card">
          <div class="stat-icon dark">
            <svg width="22" height="22" fill="none" stroke="#ffffff" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div style="flex: 1">
            <div class="stat-label" style="text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; margin-bottom: 4px;">Today's Orders</div>
            <div style="display: flex; align-items: baseline; gap: 8px;">
              <span class="stat-value">{{ stats.orders.total }}</span>
              <span style="font-size: 13px; color: var(--text-muted)">total meals</span>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 8px; font-size: 12px; border-top: 1px solid var(--border); padding-top: 6px;">
              <div><span style="font-weight: 600; color: var(--text)">{{ stats.orders.bf }}</span> <span style="color: var(--text-muted)">Breakfast</span></div>
              <div><span style="font-weight: 600; color: var(--text)">{{ stats.orders.lunch }}</span> <span style="color: var(--text-muted)">Lunch</span></div>
              <div><span style="font-weight: 600; color: var(--text)">{{ stats.orders.dinner }}</span> <span style="color: var(--text-muted)">Dinner</span></div>
            </div>
          </div>
        </div>

        <!-- Billing Card -->
        <div class="stat-card">
          <div class="stat-icon dark">
            <svg width="22" height="22" fill="none" stroke="#ffffff" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div style="flex: 1">
            <div class="stat-label" style="text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; margin-bottom: 4px;">Billing (This Month)</div>
            <div style="display: flex; align-items: baseline; gap: 8px;">
              <span class="stat-value">Rs. {{ stats.billing.pending.toLocaleString() }}</span>
              <span style="font-size: 12px; color: var(--danger); font-weight: 600">Pending</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; border-top: 1px solid var(--border); padding-top: 6px;">
              <div><span style="font-weight: 600; color: var(--text-muted)">{{ stats.billing.unpaidCount }}</span> <span style="color: var(--text-muted)">Unpaid Bills</span></div>
              <div><span style="color: var(--success); font-weight: 600">Rs. {{ stats.billing.paid.toLocaleString() }}</span> <span style="color: var(--text-muted)">Paid</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom panels -->
      <div class="dashboard-panels">
        <!-- Active Batches -->
        <div class="table-wrapper">
          <div class="table-header">
            <div>
              <h3>Active Batches</h3>
              <p>{{ activeBatches.length }} active batch{{ activeBatches.length !== 1 ? 'es' : '' }}</p>
            </div>
            <RouterLink to="/admin/batches" class="btn btn-secondary btn-sm">View All</RouterLink>
          </div>
          <div v-if="loading" class="loading-spinner"><div class="spinner"></div> Loading...</div>
          <table v-else>
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in activeBatches.slice(0, 5)" :key="b._id">
                <td><strong>{{ b.batchId }}</strong></td>
                <td>{{ b.batchName }}</td>
                <td>{{ b.phone }}</td>
                <td><span class="badge" :class="b.status === 'Active' ? 'badge-active' : 'badge-inactive'">{{ b.status }}</span></td>
              </tr>
              <tr v-if="activeBatches.length === 0">
                <td colspan="4" style="padding:20px;text-align:center;color:#94a3b8;font-size:13px">No batches added yet</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Today's Summary -->
        <div class="table-wrapper">
          <div class="table-header">
            <div>
              <h3>Today's Summary</h3>
              <p>{{ todayDateStr }}</p>
            </div>
            <RouterLink to="/admin/scheduler" class="btn btn-primary btn-sm">Open Scheduler</RouterLink>
          </div>
          <table>
            <thead>
              <tr>
                <th>Meal</th>
                <th class="text-right">Count</th>
                <th class="text-right">Income</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Breakfast</td>
                <td class="text-right"><strong>{{ todaySummary?.bfTotal ?? '—' }}</strong></td>
                <td class="text-right">{{ todaySummary ? 'Rs. ' + (todaySummary.bfTotal * (todayMenu?.breakfast?.price || 0)).toLocaleString() : '—' }}</td>
              </tr>
              <tr>
                <td>Lunch</td>
                <td class="text-right"><strong>{{ todaySummary?.lunchTotal ?? '—' }}</strong></td>
                <td class="text-right">{{ todaySummary ? 'Rs. ' + (todaySummary.lunchTotal * (todayMenu?.lunch?.price || 0)).toLocaleString() : '—' }}</td>
              </tr>
              <tr>
                <td>Dinner</td>
                <td class="text-right"><strong>{{ todaySummary?.dinnerTotal ?? '—' }}</strong></td>
                <td class="text-right">{{ todaySummary ? 'Rs. ' + (todaySummary.dinnerTotal * (todayMenu?.dinner?.price || 0)).toLocaleString() : '—' }}</td>
              </tr>
              <tr style="background:#f0fdf4;font-weight:700">
                <td>Total Income</td>
                <td></td>
                <td class="text-right" style="color:#059669;font-size:15px">Rs. {{ stats.income.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../services/api'

const auth = useAuthStore()
const loading = ref(true)
const activeBatches = ref([])
const stats = ref({
  batches: { total: 0, active: 0, inactive: 0 },
  orders: { total: 0, bf: 0, lunch: 0, dinner: 0 },
  billing: { unpaidCount: 0, paid: 0, pending: 0 },
  income: 0
})
const todaySummary = ref(null)
const todayMenu = ref(null)

const now = new Date()
const todayDateStr = now.toISOString().split('T')[0]
const todayFormatted = now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

onMounted(async () => {
  try {
    const [batchRes, summaryRes, menuRes, billsSummaryRes] = await Promise.allSettled([
      api.get('/batches'),
      api.get(`/summary/${todayDateStr}`),
      api.get(`/menu/${todayDateStr}`),
      api.get('/bills/summary', { params: { month: now.getMonth() + 1, year: now.getFullYear() } })
    ])
    if (batchRes.status === 'fulfilled') {
      const batches = batchRes.value.data
      activeBatches.value = batches.filter(b => b.status === 'Active')
      stats.value.batches.total = batches.length
      stats.value.batches.active = activeBatches.value.length
      stats.value.batches.inactive = batches.filter(b => b.status === 'Inactive').length
    }
    if (summaryRes.status === 'fulfilled' && summaryRes.value.data) {
      todaySummary.value = summaryRes.value.data
      const bf = todaySummary.value.bfTotal || 0
      const lunch = todaySummary.value.lunchTotal || 0
      const dinner = todaySummary.value.dinnerTotal || 0
      stats.value.orders.bf = bf
      stats.value.orders.lunch = lunch
      stats.value.orders.dinner = dinner
      stats.value.orders.total = bf + lunch + dinner
      stats.value.income = todaySummary.value.income || 0
    }
    if (menuRes.status === 'fulfilled' && menuRes.value.data) todayMenu.value = menuRes.value.data
    if (billsSummaryRes.status === 'fulfilled' && billsSummaryRes.value.data) {
      const bSummary = billsSummaryRes.value.data
      stats.value.billing.unpaidCount = bSummary.unpaidCount || 0
      stats.value.billing.paid = bSummary.paidAmount || 0
      stats.value.billing.pending = (bSummary.totalAmount || 0) - (bSummary.paidAmount || 0)
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard-stat-cards {
  grid-template-columns: repeat(3, 1fr);
}
.dashboard-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 1024px) {
  .dashboard-stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-stat-cards {
    grid-template-columns: 1fr;
  }
  .dashboard-panels {
    grid-template-columns: 1fr;
  }
}
</style>
