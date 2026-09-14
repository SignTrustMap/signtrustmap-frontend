import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * PageHeader: Unified header component across all Admin & Staff operational pages.
 * Standardizes title typography (text-2xl sm:text-3xl font-bold tracking-tight)
 * and action button alignment across the entire ops portal.
 */
export function PageHeader({
  title,
  actions,
  children,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
        {title}
      </h1>
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
