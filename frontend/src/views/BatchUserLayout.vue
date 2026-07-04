<template>
  <div class="app-layout">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-logo">
        <img src="/vj-logo-transparent.png" alt="VJ" style="width:36px;height:36px;object-fit:contain" />
        <div>
          <h1 style="font-size:15px;font-weight:800;margin:0;color:var(--text)">VJ Home Foods</h1>
          <p style="font-size:11px;color:var(--text-muted);margin:0">Batch Portal</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink to="/portal/bills" class="nav-item" :class="{ active: route.path.startsWith('/portal/bills') }" @click="closeSidebar">
          <span class="nav-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </span>My Bills
        </RouterLink>
        <RouterLink to="/portal/requests" class="nav-item" :class="{ active: route.path.startsWith('/portal/requests') }" @click="closeSidebar">
          <span class="nav-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </span>Food Requests
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-avatar">{{ auth.user?.username?.[0]?.toUpperCase() || 'B' }}</div>
          <div class="user-info">
            <div class="name">Batch {{ auth.user?.batchId }}</div>
            <div class="role">Member Portal</div>
          </div>
        </div>
        <button class="btn-logout" @click="logout" id="btn-portal-logout">
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
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

const logout = () => { auth.logout(); router.push('/users/login') }
</script>
