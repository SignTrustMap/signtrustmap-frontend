import { type ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ModalPortalProps {
  children: ReactNode
  lockScroll?: boolean
}

/**
 * ModalPortal: Renders modal dialogs and their backdrops directly into document.body
 * to guarantee that the backdrop covers the entire viewport (100% full screen),
 * including the Sidebar (both expanded and collapsed) and the Topbar, preventing
 * stacking context trapping and rogue unmasked UI elements.
 */
export function ModalPortal({ children, lockScroll = true }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (lockScroll) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [lockScroll])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(children, document.body)
}
