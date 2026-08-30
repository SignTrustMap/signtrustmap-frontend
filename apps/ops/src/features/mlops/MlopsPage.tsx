import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Brain,
  ArrowsClockwise,
  Play,
  CheckCircle,
} from '@phosphor-icons/react'
import { mockTrainingRuns, type ModelRetrainingRun } from '@/data/adminGovernanceData'

export default function MlopsPage() {
  const { t, i18n } = useTranslation('ops')
  const isEn = i18n.language.startsWith('en')

  const [activeTab, setActiveTab] = useState<'pipeline' | 'retraining' | 'active-learning'>('retraining')
  const [trainingRuns, setTrainingRuns] = useState<ModelRetrainingRun[]>(mockTrainingRuns)
  const [isTriggering, setIsTriggering] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  function handleTriggerRetrain() {
    setIsTriggering(true)
    setTimeout(() => {
      const newRun: ModelRetrainingRun = {
        id: `RUN-2026-0${trainingRuns.length + 7}`,
        modelName: 'YOLO12-Detector',
        version: `yolo12-stm-v2.${trainingRuns.length + 2}`,
        triggeredBy: isEn ? 'Admin Manual Trigger' : 'Admin kích hoạt thủ công',
        startedAt: isEn ? 'Just now' : 'Vừa xong',
        duration: isEn ? 'Running...' : 'Đang xử lý...',
        trainingSamplesCount: 18200,
        metricBefore: 91.2,
        metricAfter: 93.5,
        metricGain: '+2.3%',
        status: 'Evaluating',
      }
      setTrainingRuns([newRun, ...trainingRuns])
      setIsTriggering(false)
      showToast(t('mlops.toast_triggered'))
    }, 1200)
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
            <Brain size={16} weight="bold" />
            <span>{t('mlops.tag')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t('mlops.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('mlops.subtitle')}
          </p>
        </div>

        <button
          type="button"
          disabled={isTriggering}
          onClick={handleTriggerRetrain}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {isTriggering ? <ArrowsClockwise size={18} className="animate-spin" /> : <Play size={18} weight="fill" />}
          <span>{t('mlops.btn_trigger')}</span>
        </button>
      </div>

      {toastMsg && (
        <div
          onClick={() => setToastMsg(null)}
          className="fixed top-20 right-8 z-50 bg-[#007b8b] text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#00606d] transition-all active:scale-95 select-none"
          title="Bấm để đóng thông báo"
        >
          <CheckCircle size={16} weight="bold" />
          <span>{toastMsg}</span>
          <span className="ml-2 text-white/70 hover:text-white text-xs font-bold font-sans">✕</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('retraining')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'retraining'
              ? 'bg-[#007b8b] text-white'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          {t('mlops.tab_history')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pipeline'
              ? 'bg-[#007b8b] text-white'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          {t('mlops.tab_pipeline')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('active-learning')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'active-learning'
              ? 'bg-[#007b8b] text-white'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          {t('mlops.tab_active_learning')}
        </button>
      </div>

      {/* Retraining Runs Table */}
      {activeTab === 'retraining' && (
        <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4 font-semibold">{t('mlops.th_run_id')}</th>
                  <th className="py-3 px-4 font-semibold">{t('mlops.th_model_version')}</th>
                  <th className="py-3 px-4 font-semibold">{t('mlops.th_triggered_by')}</th>
                  <th className="py-3 px-4 font-semibold">{t('mlops.th_samples')}</th>
                  <th className="py-3 px-4 font-semibold">{t('mlops.th_metric')}</th>
                  <th className="py-3 px-4 font-semibold text-center">{t('mlops.th_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {trainingRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">{run.id}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-purple-600 dark:text-purple-400">{run.modelName}</p>
                      <span className="font-mono text-gray-400 text-[11px]">{run.version}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      {run.triggeredBy}
                      <span className="block font-mono text-gray-400 text-[10px]">{run.startedAt} ({run.duration})</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-800 dark:text-gray-200">
                      {run.trainingSamplesCount.toLocaleString()} {isEn ? 'crops' : 'khung hình'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-gray-400">{run.metricBefore}%</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="font-bold text-emerald-600">{run.metricAfter}%</span>
                      <span className="ml-1.5 text-xs text-emerald-600 font-bold">({run.metricGain})</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        run.status === 'Active Deployed'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}>
                        {run.status === 'Active Deployed' ? t('mlops.status_active') : t('mlops.status_evaluating')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pipeline Monitor */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl space-y-2">
            <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.card_workers')}</span>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{t('mlops.card_workers_val')}</p>
            <p className="text-xs text-emerald-600 font-medium">{t('mlops.card_workers_desc')}</p>
          </div>
          <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl space-y-2">
            <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.card_tracking')}</span>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">18 Tasks</p>
            <p className="text-xs text-gray-400 font-medium">{t('mlops.card_tracking_desc')}</p>
          </div>
          <div className="p-5 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl space-y-2">
            <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('mlops.card_vector')}</span>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{t('mlops.card_vector_val')}</p>
            <p className="text-xs text-purple-600 font-medium">{t('mlops.card_vector_desc')}</p>
          </div>
        </div>
      )}

      {/* Active Learning Settings */}
      {activeTab === 'active-learning' && (
        <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {t('mlops.sec_al_title')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
              <label className="font-mono font-bold text-gray-400 uppercase">{t('mlops.lbl_uncertainty')}</label>
              <input
                type="text"
                defaultValue="Top-1 Conf - Top-2 Conf < 0.15"
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
              />
            </div>
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
              <label className="font-mono font-bold text-gray-400 uppercase">{t('mlops.lbl_min_samples')}</label>
              <input
                type="number"
                defaultValue={5000}
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
