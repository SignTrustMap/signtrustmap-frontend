/**
 * Specialized HTTP client for Jetson Orin Edge Node APIs (AIOps).
 * Automatically injects required proxy bypass headers, manages timeouts and formats responses.
 */

export interface EdgeRequestOptions extends RequestInit {
  timeoutMs?: number
}

/**
 * Standardized Fetch wrapper for Edge AI endpoints
 */
export async function edgeFetch<T = any>(
  endpoint: string,
  options: EdgeRequestOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, headers, ...rest } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      ...rest,
      signal: options.signal || controller.signal,
      headers: {
        'ngrok-skip-browser-warning': '69420',
        Accept: 'application/json',
        ...headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Edge API Error [${response.status}]: ${errorText || response.statusText}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}
