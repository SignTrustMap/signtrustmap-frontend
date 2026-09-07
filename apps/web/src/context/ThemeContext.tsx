import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  toggleTheme: (e?: React.MouseEvent) => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'signtrustmap_theme'

function updateDOMTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme
      }
    }
    return 'dark'
  })

  useEffect(() => {
    updateDOMTheme(theme)
  }, [theme])

  const toggleTheme = (e?: React.MouseEvent) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'

    if (
      typeof document === 'undefined' ||
      !('startViewTransition' in document) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      updateDOMTheme(nextTheme)
      setThemeState(nextTheme)
      return
    }

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2

    if (e) {
      const targetEl = (e.currentTarget || e.target) as HTMLElement | null
      if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
        const rect = targetEl.getBoundingClientRect()
        x = rect.left + rect.width / 2
        y = rect.top + rect.height / 2
      } else if (typeof e.clientX === 'number' && (e.clientX !== 0 || e.clientY !== 0)) {
        x = e.clientX
        y = e.clientY
      } else if (e.nativeEvent && typeof (e.nativeEvent as MouseEvent).clientX === 'number') {
        x = (e.nativeEvent as MouseEvent).clientX
        y = (e.nativeEvent as MouseEvent).clientY
      }
    }

    const xPercent = (x / window.innerWidth) * 100
    const yPercent = (y / window.innerHeight) * 100

    const maxDistanceX = Math.max(x, window.innerWidth - x)
    const maxDistanceY = Math.max(y, window.innerHeight - y)
    const maxRadius = Math.hypot(maxDistanceX, maxDistanceY)

    // Kháng lỗi HiDPI & màn hình scale (DPR) bằng cách nhân devicePixelRatio và thêm 5% buffer
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
    const exactEndRadius = Math.ceil(maxRadius * dpr * 1.05)

    const clipFrom = `circle(0px at ${xPercent}% ${yPercent}%)`
    const clipTo = `circle(${exactEndRadius}px at ${xPercent}% ${yPercent}%)`

    const transition = (document as unknown as {
      startViewTransition: (cb: () => void) => { ready: Promise<void> }
    }).startViewTransition(() => {
      updateDOMTheme(nextTheme)
      flushSync(() => {
        setThemeState(nextTheme)
      })
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [clipFrom, clipTo],
        },
        {
          duration: 750,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
  }

  const setTheme = (newTheme: Theme) => {
    updateDOMTheme(newTheme)
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
