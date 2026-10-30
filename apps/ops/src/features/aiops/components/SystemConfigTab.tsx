import { useTranslation } from 'react-i18next'
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
}

export function SystemConfigTab({
  configData,
  configLoading,
  configViewMode,
  setConfigViewMode,
  collapsedBranches,
  toggleBranch,
  onCopyJson,
}: SystemConfigTabProps) {
  const { t } = useTranslation('ops')

  return (
    <div className="space-y-6">
      {/* Header Bar with View Switch & Copy Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de]">
            <GearSix size={22} weight="bold" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {t('mlops.config_title')}
            </h2>
            <p className="text-xs text-gray-400">
              {t('mlops.config_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* View Switch */}
          <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setConfigViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                configViewMode === 'tree'
                  ? 'bg-white dark:bg-[#061115] text-[#007b8b] dark:text-[#00c4de] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal size={14} weight="bold" />
              <span>{t('mlops.config_view_tree')}</span>
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
              <span>{t('mlops.config_view_json')}</span>
            </button>
          </div>

          {/* Copy JSON Button */}
          <button
            type="button"
            onClick={onCopyJson}
            disabled={!configData}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Copy size={15} weight="bold" />
            <span>{t('mlops.config_copy_json')}</span>
          </button>
        </div>
      </div>

      {configLoading ? (
        <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl">
          <CircleNotch size={32} className="animate-spin text-[#007b8b]" />
          <p className="font-mono text-xs">{t('mlops.config_loading')}</p>
        </div>
      ) : configData ? (
        configViewMode === 'json' ? (
          /* RAW JSON INSPECTOR VIEW */
          <div className="bg-[#0b1015] border border-white/10 rounded-2xl p-5 shadow-inner overflow-x-auto">
            <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
              {JSON.stringify(configData, null, 2)}
            </pre>
          </div>
        ) : (
          /* SUBSYSTEMS OVERVIEW VIEW */
          <div className="space-y-6">
            {/* 1. ROOT CENTRAL NODE */}
            <div className="p-5 bg-white dark:bg-[#0A171C] border border-neutral-200/80 dark:border-white/10 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
                  <Brain size={24} weight="duotone" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {t('mlops.config_root_node')}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                    {t('mlops.config_root_desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t('mlops.config_subsystems_active')}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-white/10">
                  Orin GPU Device: #{configData.system.default_device}
                </span>
              </div>
            </div>

            {/* 2. 5 SUBSYSTEM CONFIG CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* BRANCH 1: ACTIVE LEARNING */}
              <div className="bg-white dark:bg-[#0A171C] border border-purple-500/20 dark:border-purple-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">active_learning</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/10 text-purple-600">9 params</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {t('mlops.config_branch_al')}
                      </h4>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                    {collapsedBranches['active_learning'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                  </button>
                </div>

                {!collapsedBranches['active_learning'] && (
                  <div className="pl-4 border-l-2 border-dashed border-purple-500/25 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">default_strategy</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">"{configData.active_learning.default_strategy}"</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">default_aggregation</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">"{configData.active_learning.default_aggregation}"</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">default_top_k</span>
                      <span className="font-bold text-[#007b8b] dark:text-[#00c4de]">{configData.active_learning.default_top_k}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">discrepancy_threshold</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{configData.active_learning.discrepancy_threshold}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">auto_trigger_training</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {configData.active_learning.auto_trigger_training ? 'true (Active)' : 'false'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">min_batch_size_detector / classifier</span>
                      <span className="text-gray-800 dark:text-gray-200 font-bold">
                        {configData.active_learning.min_batch_size_detector} / {configData.active_learning.min_batch_size_classifier}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">dataset_store_path</span>
                      <span className="text-amber-600 dark:text-amber-400 text-[11px] truncate max-w-[240px]" title={configData.active_learning.dataset_store_path}>
                        "{configData.active_learning.dataset_store_path}"
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* BRANCH 2: OBJECT DETECTOR */}
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">detector</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#007b8b]/10 text-[#007b8b] dark:text-[#00c4de]">2 params</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {t('mlops.config_branch_detector')}
                      </h4>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                    {collapsedBranches['detector'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                  </button>
                </div>

                {!collapsedBranches['detector'] && (
                  <div className="pl-4 border-l-2 border-dashed border-[#007b8b]/25 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">active_model</span>
                      <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {configData.detector.active_model}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">default_conf</span>
                      <span className="font-bold text-[#007b8b] dark:text-[#00c4de]">
                        {configData.detector.default_conf} ({(configData.detector.default_conf * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* BRANCH 3: ZERO-SHOT CLASSIFIER */}
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">classifier</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600">3 params</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {t('mlops.config_branch_classifier')}
                      </h4>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                    {collapsedBranches['classifier'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                  </button>
                </div>

                {!collapsedBranches['classifier'] && (
                  <div className="pl-4 border-l-2 border-dashed border-blue-500/25 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">active_model</span>
                      <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {configData.classifier.active_model}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">default_conf</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {configData.classifier.default_conf} ({(configData.classifier.default_conf * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">prompt_template</span>
                      <code className="text-purple-600 dark:text-purple-300 text-[11px] bg-purple-500/10 px-2 py-0.5 rounded">
                        "{configData.classifier.prompt_template}"
                      </code>
                    </div>
                  </div>
                )}
              </div>

              {/* BRANCH 4: SYSTEM RUNTIME & HARDWARE */}
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">system</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600">3 params</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {t('mlops.config_branch_system')}
                      </h4>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                    {collapsedBranches['system'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                  </button>
                </div>

                {!collapsedBranches['system'] && (
                  <div className="pl-4 border-l-2 border-dashed border-emerald-500/25 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">default_device</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">GPU #{configData.system.default_device}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">model_idle_timeout_seconds</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{configData.system.model_idle_timeout_seconds}s (30 mins)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">log_level</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                        {configData.system.log_level}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* BRANCH 5: OBJECT STORAGE */}
              <div className="bg-white dark:bg-[#0A171C] border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden lg:col-span-2">
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">storage</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600">2 params</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {t('mlops.config_branch_storage')}
                      </h4>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                    {collapsedBranches['storage'] ? <CaretRight size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                  </button>
                </div>

                {!collapsedBranches['storage'] && (
                  <div className="pl-4 border-l-2 border-dashed border-amber-500/25 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">minio_bucket</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">"{configData.storage.minio_bucket}"</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                      <span className="text-gray-500">minio_endpoint</span>
                      <span className="text-gray-400 italic">
                        {configData.storage.minio_endpoint ? `"${configData.storage.minio_endpoint}"` : '(Local SSD Storage Mode)'}
                      </span>
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
