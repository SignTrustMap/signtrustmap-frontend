import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { AIOPS_BASE_URL } from './endpoints'

/**
 * Specialized Axios Client singleton for Jetson Orin Edge Node APIs (AIOps).
 * Automatically injects required proxy bypass headers and manages timeouts.
 */
export const edgeApiClient: AxiosInstance = axios.create({
  baseURL: AIOPS_BASE_URL,
  timeout: 15000,
  headers: {
    'ngrok-skip-browser-warning': '69420',
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
  const response = await edgeApiClient.request<T>({
    url: endpoint,
    timeout: timeoutMs || 15000,
    headers: {
      'ngrok-skip-browser-warning': '69420',
      ...headers,
    },
    ...rest,
  })
  return response.data
}
