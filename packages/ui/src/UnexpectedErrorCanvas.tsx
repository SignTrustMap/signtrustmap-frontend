export interface UnexpectedErrorCanvasProps {
  title?: string
  description?: string
  code?: string | number
  onReload?: () => void
  onHome?: () => void
  homeUrl?: string
  reloadText?: string
  homeText?: string
  className?: string
}

function resolveLanguage(): 'en' | 'vi' {
  if (typeof window === 'undefined') return 'vi'
  try {
    const raw =
      localStorage.getItem('i18nextLng') ||
      localStorage.getItem('stm_language') ||
      localStorage.getItem('language') ||
      navigator.language ||
      'vi'
    return raw.toLowerCase().startsWith('en') ? 'en' : 'vi'
  } catch {
    return 'vi'
  }
}

/**
 * Standardized Open Hero Canvas for unexpected application and runtime errors (500).
 * Implements the full-bleed Wireframe hero design consistent with 403 & 404 pages per RULE.md Section 7.8.
 * Technical error codes and stack traces are suppressed for user privacy and security.
 */
export function UnexpectedErrorCanvas({
  title,
  description,
  code = '500',
  onReload,
  onHome,
  homeUrl = '/',
  reloadText,
  homeText,
  className,
}: UnexpectedErrorCanvasProps) {
  const isEn = resolveLanguage() === 'en'

  const effectiveTitle =
    title || (isEn ? 'Unexpected Error Occurred...' : 'Đã xảy ra lỗi không mong muốn...')
  const effectiveDesc =
    description ||
    (isEn
      ? 'The system encountered an unexpected issue and protected your session. Please try reloading or return to the home page.'
      : 'Hệ thống đã ghi nhận sự cố và bảo vệ phiên làm việc của bạn. Vui lòng thử tải lại hoặc quay về trang chủ.')
  const effectiveReloadText = reloadText || (isEn ? 'Reload Page' : 'Tải Lại Trang')
  const effectiveHomeText = homeText || (isEn ? 'Return Home' : 'Về Trang Chủ')

  const handleReload = () => {
    if (onReload) {
      onReload()
    } else {
      window.location.reload()
    }
  }

  return (
    <div
      className={`w-full flex-1 min-h-[calc(100vh-140px)] flex flex-col items-center justify-center relative overflow-hidden transition-colors px-4 py-12 sm:py-16 bg-[#F8F7F7] dark:bg-[#030708] text-gray-900 dark:text-white ${
        className || ''
      }`}
    >
      <div className="absolute inset-0 pointer-events-none z-0 select-none overflow-hidden">
        <img
          src="/images/hero-wireframe.jpg"
          alt="Terrain Wireframe"
          className="w-full h-full object-cover object-bottom translate-y-8 sm:translate-y-12 transition-all opacity-30 mix-blend-multiply filter invert hue-rotate-180 brightness-95 contrast-120 dark:opacity-45 dark:brightness-[0.8] dark:contrast-[1.2] dark:mix-blend-screen dark:filter-none"
        />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] blur-[130px] bg-gradient-to-b from-[#007b8b]/20 via-[#d3f7ff]/35 to-transparent dark:from-[#00c4de]/20 dark:via-[#007b8b]/10 dark:to-transparent" />

        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[480px] rounded-full blur-[110px] bg-[#F8F7F7]/30 dark:bg-[#030708]/30" />

        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F7F7]/70 via-transparent to-[#F8F7F7] dark:from-[#030708]/80 dark:via-transparent dark:to-[#030708]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center flex flex-col items-center">
        <div className="relative mb-4 select-none">
          <h1 className="text-8xl sm:text-9xl md:text-[11rem] font-extrabold tracking-tight leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-[#007b8b] to-[#00c4de] dark:from-[#00c4de] dark:via-[#d3f7ff] dark:to-[#007b8b] dark:glow-cyan">
            {code}
          </h1>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
          {effectiveTitle}
        </h2>

        <p className="text-base sm:text-lg font-medium max-w-lg mx-auto leading-relaxed mb-10 text-gray-700 dark:text-gray-200">
          {effectiveDesc}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReload}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer text-white bg-[#007b8b] hover:bg-[#00606d] shadow-[#007b8b]/20 dark:text-black dark:bg-[#00c4de] dark:hover:bg-[#38dbf1] dark:shadow-[#00c4de]/25"
          >
            <svg
              className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            <span>{effectiveReloadText}</span>
          </button>

          <a
            href={homeUrl}
            onClick={
              onHome
                ? (e) => {
                    e.preventDefault()
                    onHome()
                  }
                : undefined
            }
            className="w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-base backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer text-gray-800 bg-white hover:bg-gray-100 border border-gray-300 shadow-sm dark:text-white dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/15"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>{effectiveHomeText}</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default UnexpectedErrorCanvas
