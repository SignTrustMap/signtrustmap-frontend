import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import type { ApiPlace } from '@/api/navigation/places';
import { formatResolvedLocationTitle, resolveLocation } from '@/api/spatial/spatial';
import type { SignCategory } from '@/constants/sign-categories';
import type { SignFilterPreset } from '@/context/sign-filter-provider';
import { usePlaceSuggestions } from '@/feature/navigation/hooks/use-places';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';

export type SelectedFilterPlace = {
  title: string;
  address?: string | null;
  latitude: number;
  longitude: number;
};

export type FilterVehicleMode = 'MOTORCYCLE' | 'CAR' | 'CYCLING' | 'WALKING';

type UseSignFilterModalsParams = {
  accessToken?: string;
  createPreset: (
    name: string,
    categories: SignCategory[],
    routeParams: {
      originName: string;
      originLatitude: number;
      originLongitude: number;
      destinationName: string;
      destinationLatitude: number;
      destinationLongitude: number;
      vehicleMode: FilterVehicleMode;
      onlyFixedSigns: boolean;
    },
  ) => Promise<unknown>;
  deletePreset: (id: string) => Promise<unknown>;
  renamePreset: (id: string, name: string) => Promise<unknown>;
  updatePreset: (
    id: string,
    payload: { name: string; categories: SignCategory[]; onlyFixedSigns: boolean },
  ) => Promise<unknown>;
};

const DEFAULT_CATEGORIES: SignCategory[] = ['MANDATORY', 'WARNING', 'PROHIBITORY'];

/**
 * Shared state and handlers for the SignFilter create/edit/rename/delete modals,
 * reused by both SignFiltersScreen and SignFilterManager.
 */
