/**
 * Label mapping dictionaries for MLOps dynamic metric and hyperparameter rendering.
 * Strictly adheres to rules:
 * - Standard sentence case (capitalize only first word)
 * - Standard technical acronyms uppercase (GPU, AI, TIMO, Top-1, F1, mAP, FPS)
 * - Preferred standard English technical terms (Active learning, Classifier, Detector, Accuracy, Precision, Recall, Latency, Batch size, Epochs, Shots)
 * - No parenthetical explanations in labels
 */

export const METRIC_LABELS: Record<string, string> = {
  // Classifier metrics
  top1_accuracy: 'Top-1 accuracy',
  top5_accuracy: 'Top-5 accuracy',
  macro_f1: 'Macro F1',
  eval_latency_ms: 'Latency ms',
  latency_ms: 'Latency ms',

  // Detector metrics
  map50: 'mAP 50',
  map50_95: 'mAP 50-95',
  precision: 'Precision',
  recall: 'Recall',
  fps: 'FPS',
}

export const PARAM_LABELS: Record<string, string> = {
  alpha: 'Hệ số alpha TIMO',
  beta: 'Hệ số beta văn bản',
  shots_per_class: 'Số shot tối đa mỗi class',
  num_anchors: 'Số anchor mỗi class',
  num_medoids: 'Số medoid tối đa',
  min_sharpness: 'Ngưỡng độ nét tối thiểu',
  sample_limit: 'Giới hạn số mẫu nạp',
  epochs: 'Số epochs',
  batch_size: 'Batch size',
  imgsz: 'Kích thước ảnh imgsz',
}

export function getMetricDisplayLabel(metricName: string): string {
  if (METRIC_LABELS[metricName]) return METRIC_LABELS[metricName]
  return metricName.replace(/_/g, ' ')
}

export function getParamDisplayLabel(paramKey: string): string {
  if (PARAM_LABELS[paramKey]) return PARAM_LABELS[paramKey]
  return paramKey.replace(/_/g, ' ')
}

export function formatMetricValue(metricName: string, val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '-'
  const num = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(num)) return String(val)

  const name = metricName.toLowerCase()
  if (name.includes('accuracy') || name.includes('map') || name.includes('precision') || name.includes('recall')) {
    if (num <= 1 && num > 0) {
      return `${(num * 100).toFixed(2)}%`
    }
    return `${num.toFixed(2)}%`
  }
  if (name.includes('latency')) {
    return `${num.toFixed(num < 0.1 ? 4 : 2)} ms`
  }
  if (name.includes('f1')) {
    return num.toFixed(4)
  }
  return num % 1 === 0 ? num.toString() : num.toFixed(2)
}
