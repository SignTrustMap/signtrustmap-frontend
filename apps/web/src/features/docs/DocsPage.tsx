import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/context/ThemeContext'
import { BookOpen } from '@phosphor-icons/react'
import { DocumentPageLayout, type DocumentSection } from '@/components/common/DocumentPageLayout'

export default function DocsPage() {
  const { isDark } = useTheme()
  const { t } = useTranslation('docs')

  const sections = useMemo(
    () => (t('sections', { returnObjects: true }) as DocumentSection[]) || [],
    [t]
  )

  return (
    <DocumentPageLayout
      title={t('title')}
      subtitle={t('subtitle')}
      tocTitle={t('toc_title')}
      badge={
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-colors ${
            isDark
              ? 'bg-[#007b8b]/20 text-[#00c4de] border-[#00c4de]/25'
              : 'bg-teal-50 text-[#007b8b] border-teal-200'
          }`}
        >
          <BookOpen size={14} />
          <span>{t('last_updated')}: 2026</span>
        </div>
      }
      sections={sections}
    />
  )
}
