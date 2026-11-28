import * as Speech from 'expo-speech';

export type SpeakOptions = {
  language?: string;
  pitch?: number;
  rate?: number;
  onDone?: () => void;
  onError?: (error: Error) => void;
};

let isSpeechServiceEnabled = true;
const unsupportedLanguages = new Set<string>();
let isWarmedUp = false;

/**
 * Service providing text-to-speech helpers via expo-speech with safe fallbacks and controls.
 */
export const speechService = {
  /**
   * Pre-warms native TTS engine and caches available voices so the first spoken alert plays without cold-start lag.
   */
  async warmup() {
    if (!isSpeechServiceEnabled || isWarmedUp) return;
    isWarmedUp = true;
    try {
      const voices = await (Speech as { getAvailableVoicesAsync?: () => Promise<{ language?: string }[]> }).getAvailableVoicesAsync?.();
      if (Array.isArray(voices) && voices.length > 0) {
        const hasVi = voices.some((v) => v.language?.toLowerCase().startsWith('vi'));
        if (!hasVi) {
          unsupportedLanguages.add('vi-VN');
        }
      }
    } catch {
      // Ignore if engine does not support voice listing
    }
  },

  /**
   * Check if speech service is currently enabled.
   */
  isEnabled(): boolean {
    return isSpeechServiceEnabled;
  },

  /**
   * Enable or disable speech service.
   */
  setEnabled(enabled: boolean) {
    isSpeechServiceEnabled = enabled;
    if (enabled) {
      unsupportedLanguages.clear();
    } else {
      try {
        Speech.stop();
      } catch {
        // Ignore
      }
    }
  },

  /**
   * Speak a given text message.
   * If speech is already in progress, stops the previous utterance before speaking.
   */
  speak(text: string, options?: SpeakOptions) {
    if (!isSpeechServiceEnabled) {
      return;
    }
    try {
      Speech.stop();
      const requestedLanguage =
        options?.language && !unsupportedLanguages.has(options.language)
          ? options.language
          : undefined;
      console.log('[Speech] Speaking:', text, 'language:', requestedLanguage ?? 'default');
      Speech.speak(text, {
        language: requestedLanguage,
        pitch: options?.pitch ?? 1.0,
        rate: options?.rate ?? 0.95,
        onDone: options?.onDone,
        onError: (error) => {
          console.warn('[Speech] Error speaking with language', requestedLanguage, error);
          if (requestedLanguage) {
            unsupportedLanguages.add(requestedLanguage);
            // Fallback: try speaking with device default voice if specific language failed
            console.log('[Speech] Attempting fallback with system default voice...');
            Speech.speak(text, {
              pitch: options?.pitch ?? 1.0,
              rate: options?.rate ?? 0.95,
              onDone: options?.onDone,
              onError: options?.onError,
            });
          } else {
            options?.onError?.(error);
          }
        },
      });
    } catch (e) {
      console.warn('[Speech] TTS speak exception:', e);
    }
  },

  /**
   * Stop any currently playing speech.
   */
  stop() {
    try {
      Speech.stop();
    } catch {
      // Ignore
    }
  },

  /**
   * Check if speech engine is speaking.
   */
  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  },
};
