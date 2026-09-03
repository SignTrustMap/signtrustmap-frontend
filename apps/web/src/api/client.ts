import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

/**
 * Standardized API Response payload wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  timestamp?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

/**
 * Base Axios Client configuration for Web Application
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.signtrustmap.site',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request Interceptor: Attach bearer token & custom headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stm_access_token') || sessionStorage.getItem('stm_access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Handle global HTTP errors & automatic token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // 401 Unauthorized handling
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('stm_refresh_token')
        if (refreshToken) {
          const res = await axios.post(`${apiClient.defaults.baseURL}/api/v1/auth/refresh-token`, {
            refreshToken,
          })
          const newAccessToken = res.data?.data?.accessToken
          if (newAccessToken) {
            localStorage.setItem('stm_access_token', newAccessToken)
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
            return apiClient(originalRequest)
          }
        }
      } catch (refreshErr) {
        localStorage.removeItem('stm_access_token')
        localStorage.removeItem('stm_refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      }
    }

    return Promise.reject(error.response?.data || error)
  }
)

/**
 * Helper request wrapper for strong typing
 */
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) => apiClient.get<any, T>(url, config),
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.post<any, T>(url, data, config),
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.put<any, T>(url, data, config),
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.patch<any, T>(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) => apiClient.delete<any, T>(url, config),
}
