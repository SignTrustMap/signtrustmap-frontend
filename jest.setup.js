// Extend Jest timeout for React Native component rendering under coverage instrumentation
jest.setTimeout(15000);

if (globalThis.__NATIVE_GLOBALS__) {
  for (const [key, value] of Object.entries(globalThis.__NATIVE_GLOBALS__)) {
    if (value !== undefined) {
      Object.defineProperty(globalThis, key, {
        value,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
  }
}

// Default test env for Google OAuth
process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'mock-google-client-id';
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'mock-google-client-id';

// Global mocks to prevent background async network leaks during Jest unit tests
jest.mock('@react-native-google-signin/google-signin', () => {
  const mockUser = {
    idToken: 'mock-google-id-token',
    serverAuthCode: 'mock-code',
    scopes: ['openid', 'profile', 'email'],
    user: {
      email: 'mock-google@example.com',
      id: 'mock-google-id',
      givenName: 'Google',
      familyName: 'User',
      photo: null,
      name: 'Google User',
    },
  };

  return {
    GoogleSignin: {
      configure: jest.fn(),
      hasPlayServices: jest.fn().mockResolvedValue(true),
      signIn: jest.fn().mockResolvedValue({
        type: 'success',
        data: mockUser,
      }),
      signInSilently: jest.fn().mockResolvedValue({
        type: 'success',
        data: mockUser,
      }),
      signOut: jest.fn().mockResolvedValue(null),
      revokeAccess: jest.fn().mockResolvedValue(null),
      hasPreviousSignIn: jest.fn().mockReturnValue(false),
      getCurrentUser: jest.fn().mockReturnValue(mockUser),
      clearCachedAccessToken: jest.fn().mockResolvedValue(null),
      getTokens: jest.fn().mockResolvedValue({
        idToken: 'mock-google-id-token',
        accessToken: 'mock-access-token',
      }),
    },
    statusCodes: {
      SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
      IN_PROGRESS: 'IN_PROGRESS',
      PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
      SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
    },
    isErrorWithCode: (error) => Boolean(error && typeof error === 'object' && 'code' in error),
    isCancelledResponse: (response) => response?.type === 'cancelled',
    isSuccessResponse: (response) => response?.type === 'success',
    isNoSavedCredentialFoundResponse: (response) => response?.type === 'noSavedCredentialFound',
  };
});

jest.mock('expo-media-library', () => ({
  getAssetsAsync: jest.fn(),
  getAssetInfoAsync: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  MediaType: {
    photo: 'photo',
    video: 'video',
  },
  SortBy: {
    creationTime: 'creationTime',
  },
}));

jest.mock('@/hooks/use-offline-maps', () => ({
  useOfflineMaps: () => ({
    availablePacks: [],
    installedPacks: {},
    activePackId: null,
    progressMap: {},
    isLoading: false,
    error: null,
    syncMetadata: jest.fn().mockResolvedValue(undefined),
    fetchPacks: jest.fn().mockResolvedValue(undefined),
    downloadPack: jest.fn(),
    deletePack: jest.fn(),
    setActivePack: jest.fn(),
    pauseDownload: jest.fn(),
    resumeDownload: jest.fn(),
  }),
}));

jest.mock('@/services/offline-map-service', () => ({
  offlineMapService: {
    loadMetadata: jest.fn().mockResolvedValue({ installedPacks: {}, activePackId: null }),
    fetchAvailablePacks: jest.fn().mockResolvedValue([]),
    subscribeToProgress: jest.fn(() => () => {}),
    subscribeToMetadata: jest.fn(() => () => {}),
    deleteMapPack: jest.fn().mockResolvedValue(undefined),
    setActivePack: jest.fn().mockResolvedValue(undefined),
  },
  formatBytes: (bytes) => `${bytes} B`,
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props) => React.createElement(View, { testID: 'mock-datetimepicker', ...props }),
    DateTimePickerAndroid: {
      open: jest.fn(),
      dismiss: jest.fn(),
    },
  };
});

