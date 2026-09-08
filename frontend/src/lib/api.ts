import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, 
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing = false
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh-token') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retry = true

      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(api(original))
            },
            reject,
          })
        })
      }

      refreshing = true

      try {
        const { data } = await axios.post(
          '/api/auth/refresh-token',
          {},
          { withCredentials: true }
        )
        const newToken: string = data.access_token
        localStorage.setItem('access_token', newToken)

        queue.forEach((p) => p.resolve(newToken))
        queue = []

        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (err) {
        queue.forEach((p) => p.reject(err))
        queue = []
        localStorage.removeItem('access_token')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        refreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
