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
      Speech.speak(text, {
        language: options?.language,
        pitch: options?.pitch ?? 1.0,
        rate: options?.rate ?? 0.95,
        onDone: options?.onDone,
        onError: options?.onError,
      });
    } catch {
      // Gracefully handle environments without native TTS
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
