import {
  useState,
  useEffect,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  children?: ReactNode
}

/**
 * Size mapping dictionary conforming to SignTrustMap Design System
 */
const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 sm:w-28 sm:h-28 text-2xl sm:text-3xl',
}

/**
 * Avatar Root Container (Shadcn pattern)
 */
export function Avatar({
  size = 'md',
  className = '',
  children,
  ...props
}: AvatarProps) {
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold select-none ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export interface AvatarImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  onStatusChange?: (status: 'loading' | 'loaded' | 'error') => void
}

/**
 * Avatar Image with automatic error fallback detection (Shadcn pattern)
 */
export function AvatarImage({
  src,
  alt = '',
  className = '',
  onError,
  onLoad,
  ...props
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(!src)

  useEffect(() => {
    setHasError(!src)
  }, [src])

  if (hasError || !src) {
    return null
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={(e) => {
        setHasError(true)
        onError?.(e)
      }}
      onLoad={(e) => {
        setHasError(false)
        onLoad?.(e)
      }}
      className={`h-full w-full object-cover object-center ${className}`}
      {...props}
    />
  )
}

export interface AvatarFallbackProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

/**
 * Avatar Fallback displayed when image is missing or fails to load (Shadcn pattern)
 */
export function AvatarFallback({
  className = '',
  children,
  ...props
}: AvatarFallbackProps) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-linear-to-tr from-[#007b8b]/20 to-[#00c4de]/25 text-[#007b8b] dark:text-[#00c4de] dark:bg-[#00c4de]/15 font-mono uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Utility helper to extract 1-2 initials from full name or email address
 * Examples:
 * - "Nguyễn Văn A" -> "NA"
 * - "Lương Minh Nhật" -> "LN"
 * - "John" -> "JO"
 * - "driver@signtrustmap.com" -> "DR"
 */
export function getInitials(nameOrEmail?: string | null, fallback: string = 'U'): string {
  if (!nameOrEmail || !nameOrEmail.trim()) return fallback

  const clean = nameOrEmail.trim()
  const base = clean.includes('@') ? clean.split('@')[0] : clean
  const words = base.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) return fallback
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
