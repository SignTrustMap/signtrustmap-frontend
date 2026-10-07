import { useEffect, useState, useRef, type ReactNode } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { CaretRight } from '@phosphor-icons/react'
import { PageHeader } from '@shared/ui'

export interface DocumentSection {
  id: string
  title: string
  content: string
  number?: string
}

export interface DocumentPageLayoutProps {
  title: string
  subtitle?: string
  badge?: ReactNode
  actions?: ReactNode
  tocTitle?: string
  sections: DocumentSection[]
  className?: string
}

export function DocumentPageLayout({
  title,
  subtitle,
  badge,
  actions,
  tocTitle = 'Mục lục',
  sections,
  className = '',
}: DocumentPageLayoutProps) {
  const { isDark } = useTheme()
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '')
  const isClickingRef = useRef(false)
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  // Sync activeSection if sections change or initializes
  useEffect(() => {
    if (sections.length > 0 && (!activeSection || !sections.some((s) => s.id === activeSection))) {
      setActiveSection(sections[0].id)
    }
  }, [sections, activeSection])

  // Smooth, high-precision ScrollSpy based on viewport visibility and reading focal point
  useEffect(() => {
    function handleScroll() {
      if (isClickingRef.current) return

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!sections.length) return

        // 1. Top of page edge case
        if (window.scrollY < 120) {
          setActiveSection(sections[0].id)
          return
        }

        // 2. Bottom of page edge case
        const isAtBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60
        if (isAtBottom) {
          setActiveSection(sections[sections.length - 1].id)
          return
        }

        // 3. Focal Zone & Visible Overlap Calculation
        const headerOffset = 100
        const viewportHeight = window.innerHeight
        const focalY = Math.min(320, viewportHeight * 0.35)

        let bestSectionId = sections[0].id
        let maxScore = -1

        for (let i = 0; i < sections.length; i++) {
          const el = document.getElementById(sections[i].id)
          if (!el) continue

          const rect = el.getBoundingClientRect()

          // Calculate visible overlap in viewport reading zone [headerOffset, viewportHeight]
          const visibleTop = Math.max(headerOffset, rect.top)
          const visibleBottom = Math.min(viewportHeight, rect.bottom)
          const visibleHeight = Math.max(0, visibleBottom - visibleTop)

          if (visibleHeight <= 0) continue

          // Base score: actual visible pixel height
          let score = visibleHeight

          // High-priority bonus: Section covers the natural reading focal line (~35% from top)
          if (rect.top <= focalY && rect.bottom >= focalY) {
            score += 400
          }

          // Ratio bonus: Proportion of the visible viewport occupied by this section
          const screenRatio = visibleHeight / (viewportHeight - headerOffset)
          score += screenRatio * 300

          if (score > maxScore) {
            maxScore = score
            bestSectionId = sections[i].id
          }
        }

        if (bestSectionId) {
          setActiveSection(bestSectionId)
        }
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
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }

    isClickingRef.current = true
    setActiveSection(id)

    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }

    clickTimeoutRef.current = setTimeout(() => {
      isClickingRef.current = false
    }, 850)
  }

  return (
    <div
      className={`w-full min-h-screen pt-6 sm:pt-8 pb-16 transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      } ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Sticky Table of Contents */}
          <aside className="lg:col-span-3 lg:sticky lg:top-[120px] self-start z-20">
            <div
              className={`rounded-2xl p-5 border max-h-[calc(100vh-140px)] overflow-y-auto transition-colors ${
                isDark ? 'bg-[#061417]/95 border-white/10' : 'bg-white/95 border-[#E8E4E3] shadow-sm'
              }`}
            >
              <p
                className={`text-xs font-mono font-bold uppercase tracking-widest mb-4 ${
                  isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                }`}
              >
                {tocTitle}
              </p>
              <nav className="flex flex-col gap-1">
                {sections.map((section) => {
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                        isActive
                          ? isDark
                            ? 'bg-[#007b8b]/20 text-[#00c4de] font-bold border border-[#00c4de]/30 shadow-xs'
                            : 'bg-teal-50 text-[#007b8b] font-bold border border-teal-200 shadow-xs'
                          : isDark
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <span className="truncate">{section.title}</span>
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
            </div>
          </aside>

          {/* Right Main Content */}
          <main className="lg:col-span-9">
            <PageHeader
              className="mb-10 text-left"
              badge={badge}
              title={title}
              subtitle={subtitle}
              actions={actions}
            />

            {/* Sections */}
            <div className="flex flex-col gap-8">
              {sections.map((section, idx) => {
                const isActive = activeSection === section.id
                const displayNumber = section.number || String(idx + 1).padStart(2, '0')
                return (
                  <div
                    id={section.id}
                    key={section.id}
                    className={`scroll-mt-32 rounded-2xl p-6 sm:p-8 border transition-all ${
                      isActive
                        ? isDark
                          ? 'bg-[#061417]/80 border-[#00c4de]/35 shadow-lg shadow-black/40 ring-1 ring-[#00c4de]/20'
                          : 'bg-white border-[#007b8b]/40 shadow-md ring-1 ring-[#007b8b]/15'
                        : isDark
                        ? 'bg-[#061417]/60 border-white/8 hover:border-white/15'
                        : 'bg-white border-[#E8E4E3] shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                          isActive
                            ? isDark
                              ? 'bg-[#00c4de] text-black font-extrabold shadow-sm'
                              : 'bg-[#007b8b] text-white font-extrabold shadow-sm'
                            : isDark
                            ? 'bg-[#007b8b]/30 text-[#00c4de]'
                            : 'bg-teal-100 text-[#007b8b]'
                        }`}
                      >
                        {displayNumber}
                      </div>
                      <div>
                        <h2
                          className={`text-lg sm:text-xl font-bold mb-3 tracking-tight ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {section.title}
                        </h2>
                        <div
                          className={`text-sm sm:text-base leading-relaxed space-y-3.5 ${
                            isDark ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {section.content.split('\n\n').map((paragraph, pIdx) => (
                            <p key={pIdx}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
export default DocumentPageLayout
