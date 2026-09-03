import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  CheckCircle,
  CircleNotch,
  WarningCircle,
  Plus,
  Coins,
  Cpu,
  VideoCamera,
  MapPin,
  ArrowRight,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { mockSurveySubmissions, type SurveySubmissionItem } from '@/data'

export default function SurveyHistoryPage() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const [submissions] = useState<SurveySubmissionItem[]>(mockSurveySubmissions)
  const [selectedSub, setSelectedSub] = useState<SurveySubmissionItem>(mockSurveySubmissions[0])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return {
          label: t('survey.status_completed'),
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle size={14} />,
        }
      case 'Processing':
        return {
          label: t('survey.status_processing'),
          bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
          icon: <CircleNotch size={14} className="animate-spin" />,
        }
      case 'PartiallyProcessed':
        return {
          label: t('survey.status_partial'),
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: <WarningCircle size={14} />,
        }
      default:
        return {
          label: t('survey.status_queued'),
          bg: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
          icon: <Clock size={14} />,
        }
    }
  }

  return (
    <div
      className={`min-h-screen pt-6 sm:pt-8 pb-16 px-4 sm:px-6 lg:px-8 transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold bg-[#00c4de]/10 text-[#00c4de] border border-[#00c4de]/20 mb-3">
              <Cpu size={16} />
              <span>Telemetry Processing Monitor</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t('survey.history_title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              {t('survey.history_subtitle')}
            </p>
          </div>

          <Link
            to="/survey"
            className={`px-5 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-md flex items-center gap-2.5 cursor-pointer shrink-0 ${
              isDark
                ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
            }`}
          >
            <Plus size={18} />
            <span>{t('survey.btn_new_survey')}</span>
          </Link>
        </div>

        {/* Live Pipeline Step Visualizer for Selected Trip */}
        {selectedSub && (
          <div
            className={`mb-10 p-6 sm:p-8 rounded-[28px] border shadow-xl ${
              isDark ? 'bg-[#061417]/95 border-white/10' : 'bg-white border-gray-200 shadow-gray-200/60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-mono uppercase font-bold text-gray-400 block mb-1 tracking-wider">{t('survey.active_stream')}</span>
                <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2.5">
                  <span>{selectedSub.tripName}</span>
                  <span className="text-sm font-mono text-gray-400">({selectedSub.id})</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs sm:text-sm font-bold px-3.5 py-1 rounded-full border flex items-center gap-2 ${getStatusBadge(selectedSub.status).bg}`}>
                  {getStatusBadge(selectedSub.status).icon}
                  <span>{getStatusBadge(selectedSub.status).label}</span>
                </span>
              </div>
            </div>

            {/* 5-Stage Pipeline Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
              {[
                { stage: t('survey.step_1'), desc: t('survey.step_1_desc'), active: true, done: true },
                { stage: t('survey.step_2'), desc: t('survey.step_2_desc'), active: true, done: true },
                { stage: t('survey.step_3'), desc: t('survey.step_3_desc'), active: true, done: selectedSub.progressPercent >= 60 },
                { stage: t('survey.step_4'), desc: t('survey.step_4_desc'), active: selectedSub.progressPercent >= 60, done: selectedSub.progressPercent >= 80 },
                { stage: t('survey.step_5'), desc: t('survey.step_5_desc'), active: selectedSub.progressPercent >= 80, done: selectedSub.status === 'Completed' },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    step.done
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : step.active
                      ? isDark
                        ? 'bg-[#00c4de]/10 border-[#00c4de]/40 text-[#00c4de] animate-pulse'
                        : 'bg-[#007b8b]/10 border-[#007b8b]/40 text-[#007b8b]'
                      : isDark
                      ? 'bg-white/5 border-white/10 text-gray-400 opacity-60'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs sm:text-sm font-bold">{step.stage}</span>
                    {step.done ? <CheckCircle size={16} /> : step.active ? <CircleNotch size={16} className="animate-spin" /> : <Clock size={16} />}
                  </div>
                  <span className="text-xs block opacity-80">{step.desc}</span>
                </div>
              ))}
            </div>

            {/* Result summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 text-sm">
              <div>
                <span className="text-xs text-gray-400 block mb-1">{t('survey.detected_count')}</span>
                <span className="font-extrabold text-lg text-cyan-400">{selectedSub.detectedSignsCount}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">{t('survey.validated_count')}</span>
                <span className="font-extrabold text-lg text-emerald-400">{selectedSub.validatedSignsCount}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">{t('survey.reward_earned')}</span>
                <span className="font-extrabold text-lg text-amber-400 flex items-center gap-1.5">
                  <Coins size={18} />
                  +{selectedSub.rewardCredits} Credits
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">{t('survey.upload_time')}</span>
                <span className="font-mono text-gray-300 font-semibold">{selectedSub.uploadDate}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submissions Table / List */}
        <div
          className={`rounded-[28px] border shadow-xl overflow-hidden ${
            isDark ? 'bg-[#061417]/90 border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`p-5 sm:p-6 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
            <h2 className="text-base sm:text-lg font-bold">{t('survey.history_list_title')}</h2>
            <span className="text-sm text-gray-400 font-medium">{submissions.length}</span>
          </div>

          <div className="divide-y divide-white/5 overflow-x-auto">
            {submissions.map((sub) => {
              const badge = getStatusBadge(sub.status)
              const isSelected = selectedSub.id === sub.id

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-colors cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-white/10'
                        : 'bg-gray-100'
                      : isDark
                      ? 'hover:bg-white/5'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl border mt-0.5 ${
                      sub.mediaType === 'video_gpx'
                        ? isDark ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
                        : isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {sub.mediaType === 'video_gpx' ? <VideoCamera size={24} /> : <MapPin size={24} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-bold text-base sm:text-lg">{sub.tripName}</h4>
                        <span className="text-xs font-mono text-gray-400">#{sub.id}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{sub.route}</p>
                      <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-400 mt-2 font-mono">
                        <span>{sub.fileSizeMb} MB</span>
                        <span>•</span>
                        <span>{sub.detectedSignsCount}</span>
                        <span>•</span>
                        <span>{sub.uploadDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5">
                    <span className="text-sm sm:text-base font-extrabold text-amber-400 flex items-center gap-1.5">
                      <Coins size={18} />
                      +{sub.rewardCredits} Credits
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-cyan-400 flex items-center gap-1">
                      <span>{t('survey.inspect_telemetry')}</span>
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
