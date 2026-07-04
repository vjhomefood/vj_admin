<template>
  <div class="page-container">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Complaints</h2>
        <p class="page-subtitle">View and reply to complaints submitted by batches</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" @click="loadComplaints" :disabled="loading" id="btn-refresh-complaints">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Alert -->
    <transition name="fade">
      <div v-if="alert.msg" :class="['cmp-alert', alert.type]">
        <svg v-if="alert.type === 'success'" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        {{ alert.msg }}
      </div>
    </transition>

    <template v-if="!loading">

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card open-stat">
          <div class="stat-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ stats.open }}</div>
            <div class="stat-label">Open</div>
          </div>
        </div>
        <div class="stat-card resolved-stat">
          <div class="stat-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ stats.resolved }}</div>
            <div class="stat-label">Resolved</div>
          </div>
        </div>
        <div class="stat-card total-stat">
          <div class="stat-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ complaints.length }}</div>
            <div class="stat-label">Total</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar">
        <button
          v-for="t in tabs" :key="t.key"
          :class="['tab-btn', { active: activeTab === t.key }]"
          @click="activeTab = t.key"
        >
          {{ t.label }}
          <span class="tab-count">{{ t.count }}</span>
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div> Loading complaints…
      </div>

      <!-- Empty state -->
      <div v-else-if="!filtered.length" class="empty-state">
        <svg width="40" height="40" fill="none" stroke="#cbd5e1" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <p>No {{ activeTab === 'all' ? '' : activeTab }} complaints found.</p>
      </div>

      <!-- Complaint Cards -->
      <div v-else class="complaints-list">
        <div
          v-for="c in filtered"
          :key="c._id"
          :class="['complaint-card', c.status.toLowerCase()]"
        >
          <!-- Card Header -->
          <div class="card-top">
            <div class="batch-info">
              <div class="batch-avatar">{{ c.batchId.replace('B','') }}</div>
              <div>
                <div class="batch-name">{{ c.batchName }}</div>
                <div class="batch-meta">{{ c.batchId }} &bull; {{ formatDate(c.createdAt) }}</div>
              </div>
            </div>
            <span :class="['status-badge', c.status.toLowerCase()]">
              <svg v-if="c.status === 'Open'" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <svg v-else width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              {{ c.status }}
            </span>
          </div>

          <!-- Complaint Message -->
          <div class="complaint-msg-box">
            <p class="complaint-text">{{ c.message }}</p>
          </div>

          <!-- Admin Reply (if exists) -->
          <div v-if="c.adminNote" class="admin-reply-box">
            <div class="reply-label">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
              Admin Reply
              <span v-if="c.updatedAt" class="reply-time">{{ formatDate(c.updatedAt) }}</span>
            </div>
            <p class="reply-text">{{ c.adminNote }}</p>
          </div>

          <!-- Actions / Reply Form -->
          <div class="card-actions">
            <button
              v-if="replyingId !== c._id"
              class="btn-reply"
              @click="openReply(c)"
              :id="`btn-reply-${c._id}`"
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
              {{ c.adminNote ? 'Edit Reply' : 'Reply' }}
            </button>
            <button
              v-if="c.status === 'Open' && replyingId !== c._id"
              class="btn-resolve"
              @click="resolveOnly(c)"
              :disabled="saving"
              :id="`btn-resolve-${c._id}`"
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              Mark Resolved
            </button>
          </div>

          <!-- Inline Reply Form -->
          <div v-if="replyingId === c._id" class="reply-form">
            <textarea
              v-model="replyText"
              class="reply-textarea"
              placeholder="Type your reply to this complaint…"
              rows="3"
              :id="`textarea-reply-${c._id}`"
            ></textarea>
            <div class="reply-form-actions">
              <button class="btn-cancel-reply" @click="cancelReply">Cancel</button>
              <button
                v-if="c.status === 'Open'"
                class="btn-send-resolve"
                @click="sendReply(c, 'Resolved')"
                :disabled="!replyText.trim() || saving"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                {{ saving ? 'Saving…' : 'Reply & Resolve' }}
              </button>
              <button
                class="btn-send-only"
                @click="sendReply(c, c.status)"
                :disabled="!replyText.trim() || saving"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                {{ saving ? 'Saving…' : 'Send Reply' }}
              </button>
            </div>
          </div>

        </div>
      </div>

    </template>

    <!-- Page-level loading -->
    <div v-if="loading" class="page-loading">
      <div class="spinner"></div> Loading complaints…
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const loading  = ref(false)
const saving   = ref(false)
const alert    = ref({ msg: '', type: 'success' })
const complaints = ref([])
const activeTab  = ref('open')
const replyingId = ref(null)
const replyText  = ref('')

