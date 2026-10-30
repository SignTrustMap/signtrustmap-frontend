import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppInput } from '@/components/input';
import { AppButton } from '@/components/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MapCoordinate } from '@/types/navigationType';
import { NavigationMapView } from '@/feature/navigation/components/navigation-map-view';
import { usePlaceSuggestions } from '@/feature/navigation/hooks/use-places';
import type { ApiPlace } from '@/api/navigation/places';
import { useReverseGeocode } from '@/feature/upload/hooks/use-reverse-geocode';
import type { FindSignsInBoundsParams } from '@/types/signMapType';
import { getMapLibre } from '@/services/maplibre';
import {
  ALLOW_LOCATION_ACCESS_MESSAGE,
  ENABLE_LOCATION_SERVICE_MESSAGE,
  LOCATION_NATIVE_BUILD_REQUIRED_MESSAGE,
  LOCATION_NOT_AVAILABLE_IN_BROWSER_MESSAGE,
} from '@/constants/message';

async function getDeviceCurrentCoordinate(): Promise<MapCoordinate> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      throw new Error(LOCATION_NOT_AVAILABLE_IN_BROWSER_MESSAGE);
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve([coords.longitude, coords.latitude]),
        (error) => {
          reject(
            new Error(
              error.code === error.PERMISSION_DENIED
                ? ALLOW_LOCATION_ACCESS_MESSAGE
                : ENABLE_LOCATION_SERVICE_MESSAGE,
            ),
          );
        },
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 },
      );
    });
  }

  const mapLibre = getMapLibre();
  if (!mapLibre) {
    throw new Error(LOCATION_NATIVE_BUILD_REQUIRED_MESSAGE);
  }

  const hasPermission = await mapLibre.LocationManager.requestPermissions();
  if (!hasPermission) {
    throw new Error(ALLOW_LOCATION_ACCESS_MESSAGE);
  }

  const position = await mapLibre.LocationManager.getCurrentPosition();
  if (!position) {
    throw new Error(ENABLE_LOCATION_SERVICE_MESSAGE);
  }

  return [position.coords.longitude, position.coords.latitude];
}

type LocationPickerModalProps = {
  visible: boolean;
  initialCoordinate?: MapCoordinate;
  onClose: () => void;
  onConfirm: (coordinate: MapCoordinate, address?: string) => void;
};

