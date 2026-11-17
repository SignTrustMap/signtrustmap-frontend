import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/context/ToastContext'
import {
  AiopsService,
  type TrainingDataStatusResponse,
  type ClassDistributionDiffResponse,
  type ClassifierRebuildResponse,
  type ModelVersionItem,
} from '@/api/services/aiops.service'
import { TrainingDataStatusCard } from './TrainingDataStatusCard'
import { ClassifierRebuildForm } from './ClassifierRebuildForm'
import { RebuildResultCard } from './RebuildResultCard'
import { ModelVersionsTable } from './ModelVersionsTable'

export function ModelLifecycleTab() {
  const toast = useToast()
  const [subTab, setSubTab] = useState<'classifier' | 'detector'>('classifier')

  // Status & Diff State
  const [statusData, setStatusData] = useState<TrainingDataStatusResponse | null>(null)
  const [diffData, setDiffData] = useState<ClassDistributionDiffResponse | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  // Versions State
  const [classifierVersions, setClassifierVersions] = useState<ModelVersionItem[]>([])
  const [detectorVersions, setDetectorVersions] = useState<ModelVersionItem[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)

  // Rebuild result state
  const [rebuildResult, setRebuildResult] = useState<ClassifierRebuildResponse | null>(null)

  // 1. Fetch Training Data Status & Class Diff
  const fetchStatusAndDiff = useCallback(async () => {
    setStatusLoading(true)
    try {
      const [st, df] = await Promise.all([
        AiopsService.getTrainingDataStatus(),
        AiopsService.getClassDistributionDiff(),
      ])
      setStatusData(st)
      setDiffData(df)
    } catch (err: any) {
      console.warn('Could not fetch training data status:', err)
    } finally {
      setStatusLoading(false)
    }
  }, [])

  // 2. Fetch Classifier Versions
  const fetchClassifierVersions = useCallback(async () => {
    setVersionsLoading(true)
    try {
      const data = await AiopsService.getClassifierVersions()
      setClassifierVersions(data)
    } catch (err: any) {
      console.warn('Could not fetch classifier versions:', err)
      toast.error(err?.response?.data?.detail || 'Không thể tải danh sách phiên bản phân loại')
    } finally {
      setVersionsLoading(false)
    }
  }, [toast])

  // 3. Fetch Detector Versions
  const fetchDetectorVersions = useCallback(async () => {
    setVersionsLoading(true)
    try {
      const data = await AiopsService.getDetectorVersions()
      setDetectorVersions(data)
    } catch (err: any) {
      console.warn('Could not fetch detector versions:', err)
      toast.error(err?.response?.data?.detail || 'Không thể tải danh sách phiên bản nhận diện')
    } finally {
      setVersionsLoading(false)
    }
  }, [toast])

  // Initial Load
  useEffect(() => {
    fetchStatusAndDiff()
    fetchClassifierVersions()
    fetchDetectorVersions()
  }, [fetchStatusAndDiff, fetchClassifierVersions, fetchDetectorVersions])

  // Rebuild Success Handler
  const handleRebuildSuccess = (res: ClassifierRebuildResponse) => {
    setRebuildResult(res)
    toast.success(`Mô hình ${res.new_model.version_tag} đã được tạo và kiểm thử thành công`)
    fetchClassifierVersions()
    fetchStatusAndDiff()
  }

  // Deploy Classifier
  const handleDeployClassifier = async (versionId: number) => {
    try {
      const res = await AiopsService.deployClassifier(versionId)
      toast.success(res.message || `Đã triển khai thành công phiên bản ${res.version_tag}`)
      await fetchClassifierVersions()
      await fetchStatusAndDiff()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Không thể triển khai mô hình phân loại')
      throw err
    }
  }

  // Rollback Classifier
  const handleRollbackClassifier = async () => {
    try {
      const res = await AiopsService.rollbackClassifier()
      toast.success(res.message || `Đã quay về phiên bản ${res.version_tag}`)
      await fetchClassifierVersions()
      await fetchStatusAndDiff()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Không thể hoàn tác phiên bản phân loại')
      throw err
    }
  }

  // Switch Classifier
  const handleSwitchClassifier = async (versionId: number) => {
    try {
      const res = await AiopsService.switchClassifier(versionId)
      toast.success(res.message || `Đã chuyển đổi sang phiên bản ${res.version_tag}`)
      await fetchClassifierVersions()
      await fetchStatusAndDiff()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Không thể chuyển đổi phiên bản phân loại')
      throw err
    }
  }

  // Rollback Detector
  const handleRollbackDetector = async () => {
    try {
      const res = await AiopsService.rollbackDetector()
      toast.success(res.message || `Đã quay về phiên bản ${res.version_tag}`)
      await fetchDetectorVersions()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Không thể hoàn tác phiên bản nhận diện')
      throw err
    }
  }

  // Switch Detector
  const handleSwitchDetector = async (versionId: number) => {
    try {
      const res = await AiopsService.switchDetector(versionId)
      toast.success(res.message || `Đã chuyển đổi sang phiên bản ${res.version_tag}`)
      await fetchDetectorVersions()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Không thể chuyển đổi phiên bản nhận diện')
      throw err
    }
  }

  return (
    <div className="space-y-4 text-left">
      {/* Sub-tab selection bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl p-3 shadow-xs">
        <div className="inline-flex items-center p-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubTab('classifier')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'classifier'
                ? 'bg-white dark:bg-[#0A171C] text-[#007b8b] dark:text-[#00c4de] font-bold shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>Mô hình classifier</span>
            <span className="text-[10px] opacity-75 font-mono">{classifierVersions.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('detector')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'detector'
                ? 'bg-white dark:bg-[#0A171C] text-purple-600 dark:text-purple-400 font-bold shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>Mô hình detector</span>
            <span className="text-[10px] opacity-75 font-mono">{detectorVersions.length}</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-gray-500">
          {subTab === 'classifier'
            ? 'Hỗ trợ kiểm tra dữ liệu, cấu hình tham số và cập nhật trực tiếp trên GPU'
            : 'Mô hình detector được huấn luyện offline và đồng bộ trọng số engine'}
        </div>
      </div>

      {/* Sub-tab 1: Classifier Lifecycle */}
      {subTab === 'classifier' && (
        <div className="space-y-4">
          {/* Block 1: Training Data Status Card */}
          <TrainingDataStatusCard
            statusData={statusData}
            diffData={diffData}
            loading={statusLoading}
            onRefresh={fetchStatusAndDiff}
          />

          {/* Block 2: Rebuild Form */}
          <ClassifierRebuildForm
            currentHyperparams={statusData?.classifier_pool?.current_hyperparams}
            activeVersionTag={statusData?.classifier_pool?.active_version_tag}
            isEligible={statusData?.classifier_pool?.is_eligible_for_rebuild ?? false}
            onRebuildSuccess={handleRebuildSuccess}
          />

          {/* Block 3: Rebuild Evaluation Results Card (shows after rebuild) */}
          {rebuildResult && (
            <RebuildResultCard
              result={rebuildResult}
              onDeploy={handleDeployClassifier}
              onDismiss={() => setRebuildResult(null)}
            />
          )}

          {/* Block 4: Classifier Version History Table */}
          <ModelVersionsTable
            modelType="CLASSIFIER"
            versions={classifierVersions}
            loading={versionsLoading}
            onRollback={handleRollbackClassifier}
            onSwitch={handleSwitchClassifier}
            onRefresh={fetchClassifierVersions}
          />
        </div>
      )}

      {/* Sub-tab 2: Detector Lifecycle (Strictly NO rebuild form or button) */}
      {subTab === 'detector' && (
        <div className="space-y-4">
          {/* Detector Version History Table */}
          <ModelVersionsTable
            modelType="DETECTOR"
            versions={detectorVersions}
            loading={versionsLoading}
            onRollback={handleRollbackDetector}
            onSwitch={handleSwitchDetector}
            onRefresh={fetchDetectorVersions}
          />
        </div>
      )}
    </div>
  )
}