const tabs = computed(() => [
  { key: 'open',     label: 'Open',     count: stats.value.open },
  { key: 'resolved', label: 'Resolved', count: stats.value.resolved },
  { key: 'all',      label: 'All',      count: complaints.value.length }
])

const stats = computed(() => ({
  open:     complaints.value.filter(c => c.status === 'Open').length,
  resolved: complaints.value.filter(c => c.status === 'Resolved').length
}))

const filtered = computed(() => {
  if (activeTab.value === 'all')      return complaints.value
  if (activeTab.value === 'open')     return complaints.value.filter(c => c.status === 'Open')
  if (activeTab.value === 'resolved') return complaints.value.filter(c => c.status === 'Resolved')
  return complaints.value
})

async function loadComplaints() {
  loading.value = true
  try {
    const res = await api.get('/complaints')
    complaints.value = res.data
  } catch {
    showAlert('Failed to load complaints', 'error')
  } finally {
    loading.value = false
  }
}

function openReply(c) {
  replyingId.value = c._id
  replyText.value  = c.adminNote || ''
}

function cancelReply() {
  replyingId.value = null
  replyText.value  = ''
}

async function sendReply(c, status) {
  if (!replyText.value.trim()) return
  saving.value = true
  try {
    const res = await api.patch(`/complaints/${c._id}`, {
      adminNote: replyText.value.trim(),
      status
    })
    const idx = complaints.value.findIndex(x => x._id === c._id)
    if (idx !== -1) complaints.value[idx] = res.data
    cancelReply()
    showAlert('Reply sent successfully', 'success')
  } catch {
    showAlert('Failed to send reply', 'error')
  } finally {
    saving.value = false
  }
}

