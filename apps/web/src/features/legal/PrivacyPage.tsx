import { useEffect, useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/context/ThemeContext'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Printer,
  LockKey,
  CaretRight,
  EyeSlash,
} from '@phosphor-icons/react'

interface LegalSection {
  id: string
  number: string
  title: string
  content: string
}

export default function PrivacyPage() {
  const { isDark } = useTheme()
  const { t } = useTranslation('legal')
  const [activeSection, setActiveSection] = useState<string>('collection')
  const isClickingRef = useRef(false)
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  const sections = useMemo(
    () => (t('privacy.sections', { returnObjects: true }) as LegalSection[]) || [],
    [t]
  )

  // Stable, high-precision ScrollSpy using viewport tracking
  useEffect(() => {
    function handleScroll() {
      if (isClickingRef.current) return

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const targetOffset = 180
        let current = sections[0]?.id || 'collection'

        for (let i = 0; i < sections.length; i++) {
          const el = document.getElementById(sections[i].id)
          if (el) {
            const rect = el.getBoundingClientRect()
            if (rect.top <= targetOffset) {
              current = sections[i].id
            }
          }
        }

        setActiveSection(current)
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
    }
  }, [sections])

  const scrollToSection = (id: string) => {
    // 1. Instantly cancel any pending scroll calculation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }

    // 2. Lock scrollspy and apply instantaneous active highlight
    isClickingRef.current = true
    setActiveSection(id)

    // 3. Smooth scroll natively respecting CSS scroll-margin-top
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }

    // 4. Release lock after smooth scroll settles
    clickTimeoutRef.current = setTimeout(() => {
      isClickingRef.current = false
    }, 850)
  }

  return (
    <div
      className={`w-full min-h-screen pt-6 sm:pt-8 pb-16 transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ─── Page Header ───────────────────────────────────────────── */}
        <div className="mb-8 text-left">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-2.5 transition-colors ${
              isDark
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-50 border border-emerald-300 text-emerald-700'
            }`}
          >
            <ShieldCheck size={16} weight="duotone" />
            <span>{t('privacy.badge')}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {t('privacy.title')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
                {t('privacy.subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-mono text-gray-400">
                {t('privacy.last_updated')}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-300'
                    : 'bg-white hover:bg-gray-100 border-[#E8E4E3] text-gray-700 shadow-xs'
                }`}
                title={t('privacy.print_btn')}
              >
                <Printer size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Main 2-Column Grid (Left: Sticky TOC, Right: Content) ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sticky Table of Contents Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-[120px] self-start z-20">
            <div
              className={`rounded-[18px] p-5 border shadow-sm transition-colors max-h-[calc(100vh-140px)] overflow-y-auto ${
                isDark ? 'bg-[#061417]/95 border-white/10' : 'bg-white/95 border-[#E8E4E3]'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <LockKey size={16} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  {t('privacy.toc_title')}
                </p>
              </div>

              <nav className="flex flex-col gap-1">
                {sections.map((sec) => {
                  const isActive = activeSection === sec.id
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150 flex items-center justify-between cursor-pointer ${
                        isActive
                          ? isDark
                            ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                          : isDark
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] text-gray-400 shrink-0">
                          {sec.number}
                        </span>
                        <span className="truncate">{sec.title}</span>
                      </div>
                      <CaretRight
                        size={12}
                        className={`shrink-0 transition-transform ${
                          isActive ? 'text-inherit translate-x-0.5' : 'text-gray-400 opacity-40'
                        }`}
                      />
                    </button>
                  )
                })}
              </nav>

              {/* Callout box inside TOC with i18n */}
              <div
                className={`mt-5 p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                  isDark
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <EyeSlash size={18} className="shrink-0 mt-0.5 text-emerald-500" />
                <span>{t('privacy.alert_anonymization')}</span>
              </div>
            </div>
          </aside>

          {/* Right Column: Detailed Legal Sections Content */}
          <div className="lg:col-span-8 space-y-6">
            {sections.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className={`scroll-mt-36 p-6 sm:p-7 rounded-[18px] border transition-all ${
                  isDark
                    ? 'bg-[#061417]/50 border-white/10 hover:border-white/20'
                    : 'bg-white border-[#E8E4E3] hover:border-gray-300 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-emerald-400'
                        : 'bg-gray-100 border-gray-200 text-emerald-700'
                    }`}
                  >
                    {sec.number}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight">
                    {sec.title}
                  </h2>
                </div>

                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-sans space-y-3.5">
                  {sec.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            {/* Bottom summary badge with i18n */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-white/[0.02] border-white/10 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>{t('privacy.copyright')}</span>
              </div>
              <Link
                to="/terms"
                className={`font-semibold hover:underline ${
                  isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                }`}
              >
                {t('privacy.view_terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
