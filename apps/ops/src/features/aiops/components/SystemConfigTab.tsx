import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CustomSelect from '@/components/common/CustomSelect'
import {
  GearSix,
  SlidersHorizontal,
  Code,
  Copy,
  CircleNotch,
  Brain,
  Package,
  Tag,
  Cloud,
  CaretRight,
  CaretDown,
  FloppyDisk,
  ArrowsClockwise,
  Sparkle,
  Images,
} from '@phosphor-icons/react'
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

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
          checked ? 'bg-[#007b8b] dark:bg-[#00c4de]' : 'bg-gray-300 dark:bg-white/20'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export function SystemConfigTab({
  configData,
  configLoading,
  configViewMode,
  setConfigViewMode,
  collapsedBranches,
  toggleBranch,
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
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  useEffect(() => {
    setDraft(configData ? structuredClone(configData) : null)
  }, [configData])

  const updateGroupField = (group: keyof SystemConfigResponse, field: string, value: any) => {
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

  const updateActiveLearningSubField = (
    subGroup: 'r3_cec' | 'least_confidence',
    field: string,
    value: any
  ) => {
    setDraft((prev) => {
      if (!prev) return prev
      const currentAl = prev.active_learning
      const currentSub = (currentAl[subGroup] as Record<string, any>) || {}
      return {
        ...prev,
        active_learning: {
          ...currentAl,
          [subGroup]: {
            ...currentSub,
            [field]: value,
          },
        },
      }
    })
  }

  const handleConfirmReset = async () => {
    await onResetConfig()
    setConfirmResetOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de]">
            <GearSix size={22} weight="bold" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {isEn ? 'AI system configuration' : 'Cấu hình hệ thống AI'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isEn
                ? 'View and edit runtime settings for the AI server.'
                : 'Xem và chỉnh sửa trực tiếp các tham số vận hành của máy chủ AI.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Switch */}
          <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setConfigViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                configViewMode === 'tree'
                  ? 'bg-white dark:bg-[#061115] text-[#007b8b] dark:text-[#00c4de] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal size={14} weight="bold" />
              <span>{isEn ? 'Edit form' : 'Chỉnh sửa'}</span>
            </button>
            <button
              type="button"
              onClick={() => setConfigViewMode('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                configViewMode === 'json'
                  ? 'bg-white dark:bg-[#061115] text-[#007b8b] dark:text-[#00c4de] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Code size={14} weight="bold" />
              <span>JSON</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={configLoading}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise size={14} weight="bold" className={configLoading ? 'animate-spin' : ''} />
            <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
          </button>

          <button
            type="button"
            onClick={onCopyJson}
            disabled={!draft}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Copy size={14} weight="bold" />
            <span>{isEn ? 'Copy JSON' : 'Sao chép JSON'}</span>
          </button>

          {!confirmResetOpen ? (
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              disabled={!draft || isResetting}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {isEn ? 'Reset defaults' : 'Khôi phục mặc định'}
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-500/40 px-2.5 py-1 rounded-xl text-xs">
              <span className="font-semibold text-rose-700 dark:text-rose-300">
                {isEn ? 'Confirm reset?' : 'Xác nhận khôi phục?'}
              </span>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (isEn ? 'Resetting...' : 'Đang khôi phục...') : isEn ? 'Confirm' : 'Đồng ý'}
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setConfirmResetOpen(false)}
                className="px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 font-semibold cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
            </div>
          )}
        </div>
      </div>

      {configLoading ? (
        <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl">
          <CircleNotch size={32} className="animate-spin text-[#007b8b]" />
          <p className="text-xs">{isEn ? 'Loading AI configuration...' : 'Đang tải cấu hình AI...'}</p>
        </div>
      ) : draft ? (
        configViewMode === 'json' ? (
          <div className="bg-[#0b1015] border border-white/10 rounded-2xl p-5 shadow-inner overflow-x-auto">
            <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
              {JSON.stringify(draft, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Root Overview */}
            <div className="p-5 bg-white dark:bg-[#0A171C] border border-neutral-200/80 dark:border-white/10 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
                  <Brain size={24} weight="duotone" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {isEn ? 'Edge AI Engine Configuration' : 'Cấu hình máy chủ AI'}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {isEn
                      ? 'Changes saved per group take effect immediately.'
                      : 'Thay đổi sau khi lưu ở từng nhóm sẽ áp dụng trực tiếp lên máy chủ AI.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {isEn ? '7 active groups' : '7 nhóm cấu hình'}
                </span>
                <span className="px-2.5 py-1 rounded-lg font-semibold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-white/10">
                  GPU #{draft.system.default_device}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* GROUP 1: DETECTOR */}
              <div className="bg-white dark:bg-[#0A171C] border border-[#007b8b]/20 dark:border-[#00c4de]/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#007b8b]" />
                <div
                  onClick={() => toggleBranch('detector')}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#007b8b]/15 text-[#007b8b] dark:text-[#00c4de]">
                      <Package size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">
                        detector
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {isEn ? 'Sign detection' : 'Nhận diện biển báo'}
                      </h4>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                    {collapsedBranches['detector'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                  </button>
                </div>

                {!collapsedBranches['detector'] && (
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-600 dark:text-gray-300">
                        {isEn ? 'Active model' : 'Mô hình đang dùng'}
                      </label>
                      <input
                        type="text"
                        value={draft.detector.active_model}
                        onChange={(e) => updateGroupField('detector', 'active_model', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-600 dark:text-gray-300">
                        {isEn ? 'Default confidence' : 'Ngưỡng tin cậy mặc định'}
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        max="1"
                        value={draft.detector.default_conf}
                        onChange={(e) => updateGroupField('detector', 'default_conf', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        disabled={savingGroup === 'detector'}
                        onClick={() => onSaveGroup('detector', draft.detector)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white font-bold cursor-pointer disabled:opacity-50"
                      >
                        {savingGroup === 'detector' ? <CircleNotch size={14} className="animate-spin" /> : <FloppyDisk size={14} weight="bold" />}
                        <span>{isEn ? 'Save group' : 'Lưu nhóm này'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* GROUP 2: CLASSIFIER */}
              <div className="bg-white dark:bg-[#0A171C] border border-blue-500/20 dark:border-blue-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                <div
                  onClick={() => toggleBranch('classifier')}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                      <Tag size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        classifier
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {isEn ? 'Sign classification' : 'Phân loại biển báo'}
                      </h4>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                    {collapsedBranches['classifier'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                  </button>
                </div>

                {!collapsedBranches['classifier'] && (
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-600 dark:text-gray-300">
                        {isEn ? 'Active model' : 'Mô hình đang dùng'}
                      </label>
                      <input
                        type="text"
                        value={draft.classifier.active_model}
                        onChange={(e) => updateGroupField('classifier', 'active_model', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Default confidence' : 'Ngưỡng tin cậy'}
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0.05"
                          max="1"
                          value={draft.classifier.default_conf}
                          onChange={(e) => updateGroupField('classifier', 'default_conf', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Temperature' : 'Hệ số nhiệt độ'}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={draft.classifier.temperature ?? 7}
                          onChange={(e) => updateGroupField('classifier', 'temperature', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-600 dark:text-gray-300">
                        {isEn ? 'Prompt template' : 'Mẫu câu lệnh nhận diện'}
                      </label>
                      <input
                        type="text"
                        value={draft.classifier.prompt_template}
                        onChange={(e) => updateGroupField('classifier', 'prompt_template', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        disabled={savingGroup === 'classifier'}
                        onClick={() => onSaveGroup('classifier', draft.classifier)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white font-bold cursor-pointer disabled:opacity-50"
                      >
                        {savingGroup === 'classifier' ? <CircleNotch size={14} className="animate-spin" /> : <FloppyDisk size={14} weight="bold" />}
                        <span>{isEn ? 'Save group' : 'Lưu nhóm này'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* GROUP 3: ACTIVE LEARNING (Full width on large screens for nested blocks) */}
              <div className="bg-white dark:bg-[#0A171C] border border-purple-500/20 dark:border-purple-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden lg:col-span-2">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
                <div
                  onClick={() => toggleBranch('active_learning')}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                      <SlidersHorizontal size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                        active_learning
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {isEn ? 'Active learning settings' : 'Cài đặt học chủ động'}
                      </h4>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                    {collapsedBranches['active_learning'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                  </button>
                </div>

                {!collapsedBranches['active_learning'] && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Default strategy' : 'Chiến lược lấy mẫu'}
                        </label>
                        <CustomSelect
                          value={draft.active_learning.default_strategy}
                          onChange={(val) => updateGroupField('active_learning', 'default_strategy', val)}
                          options={[
                            { value: 'r3_cec', label: 'r3_cec' },
                            { value: 'least_confidence', label: 'least_confidence' },
                          ]}
                          size="sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Aggregation method' : 'Cách gộp điểm'}
                        </label>
                        <CustomSelect
                          value={draft.active_learning.default_aggregation}
                          onChange={(val) => updateGroupField('active_learning', 'default_aggregation', val)}
                          options={[
                            { value: 'avg', label: 'avg' },
                            { value: 'max', label: 'max' },
                            { value: 'min', label: 'min' },
                            { value: 'sum', label: 'sum' },
                          ]}
                          size="sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Default top K' : 'Số mẫu mỗi đợt'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={draft.active_learning.default_top_k}
                          onChange={(e) => updateGroupField('active_learning', 'default_top_k', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Discrepancy threshold' : 'Ngưỡng chênh lệch'}
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="1"
                          value={draft.active_learning.discrepancy_threshold}
                          onChange={(e) => updateGroupField('active_learning', 'discrepancy_threshold', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Min detector batch' : 'Cỡ lô tối thiểu nhận diện'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={draft.active_learning.min_batch_size_detector}
                          onChange={(e) => updateGroupField('active_learning', 'min_batch_size_detector', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Min classifier batch' : 'Cỡ lô tối thiểu phân loại'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={draft.active_learning.min_batch_size_classifier}
                          onChange={(e) => updateGroupField('active_learning', 'min_batch_size_classifier', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'No detection score' : 'Điểm khi không phát hiện'}
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={draft.active_learning.no_detection_score}
                          onChange={(e) => updateGroupField('active_learning', 'no_detection_score', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Dataset store path' : 'Đường dẫn lưu tập dữ liệu'}
                        </label>
                        <input
                          type="text"
                          value={draft.active_learning.dataset_store_path}
                          onChange={(e) => updateGroupField('active_learning', 'dataset_store_path', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#007b8b]"
                        />
                      </div>
                    </div>

                    <ToggleRow
                      label={isEn ? 'Auto trigger training' : 'Tự động kích hoạt huấn luyện lại'}
                      checked={Boolean(draft.active_learning.auto_trigger_training)}
                      onChange={(val) => updateGroupField('active_learning', 'auto_trigger_training', val)}
                    />

                    {/* Nested R3-CEC & Least Confidence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200/70 dark:border-white/10">
                      {draft.active_learning.r3_cec && (
                        <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/10 space-y-2.5">
                          <h5 className="font-mono font-bold text-purple-600 dark:text-purple-400">
                            r3_cec
                          </h5>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                              <label className="block font-semibold text-gray-600 dark:text-gray-300">
                                {isEn ? 'K neighbors' : 'Số láng giềng'}
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={draft.active_learning.r3_cec.k_neighbors}
                                onChange={(e) => updateActiveLearningSubField('r3_cec', 'k_neighbors', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#061115] font-mono font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block font-semibold text-gray-600 dark:text-gray-300">
                                {isEn ? 'Temperature' : 'Nhiệt độ'}
                              </label>
                              <input
                                type="number"
                                step="0.05"
                                min="0.05"
                                value={draft.active_learning.r3_cec.temperature}
                                onChange={(e) => updateActiveLearningSubField('r3_cec', 'temperature', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#061115] font-mono font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block font-semibold text-gray-600 dark:text-gray-300">
                                {isEn ? 'Query budget' : 'Ngân sách truy vấn'}
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={draft.active_learning.r3_cec.query_budget}
                                onChange={(e) => updateActiveLearningSubField('r3_cec', 'query_budget', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#061115] font-mono font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block font-semibold text-gray-600 dark:text-gray-300">
                                {isEn ? 'Random state' : 'Hạt giống ngẫu nhiên'}
                              </label>
                              <input
                                type="number"
                                value={draft.active_learning.r3_cec.random_state}
                                onChange={(e) => updateActiveLearningSubField('r3_cec', 'random_state', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#061115] font-mono font-bold"
                              />
                            </div>
                          </div>
                          <ToggleRow
                            label={isEn ? 'Apply calibration' : 'Bật hiệu chỉnh xác suất'}
                            checked={Boolean(draft.active_learning.r3_cec.apply_calibration)}
                            onChange={(val) => updateActiveLearningSubField('r3_cec', 'apply_calibration', val)}
                          />
                        </div>
                      )}

                      {draft.active_learning.least_confidence && (
                        <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/10 space-y-2.5">
                          <h5 className="font-mono font-bold text-purple-600 dark:text-purple-400">
                            least_confidence
                          </h5>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                              <label className="block font-semibold text-gray-600 dark:text-gray-300">
                                {isEn ? 'Aggregation' : 'Cách gộp điểm'}
                              </label>
                              <CustomSelect
                                value={draft.active_learning.least_confidence.aggregation_method}
                                onChange={(val) => updateActiveLearningSubField('least_confidence', 'aggregation_method', val)}
                                options={[
                                  { value: 'avg', label: 'avg' },
                                  { value: 'max', label: 'max' },
                                  { value: 'min', label: 'min' },
                                  { value: 'sum', label: 'sum' },
                                ]}
                                size="sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block font-semibold text-gray-600 dark:text-gray-300">
                                {isEn ? 'No detection score' : 'Điểm mặc định'}
                              </label>
                              <input
                                type="number"
                                step="0.05"
                                value={draft.active_learning.least_confidence.no_detection_score}
                                onChange={(e) => updateActiveLearningSubField('least_confidence', 'no_detection_score', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#061115] font-mono font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        disabled={savingGroup === 'active_learning'}
                        onClick={() => onSaveGroup('active_learning', draft.active_learning)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white font-bold cursor-pointer disabled:opacity-50"
                      >
                        {savingGroup === 'active_learning' ? <CircleNotch size={14} className="animate-spin" /> : <FloppyDisk size={14} weight="bold" />}
                        <span>{isEn ? 'Save group' : 'Lưu nhóm này'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* GROUP 4: TIMO */}
              {draft.timo && (
                <div className="bg-white dark:bg-[#0A171C] border border-cyan-500/20 dark:border-cyan-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
                  <div
                    onClick={() => toggleBranch('timo')}
                    className="flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                        <Sparkle size={20} weight="bold" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          timo
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {isEn ? 'TIMO tuning' : 'Tinh chỉnh TIMO'}
                        </h4>
                      </div>
                    </div>
                    <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                      {collapsedBranches['timo'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                    </button>
                  </div>

                  {!collapsedBranches['timo'] && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block font-semibold text-gray-600 dark:text-gray-300">
                            {isEn ? 'Alpha' : 'Hệ số Alpha'}
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={draft.timo.alpha}
                            onChange={(e) => updateGroupField('timo', 'alpha', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-semibold text-gray-600 dark:text-gray-300">
                            {isEn ? 'Beta' : 'Hệ số Beta'}
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={draft.timo.beta}
                            onChange={(e) => updateGroupField('timo', 'beta', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Prompt template' : 'Mẫu câu lệnh văn bản'}
                        </label>
                        <input
                          type="text"
                          value={draft.timo.prompt_template}
                          onChange={(e) => updateGroupField('timo', 'prompt_template', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Cache file path' : 'Tệp bộ nhớ đệm'}
                        </label>
                        <input
                          type="text"
                          value={draft.timo.classifier_cache_file}
                          onChange={(e) => updateGroupField('timo', 'classifier_cache_file', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono"
                        />
                      </div>

                      <ToggleRow
                        label={isEn ? 'Normalize embeddings' : 'Chuẩn hóa vector đặc trưng'}
                        checked={Boolean(draft.timo.normalize_embeddings)}
                        onChange={(val) => updateGroupField('timo', 'normalize_embeddings', val)}
                      />

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          disabled={savingGroup === 'timo'}
                          onClick={() => onSaveGroup('timo', draft.timo!)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white font-bold cursor-pointer disabled:opacity-50"
                        >
                          {savingGroup === 'timo' ? <CircleNotch size={14} className="animate-spin" /> : <FloppyDisk size={14} weight="bold" />}
                          <span>{isEn ? 'Save group' : 'Lưu nhóm này'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GROUP 5: FEW-SHOT SUPPORT */}
              {draft.few_shot_support && (
                <div className="bg-white dark:bg-[#0A171C] border border-indigo-500/20 dark:border-indigo-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                  <div
                    onClick={() => toggleBranch('few_shot_support')}
                    className="flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        <Images size={20} weight="bold" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          few_shot_support
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {isEn ? 'Few-shot support gallery' : 'Kho ảnh mẫu chuẩn'}
                        </h4>
                      </div>
                    </div>
                    <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                      {collapsedBranches['few_shot_support'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                    </button>
                  </div>

                  {!collapsedBranches['few_shot_support'] && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <div className="space-y-1">
                          <label className="block font-semibold text-gray-600 dark:text-gray-300">
                            {isEn ? 'Total shots' : 'Số ảnh mỗi loại'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={draft.few_shot_support.total_shots_per_class}
                            onChange={(e) => updateGroupField('few_shot_support', 'total_shots_per_class', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-semibold text-gray-600 dark:text-gray-300">
                            {isEn ? 'Anchors' : 'Số ảnh neo'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={draft.few_shot_support.num_anchors}
                            onChange={(e) => updateGroupField('few_shot_support', 'num_anchors', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-semibold text-gray-600 dark:text-gray-300">
                            {isEn ? 'Medoids' : 'Số ảnh cụm'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={draft.few_shot_support.num_medoids}
                            onChange={(e) => updateGroupField('few_shot_support', 'num_medoids', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-semibold text-gray-600 dark:text-gray-300">
                            {isEn ? 'Min crop px' : 'Kích thước tối thiểu'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={draft.few_shot_support.min_crop_resolution}
                            onChange={(e) => updateGroupField('few_shot_support', 'min_crop_resolution', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-semibold text-gray-600 dark:text-gray-300">
                            {isEn ? 'Min sharpness' : 'Độ nét tối thiểu'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={draft.few_shot_support.min_sharpness_laplacian}
                            onChange={(e) => updateGroupField('few_shot_support', 'min_sharpness_laplacian', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-semibold text-gray-600 dark:text-gray-300">
                            {isEn ? 'Policy' : 'Cách thay ảnh'}
                          </label>
                          <input
                            type="text"
                            value={draft.few_shot_support.replacement_policy}
                            onChange={(e) => updateGroupField('few_shot_support', 'replacement_policy', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono"
                          />
                        </div>
                      </div>

                      <ToggleRow
                        label={isEn ? 'Preserve pinned shots' : 'Giữ lại các ảnh đã ghim'}
                        checked={Boolean(draft.few_shot_support.preserve_pinned_shots)}
                        onChange={(val) => updateGroupField('few_shot_support', 'preserve_pinned_shots', val)}
                      />

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          disabled={savingGroup === 'few_shot_support'}
                          onClick={() => onSaveGroup('few_shot_support', draft.few_shot_support!)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white font-bold cursor-pointer disabled:opacity-50"
                        >
                          {savingGroup === 'few_shot_support' ? <CircleNotch size={14} className="animate-spin" /> : <FloppyDisk size={14} weight="bold" />}
                          <span>{isEn ? 'Save group' : 'Lưu nhóm này'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GROUP 6: SYSTEM RUNTIME & HARDWARE */}
              <div className="bg-white dark:bg-[#0A171C] border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                <div
                  onClick={() => toggleBranch('system')}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <GearSix size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        system
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {isEn ? 'Hardware & logging' : 'Phần cứng và nhật ký'}
                      </h4>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                    {collapsedBranches['system'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                  </button>
                </div>

                {!collapsedBranches['system'] && (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Default GPU device' : 'Số hiệu GPU mặc định'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={draft.system.default_device}
                          onChange={(e) => updateGroupField('system', 'default_device', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-gray-600 dark:text-gray-300">
                          {isEn ? 'Idle timeout seconds' : 'Thời gian chờ tắt giây'}
                        </label>
                        <input
                          type="number"
                          min="60"
                          value={draft.system.model_idle_timeout_seconds}
                          onChange={(e) => updateGroupField('system', 'model_idle_timeout_seconds', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-600 dark:text-gray-300">
                        {isEn ? 'Log level' : 'Mức ghi nhật ký'}
                      </label>
                      <CustomSelect
                        value={draft.system.log_level}
                        onChange={(val) => updateGroupField('system', 'log_level', val)}
                        options={[
                          { value: 'DEBUG', label: 'DEBUG' },
                          { value: 'INFO', label: 'INFO' },
                          { value: 'WARNING', label: 'WARNING' },
                          { value: 'ERROR', label: 'ERROR' },
                        ]}
                        size="sm"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        disabled={savingGroup === 'system'}
                        onClick={() => onSaveGroup('system', draft.system)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white font-bold cursor-pointer disabled:opacity-50"
                      >
                        {savingGroup === 'system' ? <CircleNotch size={14} className="animate-spin" /> : <FloppyDisk size={14} weight="bold" />}
                        <span>{isEn ? 'Save group' : 'Lưu nhóm này'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* GROUP 7: STORAGE */}
              <div className="bg-white dark:bg-[#0A171C] border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                <div
                  onClick={() => toggleBranch('storage')}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Cloud size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        storage
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {isEn ? 'Object storage' : 'Lưu trữ MinIO'}
                      </h4>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                    {collapsedBranches['storage'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                  </button>
                </div>

                {!collapsedBranches['storage'] && (
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-600 dark:text-gray-300">
                        {isEn ? 'Bucket name' : 'Tên kho chứa dữ liệu'}
                      </label>
                      <input
                        type="text"
                        value={draft.storage.minio_bucket}
                        onChange={(e) => updateGroupField('storage', 'minio_bucket', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-600 dark:text-gray-300">
                        {isEn ? 'MinIO endpoint' : 'Địa chỉ máy chủ MinIO'}
                      </label>
                      <input
                        type="text"
                        value={draft.storage.minio_endpoint}
                        placeholder={isEn ? 'Empty for local storage' : 'Để trống nếu dùng lưu trữ cục bộ'}
                        onChange={(e) => updateGroupField('storage', 'minio_endpoint', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] font-mono"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        disabled={savingGroup === 'storage'}
                        onClick={() => onSaveGroup('storage', draft.storage)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white font-bold cursor-pointer disabled:opacity-50"
                      >
                        {savingGroup === 'storage' ? <CircleNotch size={14} className="animate-spin" /> : <FloppyDisk size={14} weight="bold" />}
                        <span>{isEn ? 'Save group' : 'Lưu nhóm này'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      ) : null}
    </div>
  )
}
