import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface PlaceholderPageProps {
  title: string
  description?: string
  icon?: ReactNode
}

export default function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  const { t } = useTranslation('common')
  const displayDesc = description || t('placeholder_desc', 'Feature under active development.')

  return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="w-12 h-12 rounded-[12px] bg-[#d3f7ff] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Public Sans, sans-serif' }}>
          {title}
        </h2>
        <p className="text-xs text-gray-400">{displayDesc}</p>
      </div>
    </div>
  )
}
