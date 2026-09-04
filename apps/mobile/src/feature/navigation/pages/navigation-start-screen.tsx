import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from '@expo/vector-icons/AntDesign';

import { AppButton } from '@/components/ui/button';
import { AppToast } from '@/components/ui/toast';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  currentLocation,
  previousLocations,
  startLocations,
} from '@/feature/navigation/data/navigation-locations';
import { useTheme } from '@/hooks/use-theme';
import { SAME_LOCATION_MESSAGE } from '@/constants/message';
import { areSameLocation } from '../utils/location';


export function NavigationStartScreen() {
  const router = useRouter();
  const { destinationId } = useLocalSearchParams<{ destinationId?: string }>();
  const theme = useTheme();
  const destination = previousLocations.find((location) => location.id === destinationId);
  const [toast, setToast] = useState<{ id: number; message: string }>();

  const showSameLocationToast = () => {
    setToast((currentToast) => ({
      id: (currentToast?.id ?? 0) + 1,
      message: SAME_LOCATION_MESSAGE,
    }));
  };

  const handleBack = () => {
    if (destinationId) {
      router.replace({
        pathname: '/home',
        params: {},
      })
    }
  }

  const handleSelectCurrentLocation = () => {
    if (!destinationId) return;

    if (areSameLocation(currentLocation.coordinate, destination?.coordinate)) {
      showSameLocationToast();
      return;
    }

    router.replace({
      pathname: '/home',
      params: {
        destinationId,
        startLat: String(currentLocation.coordinate[1]),
        startLng: String(currentLocation.coordinate[0]),
      },
    });
  };

  const handleSelectStart = (startId: string) => {
    if (!destinationId) return;

    const start = startLocations.find((location) => location.id === startId);

    if (areSameLocation(start?.coordinate, destination?.coordinate)) {
      showSameLocationToast();
      return;
    }

    router.replace({
      pathname: '/home',
      params: { destinationId, startId },
    });
  };

  const handleSwapRoutePoints = () => {
    if (!destination) return;

    const [longitude, latitude] = destination.coordinate;

    router.replace({
      pathname: '/home/search',
      params: {
        startLat: String(latitude),
        startLng: String(longitude),
      },
    });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.routeSelector}>
        <View style={styles.routeFields}>
          <View
            style={[
              styles.startInputContainer,
              { backgroundColor: theme.background, borderColor: theme.primary, borderWidth: 1 },
            ]}
          >
            <AntDesign
              color={theme.primary}
              name="pushpin"
              size={17}
            />
            <Text numberOfLines={1} style={[styles.searchPrompt, { color: theme.placeholder }]}>
              Your starting point...
            </Text>
          </View>

          {destination ? (
            <>
              <View pointerEvents="none" style={styles.inputConnector}>
                <View style={[styles.inputConnectorDot, { backgroundColor: theme.placeholder }]} />
                <View style={[styles.inputConnectorDot, { backgroundColor: theme.placeholder }]} />
                <View style={[styles.inputConnectorDot, { backgroundColor: theme.placeholder }]} />
              </View>
              <View
                style={[
                  styles.destinationRow,
                  {
                    backgroundColor: theme.background,
                    borderColor: 'transparent',
                  },
                ]}
              >
                <AntDesign
                  color={theme.primary}
                  name="pushpin"
                  size={17}
                />
                <Text numberOfLines={1} style={[styles.destinationText, { color: theme.text }]}>
                  {destination.title}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {destination ? (
          <AppButton
            accessibilityLabel="Swap starting point and destination"
            hitSlop={Spacing.one}
            onPress={handleSwapRoutePoints}
            pressedOpacity={0.68}
            style={styles.swapButton}
            variant="ghost"
          >
            <AntDesign
              color={theme.textSecondary}
              name="swap"
              size={22}
              style={styles.swapIcon}
            />
          </AppButton>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      >
        <AppButton
          accessibilityLabel="Use current location"
          onPress={handleSelectCurrentLocation}
          pressedOpacity={0.72}
          style={[styles.currentLocationRow, { borderColor: theme.border }]}
          variant="ghost"
        >
          <View style={[styles.currentIconCircle, { backgroundColor: theme.backgroundSelected }]}>
            <Text style={[styles.currentIcon, { color: theme.primary }]}>G</Text>
          </View>
          <View style={styles.locationCopy}>
            <Text style={[styles.locationTitle, { color: theme.text }]}>Current Location</Text>
            <Text style={[styles.locationSubtitle, { color: theme.textSecondary }]}>
              Using GPS accuracy
            </Text>
          </View>
          <Text style={[styles.arrowIcon, { color: theme.primary }]}>{'>'}</Text>
        </AppButton>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Recent History</Text>
        </View>

        {startLocations.map((location) => (
          <AppButton
            accessibilityLabel={location.title}
            key={location.id}
            onPress={() => handleSelectStart(location.id)}
            pressedOpacity={0.72}
            style={[styles.locationRow, { borderColor: theme.border }]}
            variant="ghost"
          >
            <View style={[styles.recentIconCircle, { backgroundColor: theme.background }]}>
              <Text style={[styles.recentIcon, { color: theme.textSecondary }]}>R</Text>
            </View>
            <View style={styles.locationCopy}>
              <Text style={[styles.locationTitle, { color: theme.text }]}>{location.title}</Text>
              <Text numberOfLines={1} style={[styles.locationSubtitle, { color: theme.text }]}>
                {location.subtitle}
              </Text>
            </View>
            <Text style={[styles.arrowIcon, { color: theme.border }]}>/</Text>
          </AppButton>
        ))}
      </ScrollView>
      {toast ? (
        <AppToast
          key={toast.id}
          message={toast.message}
          onDismiss={() => setToast(undefined)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  routeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: 5,
  },
  routeFields: {
    flex: 1,
    minWidth: 0,
  },
  startInputContainer: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingLeft: Spacing.four,
    borderRadius: Rounded.round,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  backIcon: {
    fontSize: 18,
    fontWeight: 700,
  },
  searchPrompt: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 700,
  },
  destinationRow: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Rounded.round,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.four,
    paddingRight: Spacing.three,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  inputConnector: {
    width: 16,
    height: Spacing.five,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginLeft: Spacing.four,
    paddingVertical: 2,
  },
  inputConnectorDot: {
    width: 2,
    height: 2,
    borderRadius: Rounded.round,
  },
  swapButton: {
    width: 44,
    height: 44,
    minHeight: 44,
    borderRadius: Rounded.round,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  swapIcon: {
    transform: [{ rotate: '90deg' }],
  },
  destinationText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 700,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  filterPill: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: 0,
  },
  filterIcon: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 900,
  },
  filterText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 800,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  currentLocationRow: {
    minHeight: 64,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  currentIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentIcon: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 900,
  },
  sectionHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  clearAction: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  locationRow: {
    minHeight: 64,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  recentIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIcon: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 900,
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationTitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 900,
  },
  locationSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
  },
  arrowIcon: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 900,
  },
});
