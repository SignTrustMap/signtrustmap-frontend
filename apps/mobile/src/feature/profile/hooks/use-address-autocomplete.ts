import { useCallback, useEffect, useRef, useState } from 'react';

import { searchPlaces, type ApiPlace } from '@/api/navigation/places';
import { useDebounce } from '@/hooks/use-debounce';
import type { MapCoordinate } from '@/types/navigationType';

const DEFAULT_COORDINATE: MapCoordinate = [106.7009, 10.7769];

type UseAddressAutocompleteOptions = {
  initialAddress?: string;
  onSyncAddress?: (address: string) => void;
};

/**
 * Manages debounced spatial/place autocomplete suggestions and map pin coordinate
 * synchronization for address inputs.
 */
export function useAddressAutocomplete({
  initialAddress = '',
  onSyncAddress,
}: UseAddressAutocompleteOptions) {
  const [addressInput, setAddressInput] = useState(initialAddress);
  const debouncedAddress = useDebounce(addressInput, 350);
  const [addressSuggestions, setAddressSuggestions] = useState<ApiPlace[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] = useState<MapCoordinate>(DEFAULT_COORDINATE);
  const [focusRequestId, setFocusRequestId] = useState(1);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const isTypingAddressRef = useRef(false);

  useEffect(() => {
    if (!isTypingAddressRef.current) return;
    const trimmed = (debouncedAddress || '').trim();
    if (trimmed.length < 2) {
      setAddressSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    let isMounted = true;
    setIsLoadingSuggestions(true);
    const abortCtrl = new AbortController();

    searchPlaces(trimmed, abortCtrl.signal)
      .then((places) => {
        if (isMounted) {
          setAddressSuggestions(places || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAddressSuggestions([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSuggestions(false);
        }
      });

    return () => {
      isMounted = false;
      abortCtrl.abort();
    };
  }, [debouncedAddress]);

  const hydrateFromInitialAddress = useCallback((initialAddr: string) => {
    setAddressInput(initialAddr);
    if (initialAddr.trim().length < 2) return;

    searchPlaces(initialAddr.trim())
      .then((places) => {
        if (
          places &&
          places.length > 0 &&
          places[0].longitude != null &&
          places[0].latitude != null
        ) {
          setSelectedCoordinate([places[0].longitude, places[0].latitude]);
          setFocusRequestId((prev) => prev + 1);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddressTextChange = useCallback(
    (text: string, onFormFieldChange?: (val: string) => void) => {
      isTypingAddressRef.current = true;
      onFormFieldChange?.(text);
      onSyncAddress?.(text);
      setAddressInput(text);
      setIsSuggestionsVisible(true);
    },
    [onSyncAddress],
  );

  const handleSelectPlace = useCallback(
    (place: ApiPlace, onFormFieldChange?: (val: string) => void) => {
      isTypingAddressRef.current = false;
      const chosenAddress = place.address || place.title;
      if (onFormFieldChange) {
        onFormFieldChange(chosenAddress);
      } else {
        onSyncAddress?.(chosenAddress);
      }
      setAddressInput(chosenAddress);
      setIsSuggestionsVisible(false);
      setAddressSuggestions([]);

      if (place.longitude != null && place.latitude != null) {
        setSelectedCoordinate([place.longitude, place.latitude]);
        setFocusRequestId((prev) => prev + 1);
      }
    },
    [onSyncAddress],
  );

  const handleClearAddress = useCallback(
    (onFormFieldChange?: (val: string) => void) => {
      isTypingAddressRef.current = false;
      if (onFormFieldChange) {
        onFormFieldChange('');
      } else {
        onSyncAddress?.('');
      }
      setAddressInput('');
      setAddressSuggestions([]);
      setIsSuggestionsVisible(false);
    },
    [onSyncAddress],
  );

  const handleMapConfirm = useCallback(
    (coord: MapCoordinate, resolvedAddress?: string) => {
      setSelectedCoordinate(coord);
      setFocusRequestId((prev) => prev + 1);
      if (resolvedAddress) {
        onSyncAddress?.(resolvedAddress);
        setAddressInput(resolvedAddress);
      }
      setIsMapPickerOpen(false);
    },
    [onSyncAddress],
  );

  return {
    addressInput,
    addressSuggestions,
    focusRequestId,
    handleAddressTextChange,
    handleClearAddress,
    handleMapConfirm,
    handleSelectPlace,
    hydrateFromInitialAddress,
    isLoadingSuggestions,
    isMapPickerOpen,
    isSuggestionsVisible,
    selectedCoordinate,
    setIsMapPickerOpen,
    setIsSuggestionsVisible,
  };
}
