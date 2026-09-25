import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flag,
  X,
  WarningCircle,
  EyeSlash,
  CameraRotate,
  MapPinLine,
  CopySimple,
  Prohibit,
  ShieldWarning,
  ChatText,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { Modal } from '@/components/common/Modal'
import type { FlagReasonCode } from '@/data'

interface FlagCandidateModalProps {
  isOpen: boolean
  onClose: () => void
  candidateId: string
  signCode: string
  onConfirmFlag: (reason: FlagReasonCode, notes: string) => void
}

interface ReasonOption {
  code: FlagReasonCode
  numKey: string
  labelKey: string
  descKey: string
  icon: typeof Flag
  color: string
}

export function FlagCandidateModal({
  isOpen,
  onClose,
  candidateId,
  signCode,
  onConfirmFlag,
}: FlagCandidateModalProps) {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()

  const [selectedReason, setSelectedReason] = useState<FlagReasonCode>('blurry_lighting')
  const [notes, setNotes] = useState('')

  const reasons: ReasonOption[] = [
    {
      code: 'blurry_lighting',
      numKey: '1',
      labelKey: 'reviewer.flag_reason_blurry',
      descKey: 'reviewer.flag_reason_blurry_desc',
      icon: EyeSlash,
      color: 'text-amber-400',
    },
    {
      code: 'obstructed',
      numKey: '2',
      labelKey: 'reviewer.flag_reason_obstructed',
      descKey: 'reviewer.flag_reason_obstructed_desc',
      icon: CameraRotate,
      color: 'text-amber-400',
    },
    {
      code: 'gps_spoofing',
      numKey: '3',
      labelKey: 'reviewer.flag_reason_gps',
      descKey: 'reviewer.flag_reason_gps_desc',
      icon: MapPinLine,
      color: 'text-red-400',
    },
    {
      code: 'duplicate',
      numKey: '4',
      labelKey: 'reviewer.flag_reason_duplicate',
      descKey: 'reviewer.flag_reason_duplicate_desc',
      icon: CopySimple,
      color: 'text-cyan-400',
    },
    {
      code: 'qcvn_non_compliant',
      numKey: '5',
      labelKey: 'reviewer.flag_reason_qcvn',
      descKey: 'reviewer.flag_reason_qcvn_desc',
      icon: Prohibit,
      color: 'text-orange-400',
    },
    {
      code: 'fraud_suspicious',
      numKey: '6',
      labelKey: 'reviewer.flag_reason_fraud',
      descKey: 'reviewer.flag_reason_fraud_desc',
      icon: ShieldWarning,
      color: 'text-rose-500',
    },
  ]

  // Keyboard navigation inside modal (1-6 to select, Enter to submit)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const matchingOption = reasons.find((r) => r.numKey === e.key)
      if (matchingOption) {
        setSelectedReason(matchingOption.code)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedReason, notes])

  const handleSubmit = () => {
    onConfirmFlag(selectedReason, notes.trim())
    setNotes('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl" topSpacing="pt-6 sm:pt-10 pb-8 sm:pb-12">
      <div
        className={`rounded-2xl border p-6 sm:p-7 space-y-5 shadow-2xl transition-colors text-left ${
          isDark
            ? 'bg-[#071317] border-white/10 text-gray-100 shadow-black/80'
            : 'bg-white border-[#E8E4E3] text-gray-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {candidateId}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                {signCode}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {t('reviewer.flag_modal_badge')}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
              <Flag size={20} className="text-amber-400 shrink-0" weight="fill" />
              <span>{t('reviewer.flag_modal_title')}</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('reviewer.flag_modal_subtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-white/10 hover:bg-white/10 text-gray-400 hover:text-white'
                : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Reason Selector Grid */}
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {reasons.map((item) => {
            const isSelected = selectedReason === item.code
            const IconComponent = item.icon

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setSelectedReason(item.code)}
                className={`w-full p-3.5 rounded-xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-[#00c4de]/15 border-[#00c4de]/60 text-white shadow-xs'
                      : 'bg-teal-50 border-[#007b8b] text-gray-900 shadow-xs'
                    : isDark
                    ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-gray-300'
                    : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100/70 text-gray-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-black/30' : 'bg-white/5'}`}>
                    <IconComponent size={18} className={item.color} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm">{t(item.labelKey)}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {t(item.descKey)}
                    </p>
                  </div>
                </div>

                <kbd
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 ${
                    isSelected
                      ? isDark
                        ? 'bg-[#00c4de] text-black'
                        : 'bg-[#007b8b] text-white'
                      : 'bg-black/20 text-gray-400'
                  }`}
                >
                  {item.numKey}
                </kbd>
              </button>
            )
          })}
        </div>

        {/* Additional Notes */}
        <div
          className={`p-3.5 rounded-xl border space-y-1.5 ${
            isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
          }`}
        >
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <ChatText size={14} className="text-[#00c4de]" />
            <span>{t('reviewer.flag_notes_label')}</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('reviewer.flag_notes_placeholder')}
            className={`w-full px-3 py-2 text-xs font-medium rounded-lg border outline-none resize-none transition-all ${
              isDark
                ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de]'
                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b]'
            }`}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-white/10">
          <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">
            {t('reviewer.flag_hotkey_tip')}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/10 hover:bg-white/5 text-gray-300'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-600'
              }`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-black shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <WarningCircle size={15} weight="bold" />
              <span>{t('reviewer.btn_confirm_flag')}</span>
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
