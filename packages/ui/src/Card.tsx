import { forwardRef, type HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual presentation style. */
  variant?: 'default' | 'elevated' | 'glass' | 'subtle'
  /** Internal padding scale. Defaults to 'md' (p-5 sm:p-6). */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Corner radius tier. Defaults to 'lg' (rounded-2xl). */
  radius?: 'md' | 'lg' | 'xl'
  /** Enables hover elevation and accent border highlighting. */
  interactive?: boolean
}

/**
 * Standard SignTrustMap Surface Container (Card).
 * Enforces uniform border radiuses (rounded-xl / rounded-2xl / rounded-3xl)
 * and harmonic spacing across web and ops applications.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      radius = 'lg',
      interactive = false,
      className = '',
      ...props
    },
    ref
  ) => {
    // 1. Padding tier
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
    }[padding]

    // 2. Corner radius tier
    const radiusClasses = {
      md: 'rounded-xl',
      lg: 'rounded-2xl',
      xl: 'rounded-3xl',
    }[radius]

    // 3. Variant theme styles
    const variantClasses = {
      default:
        'bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 shadow-xs text-gray-900 dark:text-gray-100',
      elevated:
        'bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/15 shadow-lg shadow-black/5 dark:shadow-black/40 text-gray-900 dark:text-gray-100',
      glass:
        'bg-white/80 dark:bg-[#071317]/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl text-gray-900 dark:text-gray-100',
      subtle:
        'bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100',
    }[variant]

    const interactiveClasses = interactive
      ? 'hover:border-[#007b8b] dark:hover:border-[#00c4de] hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5'
      : 'transition-colors'

    return (
      <div
        ref={ref}
        className={`${radiusClasses} ${paddingClasses} ${variantClasses} ${interactiveClasses} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
export default Card
