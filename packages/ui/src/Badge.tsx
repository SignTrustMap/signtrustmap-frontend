import type { FC, HTMLAttributes } from 'react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual color intent. Defaults to 'neutral'. */
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
  /** Sizing scale. Defaults to 'md'. */
  size?: 'sm' | 'md'
  /** Shows a subtle circular status dot before the content. */
  dot?: boolean
}

/**
 * Standard SignTrustMap Badge / Chip.
 * Enforces consistent radius (rounded-md / rounded-lg) and compact typographic line-height.
 */
export const Badge: FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[10px] font-mono px-2 py-0.5 rounded-md gap-1 font-bold',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-semibold',
  }[size]

  const variantClasses = {
    neutral:
      'bg-gray-100 text-gray-800 border-gray-200 dark:bg-white/10 dark:text-gray-200 dark:border-white/15',
    brand:
      'bg-teal-50 text-teal-800 border-teal-200 dark:bg-[#007b8b]/20 dark:text-[#00c4de] dark:border-[#00c4de]/30',
    success:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    warning:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    danger:
      'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    info:
      'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  }[variant]

  const dotColors = {
    neutral: 'bg-gray-400',
    brand: 'bg-[#007b8b] dark:bg-[#00c4de]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
  }[variant]

  return (
    <span
      className={`inline-flex items-center border shrink-0 transition-colors ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />}
      <span>{children}</span>
    </span>
  )
}

export default Badge
