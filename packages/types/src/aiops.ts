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
  pipeline: {
    active_inference_tasks: number
    avg_latency_ms: number
    fps: number
    dropped_frames: number
  }
}

export interface SystemHealthResponse {
  status: 'healthy' | 'unhealthy' | string
  dependencies: {
    cuda?: { status: string; device?: string }
    tensorrt?: { status: string; version?: string }
    minio?: { status: string; endpoint?: string }
    [key: string]: unknown
  }
}

export interface ModelArtifactItem {
  filename: string
  format: 'pt' | 'onnx' | 'engine' | string
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

export interface ModelRetrainingRun {
  id: string
  modelName: string
  triggeredBy: string
  samplesCount: number
  startDate: string
  endDate?: string
  status: 'running' | 'completed' | 'failed'
  baselineMap50: number
  newMap50?: number
  deltaMap?: number
  epochs: number
  batchSize: number
  learningRate: number
  hardwareDevice: string
}
