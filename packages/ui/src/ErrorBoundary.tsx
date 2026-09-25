import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
  title?: string
  description?: string
  variant?: 'full-page' | 'card' | 'inline'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      showDetails: false,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[SignTrustMap ErrorBoundary] Uncaught exception intercepted:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.props.onReset?.()
    this.setState({
      hasError: false,
      error: null,
      showDetails: false,
    })
  }

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  render(): ReactNode {
    const { hasError, error, showDetails } = this.state
    const { children, fallback, title, description, variant = 'card' } = this.props

    if (!hasError || !error) {
      return children
    }

    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback(error, this.handleReset)
      }
      return fallback
    }

    const defaultTitle = title || (variant === 'full-page' ? 'Đã xảy ra lỗi không mong muốn' : 'Khu vực này tạm thời gián đoạn')
    const defaultDesc =
      description ||
      (variant === 'full-page'
        ? 'Hệ thống đã ghi nhận sự cố và bảo vệ phiên làm việc của bạn. Vui lòng thử tải lại hoặc liên hệ quản trị viên nếu sự cố tiếp diễn.'
        : 'Module hiển thị gặp lỗi xử lý dữ liệu. Các khu vực khác trên trang vẫn hoạt động bình thường.')

    if (variant === 'inline') {
      return (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="font-semibold">{error.message || defaultTitle}</span>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )
    }

    if (variant === 'full-page') {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8F7F7] dark:bg-[#030708] text-gray-900 dark:text-white font-sans">
          <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#071317] p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">{defaultTitle}</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{defaultDesc}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#007b8b] hover:bg-[#00626f] text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                Tải lại thành phần
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 dark:border-white/15 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 transition-all cursor-pointer"
              >
                Làm mới toàn trang
              </button>
            </div>

            {/* Error Message & Stack toggle */}
            <div className="pt-2 text-left">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="text-[11px] font-mono text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline cursor-pointer"
              >
                {showDetails ? 'Ẩn chi tiết kỹ thuật ▲' : 'Xem mã lỗi kỹ thuật ▼'}
              </button>
              {showDetails && (
                <div className="mt-2.5 p-3 rounded-xl bg-gray-100 dark:bg-black/60 border border-gray-200 dark:border-white/10 overflow-x-auto text-[11px] font-mono text-red-600 dark:text-red-400 max-h-40 scrollbar-thin">
                  <p className="font-bold">{error.name}: {error.message}</p>
                  {error.stack && <pre className="mt-1 text-[10px] text-gray-500 whitespace-pre-wrap">{error.stack}</pre>}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    // Default: 'card' variant for embedded widgets & map regions
    return (
      <div className="w-full h-full min-h-[260px] rounded-2xl border border-red-200/80 dark:border-red-900/30 bg-red-50/40 dark:bg-red-950/10 p-6 flex flex-col items-center justify-center text-center space-y-4 font-sans backdrop-blur-xs">
        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="space-y-1 max-w-md">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{defaultTitle}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{defaultDesc}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#007b8b] hover:bg-[#00626f] text-white transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            Thử lại module này
          </button>
          <button
            type="button"
            onClick={this.toggleDetails}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {showDetails ? 'Ẩn chi tiết' : 'Chi tiết lỗi'}
          </button>
        </div>

        {showDetails && (
          <div className="w-full max-w-lg mt-2 p-3 text-left rounded-xl bg-white dark:bg-black/60 border border-gray-200 dark:border-white/10 overflow-x-auto text-[11px] font-mono text-red-600 dark:text-red-400 max-h-36 scrollbar-thin">
            <p className="font-bold">{error.name}: {error.message}</p>
            {error.stack && <pre className="mt-1 text-[10px] text-gray-500 whitespace-pre-wrap">{error.stack}</pre>}
          </div>
        )}
      </div>
    )
  }
}

export default ErrorBoundary
