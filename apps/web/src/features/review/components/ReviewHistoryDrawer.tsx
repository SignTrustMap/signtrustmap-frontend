import { useTranslation } from 'react-i18next'
import {
  ClockCounterClockwise,
  X,
  ArrowUUpLeft,
  CheckCircle,
  XCircle,
  PencilSimple,
  Flag,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import type { ReviewHistoryItem } from '@/data'

interface ReviewHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  historyItems: ReviewHistoryItem[]
  onUndo: (item: ReviewHistoryItem) => void
}

export function ReviewHistoryDrawer({
  isOpen,
  onClose,
  historyItems,
  onUndo,
}: ReviewHistoryDrawerProps) {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()

  if (!isOpen) return null

  const getActionBadge = (action: ReviewHistoryItem['action']) => {
    switch (action) {
      case 'Approved':
      case 'Confirmed':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle size={12} weight="bold" />
            <span>{action}</span>
          </span>
        )
      case 'Rejected':
      case 'Retired':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
            <XCircle size={12} weight="bold" />
            <span>{action}</span>
          </span>
        )
      case 'Corrected':
      case 'Updated':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-500/15 text-[#00c4de] border border-[#00c4de]/30 flex items-center gap-1">
            <PencilSimple size={12} weight="bold" />
            <span>{action}</span>
          </span>
        )
      case 'Flagged':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Flag size={12} weight="bold" />
            <span>{action}</span>
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30">
            {action}
          </span>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-md border-l shadow-2xl flex flex-col transition-colors ${
            isDark ? 'bg-[#071317] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockCounterClockwise size={20} className="text-[#00c4de]" />
              <h3 className="font-extrabold text-base sm:text-lg">{t('reviewer.history_title')}</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10">
                {historyItems.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {historyItems.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-xs">
                <ClockCounterClockwise size={36} className="mx-auto mb-2 opacity-40" />
                <p>{t('reviewer.history_empty')}</p>
              </div>
            ) : (
              historyItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#00c4de]">
                        {item.candidateId}
                      </span>
                      <span className="font-mono text-xs text-gray-400 font-semibold">
                        {item.signCode}
                      </span>
                    </div>
                    {getActionBadge(item.action)}
                  </div>

                  <p className="text-xs font-bold truncate text-gray-900 dark:text-gray-100 mb-1">
                    {item.signName}
                  </p>

                  {item.details && (
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                      {item.details}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/5 text-[10px] text-gray-600 dark:text-gray-400 font-mono">
                    <span>{item.timestamp}</span>

                    {idx === 0 && (
                      <button
                        type="button"
                        onClick={() => onUndo(item)}
                        className="flex items-center gap-1 text-[#007b8b] dark:text-[#00c4de] hover:underline font-bold cursor-pointer"
                      >
                        <ArrowUUpLeft size={12} />
                        <span>{t('reviewer.btn_undo')}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
