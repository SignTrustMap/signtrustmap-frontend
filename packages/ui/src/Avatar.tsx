import {
  createContext,
  useContext,
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

type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface AvatarContextValue {
  status: ImageLoadingStatus
  setStatus: (status: ImageLoadingStatus) => void
}

const AvatarContext = createContext<AvatarContextValue | null>(null)

/**
 * Size mapping dictionary conforming to SignTrustMap Design System
 */
const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-28 h-28 text-2xl',
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
  const [status, setStatus] = useState<ImageLoadingStatus>('idle')

  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <div
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold select-none aspect-square ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    </AvatarContext.Provider>
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
  onStatusChange,
  ...props
}: AvatarImageProps) {
  const context = useContext(AvatarContext)

  useEffect(() => {
    if (!src) {
      context?.setStatus('error')
      onStatusChange?.('error')
      return
    }

    // Check if the image has already finished loading (cached)
    const img = new Image()
    img.src = src
    if (img.complete && img.naturalWidth > 0) {
      context?.setStatus('loaded')
      onStatusChange?.('loaded')
      return
    }

    context?.setStatus('loading')
    onStatusChange?.('loading')
  }, [src])

  if (!src || context?.status === 'error') {
    return null
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={(e) => {
        context?.setStatus('error')
        onStatusChange?.('error')
        onError?.(e)
      }}
      onLoad={(e) => {
        context?.setStatus('loaded')
        onStatusChange?.('loaded')
        onLoad?.(e)
      }}
      className={`absolute inset-0 h-full w-full object-cover object-center ${className}`}
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
  const context = useContext(AvatarContext)

  // When image loads successfully, do not render fallback to prevent overlapping/side-by-side flex issues
  if (context && context.status === 'loaded') {
    return null
  }

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
