import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // ── Root redirect ─────────────────────────────────────────────────────────
  { path: '/', redirect: '/admin/login' },

  // ── Admin login ──────────────────────────────────────────────────────────
  {
    path: '/admin/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true }
  },

  // ── Admin dashboard layout ───────────────────────────────────────────────
  {
    path: '/admin',
    component: () => import('../views/DashboardLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '',          redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'Dashboard',  component: () => import('../views/DashboardHome.vue') },
      { path: 'batches',   name: 'Batches',    component: () => import('../views/BatchManagement.vue') },
      { path: 'scheduler', name: 'Scheduler',  component: () => import('../views/OrderScheduler.vue') },
      { path: 'history',   name: 'History',    component: () => import('../views/OrderHistory.vue') },
      { path: 'billing',   name: 'Billing',    component: () => import('../views/BillingManagement.vue') },
      { path: 'deliveries', name: 'Deliveries', component: () => import('../views/DeliveryManagement.vue') },
      { path: 'food-requests', name: 'FoodRequests', component: () => import('../views/FoodRequestsManagement.vue') }
    ]
  },

  // ── Catch-all ─────────────────────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', redirect: '/admin/login' }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('vj_token')
  const user  = JSON.parse(localStorage.getItem('vj_user') || 'null')
  const role  = user?.role || null

  // Already logged in — redirect away from login page to dashboard
  if (to.meta.guestOnly && token) {
    if (role === 'admin') return next('/admin/dashboard')
  }

  // Protected routes require authentication
  if (to.meta.requiresAuth && !token) {
    return next('/admin/login')
  }

  // Admin area — only admin role allowed
  if (to.meta.requiresAdmin && role !== 'admin') {
    return next('/admin/login')
  }

  next()
})

export default router
