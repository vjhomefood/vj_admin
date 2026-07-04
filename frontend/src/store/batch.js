import { defineStore } from 'pinia'
import api from '../services/api'

export const useBatchStore = defineStore('batch', {
  state: () => ({ batches: [], loading: false, error: null }),
  actions: {
    async fetchBatches() {
      this.loading = true
      try {
        const res = await api.get('/batches')
        this.batches = res.data
      } catch (e) {
        this.error = e.response?.data?.message || e.message
      } finally {
        this.loading = false
      }
    },
    async createBatch(data) {
      const res = await api.post('/batches', data)
      this.batches.push(res.data)
      return res.data
    },
    async updateBatch(id, data) {
      const res = await api.put(`/batches/${id}`, data)
      const idx = this.batches.findIndex(b => b._id === id)
      if (idx !== -1) this.batches[idx] = res.data
      return res.data
    },
    async deleteBatch(id) {
      await api.delete(`/batches/${id}`)
      this.batches = this.batches.filter(b => b._id !== id)
    }
  }
})