export function LocationPickerModal({
  visible,
  initialCoordinate,
  onClose,
  onConfirm,
}: LocationPickerModalProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [centerCoordinate, setCenterCoordinate] = useState<MapCoordinate>(
    initialCoordinate ?? [106.7009, 10.7769],
  );
  const [cameraFocusCoord, setCameraFocusCoord] = useState<MapCoordinate | undefined>(
    initialCoordinate,
  );
  const [focusRequestId, setFocusRequestId] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const { data: suggestions, isLoading: isSearching } = usePlaceSuggestions(searchQuery);

  const reverseGeocodeQuery = useReverseGeocode(
    centerCoordinate
      ? { latitude: centerCoordinate[1], longitude: centerCoordinate[0] }
      : null,
  );

  // Initialize with device GPS if no initialCoordinate provided
  useEffect(() => {
    if (!visible) return;

    if (initialCoordinate) {
      setCenterCoordinate(initialCoordinate);
      setCameraFocusCoord(initialCoordinate);
      setFocusRequestId((prev) => prev + 1);
      return;
    }

    // Default to device's current location
    let active = true;
    setIsLocating(true);
    getDeviceCurrentCoordinate()
      .then((coord) => {
        if (!active) return;
        setCenterCoordinate(coord);
        setCameraFocusCoord(coord);
        setFocusRequestId((prev) => prev + 1);
      })
      .catch((err) => {
        console.warn('[LocationPicker] Unable to fetch device location:', err);
      })
      .finally(() => {
        if (active) setIsLocating(false);
      });

    return () => {
      active = false;
    };
  }, [visible, initialCoordinate]);

  const handleBoundsChange = useCallback((bounds: FindSignsInBoundsParams) => {
    const lat = (bounds.minLat + bounds.maxLat) / 2;
    const lon = (bounds.minLon + bounds.maxLon) / 2;
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      setCenterCoordinate([lon, lat]);
    }
  }, []);

  const handleSelectPlace = (place: ApiPlace) => {
    if (place.latitude == null || place.longitude == null) return;
    const coord: MapCoordinate = [place.longitude, place.latitude];
    setCenterCoordinate(coord);
    setCameraFocusCoord(coord);
    setFocusRequestId((prev) => prev + 1);
    setSearchQuery(place.title);
    setIsSearchFocused(false);
  };

  const handleCurrentLocation = async () => {
    try {
      setIsLocating(true);
      setErrorMessage(undefined);
      const coord = await getDeviceCurrentCoordinate();
      setCenterCoordinate(coord);
      setCameraFocusCoord(coord);
      setFocusRequestId((prev) => prev + 1);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể lấy vị trí hiện tại');
    } finally {
      setIsLocating(false);
    }
  };

  const handleConfirm = () => {
    const resolvedAddress =
      reverseGeocodeQuery.data?.displayAddress ||
      reverseGeocodeQuery.data?.roadName ||
      undefined;
    onConfirm(centerCoordinate, resolvedAddress);
    onClose();
  };

  const resolvedRoadName =
    reverseGeocodeQuery.data?.roadName ||
    reverseGeocodeQuery.data?.displayAddress ||
    'Đang tải địa chỉ...';

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      visible={visible}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Full-screen Map */}
        <View style={StyleSheet.absoluteFill}>
          <NavigationMapView
            focusCoordinate={cameraFocusCoord}
            focusRequestId={focusRequestId}
            onBoundsChange={handleBoundsChange}
            showCurrentLocation
          />
        </View>

        {/* Center Crosshair Pin */}
        <View pointerEvents="none" style={styles.centerPinWrapper}>
          <View style={styles.centerPin}>
            <MaterialCommunityIcons name="map-marker" size={46} color="#0671eb" />
            <View style={styles.pinShadow} />
          </View>
        </View>

        {/* Top Header & Search Area */}
        <SafeAreaView edges={['top']} style={styles.topArea}>
          <View style={styles.headerBar}>
            <Pressable
              accessibilityLabel="Đóng"
              onPress={onClose}
              style={[styles.circleButton, { backgroundColor: theme.background, borderColor: theme.border }]}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
            </Pressable>

            <View style={styles.searchBoxWrapper}>
              <AppInput
                containerStyle={styles.searchInputContainer}
                leadingIcon={<MaterialCommunityIcons name="magnify" size={20} color={theme.placeholder} />}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Tìm kiếm vị trí, địa chỉ..."
                style={styles.searchInput}
                value={searchQuery}
              />
              {searchQuery.length > 0 ? (
                <Pressable
                  onPress={() => {
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  style={styles.clearSearchBtn}
                >
                  <MaterialCommunityIcons name="close-circle" size={18} color={theme.placeholder} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Autocomplete Search Dropdown */}
          {isSearchFocused && searchQuery.trim().length >= 2 ? (
            <View style={[styles.searchDropdown, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {isSearching ? (
                <View style={styles.dropdownLoading}>
                  <ActivityIndicator color={theme.primary} size="small" />
                  <Text style={[styles.dropdownLoadingText, { color: theme.textSecondary }]}>
                    Đang tìm kiếm...
                  </Text>
                </View>
              ) : suggestions && suggestions.length > 0 ? (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  style={styles.dropdownScroll}
                >
                  {suggestions.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectPlace(item)}
                      style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                    >
                      <MaterialCommunityIcons name="map-marker-outline" size={20} color={theme.primary} />
                      <View style={styles.dropdownItemCopy}>
                        <Text numberOfLines={1} style={[styles.dropdownItemTitle, { color: theme.text }]}>
                          {item.title}
                        </Text>
                        {item.address ? (
                          <Text numberOfLines={1} style={[styles.dropdownItemSubtitle, { color: theme.textSecondary }]}>
                            {item.address}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.dropdownEmpty}>
                  <Text style={[styles.dropdownEmptyText, { color: theme.placeholder }]}>
                    Không tìm thấy địa điểm phù hợp
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </SafeAreaView>

        {/* Right Floating Actions */}
        <View style={styles.floatingActions}>
          <Pressable
            accessibilityLabel="Đến vị trí hiện tại"
            onPress={handleCurrentLocation}
            style={[styles.circleButton, styles.gpsButton, { backgroundColor: theme.background, borderColor: theme.border }]}
          >
            {isLocating ? (
              <ActivityIndicator color={theme.primary} size="small" />
            ) : (
              <MaterialCommunityIcons name="crosshairs-gps" size={24} color={theme.primary} />
            )}
          </Pressable>
        </View>

        {/* Bottom Details & Confirmation Panel */}
        <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
          <View style={[styles.bottomCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.bottomAddressRow}>
              <View style={[styles.addressBadge, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialCommunityIcons name="map-marker" size={18} color={theme.primary} />
              </View>
              <View style={styles.addressTextWrapper}>
                <Text numberOfLines={1} style={[styles.addressTitle, { color: theme.text }]}>
                  {resolvedRoadName}
                </Text>
                <Text style={[styles.addressCoords, { color: theme.textSecondary }]}>
                  {centerCoordinate[1].toFixed(6)}, {centerCoordinate[0].toFixed(6)}
                </Text>
              </View>
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <AppButton
              label="Xác nhận vị trí này"
              onPress={handleConfirm}
              style={styles.confirmButton}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerPinWrapper: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerPin: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 44, // Align the marker point with the center
  },
  pinShadow: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: -2,
  },
  topArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: Spacing.two,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchBoxWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  searchInputContainer: {
    marginBottom: 0,
    height: 44,
    borderRadius: Rounded.xlg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchInput: {
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  searchDropdown: {
    marginTop: Spacing.one,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    maxHeight: 240,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownItemCopy: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.body,
  },
  dropdownItemSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.body,
    marginTop: 2,
  },
  dropdownLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  dropdownLoadingText: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  dropdownEmpty: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  floatingActions: {
    position: 'absolute',
    right: Spacing.two,
    bottom: 170,
    zIndex: 15,
  },
  gpsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
  },
  bottomCard: {
    borderRadius: Rounded.xlg,
    padding: Spacing.three,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    gap: Spacing.two,
  },
  bottomAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  addressBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextWrapper: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.body,
  },
  addressCoords: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    marginTop: 2,
  },
  confirmButton: {
    width: '100%',
    minHeight: 46,
    borderRadius: Rounded.lg,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: Fonts.body,
  },
});
