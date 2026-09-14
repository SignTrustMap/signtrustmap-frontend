import { CheckCircle, XCircle, Warning, Info, X } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationProps {
  message: string
  title?: string
  type?: NotificationType
  onClose?: () => void
  className?: string
}

/**
 * Standard Notification Toast Component used across apps/ops
 * Matches the unified Card Glassmorphism design system
 */
export function Notification({
  message,
  title,
  type = 'success',
  onClose,
  className = '',
}: NotificationProps) {
  const { t } = useTranslation('ops')
  let icon = <CheckCircle size={20} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
  let cardStyle =
    'bg-white/95 text-gray-900 border-emerald-300 dark:bg-[#061513]/95 dark:text-emerald-100 dark:border-emerald-500/40 shadow-xl shadow-black/10 dark:shadow-black/70'

  if (type === 'error') {
    icon = <XCircle size={20} weight="fill" className="text-rose-500 shrink-0 mt-0.5" />
    cardStyle =
      'bg-white/95 text-gray-900 border-rose-300 dark:bg-[#1a0808]/95 dark:text-rose-100 dark:border-rose-500/40 shadow-xl shadow-black/10 dark:shadow-black/70'
  } else if (type === 'warning') {
    icon = <Warning size={20} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
    cardStyle =
      'bg-white/95 text-gray-900 border-amber-300 dark:bg-[#191206]/95 dark:text-amber-100 dark:border-amber-500/40 shadow-xl shadow-black/10 dark:shadow-black/70'
  } else if (type === 'info') {
    icon = <Info size={20} weight="fill" className="text-[#007b8b] dark:text-[#00c4de] shrink-0 mt-0.5" />
    cardStyle =
      'bg-white/95 text-gray-900 border-cyan-300 dark:bg-[#071317]/95 dark:text-cyan-100 dark:border-[#00c4de]/40 shadow-xl shadow-black/10 dark:shadow-black/70'
  }

  return (
    <div
      role="alert"
      onClick={onClose}
      className={`fixed top-6 sm:top-20 right-6 sm:right-8 z-[9999] max-w-sm w-full group cursor-pointer rounded-2xl border p-3.5 sm:p-4 shadow-xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-top-3 duration-200 transition-all hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] select-none ${cardStyle} ${className}`}
      title={t('btn_close_notice')}
    >
      {icon}
      <div className="flex-1 min-w-0 pr-1">
        {title && (
          <h5 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight mb-0.5">
            {title}
          </h5>
        )}
        <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug break-words">
          {message}
        </p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="shrink-0 p-1 rounded-lg text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X size={14} weight="bold" />
        </button>
      )}
    </div>
  )
}