async function resolveOnly(c) {
  saving.value = true
  try {
    const res = await api.patch(`/complaints/${c._id}`, { status: 'Resolved' })
    const idx = complaints.value.findIndex(x => x._id === c._id)
    if (idx !== -1) complaints.value[idx] = res.data
    showAlert('Complaint marked as resolved', 'success')
  } catch {
    showAlert('Failed to update status', 'error')
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
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(loadComplaints)
</script>

<style scoped>
/* ── Layout ───────────────────────────────────────────────────────────────── */
.page-container  { padding: 0; }
.page-header     { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-title      { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.03em; }
.page-subtitle   { font-size: 13px; color: #64748b; margin: 0; }
.header-actions  { display: flex; gap: 8px; align-items: center; }

.btn-refresh {
  display: inline-flex; align-items: center; gap: 6px;
  background: #f1f5f9; border: 1.5px solid #e2e8f0; border-radius: 8px;
  padding: 7px 14px; font-size: 13px; font-weight: 600; color: #475569;
  cursor: pointer; transition: all 0.15s;
}
.btn-refresh:hover { background: #e2e8f0; }

/* ── Alert ────────────────────────────────────────────────────────────────── */
.cmp-alert {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; border-radius: 10px; font-size: 13px;
  font-weight: 600; margin-bottom: 20px;
}
.cmp-alert.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.cmp-alert.error   { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }

/* ── Stats ────────────────────────────────────────────────────────────────── */
.stats-row { display: flex; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
.stat-card {
  display: flex; align-items: center; gap: 14px;
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px;
  padding: 16px 22px; flex: 1; min-width: 140px;
  transition: box-shadow 0.2s;
}
.stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
.stat-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.open-stat .stat-icon     { background: #fef2f2; color: #dc2626; }
.resolved-stat .stat-icon { background: #f0fdf4; color: #16a34a; }
.total-stat .stat-icon    { background: #f0f9ff; color: #0284c7; }
.stat-value { font-size: 26px; font-weight: 800; color: #0f172a; line-height: 1; }
.stat-label { font-size: 12px; color: #64748b; font-weight: 600; margin-top: 3px; text-transform: uppercase; letter-spacing: .04em; }

/* ── Tabs ─────────────────────────────────────────────────────────────────── */
.tab-bar   { display: flex; gap: 4px; margin-bottom: 20px; background: #f8fafc; border-radius: 12px; padding: 4px; border: 1.5px solid #e2e8f0; width: fit-content; }
.tab-btn   { display: flex; align-items: center; gap: 6px; padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; border: none; background: transparent; transition: all 0.15s; }
.tab-btn.active { background: #0f172a; color: #fff; }
.tab-btn:hover:not(.active) { background: #e2e8f0; }
.tab-count { background: rgba(255,255,255,0.2); font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 100px; }
.tab-btn:not(.active) .tab-count { background: #e2e8f0; color: #64748b; }

/* ── Empty / Loading ──────────────────────────────────────────────────────── */
.empty-state { text-align: center; padding: 64px 24px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty-state p { font-size: 14px; margin: 0; }
.loading-state, .page-loading { text-align: center; padding: 48px; color: #94a3b8; display: flex; align-items: center; justify-content: center; gap: 10px; }

.spinner {
  width: 16px; height: 16px; border: 2px solid #e2e8f0;
  border-top-color: #0f172a; border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Complaint Cards ──────────────────────────────────────────────────────── */
.complaints-list { display: flex; flex-direction: column; gap: 14px; }

.complaint-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  transition: box-shadow 0.2s, transform 0.2s;
}
.complaint-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); transform: translateY(-1px); }
.complaint-card.open     { border-left: 4px solid #dc2626; }
.complaint-card.resolved { border-left: 4px solid #16a34a; }

.card-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px; gap: 12px; flex-wrap: wrap;
}

.batch-info { display: flex; align-items: center; gap: 12px; }
.batch-avatar {
  width: 40px; height: 40px; border-radius: 10px;
  background: linear-gradient(135deg, #0f172a, #334155);
  color: #fff; font-size: 14px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.batch-name { font-size: 15px; font-weight: 700; color: #0f172a; }
.batch-meta { font-size: 12px; color: #94a3b8; margin-top: 2px; }

.status-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; padding: 4px 12px; border-radius: 100px;
}
.status-badge.open     { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.status-badge.resolved { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

/* ── Complaint Message ────────────────────────────────────────────────────── */
.complaint-msg-box {
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 10px; padding: 14px 16px; margin-bottom: 14px;
}
.complaint-text { font-size: 14px; color: #334155; margin: 0; line-height: 1.6; }

/* ── Admin Reply Box ──────────────────────────────────────────────────────── */
.admin-reply-box {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #bbf7d0; border-radius: 10px;
  padding: 12px 16px; margin-bottom: 14px;
}
.reply-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; color: #16a34a; margin-bottom: 6px;
}
.reply-time { font-size: 10px; color: #86efac; font-weight: 500; margin-left: auto; text-transform: none; }
.reply-text { font-size: 13px; color: #166534; margin: 0; line-height: 1.6; }

/* ── Actions ──────────────────────────────────────────────────────────────── */
.card-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.btn-reply {
  display: inline-flex; align-items: center; gap: 6px;
  background: #f1f5f9; border: 1.5px solid #e2e8f0; border-radius: 8px;
  padding: 7px 14px; font-size: 12px; font-weight: 600; color: #475569;
  cursor: pointer; transition: all 0.15s;
}
.btn-reply:hover { background: #e2e8f0; color: #0f172a; }

.btn-resolve {
  display: inline-flex; align-items: center; gap: 6px;
  background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 8px;
  padding: 7px 14px; font-size: 12px; font-weight: 600; color: #16a34a;
  cursor: pointer; transition: all 0.15s;
}
.btn-resolve:hover:not(:disabled) { background: #dcfce7; }
.btn-resolve:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Reply Form ───────────────────────────────────────────────────────────── */
.reply-form { margin-top: 14px; border-top: 1.5px solid #e2e8f0; padding-top: 14px; }

.reply-textarea {
  width: 100%; box-sizing: border-box;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 10px 14px; font-size: 13.5px; font-family: inherit;
  resize: vertical; outline: none; transition: border-color 0.15s;
  color: #0f172a; background: #f8fafc;
}
.reply-textarea:focus { border-color: #0f172a; background: #fff; }

.reply-form-actions {
  display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; justify-content: flex-end;
}
.btn-cancel-reply {
  padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
  background: #f1f5f9; border: 1.5px solid #e2e8f0; color: #64748b;
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel-reply:hover { background: #e2e8f0; }

.btn-send-resolve {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700;
  background: #16a34a; border: none; color: #fff;
  cursor: pointer; transition: all 0.15s;
}
.btn-send-resolve:hover:not(:disabled) { background: #15803d; }
.btn-send-resolve:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-send-only {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700;
  background: #0f172a; border: none; color: #fff;
  cursor: pointer; transition: all 0.15s;
}
.btn-send-only:hover:not(:disabled) { background: #1e293b; }
.btn-send-only:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Transitions ──────────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
