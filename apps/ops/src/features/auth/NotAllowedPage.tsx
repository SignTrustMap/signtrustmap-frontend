import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useTranslation } from 'react-i18next'
import { LockKey, ArrowLeft, EnvelopeSimple } from '@phosphor-icons/react'

export default function NotAllowedPage() {
  const { user } = useAuth()
  const { t } = useTranslation('ops')

  return (
    <div className="min-h-[100dvh] bg-[#F8F7F7] dark:bg-[#030708] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-[16px] bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <LockKey size={32} weight="duotone" className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('not_allowed.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {t('not_allowed.desc')}
        </p>
        {user && (
          <p className="text-xs text-gray-400 mb-6 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-[8px] px-4 py-2 inline-block">
            {t('not_allowed.account')}: <span className="font-medium text-gray-600 dark:text-gray-300">{user.email}</span>{' '}
            <span className="text-[#007b8b] dark:text-[#00c4de]">({user.role})</span>
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
          <Link
            to="/map"
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-[#E8E4E3] dark:border-white/15 rounded-lg hover:bg-white dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={14} />
            {t('not_allowed.btn_back')}
          </Link>
          <a
            href="mailto:admin@signtrustmap.site"
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#007b8b] rounded-lg hover:bg-[#006272] transition-colors"
          >
            <EnvelopeSimple size={14} />
            {t('not_allowed.btn_contact')}
          </a>
        </div>
      </div>
    </div>
  )
}
