import * as Speech from 'expo-speech';
import { speechService } from '@/services/speech';

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(),
}));

describe('SpeechService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default enabled state before each test
    speechService.setEnabled(true);
  });

  describe('isEnabled and setEnabled', () => {
    it('returns true by default', () => {
      expect(speechService.isEnabled()).toBe(true);
    });

    it('disables speech service and stops any ongoing speech', () => {
      speechService.setEnabled(false);
      expect(speechService.isEnabled()).toBe(false);
      expect(Speech.stop).toHaveBeenCalled();
    });

    it('enables speech service without calling stop', () => {
      speechService.setEnabled(false);
      jest.clearAllMocks();

      speechService.setEnabled(true);
      expect(speechService.isEnabled()).toBe(true);
      expect(Speech.stop).not.toHaveBeenCalled();
    });

    it('safely catches error when Speech.stop throws in setEnabled(false)', () => {
      (Speech.stop as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Stop failure');
      });

      expect(() => speechService.setEnabled(false)).not.toThrow();
      expect(speechService.isEnabled()).toBe(false);
    });
  });

  describe('speak', () => {
    it('does nothing when speech service is disabled', () => {
      speechService.setEnabled(false);
      jest.clearAllMocks();

      speechService.speak('Biển báo nguy hiểm phía trước');
      expect(Speech.stop).not.toHaveBeenCalled();
      expect(Speech.speak).not.toHaveBeenCalled();
    });

    it('speaks text with default options when enabled', () => {
      speechService.speak('Đi thẳng 500 mét');

      expect(Speech.stop).toHaveBeenCalledTimes(1);
      expect(Speech.speak).toHaveBeenCalledWith(
        'Đi thẳng 500 mét',
        expect.objectContaining({
          pitch: 1.0,
          rate: 0.95,
          language: undefined,
        })
      );
    });

    it('speaks text with custom options (language, pitch, rate, onDone)', () => {
      const mockOnDone = jest.fn();
      speechService.speak('Rẽ phải vào đường Lê Lợi', {
        language: 'vi-VN',
        pitch: 1.2,
        rate: 0.85,
        onDone: mockOnDone,
      });

      expect(Speech.speak).toHaveBeenCalledWith(
        'Rẽ phải vào đường Lê Lợi',
        expect.objectContaining({
          language: 'vi-VN',
          pitch: 1.2,
          rate: 0.85,
          onDone: mockOnDone,
        })
      );
    });

    it('handles speech error and triggers fallback voice when language was provided', () => {
      const mockOnError = jest.fn();
      const mockOnDone = jest.fn();

      speechService.speak('Chú ý đường cong nguy hiểm', {
        language: 'vi-VN',
        pitch: 1.1,
        rate: 0.9,
        onDone: mockOnDone,
        onError: mockOnError,
      });

      // Extract the onError handler passed to the first Speech.speak call
      const firstCallArgs = (Speech.speak as jest.Mock).mock.calls[0];
      const internalOnError = firstCallArgs[1].onError;

      // Simulate first speak error
      const speechError = new Error('Language not supported on device');
      internalOnError(speechError);

      // Verify fallback was attempted without explicit language option
      expect(Speech.speak).toHaveBeenCalledTimes(2);
      expect(Speech.speak).toHaveBeenLastCalledWith(
        'Chú ý đường cong nguy hiểm',
        expect.objectContaining({
          pitch: 1.1,
          rate: 0.9,
          onDone: mockOnDone,
          onError: mockOnError,
        })
      );
    });

    it('uses default pitch and rate in fallback when not provided', () => {
      speechService.speak('Thông báo mặc định', {
        language: 'en-US',
      });

      const firstCallArgs = (Speech.speak as jest.Mock).mock.calls[0];
      const internalOnError = firstCallArgs[1].onError;

      internalOnError(new Error('TTS failure'));

      expect(Speech.speak).toHaveBeenCalledTimes(2);
      expect(Speech.speak).toHaveBeenLastCalledWith(
        'Thông báo mặc định',
        expect.objectContaining({
          pitch: 1.0,
          rate: 0.95,
        })
      );
    });

    it('calls onError callback directly when error occurs without specific language', () => {
      const mockOnError = jest.fn();

      speechService.speak('Cảnh báo tốc độ', {
        onError: mockOnError,
      });

      const firstCallArgs = (Speech.speak as jest.Mock).mock.calls[0];
      const internalOnError = firstCallArgs[1].onError;

      const speechError = new Error('Generic TTS failure');
      internalOnError(speechError);

      expect(mockOnError).toHaveBeenCalledWith(speechError);
      // No fallback attempted when no language was set
      expect(Speech.speak).toHaveBeenCalledTimes(1);
    });

    it('does not throw when error occurs and no onError callback provided', () => {
      speechService.speak('Không có callback lỗi');

      const firstCallArgs = (Speech.speak as jest.Mock).mock.calls[0];
      const internalOnError = firstCallArgs[1].onError;

      expect(() => internalOnError(new Error('TTS failure'))).not.toThrow();
    });

    it('safely catches synchronous exception thrown by Speech.speak', () => {
      (Speech.speak as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Immediate TTS crash');
      });

      expect(() => speechService.speak('Thông báo kiểm tra')).not.toThrow();
    });
  });

  describe('stop', () => {
    it('stops speech when called', () => {
      speechService.stop();
      expect(Speech.stop).toHaveBeenCalledTimes(1);
    });

    it('safely ignores exceptions thrown by Speech.stop', () => {
      (Speech.stop as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Stop failed');
      });

      expect(() => speechService.stop()).not.toThrow();
    });
  });

  describe('isSpeaking', () => {
    it('returns true when engine is speaking', async () => {
      (Speech.isSpeakingAsync as jest.Mock).mockResolvedValueOnce(true);

      const result = await speechService.isSpeaking();
      expect(result).toBe(true);
      expect(Speech.isSpeakingAsync).toHaveBeenCalled();
    });

    it('returns false when engine is not speaking', async () => {
      (Speech.isSpeakingAsync as jest.Mock).mockResolvedValueOnce(false);

      const result = await speechService.isSpeaking();
      expect(result).toBe(false);
    });

    it('returns false safely when Speech.isSpeakingAsync rejects', async () => {
      (Speech.isSpeakingAsync as jest.Mock).mockRejectedValueOnce(
        new Error('TTS engine query error')
      );

      const result = await speechService.isSpeaking();
      expect(result).toBe(false);
    });
  });
});
