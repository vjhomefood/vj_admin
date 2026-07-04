import { defineStore } from 'pinia'
import api from '../services/api'

export const useMemberStore = defineStore('member', {
  state: () => ({ members: [], loading: false, error: null }),
  actions: {
    async fetchMembers(batchId = null) {
      this.loading = true
      try {
        const params = batchId ? { batchId } : {}
        const res = await api.get('/members', { params })
        this.members = res.data
      } catch (e) {
        this.error = e.response?.data?.message || e.message
      } finally {
        this.loading = false
      }
    },
    async createMember(data) {
      const res = await api.post('/members', data)
      this.members.push(res.data)
      return res.data
    },
    async updateMember(id, data) {
      const res = await api.put(`/members/${id}`, data)
      const idx = this.members.findIndex(m => m._id === id)
      if (idx !== -1) this.members[idx] = res.data
      return res.data
    },
    async deleteMember(id) {
      await api.delete(`/members/${id}`)
      this.members = this.members.filter(m => m._id !== id)
    }
  }
})
