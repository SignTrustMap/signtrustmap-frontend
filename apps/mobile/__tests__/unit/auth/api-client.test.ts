import {
  apiBaseUrl,
  ApiError,
  apiRequest,
  jsonApiRequest,
  authExpiredEmitter,
} from '@/api/api-client';

describe('API Client Core Module', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('authExpiredEmitter', () => {
    it('notifies subscribers when emitted and stops after unsubscribe', () => {
      const listenerA = jest.fn();
      const listenerB = jest.fn();

      const unsubscribeA = authExpiredEmitter.subscribe(listenerA);
      const unsubscribeB = authExpiredEmitter.subscribe(listenerB);

      authExpiredEmitter.emit();
      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerB).toHaveBeenCalledTimes(1);

      unsubscribeA();
      authExpiredEmitter.emit();
      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerB).toHaveBeenCalledTimes(2);

      unsubscribeB();
    });
  });

  describe('ApiError', () => {
    it('instantiates correctly with message and status code', () => {
      const err = new ApiError('Unauthorized access', 401);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('ApiError');
      expect(err.message).toBe('Unauthorized access');
      expect(err.status).toBe(401);
    });
  });

  describe('apiBaseUrl', () => {
    it('returns configured API base URL string', () => {
      const url = apiBaseUrl();
      expect(typeof url).toBe('string');
    });
  });

  describe('apiRequest', () => {
    it('makes successful GET request and parses JSON body', async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, count: 5 }),
      });

      const res = await apiRequest<{ success: boolean; count: number }>('/test-endpoint');

      expect(res).toEqual({ success: true, count: 5 });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          headers: expect.any(Headers),
        }),
      );
    });

    it('attaches Authorization header when accessToken is provided', async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ user: 'auth-ok' }),
      });

      await apiRequest('/secure-endpoint', {}, 'my-secret-token');

      const calledHeaders = (globalThis.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(calledHeaders.get('Authorization')).toBe('Bearer my-secret-token');
    });

    it('parses raw text when response is not valid JSON', async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Plain text response OK',
      });

      const res = await apiRequest<string>('/text-endpoint');
      expect(res).toBe('Plain text response OK');
    });

    it('throws ApiError with formatted message when response is not ok', async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({ message: ['Invalid email.', 'Password too short.'] }),
      });

      await expect(apiRequest('/validation-fail')).rejects.toThrow('Invalid email. Password too short.');
    });

    it('triggers authExpiredEmitter on 401 response when credentials were supplied', async () => {
      const authListener = jest.fn();
      const unsub = authExpiredEmitter.subscribe(authListener);

      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => JSON.stringify({ message: 'Token expired' }),
      });

      await expect(apiRequest('/protected', {}, 'expired-token')).rejects.toThrow(ApiError);
      expect(authListener).toHaveBeenCalledTimes(1);

      unsub();
    });

    it('does not trigger authExpiredEmitter on 401 response if no auth was provided', async () => {
      const authListener = jest.fn();
      const unsub = authExpiredEmitter.subscribe(authListener);

      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => JSON.stringify({ message: 'Public login fail' }),
      });

      await expect(apiRequest('/public-check')).rejects.toThrow(ApiError);
      expect(authListener).not.toHaveBeenCalled();

      unsub();
    });

    it('rethrows abort error without wrapping when request is aborted', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      globalThis.fetch = jest.fn().mockRejectedValueOnce(abortError);

      const controller = new AbortController();
      controller.abort();

      await expect(
        apiRequest('/aborted-call', { signal: controller.signal }),
      ).rejects.toThrow('Aborted');
    });

    it('wraps network errors into connection error message', async () => {
      globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(apiRequest('/network-error')).rejects.toThrow(
        /Không thể kết nối tới máy chủ|Failed to fetch/i,
      );
    });
  });

  describe('jsonApiRequest', () => {
    it('sets Content-Type application/json and serializes JSON body', async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ created: true }),
      });

      const res = await jsonApiRequest('/items', { title: 'New Item' }, 'token-abc', undefined, 'POST');

      expect(res).toEqual({ created: true });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'New Item' }),
        }),
      );
    });
  });
});
