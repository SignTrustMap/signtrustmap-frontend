import type React from 'react'

export interface UnexpectedErrorCanvasProps {
  /** Error status code to display prominently (e.g. 403, 404, 500) */
  code?: string | number
  /** Primary title of the error state */
  title?: string
  /** Explanatory description and recovery guidance */
  description?: string
  /**
   * Layout presentation variant:
   * - 'fullscreen': Full-bleed hero canvas designed for public Web Portal between Navbar & Footer.
   * - 'embedded': Viewport-bounded canvas designed to fit cleanly inside Ops AppShell next to Sidebar.
   * @default 'fullscreen'
   */
  layoutVariant?: 'fullscreen' | 'embedded'
  /**
   * Whether to render the 3D Wireframe mesh and ambient spotlight beam.
   * Set to `false` when embedded inside containers that already provide ambient wireframes (e.g. Ops AppShell).
   * @default true
   */
  showBackgroundMesh?: boolean
  /** Handler invoked when user clicks the Back button */
  onBack?: () => void
  /** Label for the Back button */
  backText?: string
  /** Whether to show the Back button */
  showBack?: boolean
  /** Handler invoked when user clicks the Reload button */
  onReload?: () => void
  /** Label for the Reload button */
  reloadText?: string
  /** Whether to show the Reload button */
  showReload?: boolean
  /** Destination URL for home navigation */
  homeUrl?: string
  /** Custom handler for home navigation (e.g. react-router navigate('/')) */
  onHome?: () => void
  /** Label for the Home button */
  homeText?: string
  /** Whether to show the Home button */
  showHome?: boolean
  /**
   * Explicitly designate which action receives primary emphasis styling (Cyan/Teal Gradient with shadow).
   * Defaults automatically based on error code:
   * - '403' -> 'back'
   * - '404' -> 'home'
   * - '500' -> 'reload'
   */
  primaryAction?: 'back' | 'home' | 'reload'
  /** Fully custom actions row component, completely replacing default button row */
  actions?: React.ReactNode
  /** Additional container classes */
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
 * Standardized Open Hero Canvas for application error states (403, 404, 500).
 * Implements the full-bleed Wireframe hero design per RULE.md Section 7.8 and Design System tokens.
 * Suppresses internal technical stack traces for user privacy and security.
 */
export function UnexpectedErrorCanvas({
  code = '500',
  title,
  description,
  layoutVariant = 'fullscreen',
  showBackgroundMesh = true,
  onBack,
  backText,
  showBack,
  onReload,
  reloadText,
  showReload,
  homeUrl = '/',
  onHome,
  homeText,
  showHome = true,
  primaryAction,
  actions,
  className,
}: UnexpectedErrorCanvasProps) {
  const isEn = resolveLanguage() === 'en'
  const codeStr = String(code)
  const is403 = codeStr === '403'
  const is404 = codeStr === '404'
  const is500 = codeStr === '500'

  // Localized fallbacks based on status code
  let defaultTitle = isEn ? 'Unexpected Error Occurred...' : 'Đã xảy ra lỗi không mong muốn...'
  let defaultDesc = isEn
    ? 'The system encountered an unexpected issue and protected your session. Please try reloading or return to the home page.'
    : 'Hệ thống đã ghi nhận sự cố và bảo vệ phiên làm việc của bạn. Vui lòng thử tải lại hoặc quay về trang chủ.'

  if (is403) {
    defaultTitle = isEn ? 'Access Restricted' : 'Khu Vực Hạn Chế Phân Quyền'
    defaultDesc = isEn
      ? 'The page you are trying to access requires elevated permissions. Please contact your system administrator.'
      : 'Trang bạn đang cố gắng truy cập bị giới hạn quyền hạn. Vui lòng liên hệ với quản trị viên hệ thống.'
  } else if (is404) {
    defaultTitle = isEn ? 'Page Not Found' : 'Không Tìm Thấy Trang'
    defaultDesc = isEn
      ? 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'
      : 'Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.'
  }

  const effectiveTitle = title ?? defaultTitle
  const effectiveDesc = description ?? defaultDesc
  const effectiveReloadText = reloadText || (isEn ? 'Reload Page' : 'Tải Lại Trang')
  const effectiveBackText = backText || (isEn ? 'Go Back' : 'Quay Lại')
  const effectiveHomeText = homeText || (isEn ? 'Return Home' : 'Về Trang Chủ')

  const determinedPrimary =
    primaryAction ||
    (is403 ? 'back' : is404 ? 'home' : 'reload')

  const shouldShowBack = showBack ?? (is403 || is404 || !!onBack)
  const shouldShowReload = showReload ?? (is500 || !!onReload)
  const shouldShowHome = showHome

  const handleReload = () => {
    if (onReload) {
      onReload()
    } else if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    }
  }

  const handleHomeClick = (e: React.MouseEvent) => {
    if (onHome) {
      e.preventDefault()
      onHome()
    }
  }

