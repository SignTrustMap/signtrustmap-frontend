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
import { removeStorageItemAsync } from '@/hooks/use-storage';
import { useOptionalSession } from '@/context/session-provider';
import {
  createSavedRoute,
  deleteSavedRoute,
  getSavedRoutes,
  updateSavedRoute,
} from '@/api/saved-routes/saved-routes';
import {
  categoryToCode,
  codeToCategory,
  type CreateSavedRouteDto,
  type SavedRoute,
  type UpdateSavedRouteDto,
} from '@/types/savedRouteType';

export const SIGN_FILTER_STORAGE_KEY = 'stm_sign_filter_presets_v1';

export type SignFilterPreset = {
  id: string;
  name: string;
  categories: SignCategory[];
  onlyFixedSigns: boolean;
  createdAt: number;
  savedRoute?: SavedRoute;
};

export type CreatePresetOptions = {
  onlyFixedSigns?: boolean;
  originName?: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationName?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  encodedPolyline?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  vehicleMode?: string;
};

type SignFilterContextValue = {
  activeCategories: Set<SignCategory> | null;
  activeOnlyFixedSigns: boolean;
  activePreset: SignFilterPreset | null;
  activePresetId: string | null;
  createPreset: (
    name: string,
    categories: SignCategory[],
    options?: CreatePresetOptions
  ) => Promise<SignFilterPreset>;
  deletePreset: (id: string) => Promise<void>;
  isLoading: boolean;
  presets: SignFilterPreset[];
  refetchPresets: () => Promise<void>;
  renamePreset: (id: string, newName: string) => Promise<void>;
  setActivePresetId: (id: string | null) => Promise<void>;
  updatePreset: (
    id: string,
    updates: { name?: string; categories?: SignCategory[]; onlyFixedSigns?: boolean }
  ) => Promise<void>;
};

const SignFilterContext = createContext<SignFilterContextValue | null>(null);