export function useSignFilterModals({
  accessToken,
  createPreset,
  deletePreset,
  renamePreset,
  updatePreset,
}: UseSignFilterModalsParams) {
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<SignFilterPreset | null>(null);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [vehicleMode, setVehicleMode] = useState<FilterVehicleMode>('MOTORCYCLE');

  const [startPoint, setStartPoint] = useState<SelectedFilterPlace | null>(null);
  const [startQuery, setStartQuery] = useState('');
  const [isStartFocused, setIsStartFocused] = useState(false);
  const [isLocatingStart, setIsLocatingStart] = useState(false);

  const [destPoint, setDestPoint] = useState<SelectedFilterPlace | null>(null);
  const [destQuery, setDestQuery] = useState('');
  const [isDestFocused, setIsDestFocused] = useState(false);
  const [isLocatingDest, setIsLocatingDest] = useState(false);

  const { data: startSuggestions = [], isLoading: isStartSearching } = usePlaceSuggestions(startQuery);
  const { data: destSuggestions = [], isLoading: isDestSearching } = usePlaceSuggestions(destQuery);

  const [selectedCategories, setSelectedCategories] = useState<Set<SignCategory>>(
    () => new Set(DEFAULT_CATEGORIES),
  );
  const [editorError, setEditorError] = useState('');

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renamingPresetId, setRenamingPresetId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [renameError, setRenameError] = useState('');

  const handleOpenCreate = useCallback(() => {
    setEditingPreset(null);
    setPresetNameInput('');
    setStartPoint(null);
    setStartQuery('');
    setIsStartFocused(false);
    setDestPoint(null);
    setDestQuery('');
    setIsDestFocused(false);
    setVehicleMode('MOTORCYCLE');
    setSelectedCategories(new Set(DEFAULT_CATEGORIES));
    setEditorError('');
    setIsEditorModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((preset: SignFilterPreset) => {
    setEditingPreset(preset);
    setPresetNameInput(preset.name);
    setSelectedCategories(new Set(preset.categories));
    if (preset.savedRoute) {
      setStartPoint({
        title: preset.savedRoute.originName,
        latitude: preset.savedRoute.originLatitude,
        longitude: preset.savedRoute.originLongitude,
      });
      setStartQuery(preset.savedRoute.originName);
      setDestPoint({
        title: preset.savedRoute.destinationName,
        latitude: preset.savedRoute.destinationLatitude,
        longitude: preset.savedRoute.destinationLongitude,
      });
      setDestQuery(preset.savedRoute.destinationName);
      const vMode = preset.savedRoute.vehicleMode?.toUpperCase();
      if (vMode === 'CYCLING' || vMode === 'BICYCLE') setVehicleMode('CYCLING');
      else if (vMode === 'WALKING' || vMode === 'PEDESTRIAN') setVehicleMode('WALKING');
      else if (vMode === 'CAR') setVehicleMode('CAR');
      else setVehicleMode('MOTORCYCLE');
    } else {
      setStartPoint(null);
      setStartQuery('');
      setDestPoint(null);
      setDestQuery('');
      setVehicleMode('MOTORCYCLE');
    }
    setIsStartFocused(false);
    setIsDestFocused(false);
    setEditorError('');
    setIsEditorModalOpen(true);
  }, []);

  const resolveCurrentPoint = useCallback(
    async (
      setLocating: (v: boolean) => void,
      setPoint: (p: SelectedFilterPlace) => void,
      setQuery: (q: string) => void,
      setFocused: (v: boolean) => void,
    ) => {
      setLocating(true);
      try {
        const pos = await fetchFreshGpsPosition(3500);
        if (pos) {
          let resolvedTitle = 'Vị trí hiện tại';
          let resolvedAddress = 'Tọa độ GPS thiết bị';
          try {
            const resolved = await resolveLocation(pos[1], pos[0], accessToken);
            const formatted = formatResolvedLocationTitle(resolved);
            if (formatted) {
              resolvedTitle = formatted;
              resolvedAddress = resolved?.displayAddress || resolvedAddress;
            }
          } catch {
            // keep fallback
          }
          setPoint({
            title: resolvedTitle,
            address: resolvedAddress,
            latitude: pos[1],
            longitude: pos[0],
          });
          setQuery(resolvedTitle);
          setFocused(false);
          setEditorError('');
        } else {
          Alert.alert('Không thể xác định vị trí', 'Vui lòng kiểm tra quyền truy cập vị trí và bật GPS.');
        }
      } catch {
        Alert.alert('Lỗi GPS', 'Không thể lấy vị trí hiện tại.');
      } finally {
        setLocating(false);
      }
    },
    [accessToken],
  );

  const handleSelectCurrentLocationForStart = useCallback(
    () => resolveCurrentPoint(setIsLocatingStart, setStartPoint, setStartQuery, setIsStartFocused),
    [resolveCurrentPoint],
  );

  const handleSelectCurrentLocationForDest = useCallback(
    () => resolveCurrentPoint(setIsLocatingDest, setDestPoint, setDestQuery, setIsDestFocused),
    [resolveCurrentPoint],
  );

  const handleSelectStartSuggestion = useCallback((item: ApiPlace) => {
    if (item.latitude == null || item.longitude == null) return;
    setStartPoint({
      title: item.title,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setStartQuery(item.title);
    setIsStartFocused(false);
    setEditorError('');
  }, []);

  const handleSelectDestSuggestion = useCallback((item: ApiPlace) => {
    if (item.latitude == null || item.longitude == null) return;
    setDestPoint({
      title: item.title,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setDestQuery(item.title);
    setIsDestFocused(false);
    setEditorError('');
  }, []);

  const handleOpenRename = useCallback((preset: SignFilterPreset) => {
    setRenamingPresetId(preset.id);
    setRenameInput(preset.name);
    setRenameError('');
    setIsRenameModalOpen(true);
  }, []);

  const handleToggleCategory = useCallback((cat: SignCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size === 1) {
          setEditorError('Danh sách phải bao gồm ít nhất một danh mục biển báo.');
          return prev;
        }
        next.delete(cat);
      } else {
        next.add(cat);
      }
      setEditorError('');
      return next;
    });
  }, []);

  const handleSaveEditor = useCallback(async () => {
    if (selectedCategories.size === 0) {
      setEditorError('Chọn ít nhất một danh mục biển báo.');
      return;
    }

    const categoriesArray = Array.from(selectedCategories);
    if (editingPreset) {
      const trimmed = presetNameInput.trim() || editingPreset.name;
      await updatePreset(editingPreset.id, {
        name: trimmed,
        categories: categoriesArray,
        onlyFixedSigns: true,
      });
    } else {
      if (!startPoint) {
        setEditorError('Vui lòng chọn Điểm bắt đầu (nhập tìm kiếm hoặc chọn Vị trí hiện tại).');
        return;
      }
      if (!destPoint) {
        setEditorError('Vui lòng chọn Điểm đến (nhập tìm kiếm hoặc chọn Vị trí hiện tại).');
        return;
      }

      const finalName = presetNameInput.trim() || `${startPoint.title} ➔ ${destPoint.title}`;
      await createPreset(finalName, categoriesArray, {
        originName: startPoint.title,
        originLatitude: startPoint.latitude,
        originLongitude: startPoint.longitude,
        destinationName: destPoint.title,
        destinationLatitude: destPoint.latitude,
        destinationLongitude: destPoint.longitude,
        vehicleMode,
        onlyFixedSigns: true,
      });
    }
    setIsEditorModalOpen(false);
  }, [createPreset, destPoint, editingPreset, presetNameInput, selectedCategories, startPoint, updatePreset, vehicleMode]);

  const handleSaveRename = useCallback(async () => {
    const trimmed = renameInput.trim();
    if (!trimmed) {
      setRenameError('Tên danh sách không được để trống.');
      return;
    }
    if (renamingPresetId) {
      await renamePreset(renamingPresetId, trimmed);
    }
    setIsRenameModalOpen(false);
  }, [renameInput, renamePreset, renamingPresetId]);

  const handleDeletePress = useCallback(
    (preset: SignFilterPreset) => {
      Alert.alert(
        'Xóa lộ trình đã lưu',
        `Bạn có chắc chắn muốn xóa "${preset.name}"?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: () => {
              void deletePreset(preset.id);
            },
          },
        ],
      );
    },
    [deletePreset],
  );

  return {
    destPoint,
    destQuery,
    destSuggestions,
    editingPreset,
    editorError,
    handleDeletePress,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenRename,
    handleSaveEditor,
    handleSaveRename,
    handleSelectCurrentLocationForDest,
    handleSelectCurrentLocationForStart,
    handleSelectDestSuggestion,
    handleSelectStartSuggestion,
    handleToggleCategory,
    isDestFocused,
    isDestSearching,
    isEditorModalOpen,
    isLocatingDest,
    isLocatingStart,
    isRenameModalOpen,
    isStartFocused,
    isStartSearching,
    presetNameInput,
    renameError,
    renameInput,
    selectedCategories,
    setDestPoint,
    setDestQuery,
    setEditorError,
    setIsDestFocused,
    setIsEditorModalOpen,
    setIsRenameModalOpen,
    setIsStartFocused,
    setPresetNameInput,
    setRenameError,
    setRenameInput,
    setStartPoint,
    setStartQuery,
    setVehicleMode,
    startPoint,
    startQuery,
    startSuggestions,
    vehicleMode,
  };
}
