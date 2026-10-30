import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/context/ThemeContext'
import { Printer, Scales } from '@phosphor-icons/react'
import { DocumentPageLayout, type DocumentSection } from '@/components/common/DocumentPageLayout'

export default function TermsPage() {
  const { isDark } = useTheme()
  const { t } = useTranslation('legal')

  const sections = useMemo(
    () => (t('terms.sections', { returnObjects: true }) as DocumentSection[]) || [],
    [t]
  )

  return (
    <DocumentPageLayout
      title={t('terms.title')}
      subtitle={t('terms.subtitle')}
      tocTitle={t('terms.toc_title')}
      badge={
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-colors ${
            isDark
              ? 'bg-[#007b8b]/20 text-[#00c4de] border-[#00c4de]/25'
              : 'bg-teal-50 text-[#007b8b] border-teal-200'
          }`}
        >
          <Scales size={14} />
          <span>{t('terms.last_updated')}</span>
        </div>
      }
      actions={
        <button
          type="button"
          onClick={() => window.print()}
          className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-300'
              : 'bg-white hover:bg-gray-100 border-[#E8E4E3] text-gray-700 shadow-xs'
          }`}
          title={t('terms.print_btn')}
        >
          <Printer size={15} />
        </button>
      }
      sections={sections}
    />
  )
}
