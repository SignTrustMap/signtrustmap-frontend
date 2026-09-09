import { useTranslation } from 'react-i18next'
import { useTheme } from '@/context/ThemeContext'
import { BookOpen, CaretRight } from '@phosphor-icons/react'

interface DocSection {
  id: string
  title: string
  content: string
}

export default function Docs() {
  const { isDark } = useTheme()
  const { t } = useTranslation('docs')

  const sections = t('sections', { returnObjects: true }) as DocSection[]

  return (
    <div
      className={`w-full min-h-screen pt-6 sm:pt-8 pb-16 transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Left TOC */}
          <aside className="lg:col-span-3 lg:sticky lg:top-[120px] self-start z-20">
            <div
              className={`rounded-[18px] p-5 border max-h-[calc(100vh-140px)] overflow-y-auto ${
                isDark ? 'bg-[#061417]/95 border-white/10' : 'bg-white/95 border-[#E8E4E3] shadow-sm'
              }`}
            >
              <p
                className={`text-xs font-mono font-bold uppercase tracking-widest mb-4 ${
                  isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                }`}
              >
                {t('toc_title')}
              </p>
              <ul className="flex flex-col gap-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm transition-colors ${
                        isDark
                          ? 'text-gray-400 hover:text-[#00c4de] hover:bg-white/5'
                          : 'text-gray-600 hover:text-[#007b8b] hover:bg-gray-100'
                      }`}
                    >
                      <CaretRight size={12} className="shrink-0" />
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Right Content */}
          <main className="lg:col-span-9">
            {/* Page Header */}
            <div className="mb-10">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold border mb-4 ${
                  isDark
                    ? 'bg-[#007b8b]/20 text-[#00c4de] border-[#00c4de]/25'
                    : 'bg-teal-50 text-[#007b8b] border-teal-200'
                }`}
              >
                <BookOpen size={14} />
                {t('last_updated')}: 2026
              </div>
              <h1
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {t('title')}
              </h1>
              <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('subtitle')}
              </p>
            </div>

            {/* Sections */}
            <div className="flex flex-col gap-8">
              {sections.map((section, idx) => (
                <div
                  id={section.id}
                  key={section.id}
                  className={`rounded-[18px] p-6 sm:p-8 border transition-all ${
                    isDark
                      ? 'bg-[#061417]/60 border-white/8 hover:border-white/15'
                      : 'bg-white border-[#E8E4E3] shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                        isDark
                          ? 'bg-[#007b8b]/30 text-[#00c4de]'
                          : 'bg-teal-100 text-[#007b8b]'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h2
                        className={`text-lg sm:text-xl font-bold mb-3 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {section.title}
                      </h2>
                      <p
                        className={`text-sm sm:text-base leading-relaxed ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        {section.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
