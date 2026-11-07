import { renderHook, waitFor } from '@testing-library/react-native';
import { useAuthentication } from '@/hooks/use-authentication';
import * as storage from '@/hooks/use-storage';

jest.mock('@/hooks/use-storage', () => ({
  getStorageItemAsync: jest.fn(),
}));

describe('useAuthentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads user from storage and sets loading to false', async () => {
    (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce('user-token-123');

    const { result } = await renderHook(() => useAuthentication('auth_key'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe('user-token-123');
    expect(storage.getStorageItemAsync).toHaveBeenCalledWith('auth_key');
  });

  it('handles null user from storage', async () => {
    (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce(null);

    const { result } = await renderHook(() => useAuthentication('auth_key'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it('handles storage exception safely without crashing', async () => {
    (storage.getStorageItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Storage access denied')
    );

    const { result } = await renderHook(() => useAuthentication('auth_key'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });
});
