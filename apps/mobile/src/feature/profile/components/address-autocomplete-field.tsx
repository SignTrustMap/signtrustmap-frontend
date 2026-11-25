import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ApiPlace } from '@/api/navigation/places';
import { AppButton } from '@/components/button';
import { AppInput } from '@/components/input';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  MapLocationPin,
  NavigationMapView,
} from '@/feature/navigation/components/navigation-map-view';
import { LocationPickerModal } from '@/feature/upload/components/location-picker-modal';
import { useTheme } from '@/hooks/use-theme';
import type { MapCoordinate } from '@/types/navigationType';

type AddressAutocompleteFieldProps = {
  addressInput: string;
  addressSuggestions: ApiPlace[];
  editable?: boolean;
  error?: string;
  focusRequestId: number;
  inputContainerStyle?: StyleProp<ViewStyle>;
  inputErrorStyle?: StyleProp<ViewStyle>;
  isLoadingSuggestions: boolean;
  isMapPickerOpen: boolean;
  isSuggestionsVisible: boolean;
  onBlur: () => void;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onCloseMapPicker: () => void;
  onConfirmMapPicker: (coord: MapCoordinate, resolvedAddress?: string) => void;
  onOpenMapPicker: () => void;
  onSelectPlace: (place: ApiPlace) => void;
  onSuggestionsVisibilityChange: (visible: boolean) => void;
  selectedCoordinate: MapCoordinate;
  value?: string;
};

/**
 * Reusable address input with spatial/place autocomplete dropdown, mini-map preview,
 * and fullscreen map picker modal.
 */
export function AddressAutocompleteField({
  addressInput,
  addressSuggestions,
  editable = true,
  error,
  focusRequestId,
  inputContainerStyle,
  inputErrorStyle,
  isLoadingSuggestions,
  isMapPickerOpen,
  isSuggestionsVisible,
  onBlur,
  onChangeText,
  onClear,
  onCloseMapPicker,
  onConfirmMapPicker,
  onOpenMapPicker,
  onSelectPlace,
  onSuggestionsVisibilityChange,
  selectedCoordinate,
  value,
}: AddressAutocompleteFieldProps) {
  const theme = useTheme();

  return (
    <View>
      <AppInput
        accessibilityLabel="Địa chỉ"
        autoCapitalize="sentences"
        containerStyle={[inputContainerStyle, error ? inputErrorStyle : null]}
        editable={editable}
        error={error}
        maxLength={200}
        onBlur={() => {
          onBlur();
          setTimeout(() => {
            onSuggestionsVisibilityChange(false);
          }, 250);
        }}
        onChangeText={onChangeText}
        onFocus={() => {
          if (addressInput.trim().length >= 2) {
            onSuggestionsVisibilityChange(true);
          }
        }}
        placeholder="Nhập địa chỉ của bạn"
        placeholderTextColor="#94A3B8"
        trailingIcon={
          value ? (
            <Pressable
              accessibilityLabel="Xóa địa chỉ"
              hitSlop={8}
              onPress={onClear}
              style={styles.addressClearBtn}
              testID="clear-address-btn"
            >
              <MaterialCommunityIcons color="#94A3B8" name="close-circle" size={18} />
            </Pressable>
          ) : undefined
        }
        value={value}
      />

      {isSuggestionsVisible && (addressSuggestions.length > 0 || isLoadingSuggestions) ? (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
          testID="address-suggestions-container"
        >
          {isLoadingSuggestions ? (
            <View style={styles.suggestionLoadingRow}>
              <ActivityIndicator color={theme.primary} size="small" />
              <Text style={[styles.suggestionLoadingText, { color: theme.placeholder }]}>
                Đang tìm địa chỉ...
              </Text>
            </View>
          ) : null}

          {addressSuggestions.slice(0, 5).map((place, idx) => (
            <Pressable
              key={place.id || `${place.title}-${idx}`}
              accessibilityLabel={`Chọn địa chỉ ${place.title}`}
              onPress={() => onSelectPlace(place)}
              style={({ pressed }) => [
                styles.suggestionItem,
                {
                  borderBottomColor: theme.border,
                  backgroundColor: pressed ? `${theme.primary}12` : 'transparent',
                },
              ]}
              testID={`address-suggestion-${idx}`}
            >
              <MaterialCommunityIcons color={theme.primary} name="map-marker" size={18} />
              <View style={styles.suggestionTextCol}>
                <Text numberOfLines={1} style={[styles.suggestionTitle, { color: theme.text }]}>
                  {place.title}
                </Text>
                {place.address && place.address !== place.title ? (
                  <Text
                    numberOfLines={1}
                    style={[styles.suggestionSubtitle, { color: theme.placeholder }]}
                  >
                    {place.address}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View
        style={[
          styles.miniMapCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
        testID="profile-mini-map-card"
      >
        <View style={styles.miniMapWrapper}>
          <NavigationMapView
            focusCoordinate={selectedCoordinate}
            focusRequestId={focusRequestId}
            showCurrentLocation={false}
          />

          <View pointerEvents="none" style={styles.miniMapPinWrapper}>
            <MapLocationPin color={theme.primary} size={32} testID="profile-map-pin" />
          </View>

          <AppButton
            accessibilityHint="Mở bản đồ toàn màn hình để chọn vị trí chính xác"
            accessibilityLabel="Xem phóng to bản đồ"
            onPress={onOpenMapPicker}
            pressedOpacity={0.7}
            style={styles.miniMapZoomButton}
            testID="mini-map-zoom-btn"
            variant="primary"
          >
            <MaterialCommunityIcons color="#FFFFFF" name="arrow-expand" size={18} />
          </AppButton>
        </View>

        <View style={[styles.miniMapCaption, { borderTopColor: theme.border }]}>
          <MaterialCommunityIcons color={theme.primary} name="crosshairs-gps" size={14} />
          <Text numberOfLines={1} style={[styles.miniMapCaptionText, { color: theme.placeholder }]}>
            {value || 'Chạm vào nút phóng to để chọn vị trí trên bản đồ'}
          </Text>
        </View>
      </View>

      {isMapPickerOpen ? (
        <LocationPickerModal
          initialCoordinate={selectedCoordinate}
          onClose={onCloseMapPicker}
          onConfirm={onConfirmMapPicker}
          visible={isMapPickerOpen}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  addressClearBtn: {
    marginLeft: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    borderRadius: Rounded.md,
    borderWidth: 1,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  suggestionLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  suggestionLoadingText: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  suggestionTextCol: {
    flex: 1,
    minWidth: 0,
  },
  suggestionTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 1,
  },
  miniMapCard: {
    borderRadius: Rounded.md,
    borderWidth: 1,
    marginTop: Spacing.two,
    overflow: 'hidden',
  },
  miniMapWrapper: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  miniMapPinWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  miniMapZoomButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 38,
    height: 38,
    minHeight: 38,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  miniMapCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  miniMapCaptionText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 11,
  },
});
