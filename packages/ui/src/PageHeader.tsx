import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
  bordered?: boolean
}

/**
 * PageHeader: Unified header component standardizing title typography
 * (text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight)
 * and action button alignment across web and ops pages according to RULE.md.
 */
export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
  bordered = false,
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        bordered ? 'pb-4 border-b border-gray-200 dark:border-white/10' : ''
      } ${className}`}
    >
      <div className="space-y-1">
        {badge && <div className="mb-2">{badge}</div>}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  )
}

export default PageHeader