  const primaryBtnClass =
    'w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer text-white bg-[#007b8b] hover:bg-[#00606d] shadow-[#007b8b]/20 dark:text-black dark:bg-[#00c4de] dark:hover:bg-[#38dbf1] dark:shadow-[#00c4de]/25'

  const secondaryBtnClass =
    'w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-base backdrop-blur-md transition-all flex items-center justify-center gap-2 group cursor-pointer text-gray-800 bg-white hover:bg-gray-100 border border-gray-300 shadow-sm dark:text-white dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/15'

  const renderBackButton = (isPrimary: boolean) => (
    <button
      key="back-btn"
      type="button"
      onClick={handleBack}
      className={isPrimary ? primaryBtnClass : secondaryBtnClass}
    >
      <svg
        className={`w-5 h-5 ${isPrimary ? 'group-hover:-translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      <span>{effectiveBackText}</span>
    </button>
  )

  const renderReloadButton = (isPrimary: boolean) => (
    <button
      key="reload-btn"
      type="button"
      onClick={handleReload}
      className={isPrimary ? primaryBtnClass : secondaryBtnClass}
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
  )

  const renderHomeButton = (isPrimary: boolean) => (
    <a
      key="home-btn"
      href={homeUrl}
      onClick={handleHomeClick}
      className={isPrimary ? primaryBtnClass : secondaryBtnClass}
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
  )

  const renderButtons = () => {
    if (actions) return actions

    const buttonList: React.ReactNode[] = []

    if (determinedPrimary === 'back' && shouldShowBack) {
      buttonList.push(renderBackButton(true))
      if (shouldShowHome) buttonList.push(renderHomeButton(false))
      if (shouldShowReload) buttonList.push(renderReloadButton(false))
    } else if (determinedPrimary === 'home' && shouldShowHome) {
      buttonList.push(renderHomeButton(true))
      if (shouldShowBack) buttonList.push(renderBackButton(false))
      if (shouldShowReload) buttonList.push(renderReloadButton(false))
    } else if (determinedPrimary === 'reload' && shouldShowReload) {
      buttonList.push(renderReloadButton(true))
      if (shouldShowHome) buttonList.push(renderHomeButton(false))
      if (shouldShowBack) buttonList.push(renderBackButton(false))
    } else {
      // Fallback
      if (shouldShowReload) buttonList.push(renderReloadButton(true))
      if (shouldShowBack) buttonList.push(renderBackButton(false))
      if (shouldShowHome) buttonList.push(renderHomeButton(false))
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
        {buttonList}
      </div>
    )
  }

  const containerClasses = [
    'w-full flex-1 flex flex-col items-center justify-center relative overflow-hidden transition-colors px-4',
    layoutVariant === 'embedded'
      ? 'min-h-0 py-8 sm:py-12'
      : 'min-h-[calc(100vh-140px)] py-12 sm:py-16',
    showBackgroundMesh
      ? 'bg-[#F8F7F7] dark:bg-[#030708] text-gray-900 dark:text-white'
      : 'text-gray-900 dark:text-white',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClasses}>
      {showBackgroundMesh && (
        <div className="absolute inset-0 pointer-events-none z-0 select-none overflow-hidden">
          <img
            src="/images/hero-wireframe.jpg"
            alt="Terrain Wireframe"
            className="w-full h-full object-cover object-bottom translate-y-8 sm:translate-y-12 transition-all opacity-30 mix-blend-multiply filter invert hue-rotate-180 brightness-95 contrast-120 dark:opacity-45 dark:brightness-[0.8] dark:contrast-[1.2] dark:mix-blend-screen dark:filter-none"
          />

          {/* Overhead spotlight beam with soft glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] blur-[130px] bg-gradient-to-b from-[#007b8b]/20 via-[#d3f7ff]/35 to-transparent dark:from-[#00c4de]/20 dark:via-[#007b8b]/10 dark:to-transparent" />

          {/* Soft radial scrim behind text */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[480px] rounded-full blur-[110px] bg-[#F8F7F7]/30 dark:bg-[#030708]/30" />

          {/* Top and bottom gradient fades */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8F7F7]/70 via-transparent to-[#F8F7F7] dark:from-[#030708]/80 dark:via-transparent dark:to-[#030708]" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center flex flex-col items-center">
        {/* Large Typography Code (Aligned with Home Hero Trust text) */}
        <div className="relative mb-4 select-none">
          <h1 className="text-8xl sm:text-9xl md:text-[11rem] font-extrabold tracking-tight leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-[#007b8b] to-[#00c4de] dark:from-[#00c4de] dark:via-[#d3f7ff] dark:to-[#007b8b] dark:glow-cyan">
            {code}
          </h1>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
          {effectiveTitle}
        </h2>

        {/* Subtitle / Description */}
        <p className="text-base sm:text-lg font-medium max-w-lg mx-auto leading-relaxed mb-10 text-gray-700 dark:text-gray-200">
          {effectiveDesc}
        </p>

        {/* Dynamic Recovery Actions */}
        {renderButtons()}
      </div>
    </div>
  )
}

export default UnexpectedErrorCanvas
