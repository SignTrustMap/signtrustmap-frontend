import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { SignCategory } from '@/constants/sign-categories';
import { getStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage';

export const SIGN_FILTER_STORAGE_KEY = 'stm_sign_filter_presets_v1';

export type SignFilterPreset = {
  id: string;
  name: string;
  categories: SignCategory[];
  createdAt: number;
};

type StoredSignFilterData = {
  activePresetId: string | null;
  presets: SignFilterPreset[];
};

type SignFilterContextValue = {
  activeCategories: Set<SignCategory> | null;
  activePreset: SignFilterPreset | null;
  activePresetId: string | null;
  createPreset: (name: string, categories: SignCategory[]) => Promise<SignFilterPreset>;
  deletePreset: (id: string) => Promise<void>;
  isLoading: boolean;
  presets: SignFilterPreset[];
  renamePreset: (id: string, newName: string) => Promise<void>;
  setActivePresetId: (id: string | null) => Promise<void>;
  updatePreset: (
    id: string,
    updates: { name?: string; categories?: SignCategory[] }
  ) => Promise<void>;
};

const SignFilterContext = createContext<SignFilterContextValue | null>(null);

export function SignFilterProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<SignFilterPreset[]>([]);
  const [activePresetId, setActivePresetIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from persistent storage on mount
  useEffect(() => {
    let isMounted = true;

    async function loadStoredFilters() {
      try {
        const raw = await getStorageItemAsync(SIGN_FILTER_STORAGE_KEY);
        if (raw && isMounted) {
          const parsed = JSON.parse(raw) as Partial<StoredSignFilterData>;
          const loadedPresets = Array.isArray(parsed.presets) ? parsed.presets : [];
          setPresets(loadedPresets);

          if (parsed.activePresetId && loadedPresets.some((p) => p.id === parsed.activePresetId)) {
            setActivePresetIdState(parsed.activePresetId);
          } else {
            setActivePresetIdState(null);
          }
        }
      } catch (err) {
        console.error('Failed to load sign filter presets from storage:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStoredFilters();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to persist state to storage
  const persistState = useCallback(
    async (newPresets: SignFilterPreset[], newActiveId: string | null) => {
      try {
        const payload: StoredSignFilterData = {
          activePresetId: newActiveId,
          presets: newPresets,
        };
        await setStorageItemAsync(SIGN_FILTER_STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to persist sign filter presets to storage:', err);
      }
    },
    []
  );

  const setActivePresetId = useCallback(
    async (id: string | null) => {
      setActivePresetIdState(id);
      await persistState(presets, id);
    },
    [persistState, presets]
  );

  const createPreset = useCallback(
    async (name: string, categories: SignCategory[]) => {
      const trimmedName = name.trim() || `List ${presets.length + 1}`;
      const newPreset: SignFilterPreset = {
        id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: trimmedName,
        categories: categories.length > 0 ? categories : ['MANDATORY'],
        createdAt: Date.now(),
      };

      const nextPresets = [...presets, newPreset];
      setPresets(nextPresets);
      setActivePresetIdState(newPreset.id);
      await persistState(nextPresets, newPreset.id);
      return newPreset;
    },
    [persistState, presets]
  );

  const renamePreset = useCallback(
    async (id: string, newName: string) => {
      const trimmedName = newName.trim();
      if (!trimmedName) return;

      const nextPresets = presets.map((p) => (p.id === id ? { ...p, name: trimmedName } : p));
      setPresets(nextPresets);
      await persistState(nextPresets, activePresetId);
    },
    [activePresetId, persistState, presets]
  );

  const updatePreset = useCallback(
    async (id: string, updates: { name?: string; categories?: SignCategory[] }) => {
      const nextPresets = presets.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          name: updates.name?.trim() ? updates.name.trim() : p.name,
          categories: updates.categories !== undefined ? updates.categories : p.categories,
        };
      });
      setPresets(nextPresets);
      await persistState(nextPresets, activePresetId);
    },
    [activePresetId, persistState, presets]
  );

  const deletePreset = useCallback(
    async (id: string) => {
      const nextPresets = presets.filter((p) => p.id !== id);
      const nextActiveId = activePresetId === id ? null : activePresetId;
      setPresets(nextPresets);
      setActivePresetIdState(nextActiveId);
      await persistState(nextPresets, nextActiveId);
    },
    [activePresetId, persistState, presets]
  );

  const activePreset = useMemo(() => {
    if (!activePresetId) return null;
    return presets.find((p) => p.id === activePresetId) ?? null;
  }, [activePresetId, presets]);

  const activeCategories = useMemo(() => {
    if (!activePreset) return null; // null means no filter / show all signs
    return new Set(activePreset.categories);
  }, [activePreset]);

  return (
    <SignFilterContext.Provider
      value={{
        activeCategories,
        activePreset,
        activePresetId,
        createPreset,
        deletePreset,
        isLoading,
        presets,
        renamePreset,
        setActivePresetId,
        updatePreset,
      }}
    >
      {children}
    </SignFilterContext.Provider>
  );
}

const defaultSignFilterValue: SignFilterContextValue = {
  activeCategories: null,
  activePreset: null,
  activePresetId: null,
  createPreset: async () => ({ id: '', name: '', categories: [], createdAt: 0 }),
  deletePreset: async () => {},
  isLoading: false,
  presets: [],
  renamePreset: async () => {},
  setActivePresetId: async () => {},
  updatePreset: async () => {},
};

export function useSignFilter() {
  const context = useContext(SignFilterContext);
  return context ?? defaultSignFilterValue;
}
