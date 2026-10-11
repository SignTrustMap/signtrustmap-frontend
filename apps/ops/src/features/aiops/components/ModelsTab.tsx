import { useTranslation } from 'react-i18next'
import { CircleNotch, FileCode } from '@phosphor-icons/react'
import type { ModelsResponse } from '@/api/services/aiops.service'

interface ModelsTabProps {
  modelsData: ModelsResponse | null
  modelsLoading: boolean
  modelsSubTab: 'detectors' | 'classifiers'
  setModelsSubTab: React.Dispatch<React.SetStateAction<'detectors' | 'classifiers'>>
}

export function ModelsTab({
  modelsData,
  modelsLoading,
  modelsSubTab,
  setModelsSubTab,
}: ModelsTabProps) {
  const { t } = useTranslation('ops')

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.models_kpi_detectors')}</span>
          <p className="text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
            {modelsData?.total_detectors ?? 10} Weights
          </p>
          <p className="text-xs text-gray-500">{t('mlops.models_kpi_detectors_desc')}</p>
        </div>

        <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.models_kpi_classifiers')}</span>
          <p className="text-3xl font-extrabold font-mono text-[#007b8b] dark:text-[#00c4de]">
            {modelsData?.total_classifiers ?? 4} Weights
          </p>
          <p className="text-xs text-gray-500">{t('mlops.models_kpi_classifiers_desc')}</p>
        </div>

        <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.models_kpi_engine')}</span>
          <p className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            TensorRT 10.3
          </p>
          <p className="text-xs text-gray-500">{t('mlops.models_kpi_engine_desc')}</p>
        </div>
      </div>

      {/* Models Table Container */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        {/* Sub-tabs header */}
        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 dark:bg-white/2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModelsSubTab('detectors')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                modelsSubTab === 'detectors'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {t('mlops.models_detectors')} ({modelsData?.total_detectors ?? 10})
            </button>

            <button
              type="button"
              onClick={() => setModelsSubTab('classifiers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                modelsSubTab === 'classifiers'
                  ? 'bg-[#007b8b] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {t('mlops.models_classifiers')} ({modelsData?.total_classifiers ?? 4})
            </button>
          </div>

          <div className="text-xs text-gray-400 font-mono">
            {t('mlops.models_storage_path')} <strong className="text-gray-700 dark:text-gray-200">/media/taiduc_orico_ssd/weights</strong>
          </div>
        </div>

        {modelsLoading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <CircleNotch size={28} className="animate-spin text-[#007b8b]" />
            <span className="text-xs font-mono">{t('mlops.models_loading')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">{t('mlops.models_th_filename')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('mlops.models_th_format')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('mlops.models_th_size')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('mlops.models_th_modified')}</th>
                  <th className="py-3.5 px-4 font-semibold text-center">{t('mlops.models_th_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {(modelsSubTab === 'detectors' ? modelsData?.detectors : modelsData?.classifiers)?.map((m, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileCode size={16} className="text-gray-400" />
                      <span>{m.filename}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                          m.format === 'engine'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : m.format === 'onnx'
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-[#00c4de] border border-cyan-500/30'
                            : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {m.format}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-gray-800 dark:text-gray-200">
                      {m.size_human}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                      {m.modified_at}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          m.is_loaded
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                        }`}
                      >
                        {m.is_loaded ? t('mlops.models_status_loaded') : t('mlops.models_status_standby')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
