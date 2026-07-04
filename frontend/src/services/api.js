import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vj_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/admin/login') && !err.config.url.includes('/auth/login')) {
      const user = JSON.parse(localStorage.getItem('vj_user') || 'null')
      localStorage.removeItem('vj_token')
      localStorage.removeItem('vj_user')
      window.location.href = user?.role === 'admin' ? '/admin/login' : '/users/login'
    }
    return Promise.reject(err)
  }
)

export default api
