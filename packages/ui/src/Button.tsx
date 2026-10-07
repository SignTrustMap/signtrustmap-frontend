import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { CircleNotch } from '@phosphor-icons/react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual hierarchy variant. Defaults to 'primary'. */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  /** Standard size tier enforcing height, padding, font-size, and radius. */
  size?: 'sm' | 'md' | 'lg'
  /** Shows loading spinner and disables user interaction. */
  isLoading?: boolean
  /** Icon element placed before the label text. */
  leftIcon?: ReactNode
  /** Icon element placed after the label text. */
  rightIcon?: ReactNode
  /** Full-width button spanning 100% of container. */
  fullWidth?: boolean
}

/**
 * Standard SignTrustMap Button Primitive.
 * Enforces design system height tokens (32px / 40px / 48px) and consistent corner radiuses.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // 1. Size scale (strictly enforces height and radius tokens)
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg font-semibold',
      md: 'h-10 px-4 text-sm gap-2 rounded-xl font-bold',
      lg: 'h-12 px-5 text-base gap-2.5 rounded-xl font-bold',
    }[size]

    // 2. Variant styles
    const variantClasses = {
      primary:
        'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-xs active:scale-[0.98] dark:bg-[#00c4de] dark:text-[#030708] dark:hover:bg-[#38dbf1]',
      secondary:
        'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15',
      outline:
        'border border-gray-300 dark:border-white/15 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 shadow-xs',
      ghost:
        'bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-xs active:scale-[0.98]',
    }[variant]

    const baseClasses =
      'inline-flex items-center justify-center transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007b8b]/40 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed'

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <CircleNotch size={size === 'sm' ? 14 : 16} className="animate-spin" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
