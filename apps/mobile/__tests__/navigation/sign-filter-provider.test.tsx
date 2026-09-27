import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

import {
  SIGN_FILTER_STORAGE_KEY,
  SignFilterProvider,
  useSignFilter,
} from '@/context/sign-filter-provider';
import * as storage from '@/hooks/use-storage';

jest.mock('@/hooks/use-storage', () => ({
  getStorageItemAsync: jest.fn(),
  setStorageItemAsync: jest.fn(),
  removeStorageItemAsync: jest.fn(),
}));

describe('SignFilterProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty presets and null activePresetId on first launch', async () => {
    (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce(null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SignFilterProvider>{children}</SignFilterProvider>
    );

    const { result } = await renderHook(() => useSignFilter(), { wrapper });

    expect(result.current.presets).toEqual([]);
    expect(result.current.activePresetId).toBeNull();
    expect(result.current.activePreset).toBeNull();
    expect(result.current.activeCategories).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('loads previously stored presets and active list from storage', async () => {
    const savedData = {
      activePresetId: 'preset-1',
      presets: [
        {
          id: 'preset-1',
          name: 'Mandatory Signs',
          categories: ['MANDATORY'],
          createdAt: 1000,
        },
        {
          id: 'preset-2',
          name: 'Hazards & Roadworks',
          categories: ['WARNING', 'TEMPORARY'],
          createdAt: 2000,
        },
      ],
    };

    (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(savedData));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SignFilterProvider>{children}</SignFilterProvider>
    );

    const { result } = await renderHook(() => useSignFilter(), { wrapper });

    expect(result.current.presets).toHaveLength(2);
    expect(result.current.activePresetId).toBe('preset-1');
    expect(result.current.activePreset?.name).toBe('Mandatory Signs');
    expect(result.current.activeCategories).toEqual(new Set(['MANDATORY']));
  });

  it('creates, renames, selects, and deletes filter lists with persistent storage calls', async () => {
    (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce(null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SignFilterProvider>{children}</SignFilterProvider>
    );

    const { result } = await renderHook(() => useSignFilter(), { wrapper });

    await act(async () => {});

    // 1. Create List 1
    let created1: any;
    await act(async () => {
      created1 = await result.current.createPreset('List 1: Mandatory', ['MANDATORY']);
    });

    expect(result.current.presets).toHaveLength(1);
    expect(result.current.activePresetId).toBe(created1.id);
    expect(storage.setStorageItemAsync).toHaveBeenCalledWith(
      SIGN_FILTER_STORAGE_KEY,
      expect.stringContaining('List 1: Mandatory')
    );

    // 2. Create List 2
    let created2: any;
    await act(async () => {
      created2 = await result.current.createPreset('List 2: Prohibitory & Mandatory', [
        'PROHIBITORY',
        'MANDATORY',
      ]);
    });

    expect(result.current.presets).toHaveLength(2);
    expect(result.current.activePresetId).toBe(created2.id);

    // 3. Rename List 1
    await act(async () => {
      await result.current.renamePreset(created1.id, 'Renamed List 1');
    });

    expect(result.current.presets.find((p) => p.id === created1.id)?.name).toBe('Renamed List 1');
    expect(storage.setStorageItemAsync).toHaveBeenCalledWith(
      SIGN_FILTER_STORAGE_KEY,
      expect.stringContaining('Renamed List 1')
    );

    // 4. Switch active list (only one active at a time)
    await act(async () => {
      await result.current.setActivePresetId(created1.id);
    });

    expect(result.current.activePresetId).toBe(created1.id);
    expect(result.current.activePreset?.name).toBe('Renamed List 1');

    // 5. Delete List 1
    await act(async () => {
      await result.current.deletePreset(created1.id);
    });

    expect(result.current.presets).toHaveLength(1);
    // Since active preset was deleted, activePresetId resets to null
    expect(result.current.activePresetId).toBeNull();
  });
});
