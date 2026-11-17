import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { AIOPS_BASE_URL } from './endpoints'

/**
 * Specialized Axios Client singleton for Jetson Orin Edge Node APIs (AIOps).
 * Routes through the unified Nginx API Gateway with centralized timeouts and CORS policies.
 */
export const edgeApiClient: AxiosInstance = axios.create({
  baseURL: AIOPS_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export interface EdgeRequestOptions extends AxiosRequestConfig {
  timeoutMs?: number
}

/**
 * Standardized Edge Request method backed by Axios Singleton (Zero raw fetch)
 */
export async function edgeFetch<T = any>(
  endpoint: string,
  options: EdgeRequestOptions = {}
): Promise<T> {
  const { timeoutMs, headers, ...rest } = options
  let url = endpoint
  if (AIOPS_BASE_URL && url.startsWith(AIOPS_BASE_URL)) {
    url = url.slice(AIOPS_BASE_URL.length) || '/'
  }
  const response = await edgeApiClient.request<T>({
    url,
    timeout: timeoutMs || 15000,
    headers: {
      ...headers,
    },
    ...rest,
  })
  return response.data
}
