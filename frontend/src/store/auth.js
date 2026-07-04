import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('vj_token') || null,
    user:  JSON.parse(localStorage.getItem('vj_user') || 'null')
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin:    (s) => s.user?.role === 'admin'
  },
  actions: {
    async adminLogin(username, password) {
      const res = await api.post('/auth/admin/login', { username, password })
      this.token = res.data.token
      this.user  = res.data.user
      localStorage.setItem('vj_token', this.token)
      localStorage.setItem('vj_user', JSON.stringify(this.user))
    },
    async logout() {
      try {
        if (this.token) {
          await api.post('/auth/logout')
        }
      } catch (e) {
        console.error('Revoking token from server failed:', e)
      } finally {
        this.token = null
        this.user  = null
        localStorage.removeItem('vj_token')
        localStorage.removeItem('vj_user')
      }
    }
  }
})
