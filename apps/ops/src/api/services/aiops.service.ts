import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { edgeFetch } from '../edgeClient'
import type { ModelRetrainingRun } from '@shared/types'

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
  uncertaintyMargin?: string
  minSamplesForAutoRetrain?: number
  defaultStrategy?: string
  defaultTopK?: number
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
  standard_code?: string
  name_vi?: string
  name_en?: string
  category?: string
}

export interface ClassesResponse {
  total?: number
  total_classes?: number
  prompt_template?: string
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
    r3_cec?: {
      k_neighbors: number
      temperature: number
      query_budget: number
      apply_calibration: boolean
      random_state: number
    }
    least_confidence?: {
      aggregation_method: string
      no_detection_score: number
    }
  }
  timo?: {
    alpha: number
    beta: number
    prompt_template: string
    normalize_embeddings: boolean
    classifier_cache_file: string
  }
  few_shot_support?: {
    total_shots_per_class: number
    num_anchors: number
    num_medoids: number
    min_crop_resolution: number
    min_sharpness_laplacian: number
    replacement_policy: string
    preserve_pinned_shots: boolean
  }
  detector: {
    active_model: string
    default_conf: number
  }
  classifier: {
    active_model: string
    default_conf: number
    temperature?: number
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

export interface ConfigResetResponse {
  status: string
  message: string
  config: SystemConfigResponse
}

// ── MLOps Model Lifecycle Types ─────────────────────────────────────────────

export interface ClassifierPoolStatus {
  active_version_id: number | null
  active_version_tag: string | null
  total_verified_crops_in_ai_db: number
  new_verified_crops_since_active_model: number
  affected_classes_count: number
  min_samples_threshold: number
  is_eligible_for_rebuild: boolean
  current_hyperparams: Record<string, any>
}

export interface DetectorPoolStatus {
  active_version_id: number | null
  active_version_tag: string | null
  data_source: string
  distinct_full_frames_count: number
  total_bounding_box_annotations: number
  min_samples_threshold: number
  is_eligible_for_retrain: boolean
  current_hyperparams?: Record<string, any>
}

export interface TrainingDataStatusResponse {
  status: string
  total_verified_signs_platform: number
  classifier_pool: ClassifierPoolStatus
  detector_pool: DetectorPoolStatus
}

export interface AddedClassItem {
  sign_code: string
  name_vi: string
  name_en: string
  current_verified_count: number
  category?: string
}

export interface ChangedClassItem {
  sign_code: string
  name_vi: string
  name_en: string
  previous_samples_count: number
  current_samples_count: number
  delta_samples: number
  category?: string
}

export interface RemovedClassItem {
  sign_code: string
  name_vi: string
  name_en: string
  previous_samples_count: number
}

export interface ClassDistributionDiffResponse {
  status: string
  compared_with_version_id: number
  compared_version_tag: string
  total_classes_in_compared_model: number
  unchanged_classes_count: number
  added_classes: AddedClassItem[]
  changed_classes: ChangedClassItem[]
  removed_classes?: RemovedClassItem[]
}

export interface CatalogSignDistributionItem {
  class_id: number
  sign_code: string
  name_vi: string
  name_en: string
  category: string
  verified_count: number
}

export interface ClassDistributionResponse {
  status: string
  total_catalog_classes: number
  classes_with_verified_signs: number
  distribution: CatalogSignDistributionItem[]
}

export interface ClassifierRebuildRequest {
  version_tag: string
  note?: string
  alpha?: number
  beta?: number
  shots_per_class?: number
  num_anchors?: number
  num_medoids?: number
  min_sharpness?: number
  force?: boolean
  sample_limit?: number | null
  [key: string]: any
}

export interface RebuildNewModelInfo {
  version_id: number
  version_tag: string
  is_active: boolean
  sample_count?: number
  num_classes?: number
}

export interface RebuildEvaluationMetrics {
  sample_count?: number
  top1_accuracy?: number
  top5_accuracy?: number
  macro_f1?: number
  latency_ms?: number
  comparison_with_active?: {
    delta_accuracy?: string
    delta_f1?: string
    [key: string]: any
  }
  [key: string]: any
}

export interface ClassifierRebuildResponse {
  status: string
  message: string
  new_model: RebuildNewModelInfo
  evaluation_metrics: RebuildEvaluationMetrics
}

export interface ModelVersionItem {
  id: number
  model_type: 'CLASSIFIER' | 'DETECTOR' | string
  version_tag: string
  is_active: boolean
  note: string | null
  created_at: string
}

export interface MetricItem {
  metric_name: string
  metric_value: number
  split: string
}

export interface EvaluationMetricsResponse {
  version_id: number
  version_tag: string
  is_active: boolean
  created_at: string
  metrics: MetricItem[]
}

export interface ModelDeployResponse {
  status: string
  message: string
  deployed_version_id: number
  version_tag: string
  is_active: boolean
  deployed_at: string
  batch_run_id?: string
}

export interface ModelRollbackResponse {
  status: string
  message: string
  rolled_back_from: number
  active_version_id: number
  version_tag: string
}

export interface ModelSwitchResponse {
  status: string
  message: string
  switched_to_version_id: number
  version_tag: string
  is_active: boolean
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
   * Fetch configuration for a specific subsystem group (/api/v1/config/{group_name})
   */
  getConfigGroup: async (groupName: string): Promise<Record<string, any>> => {
    return edgeFetch<Record<string, any>>(API_ENDPOINTS.AIOPS.CONFIG_GROUP(groupName))
  },

  /**
   * Update multiple configuration groups (PATCH /api/v1/config)
   */
  updateConfig: async (updates: Partial<SystemConfigResponse>): Promise<SystemConfigResponse> => {
    return edgeFetch<SystemConfigResponse>(API_ENDPOINTS.AIOPS.CONFIG, {
      method: 'PATCH',
      data: updates,
    })
  },

  /**
   * Update configuration for a specific subsystem group (PATCH /api/v1/config/{group_name})
   */
  updateConfigGroup: async (
    groupName: keyof SystemConfigResponse | string,
    updates: Record<string, any>
  ): Promise<Record<string, any>> => {
    return edgeFetch<Record<string, any>>(API_ENDPOINTS.AIOPS.CONFIG_GROUP(groupName), {
      method: 'PATCH',
      data: updates,
    })
  },

  /**
   * Reset all AI system configuration to factory defaults (POST /api/v1/config/reset)
   */
  resetConfig: async (): Promise<ConfigResetResponse> => {
    return edgeFetch<ConfigResetResponse>(API_ENDPOINTS.AIOPS.CONFIG_RESET, {
      method: 'POST',
    })
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

  // ── MLOps Training Data & Lifecycle Operations ────────────────────────────

  /**
   * Get training data status and rebuild eligibility
   */
  getTrainingDataStatus: async (): Promise<TrainingDataStatusResponse> => {
    return edgeFetch<TrainingDataStatusResponse>(API_ENDPOINTS.AIOPS.TRAINING_DATA_STATUS)
  },

  /**
   * Compare class sample distribution diff with active or specified model
   */
  getClassDistributionDiff: async (modelId?: number): Promise<ClassDistributionDiffResponse> => {
    return edgeFetch<ClassDistributionDiffResponse>(API_ENDPOINTS.AIOPS.TRAINING_DATA_DIFF(modelId))
  },

  /**
   * Get full QCVN 41:2019 catalog class distribution with verified counts
   */
  getClassDistribution: async (): Promise<ClassDistributionResponse> => {
    return edgeFetch<ClassDistributionResponse>(API_ENDPOINTS.AIOPS.TRAINING_DATA_DISTRIBUTION)
  },

  /**
   * Rebuild TIMO Classifier and evaluate immediately
   */
  rebuildClassifier: async (payload: ClassifierRebuildRequest): Promise<ClassifierRebuildResponse> => {
    return edgeFetch<ClassifierRebuildResponse>(API_ENDPOINTS.AIOPS.CLASSIFIER_REBUILD, {
      method: 'POST',
      data: payload,
      timeoutMs: 60000,
    })
  },

  /**
   * Get classifier model version history
   */
  getClassifierVersions: async (): Promise<ModelVersionItem[]> => {
    return edgeFetch<ModelVersionItem[]>(API_ENDPOINTS.AIOPS.CLASSIFIER_VERSIONS)
  },

  /**
   * Read dynamic evaluation metrics of a classifier version
   */
  getClassifierEvaluation: async (versionId: number | string): Promise<EvaluationMetricsResponse> => {
    return edgeFetch<EvaluationMetricsResponse>(API_ENDPOINTS.AIOPS.CLASSIFIER_EVALUATION(versionId))
  },

  /**
   * Deploy a classifier version to production
   */
  deployClassifier: async (versionId: number | string): Promise<ModelDeployResponse> => {
    return edgeFetch<ModelDeployResponse>(API_ENDPOINTS.AIOPS.CLASSIFIER_DEPLOY(versionId), {
      method: 'POST',
    })
  },

  /**
   * Rollback classifier to previous active version
   */
  rollbackClassifier: async (): Promise<ModelRollbackResponse> => {
    return edgeFetch<ModelRollbackResponse>(API_ENDPOINTS.AIOPS.CLASSIFIER_ROLLBACK, {
      method: 'POST',
    })
  },

  /**
   * Switch active classifier to any historical version
   */
  switchClassifier: async (versionId: number | string): Promise<ModelSwitchResponse> => {
    return edgeFetch<ModelSwitchResponse>(API_ENDPOINTS.AIOPS.CLASSIFIER_SWITCH(versionId), {
      method: 'POST',
    })
  },

  /**
   * Get detector model version history (no rebuild endpoint exists)
   */
  getDetectorVersions: async (): Promise<ModelVersionItem[]> => {
    return edgeFetch<ModelVersionItem[]>(API_ENDPOINTS.AIOPS.DETECTOR_VERSIONS)
  },

  /**
   * Read dynamic evaluation metrics of a detector version
   */
  getDetectorEvaluation: async (versionId: number | string): Promise<EvaluationMetricsResponse> => {
    return edgeFetch<EvaluationMetricsResponse>(API_ENDPOINTS.AIOPS.DETECTOR_EVALUATION(versionId))
  },

  /**
   * Deploy a detector version to production
   */
  deployDetector: async (versionId: number | string): Promise<ModelDeployResponse> => {
    return edgeFetch<ModelDeployResponse>(API_ENDPOINTS.AIOPS.DETECTOR_DEPLOY(versionId), {
      method: 'POST',
    })
  },

  /**
   * Rollback detector to previous active version
   */
  rollbackDetector: async (): Promise<ModelRollbackResponse> => {
    return edgeFetch<ModelRollbackResponse>(API_ENDPOINTS.AIOPS.DETECTOR_ROLLBACK, {
      method: 'POST',
    })
  },

  /**
   * Switch active detector to any historical version
   */
  switchDetector: async (versionId: number | string): Promise<ModelSwitchResponse> => {
    return edgeFetch<ModelSwitchResponse>(API_ENDPOINTS.AIOPS.DETECTOR_SWITCH(versionId), {
      method: 'POST',
    })
  },
}

export const AiopsService = aiopsService
