import { useEffect, useCallback } from 'react'

export interface ReviewHotkeysActions {
  onApprove?: () => void
  onReject?: () => void
  onSuggest?: () => void
  onSkip?: () => void
  onFlag?: () => void
  onToggleView?: () => void
  onUndo?: () => void
}

/**
 * Custom Hook to listen for keyboard shortcuts in the Reviewer Workspace.
 * Disables keybind processing whenever the user focuses on an input, textarea, or select element.
 * Follows RULE.md §7.5 (Keyboard Accessibility & Hotkeys).
 *
 * @param actions - Callbacks triggered for respective hotkeys.
 * @param enabled - Master toggle to disable all hotkeys (e.g. when modal is active).
 */
export function useReviewHotkeys(actions: ReviewHotkeysActions, enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Ignore when typing inside input elements or contenteditable
      const activeEl = document.activeElement
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute('contenteditable') === 'true'

      if (isInput) return

      const key = event.key.toLowerCase()

      // Handle Undo: Ctrl+Z or standalone 'z'
      if ((event.ctrlKey || event.metaKey) && key === 'z') {
        event.preventDefault()
        actions.onUndo?.()
        return
      }

      // Ignore other shortcuts when Ctrl/Meta/Alt are held
      if (event.ctrlKey || event.metaKey || event.altKey) return

      switch (key) {
        case '1':
        case 'a':
          event.preventDefault()
          actions.onApprove?.()
          break

        case '2':
        case 'r':
          event.preventDefault()
          actions.onReject?.()
          break

        case '3':
        case 'c':
          event.preventDefault()
          actions.onSuggest?.()
          break

        case '4':
        case 's':
          event.preventDefault()
          actions.onSkip?.()
          break

        case 'f':
          event.preventDefault()
          actions.onFlag?.()
          break

        case ' ':
        case 'v':
          event.preventDefault()
          actions.onToggleView?.()
          break

        case 'z':
          event.preventDefault()
          actions.onUndo?.()
          break

        default:
          break
      }
    },
    [actions, enabled]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
