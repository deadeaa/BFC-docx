import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // for refresh token cookie
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing = false
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

// Auto-refresh access token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // FIX: Skip retry for the refresh-token endpoint itself to avoid infinite loop
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
        // FIX: Use the api instance (withCredentials: true) instead of bare axios
        // so the refresh_token cookie is always included in the request
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
