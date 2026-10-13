import * as Speech from 'expo-speech';

export type SpeakOptions = {
  language?: string;
  pitch?: number;
  rate?: number;
  onDone?: () => void;
  onError?: (error: Error) => void;
};

/**
 * Service providing text-to-speech helpers via expo-speech with safe fallbacks and controls.
 */
export const speechService = {
  /**
   * Speak a given text message.
   * If speech is already in progress, it can optionally stop previous utterance.
   */
  speak(text: string, options?: SpeakOptions) {
    try {
      Speech.stop();
      console.log('[Speech] Speaking:', text, 'language:', options?.language ?? 'default');
      Speech.speak(text, {
        language: options?.language,
        pitch: options?.pitch ?? 1.0,
        rate: options?.rate ?? 0.95,
        onDone: options?.onDone,
        onError: (error) => {
          console.warn('[Speech] Error speaking with language', options?.language, error);
          if (options?.language) {
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
