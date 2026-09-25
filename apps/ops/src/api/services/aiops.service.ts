import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { edgeFetch } from '../edgeClient'
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

export interface SystemHealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded' | string
  dependencies: {
    cuda: {
      status: string
      available: boolean
      device: string
      error: string | null
    }
    tensorrt: {
      status: string
      available: boolean
      version: string
      trtexec_available: boolean
      error: string | null
    }
    minio: {
      status: string
      error: string | null
    }
  }
}

export interface ModelArtifactItem {
  filename: string
  format: 'engine' | 'onnx' | 'pt' | string
  size_bytes: number
  size_human: string
  modified_at: string
  is_loaded: boolean
}

export interface ModelsResponse {
  total_detectors: number
  total_classifiers: number
  loaded_detector: string | null
  loaded_classifier: string | null
  detectors: ModelArtifactItem[]
  classifiers: ModelArtifactItem[]
}

export interface ActiveLearningStrategiesResponse {
  strategies: string[]
  aggregation_methods: string[]
  default_strategy: string
  default_aggregation: string
  default_top_k: number
}

export interface AiClassItem {
  class_id: number
  class_name: string
  human_readable_name: string
  prompt: string
}

export interface ClassesResponse {
  total: number
  classes: AiClassItem[]
}

export interface SystemConfigResponse {
  active_learning: {
    default_top_k: number
    default_strategy: string
    default_aggregation: string
    no_detection_score: number
    min_batch_size_detector: number
    min_batch_size_classifier: number
    discrepancy_threshold: number
    auto_trigger_training: boolean
    dataset_store_path: string
  }
  detector: {
    active_model: string
    default_conf: number
  }
  classifier: {
    active_model: string
    default_conf: number
    prompt_template: string
  }
  system: {
    default_device: number
    model_idle_timeout_seconds: number
    log_level: string
  }
  storage: {
    minio_endpoint: string
    minio_bucket: string
  }
}

export const aiopsService = {
  /**
   * Fetch one-time infrastructure health snapshot (CUDA, TensorRT, MinIO)
   */
  getSystemHealth: async (): Promise<SystemHealthResponse> => {
    return edgeFetch<SystemHealthResponse>(API_ENDPOINTS.AIOPS.HEALTH)
  },

  /**
   * Fetch full AI Runtime & Subsystems Configuration Tree (/api/v1/config)
   */
  getConfig: async (): Promise<SystemConfigResponse> => {
    return edgeFetch<SystemConfigResponse>(API_ENDPOINTS.AIOPS.CONFIG)
  },

  /**
   * Fetch all AI Model Weights & Engines on NVIDIA Edge Node
   */
  getModels: async (): Promise<ModelsResponse> => {
    return edgeFetch<ModelsResponse>(API_ENDPOINTS.AIOPS.MODELS)
  },

  /**
   * Fetch available Active Learning Strategies & Aggregation Config
   */
  getStrategies: async (): Promise<ActiveLearningStrategiesResponse> => {
    return edgeFetch<ActiveLearningStrategiesResponse>(API_ENDPOINTS.AIOPS.STRATEGIES)
  },

  /**
   * Fetch 100 AI Recognition Classes (VTSDB100)
   */
  getClasses: async (): Promise<ClassesResponse> => {
    return edgeFetch<ClassesResponse>(API_ENDPOINTS.AIOPS.CLASSES)
  },

  /**
   * Subscribe to live SSE Stream of NVIDIA Jetson Orin Hardware & AI Telemetry
   * Uses modern Fetch ReadableStream with custom headers to completely bypass Ngrok warnings and CORS issues
   */
  subscribeSystemMetricsStream: (
    onData: (data: SystemHardwareMetrics) => void,
    onError?: (err: any) => void
  ): (() => void) => {
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
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('data:')) {
              try {
                const rawJson = trimmed.replace(/^data:\s*/, '')
                if (rawJson && rawJson !== '[DONE]') {
                  const parsed: SystemHardwareMetrics = JSON.parse(rawJson)
                  onData(parsed)
                }
              } catch (e) {
                console.warn('[SSE Parse Error]', e)
              }
            }
          }
        }
      } catch (err: any) {
        if (!isCancelled && err.name !== 'AbortError') {
          console.error('[SSE Stream Error]', err)
          if (onError) onError(err)
        }
      }
    }

    startStream()

    return () => {
      isCancelled = true
      controller.abort()
    }
  },

  /**
   * Fetch model retraining run history
   */
  getRetrainingRuns: async (): Promise<ApiResponse<ModelRetrainingRun[]>> => {
    return http.get<ApiResponse<ModelRetrainingRun[]>>(API_ENDPOINTS.AIOPS.RETRAINING_RUNS)
  },

  /**
   * Manually trigger a model retraining run
   */
  triggerRetrain: async (modelName?: string): Promise<ApiResponse<ModelRetrainingRun>> => {
    return http.post<ApiResponse<ModelRetrainingRun>>(API_ENDPOINTS.AIOPS.TRIGGER_RUN, { modelName })
  },

  /**
   * Get Active learning sampling configuration
   */
  getActiveLearningConfig: async (): Promise<ApiResponse<ActiveLearningConfig>> => {
    return http.get<ApiResponse<ActiveLearningConfig>>(API_ENDPOINTS.AIOPS.ACTIVE_LEARNING_CONFIG)
  },

  /**
   * Update Active learning sampling configuration
   */
  updateActiveLearningConfig: async (data: ActiveLearningConfig): Promise<ApiResponse<ActiveLearningConfig>> => {
    return http.put<ApiResponse<ActiveLearningConfig>>(API_ENDPOINTS.AIOPS.ACTIVE_LEARNING_CONFIG, data)
  },
}

export const AiopsService = aiopsService