export function SignFilterProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<SignFilterPreset[]>([]);
  const [activePresetId, setActivePresetIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sessionContext = useOptionalSession();
  const accessToken = sessionContext?.session?.accessToken;

  // Purge any previously stored local filters on mount
  useEffect(() => {
    let isMounted = true;

    async function purgeLocalStoredFilters() {
      try {
        await removeStorageItemAsync(SIGN_FILTER_STORAGE_KEY);
      } catch (err) {
        console.error('Failed to clear sign filter presets from local storage:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void purgeLocalStoredFilters();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadSavedRoutesFromBackend = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    try {
      setIsLoading(true);
      const routes = await getSavedRoutes(undefined, accessToken);
      const mapped: SignFilterPreset[] = routes.map((sr) => ({
        id: sr.id,
        name: sr.title,
        categories:
          sr.filterRules?.categories && sr.filterRules.categories.length > 0
            ? sr.filterRules.categories.map(codeToCategory)
            : ['WARNING', 'MANDATORY', 'PROHIBITORY', 'INFORMATION'],
        onlyFixedSigns: sr.filterRules?.onlyFixedSigns !== false,
        createdAt: new Date(sr.createdAt).getTime(),
        savedRoute: sr,
      }));
      setPresets(mapped);
    } catch (err) {
      console.error('Failed to load saved routes from backend:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Sync with backend whenever accessToken becomes available or changes
  useEffect(() => {
    if (accessToken) {
      void loadSavedRoutesFromBackend();
    } else {
      setPresets([]);
      setActivePresetIdState(null);
    }
  }, [accessToken, loadSavedRoutesFromBackend]);

  const setActivePresetId = useCallback(
    async (id: string | null) => {
      setActivePresetIdState(id);
    },
    []
  );

  const createPreset = useCallback(
    async (
      name: string,
      categories: SignCategory[],
      options?: CreatePresetOptions
    ) => {
      const trimmedName = name.trim() || `Lộ trình ${presets.length + 1}`;
      const onlyFixed = options?.onlyFixedSigns !== false;
      const cats: SignCategory[] = categories.length > 0 ? categories : ['MANDATORY'];

      if (accessToken) {
        const createDto: CreateSavedRouteDto = {
          title: trimmedName,
          vehicleMode: options?.vehicleMode || 'MOTORCYCLE',
          originName: options?.originName || 'Điểm xuất phát',
          originLatitude: options?.originLatitude ?? 10.7769,
          originLongitude: options?.originLongitude ?? 106.7009,
          destinationName: options?.destinationName || trimmedName,
          destinationLatitude: options?.destinationLatitude ?? 10.85,
          destinationLongitude: options?.destinationLongitude ?? 106.772,
          encodedPolyline: options?.encodedPolyline,
          distanceMeters: options?.distanceMeters,
          durationSeconds: options?.durationSeconds,
          filterRules: {
            onlyFixedSigns: onlyFixed,
            categories: cats.map(categoryToCode),
          },
        };

        const createdRoute = await createSavedRoute(createDto, accessToken);
        const newPreset: SignFilterPreset = {
          id: createdRoute.id,
          name: createdRoute.title,
          categories: cats,
          onlyFixedSigns: onlyFixed,
          createdAt: new Date(createdRoute.createdAt).getTime(),
          savedRoute: createdRoute,
        };

        setPresets((prev) => [newPreset, ...prev.filter((p) => p.id !== newPreset.id)]);
        setActivePresetIdState(newPreset.id);
        return newPreset;
      }

      // In-memory fallback
      const newPreset: SignFilterPreset = {
        id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: trimmedName,
        categories: cats,
        onlyFixedSigns: onlyFixed,
        createdAt: Date.now(),
      };

      setPresets((prev) => [...prev, newPreset]);
      setActivePresetIdState(newPreset.id);
      return newPreset;
    },
    [accessToken, presets.length]
  );

  const updatePreset = useCallback(
    async (
      id: string,
      updates: { name?: string; categories?: SignCategory[]; onlyFixedSigns?: boolean }
    ) => {
      const target = presets.find((p) => p.id === id);
      const newName = updates.name?.trim() ? updates.name.trim() : target?.name || '';
      const newCats =
        updates.categories !== undefined ? updates.categories : target?.categories || [];
      const newOnlyFixed =
        updates.onlyFixedSigns !== undefined ? updates.onlyFixedSigns : (target?.onlyFixedSigns ?? true);

      if (accessToken && target?.savedRoute) {
        const updateDto: UpdateSavedRouteDto = {
          title: newName || undefined,
          filterRules: {
            onlyFixedSigns: newOnlyFixed,
            categories: newCats.map(categoryToCode),
          },
        };
        const updated = await updateSavedRoute(id, updateDto, accessToken);
        setPresets((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: updated.title,
                  categories: newCats,
                  onlyFixedSigns: newOnlyFixed,
                  savedRoute: updated,
                }
              : p
          )
        );
        return;
      }

      setPresets((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name: newName || p.name,
                categories: newCats,
                onlyFixedSigns: newOnlyFixed,
              }
            : p
        )
      );
    },
    [accessToken, presets]
  );

  const renamePreset = useCallback(
    async (id: string, newName: string) => {
      const trimmedName = newName.trim();
      if (!trimmedName) return;
      await updatePreset(id, { name: trimmedName });
    },
    [updatePreset]
  );

  const deletePreset = useCallback(
    async (id: string) => {
      if (accessToken) {
        try {
          await deleteSavedRoute(id, accessToken);
        } catch (err) {
          console.error('Failed to delete saved route from backend:', err);
        }
      }

      setPresets((prev) => prev.filter((p) => p.id !== id));
      setActivePresetIdState((prev) => (prev === id ? null : prev));
    },
    [accessToken]
  );

  const refetchPresets = useCallback(async () => {
    await loadSavedRoutesFromBackend();
  }, [loadSavedRoutesFromBackend]);

  const activePreset = useMemo(() => {
    if (!activePresetId) return null;
    return presets.find((p) => p.id === activePresetId) ?? null;
  }, [activePresetId, presets]);

  const activeCategories = useMemo(() => {
    if (!activePreset) return null; // null means no filter / show all signs
    return new Set(activePreset.categories);
  }, [activePreset]);

  const activeOnlyFixedSigns = useMemo(() => {
    if (!activePreset) return false;
    return activePreset.onlyFixedSigns !== false;
  }, [activePreset]);

  return (
    <SignFilterContext.Provider
      value={{
        activeCategories,
        activeOnlyFixedSigns,
        activePreset,
        activePresetId,
        createPreset,
        deletePreset,
        isLoading,
        presets,
        refetchPresets,
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
  activeOnlyFixedSigns: false,
  activePreset: null,
  activePresetId: null,
  createPreset: async () => ({
    id: '',
    name: '',
    categories: [],
    onlyFixedSigns: true,
    createdAt: 0,
  }),
  deletePreset: async () => {},
  isLoading: false,
  presets: [],
  refetchPresets: async () => {},
  renamePreset: async () => {},
  setActivePresetId: async () => {},
  updatePreset: async () => {},
};

export function useSignFilter() {
  const context = useContext(SignFilterContext);
  return context ?? defaultSignFilterValue;
}
