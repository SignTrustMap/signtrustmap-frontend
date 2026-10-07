import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { env } from '@/config/env'

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
  baseURL: env.apiBaseUrl,
  timeout: 30000,
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

    // When sending FormData, delete Content-Type to let browser / Axios
    // automatically generate the multipart/form-data boundary parameter
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Handle global HTTP errors & 401 unauthorized
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // 401 Unauthorized handling (token expired or revoked)
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (originalRequest) {
        originalRequest._retry = true
      }

      // Check whether this request was an authenticated protected route
      const wasProtectedRequest = !!originalRequest?.headers?.Authorization

      if (wasProtectedRequest) {
        // Clear all token and session traces from both storages
        localStorage.removeItem('stm_access_token')
        localStorage.removeItem('stm_web_user')
        sessionStorage.removeItem('stm_access_token')
        sessionStorage.removeItem('stm_web_user')

        // Soft event-driven unauthorized dispatch (prevents hard full-page reload - RULE 6.4)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('auth:unauthorized', {
              detail: { reason: 'session_expired', path: window.location.pathname },
            })
          )
        }
      }
    }

    // Extract readable error message from NestJS (handles string or ValidationPipe array)
    const errData = error.response?.data
    let readableMessage = error.message || 'Lỗi kết nối máy chủ'

    if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
      readableMessage = 'Quá thời gian chờ phản hồi từ máy chủ (Request Timeout). Vui lòng thử lại.'
    } else if (errData?.message) {
      readableMessage = Array.isArray(errData.message)
        ? errData.message.join('. ')
        : String(errData.message)
    }

    const enhancedError = new Error(readableMessage)
    ;(enhancedError as any).response = error.response
    ;(enhancedError as any).status = error.response?.status
    ;(enhancedError as any).data = errData

    return Promise.reject(enhancedError)
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
