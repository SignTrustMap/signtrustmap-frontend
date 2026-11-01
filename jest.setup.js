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

// Global mocks to prevent background async network leaks during Jest unit tests
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
