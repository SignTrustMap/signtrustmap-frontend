import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { ModelRetrainingRun } from '@/data/adminGovernanceData'

export interface SystemHardwareMetrics {
  timestamp: string
  uptime_seconds: number
  cpu: {
    total_percent: number
    per_core_percent: number[]
    frequency_mhz: number
    core_count: number
  }
  memory: {
    total_mb: number
    used_mb: number
    free_mb: number
    available_mb: number
    percent: number
    swap_total_mb: number
    swap_used_mb: number
    swap_free_mb: number
    swap_percent: number
  }
  gpu: {
    available: boolean
    device_name: string
    load_percent: number
    memory_allocated_mb: number
    memory_reserved_mb: number
  }
  thermal: {
    cpu_temp_c: number
    gpu_temp_c: number
    soc_temp_c: number
    tj_temp_c: number
    all_zones: Record<string, number>
  }
  fan: {
    pwm: number
    speed_percent: number
    rpm: number
  }
  power: {
    voltage_v: number
    current_ma: number
    power_w: number
  }
  disks: Array<{
    device: string
    mountpoint: string
    fstype: string
    total_gb: number
    used_gb: number
    free_gb: number
    percent: number
    read_speed_kbps: number
    write_speed_kbps: number
  }>
  network: {
    download_speed_kbps: number
    upload_speed_kbps: number
    total_recv_mb: number
    total_sent_mb: number
  }
}

export interface ActiveLearningConfig {
  uncertaintyMargin: string
  minSamplesForAutoRetrain: number
}

export class AiopsService {
  /**
   * Subscribe to live SSE Stream of NVIDIA Jetson Orin Hardware & AI Telemetry
   * Uses modern Fetch ReadableStream with custom headers to completely bypass Ngrok warnings and CORS issues
   */
  static subscribeSystemMetricsStream(
    onData: (data: SystemHardwareMetrics) => void,
    onError?: (err: any) => void
  ): () => void {
    const controller = new AbortController()
    let isCancelled = false

    const startStream = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.AIOPS.STREAM, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': '69420',
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          throw new Error(`Stream HTTP error: ${response.status} ${response.statusText}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (!isCancelled) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.replace(/^data:\s*/, '').trim()
              if (jsonStr) {
                try {
                  const parsed: SystemHardwareMetrics = JSON.parse(jsonStr)
                  onData(parsed)
                } catch (parseErr) {
                  console.warn('Error parsing JSON from SSE chunk:', parseErr)
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || isCancelled) return
        console.warn('Fetch stream connection warning:', err)
        if (onError) onError(err)

        // Auto-reconnect after 3s if not intentionally closed
        if (!isCancelled) {
          setTimeout(() => {
            if (!isCancelled) startStream()
          }, 3000)
        }
      }
    }

    startStream()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }

  /**
   * Fetch model retraining run history
   */
  static async getRetrainingRuns(): Promise<ApiResponse<ModelRetrainingRun[]>> {
    return http.get<ApiResponse<ModelRetrainingRun[]>>(API_ENDPOINTS.AIOPS.RETRAINING_RUNS)
  }

  /**
   * Manually trigger a model retraining run
   */
  static async triggerRetrain(modelName?: string): Promise<ApiResponse<ModelRetrainingRun>> {
    return http.post<ApiResponse<ModelRetrainingRun>>(API_ENDPOINTS.AIOPS.TRIGGER_RUN, { modelName })
  }

  /**
   * Get Active learning sampling configuration
   */
  static async getActiveLearningConfig(): Promise<ApiResponse<ActiveLearningConfig>> {
    return http.get<ApiResponse<ActiveLearningConfig>>(API_ENDPOINTS.AIOPS.ACTIVE_LEARNING_CONFIG)
  }

  /**
   * Update Active learning sampling configuration
   */
  static async updateActiveLearningConfig(data: ActiveLearningConfig): Promise<ApiResponse<ActiveLearningConfig>> {
    return http.put<ApiResponse<ActiveLearningConfig>>(API_ENDPOINTS.AIOPS.ACTIVE_LEARNING_CONFIG, data)
  }
}
