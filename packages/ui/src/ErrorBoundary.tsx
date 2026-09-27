import { Component, type ErrorInfo, type ReactNode } from 'react'
import { UnexpectedErrorCanvas } from './UnexpectedErrorCanvas'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
  title?: string
  description?: string
  code?: string | number
  variant?: 'full-page' | 'card' | 'inline'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
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
    })
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback, title, description, code = '500', variant = 'card' } = this.props

    if (!hasError || !error) {
      return children
    }

    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback(error, this.handleReset)
      }
      return fallback
    }

    const defaultTitle = title || (variant === 'full-page' ? 'Đã xảy ra lỗi không mong muốn...' : 'Khu vực này tạm thời gián đoạn')
    const defaultDesc =
      description ||
      (variant === 'full-page'
        ? 'Hệ thống đã ghi nhận sự cố và bảo vệ phiên làm việc của bạn. Vui lòng thử tải lại hoặc quay về trang chủ.'
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
            <span className="font-semibold">{defaultTitle}</span>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-[#007b8b] hover:bg-[#00626f] text-white transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )
    }

    if (variant === 'full-page') {
      return (
        <UnexpectedErrorCanvas
          code={code}
          title={title}
          description={description}
          onReload={() => {
            this.handleReset()
            if (typeof window !== 'undefined') {
              window.location.reload()
            }
          }}
          onHome={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/'
            }
          }}
        />
      )
    }

    // Default: 'card' variant for embedded widgets & map regions
    return (
      <div className="w-full h-full min-h-[260px] rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] p-6 flex flex-col items-center justify-center text-center space-y-4 font-sans backdrop-blur-xs">
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

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={this.handleReset}
            className="px-5 py-2 rounded-full text-xs font-bold bg-[#007b8b] hover:bg-[#00626f] text-white dark:bg-[#00c4de] dark:hover:bg-[#38dbf1] dark:text-black transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            Thử lại module này
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary

