import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleNotch } from '@phosphor-icons/react'
import type { SystemConfigResponse } from '@/api/services/aiops.service'

interface SystemConfigTabProps {
  configData: SystemConfigResponse | null
  configLoading: boolean
  configViewMode: 'tree' | 'json'
  setConfigViewMode: React.Dispatch<React.SetStateAction<'tree' | 'json'>>
  collapsedBranches: Record<string, boolean>
  toggleBranch: (branchKey: string) => void
  onCopyJson: () => void
  onRefresh: () => void
  onSaveGroup: (groupName: string, payload: Record<string, any>) => Promise<void>
  onResetConfig: () => Promise<void>
  savingGroup: string | null
  isResetting: boolean
}

type ConfigGroupId = 'detector' | 'classifier' | 'active_learning' | 'system' | 'storage' | 'json'

export function SystemConfigTab({
  configData,
  configLoading,
  onCopyJson,
  onRefresh,
  onSaveGroup,
  onResetConfig,
  savingGroup,
  isResetting,
}: SystemConfigTabProps) {
  const { i18n } = useTranslation('ops')
  const isEn = i18n.language?.startsWith('en')

  const [draft, setDraft] = useState<SystemConfigResponse | null>(configData)
  const [selectedGroup, setSelectedGroup] = useState<ConfigGroupId>('detector')
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  useEffect(() => {
    setDraft(configData ? structuredClone(configData) : null)
  }, [configData])

  const updateField = (group: keyof SystemConfigResponse, field: string, value: any) => {
    setDraft((prev) => {
      if (!prev) return prev
      const currentGroup = (prev[group] as Record<string, any>) || {}
      return {
        ...prev,
        [group]: {
          ...currentGroup,
          [field]: value,
        },
      }
    })
  }

  const navItems: Array<{ id: ConfigGroupId; label: string; sub: string }> = [
    { id: 'detector', label: isEn ? 'Object Detection' : 'Mô hình detector', sub: 'YOLOv11x' },
    { id: 'classifier', label: isEn ? 'Zero-Shot Classifier' : 'Mô hình classifier', sub: 'MobileCLIP' },
    { id: 'active_learning', label: isEn ? 'Active Learning' : 'Active learning', sub: 'Sampling & Retrain' },
    { id: 'system', label: isEn ? 'System Resources' : 'Tài nguyên hệ thống', sub: 'GPU & Timeout' },
    { id: 'storage', label: isEn ? 'Object Storage' : 'Lưu trữ MinIO', sub: 'Bucket & S3 Endpoint' },
    { id: 'json', label: isEn ? 'Raw JSON Config' : 'Cấu hình JSON', sub: 'Export & Copy' },
  ]

  const handleSaveCurrentGroup = () => {
    if (!draft || selectedGroup === 'json') return
    const groupData = draft[selectedGroup as keyof SystemConfigResponse]
    if (groupData) {
      onSaveGroup(selectedGroup, groupData as Record<string, any>)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Top Bar with Global Actions ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl px-4 py-3 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {isEn ? 'Edge AI System Configuration' : 'Cấu hình hệ thống & tham số AI'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isEn
              ? 'Tune runtime parameters for inference, sampling, and storage directly on the NVIDIA edge node.'
              : 'Điều chỉnh trực tiếp các tham số suy luận, lấy mẫu và lưu trữ trên máy chủ Jetson Orin.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={configLoading}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {isEn ? 'Refresh' : 'Tải lại'}
          </button>

          {!confirmResetOpen ? (
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              disabled={!draft || isResetting}
              className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {isEn ? 'Reset defaults' : 'Khôi phục mặc định'}
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-500/40 px-2 py-1 rounded-lg text-xs font-mono">
              <span className="text-rose-700 dark:text-rose-300 font-bold">{isEn ? 'Reset?' : 'Xác nhận?'}</span>
              <button
                type="button"
                onClick={async () => {
                  await onResetConfig()
                  setConfirmResetOpen(false)
                }}
                disabled={isResetting}
                className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold cursor-pointer"
              >
                {isResetting ? '...' : (isEn ? 'Yes' : 'Đồng ý')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-2 py-0.5 text-gray-600 dark:text-gray-400 hover:underline cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
            </div>
          )}
        </div>
      </div>

      {configLoading ? (
        <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl">
          <CircleNotch size={28} className="animate-spin text-[#007b8b]" />
          <p className="text-xs font-mono">{isEn ? 'Loading configuration tree...' : 'Đang tải cấu hình hệ thống AI...'}</p>
        </div>
      ) : !draft ? (
        <div className="p-12 text-center text-gray-400 font-mono text-xs bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl">
          {isEn ? 'Configuration unavailable.' : 'Không thể tải dữ liệu cấu hình.'}
        </div>
      ) : (
        /* ── 2-Column Master-Detail Settings Layout ──────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Left Navigation Menu (4 cols) */}
          <div className="md:col-span-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl p-2 shadow-xs space-y-1">
            {navItems.map((item) => {
              const active = selectedGroup === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedGroup(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer flex flex-col ${
                    active
                      ? 'bg-[#007b8b] text-white shadow-xs font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs">{item.label}</span>
                  <span className={`text-[10px] font-mono ${active ? 'text-white/80' : 'text-gray-400'}`}>
                    {item.sub}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right Active Settings Panel (8 cols) */}
          <div className="md:col-span-8 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-xl p-5 shadow-xs space-y-5">
            {/* 1. DETECTOR SETTINGS */}
            {selectedGroup === 'detector' && draft.detector && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 dark:border-white/10 pb-3">
                  <h4 className="text-xs font-bold font-mono uppercase text-[#007b8b] dark:text-[#00c4de]">
                    detector
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isEn ? 'Configures bounding-box location detection engine.' : 'Cấu hình mô hình nhận diện vị trí biển báo giao thông.'}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                      active_model • {isEn ? 'Active model file' : 'Tệp model active'}
                    </label>
                    <input
                      type="text"
                      value={draft.detector.active_model}
                      onChange={(e) => updateField('detector', 'active_model', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                      default_conf • {isEn ? 'Default confidence threshold' : 'Ngưỡng tin cậy mặc định'}: {draft.detector.default_conf}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0.05}
                        max={1}
                        step={0.05}
                        value={draft.detector.default_conf}
                        onChange={(e) => updateField('detector', 'default_conf', Number(e.target.value))}
                        className="w-full accent-[#007b8b] cursor-pointer"
                      />
                      <input
                        type="number"
                        step={0.05}
                        value={draft.detector.default_conf}
                        onChange={(e) => updateField('detector', 'default_conf', Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono text-right text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CLASSIFIER SETTINGS */}
            {selectedGroup === 'classifier' && draft.classifier && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 dark:border-white/10 pb-3">
                  <h4 className="text-xs font-bold font-mono uppercase text-[#007b8b] dark:text-[#00c4de]">
                    classifier
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isEn ? 'Configures Zero-Shot fine-grained sign recognition.' : 'Cấu hình mô hình phân loại chi tiết Zero-Shot theo chuẩn QCVN.'}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                      active_model • {isEn ? 'Active classifier model' : 'Tệp model classifier'}
                    </label>
                    <input
                      type="text"
                      value={draft.classifier.active_model}
                      onChange={(e) => updateField('classifier', 'active_model', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                        default_conf • {isEn ? 'Confidence threshold' : 'Ngưỡng tin cậy'}
                      </label>
                      <input
                        type="number"
                        step={0.05}
                        min={0.05}
                        max={1}
                        value={draft.classifier.default_conf}
                        onChange={(e) => updateField('classifier', 'default_conf', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                        temperature • {isEn ? 'Softmax temperature' : 'Hệ số nhiệt độ softmax'}
                      </label>
                      <input
                        type="number"
                        step={0.5}
                        min={0.1}
                        value={draft.classifier.temperature ?? 7}
                        onChange={(e) => updateField('classifier', 'temperature', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                      prompt_template • {isEn ? 'CLIP prompt template' : 'Mẫu prompt CLIP'}
                    </label>
                    <input
                      type="text"
                      value={draft.classifier.prompt_template}
                      onChange={(e) => updateField('classifier', 'prompt_template', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. ACTIVE LEARNING SETTINGS */}
            {selectedGroup === 'active_learning' && draft.active_learning && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 dark:border-white/10 pb-3">
                  <h4 className="text-xs font-bold font-mono uppercase text-[#007b8b] dark:text-[#00c4de]">
                    active_learning
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isEn ? 'Controls sample mining, thresholds, and auto-training triggers.' : 'Tham số khai thác mẫu biên và điều kiện kích hoạt huấn luyện tự động.'}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                        default_strategy • {isEn ? 'Default strategy' : 'Chiến lược mặc định'}
                      </label>
                      <input
                        type="text"
                        value={draft.active_learning.default_strategy}
                        onChange={(e) => updateField('active_learning', 'default_strategy', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                        default_top_k • {isEn ? 'Top-K budget' : 'Ngân sách mẫu Top-K'}
                      </label>
                      <input
                        type="number"
                        value={draft.active_learning.default_top_k}
                        onChange={(e) => updateField('active_learning', 'default_top_k', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                        discrepancy_threshold • {isEn ? 'Reviewer discrepancy threshold' : 'Ngưỡng bất đồng reviewer'}
                      </label>
                      <input
                        type="number"
                        step={0.05}
                        value={draft.active_learning.discrepancy_threshold}
                        onChange={(e) => updateField('active_learning', 'discrepancy_threshold', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                        dataset_store_path • {isEn ? 'Dataset store path' : 'Đường dẫn lưu dataset'}
                      </label>
                      <input
                        type="text"
                        value={draft.active_learning.dataset_store_path}
                        onChange={(e) => updateField('active_learning', 'dataset_store_path', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>
                  </div>

                  {/* Auto Trigger Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 block text-xs">
                        auto_trigger_training • {isEn ? 'Auto trigger retraining' : 'Tự động kích hoạt huấn luyện lại'}
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        Tự kích hoạt retraining job khi số lượng mẫu gán nhãn đạt mốc quy định.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField('active_learning', 'auto_trigger_training', !draft.active_learning.auto_trigger_training)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                        draft.active_learning.auto_trigger_training ? 'bg-[#007b8b]' : 'bg-gray-300 dark:bg-white/20'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                          draft.active_learning.auto_trigger_training ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. SYSTEM SETTINGS */}
            {selectedGroup === 'system' && draft.system && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 dark:border-white/10 pb-3">
                  <h4 className="text-xs font-bold font-mono uppercase text-[#007b8b] dark:text-[#00c4de]">
                    system
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isEn ? 'Hardware device binding and daemon lifecycle.' : 'Gán thiết bị tăng tốc phần cứng và chu kỳ nghỉ của mô hình.'}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                        default_device • {isEn ? 'GPU device ordinal' : 'Mã thiết bị GPU'}
                      </label>
                      <input
                        type="number"
                        value={draft.system.default_device}
                        onChange={(e) => updateField('system', 'default_device', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                        log_level • {isEn ? 'Log level' : 'Mức độ ghi log'}
                      </label>
                      <select
                        value={draft.system.log_level}
                        onChange={(e) => updateField('system', 'log_level', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b] cursor-pointer"
                      >
                        <option value="DEBUG">DEBUG</option>
                        <option value="INFO">INFO</option>
                        <option value="WARNING">WARNING</option>
                        <option value="ERROR">ERROR</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                      model_idle_timeout_seconds • {isEn ? 'Idle timeout' : 'Thời gian chờ hạ tải model'}: {draft.system.model_idle_timeout_seconds}s
                    </label>
                    <input
                      type="number"
                      step={60}
                      value={draft.system.model_idle_timeout_seconds}
                      onChange={(e) => updateField('system', 'model_idle_timeout_seconds', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. STORAGE SETTINGS */}
            {selectedGroup === 'storage' && draft.storage && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 dark:border-white/10 pb-3">
                  <h4 className="text-xs font-bold font-mono uppercase text-[#007b8b] dark:text-[#00c4de]">
                    storage
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isEn ? 'MinIO S3-compatible storage endpoints for training datasets.' : 'Địa chỉ máy chủ MinIO lưu trữ dữ liệu ảnh và tệp trọng số.'}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                      minio_endpoint
                    </label>
                    <input
                      type="text"
                      value={draft.storage.minio_endpoint}
                      onChange={(e) => updateField('storage', 'minio_endpoint', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                      minio_bucket
                    </label>
                    <input
                      type="text"
                      value={draft.storage.minio_bucket}
                      onChange={(e) => updateField('storage', 'minio_bucket', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. RAW JSON VIEW */}
            {selectedGroup === 'json' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-2">
                  <span className="text-xs font-mono font-bold text-gray-400">JSON Payload</span>
                  <button
                    type="button"
                    onClick={onCopyJson}
                    className="px-3 py-1 rounded border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-mono font-semibold cursor-pointer"
                  >
                    {isEn ? 'Copy JSON' : 'Sao chép JSON'}
                  </button>
                </div>
                <div className="bg-[#0b1015] border border-white/10 rounded-lg p-4 overflow-x-auto max-h-[450px]">
                  <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
                    {JSON.stringify(draft, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Bottom Save Action Button for Active Group */}
            {selectedGroup !== 'json' && (
              <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex justify-end">
                <button
                  type="button"
                  disabled={savingGroup === selectedGroup}
                  onClick={handleSaveCurrentGroup}
                  className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingGroup === selectedGroup && <CircleNotch size={14} className="animate-spin" />}
                  <span>{savingGroup === selectedGroup ? (isEn ? 'Saving group...' : 'Đang lưu...') : (isEn ? `Save ${selectedGroup} settings` : `Lưu nhóm ${selectedGroup}`)}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
