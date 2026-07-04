<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-logo">
        <img src="/vj-logo-transparent.png" alt="VJ" style="width:36px;height:36px;object-fit:contain" />
        <div>
          <h1 style="font-size:15px;font-weight:800;margin:0;color:var(--text)">VJ Home Foods</h1>
          <p style="font-size:11px;color:#94a3b8;margin:0">Admin Panel</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Main</div>
        <RouterLink to="/admin/dashboard" class="nav-item" :class="{ active: route.path === '/admin/dashboard' }" @click="closeSidebar">
          <span class="nav-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </span>Dashboard
        </RouterLink>

        <div class="nav-section-label" style="margin-top:8px">Operations</div>
        <RouterLink to="/admin/scheduler" class="nav-item" :class="{ active: route.path === '/admin/scheduler' }" @click="closeSidebar">
          <span class="nav-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>Order Scheduler
        </RouterLink>
        <RouterLink to="/admin/history" class="nav-item" :class="{ active: route.path === '/admin/history' }" @click="closeSidebar">
          <span class="nav-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </span>Order History
        </RouterLink>
        <RouterLink to="/admin/food-requests" class="nav-item" :class="{ active: route.path === '/admin/food-requests' }" @click="closeSidebar">
          <span class="nav-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </span>Complaints
        </RouterLink>

        <div class="nav-section-label" style="margin-top:8px">Management</div>
        <RouterLink to="/admin/batches" class="nav-item" :class="{ active: route.path === '/admin/batches' }" @click="closeSidebar">
          <span class="nav-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>Batches
        </RouterLink>
        <RouterLink to="/admin/billing" class="nav-item" :class="{ active: route.path === '/admin/billing' }" @click="closeSidebar">
          <span class="nav-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </span>Billing
        </RouterLink>
        <RouterLink to="/admin/deliveries" class="nav-item" :class="{ active: route.path === '/admin/deliveries' }" @click="closeSidebar">
          <span class="nav-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </span>Deliveries
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user interactive-profile" @click="openModal" title="Change Admin Password">
          <img src="/vj-logo-transparent.png" alt="VJ" class="user-avatar" style="object-fit:contain;background:#fff;padding:2px;border:1px solid var(--border)" />
          <div class="user-info">
            <div class="name" style="display:flex;align-items:center;gap:6px">
              {{ auth.user?.username }}
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <div class="role">Administrator (Settings)</div>
          </div>
        </div>
        <button class="btn-logout" @click="logout" id="btn-logout">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </div>
    </aside>

    <!-- Sidebar overlay (mobile) -->
    <div class="sidebar-overlay" :class="{ active: sidebarOpen }" @click="closeSidebar"></div>

    <main class="main-content">
      <!-- Mobile top bar -->
      <div class="mobile-topbar">
        <button class="mobile-menu-btn" @click="toggleSidebar" aria-label="Open menu">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="mobile-brand">
          <img src="/vj-logo-transparent.png" alt="VJ" style="width:28px;height:28px;object-fit:contain" />
          <h1>VJ Home Foods</h1>
        </div>
      </div>

      <RouterView />
    </main>

    <!-- Change Password Modal -->
    <div v-if="showChangePasswordModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Change Admin Password</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <form @submit.prevent="handleChangePassword" style="padding:24px; display:flex; flex-direction:column; gap:16px">
          <div v-if="modalError" class="alert-box danger" style="padding:10px; border-radius:6px; font-size:13px; border:1px solid #fca5a5; background:#fee2e2; color:#991b1b">
            <span>{{ modalError }}</span>
          </div>
          <div v-if="modalSuccess" class="alert-box success" style="padding:10px; border-radius:6px; font-size:13px; border:1px solid #86efac; background:#dcfce7; color:#166534">
            <span>{{ modalSuccess }}</span>
          </div>
          
          <div class="form-group" style="display:flex; flex-direction:column; gap:6px">
            <label style="font-size:12px; font-weight:600; color:var(--text-muted)">Current Password</label>
            <input type="password" v-model="currentPassword" class="form-input" placeholder="Enter current password" required />
          </div>
          
          <div class="form-group" style="display:flex; flex-direction:column; gap:6px">
            <label style="font-size:12px; font-weight:600; color:var(--text-muted)">New Password</label>
            <input type="password" v-model="newPassword" class="form-input" placeholder="Enter new password (min 6 chars)" required />
          </div>

          <div class="form-group" style="display:flex; flex-direction:column; gap:6px">
            <label style="font-size:12px; font-weight:600; color:var(--text-muted)">Confirm New Password</label>
            <input type="password" v-model="confirmPassword" class="form-input" placeholder="Confirm new password" required />
          </div>

          <div class="modal-footer" style="margin-top:8px; display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:16px">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import api from '../services/api'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

const showChangePasswordModal = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const modalError = ref('')
const modalSuccess = ref('')
const submitting = ref(false)

function openModal() {
  showChangePasswordModal.value = true
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  modalError.value = ''
  modalSuccess.value = ''
}

function closeModal() {
  if (submitting.value) return
  showChangePasswordModal.value = false
}

async function handleChangePassword() {
  if (newPassword.value.length < 6) {
    modalError.value = 'New password must be at least 6 characters long'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    modalError.value = 'New passwords do not match'
    return
  }

  modalError.value = ''
  modalSuccess.value = ''
  submitting.value = true

  try {
    const res = await api.post('/auth/change-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })
    
    modalSuccess.value = res.data.message || 'Password updated successfully! Logging out...'
    
    // Auto-logout after 2 seconds to let the user see the success message
    setTimeout(async () => {
      await auth.logout()
      router.push('/admin/login')
    }, 2000)
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Failed to update password. Please try again.'
    submitting.value = false
  }
}

async function logout() {
  await auth.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.interactive-profile {
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s ease;
}
.interactive-profile:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-1px);
}
</style>
