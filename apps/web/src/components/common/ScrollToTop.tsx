import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowUp } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'

export function ScrollToTop() {
  const { isDark } = useTheme()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 250
          setIsVisible(scrolled)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.6, y: 20, filter: 'blur(4px)' }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            mass: 0.8,
          }}
          whileHover={{
            scale: 1.1,
            y: -3,
            transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
          }}
          whileTap={{
            scale: 0.9,
            transition: { duration: 0.1 },
          }}
          type="button"
          onClick={scrollToTop}
          aria-label="Cuộn lên đầu trang"
          title="Cuộn lên đầu trang"
          className={`fixed bottom-7 right-7 z-40 w-12 h-12 rounded-full backdrop-blur-xl border flex items-center justify-center cursor-pointer transition-all group ${
            isDark
              ? 'bg-[#061519]/90 border-white/20 hover:border-[#00c4de]/70 text-[#00c4de] hover:text-white hover:bg-[#007b8b]/40 shadow-2xl hover:shadow-[0_0_30px_rgba(0,196,222,0.35)]'
              : 'bg-white/95 border-gray-300 hover:border-[#007b8b] text-[#007b8b] hover:text-white hover:bg-[#007b8b] shadow-xl hover:shadow-[0_4px_25px_rgba(0,123,139,0.3)]'
          }`}
        >
          <ArrowUp
            size={19}
            weight="bold"
            className="group-hover:-translate-y-1 transition-transform duration-200 ease-out"
          />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
