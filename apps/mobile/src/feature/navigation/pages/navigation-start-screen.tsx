import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AntDesign from '@expo/vector-icons/AntDesign';

import { AppButton } from "@/components/ui/button";
import { AppToast } from "@/components/ui/toast";
import { Fonts, Rounded, Spacing } from "@/constants/theme";
import { useSession } from "@/context/session-provider";
import {
  currentLocation,
  previousLocations,
  type MapCoordinate,
} from "@/feature/navigation/data/navigation-locations";
import {
  getUserPlaces,
  saveRecentPlace,
  searchPlaces,
  type ApiPlace,
} from "@/feature/navigation/services/places-api";
import { useTheme } from "@/hooks/use-theme";
import { getMapLibre } from "@/services/maplibre";
import { SAME_LOCATION_MESSAGE } from "@/constants/message";
import { areSameLocation } from "../utils/location";

export function NavigationStartScreen() {
  const router = useRouter();
  const {
    destinationId,
    destinationLat,
    destinationLng,
    destinationSubtitle,
    destinationTitle,
  } = useLocalSearchParams<{
    destinationId?: string;
    destinationLat?: string;
    destinationLng?: string;
    destinationSubtitle?: string;
    destinationTitle?: string;
  }>();
  const theme = useTheme();
  const { session } = useSession();
  const savedDestination = previousLocations.find(
    (location) => location.id === destinationId,
  );
  const destination = useMemo(() => {
    if (destinationLat && destinationLng && destinationId) {
      return {
        coordinate: [
          Number(destinationLng),
          Number(destinationLat),
        ] as MapCoordinate,
        id: destinationId,
        subtitle: destinationSubtitle ?? "",
        title: destinationTitle ?? "Destination",
      };
    }
    return savedDestination;
  }, [
    destinationId,
    destinationLat,
    destinationLng,
    destinationSubtitle,
    destinationTitle,
    savedDestination,
  ]);

  const [toast, setToast] = useState<{ id: number; message: string }>();
  const [query, setQuery] = useState("");
  const [startLocations, setStartLocations] = useState<ApiPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!session?.accessToken) return;
    if (query.trim().length >= 2) return;

    getUserPlaces(session.accessToken)
      .then((places) => {
        setStartLocations(places);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load saved starting points.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [query, session?.accessToken]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setIsLoading(true);
      searchPlaces(normalizedQuery, controller.signal)
        .then((places) => {
          setStartLocations(places);
          setError(undefined);
        })
        .catch((cause: unknown) => {
          if (cause instanceof Error && cause.name === "AbortError") return;
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to search for starting points.",
          );
        })
        .finally(() => setIsLoading(false));
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const destinationParams = destination
    ? {
      destinationId: destination.id,
      destinationLat: String(destination.coordinate[1]),
      destinationLng: String(destination.coordinate[0]),
      destinationSubtitle: destination.subtitle,
      destinationTitle: destination.title,
    }
    : {};

  const showSameLocationToast = () => {
    setToast((currentToast) => ({
      id: (currentToast?.id ?? 0) + 1,
      message: SAME_LOCATION_MESSAGE,
    }));
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (destinationId) {
      router.replace({
        pathname: "/home",
        params: destinationParams,
      });
    } else {
      router.replace("/home");
    }
  };

  const handleSelectCurrentLocation = async () => {
    if (!destinationId) return;

    let coordinate: MapCoordinate = currentLocation.coordinate;

    const mapLibre = getMapLibre();
    if (mapLibre) {
      try {
        const hasPermission =
          await mapLibre.LocationManager.requestPermissions();
        if (hasPermission) {
          const position = await mapLibre.LocationManager.getCurrentPosition();
          if (position) {
            coordinate = [position.coords.longitude, position.coords.latitude];
          }
        }
      } catch {
        // Fall back to default coordinate
      }
    }

    if (areSameLocation(coordinate, destination?.coordinate)) {
      showSameLocationToast();
      return;
    }

    router.replace({
      pathname: "/home",
      params: {
        ...destinationParams,
        startLat: String(coordinate[1]),
        startLng: String(coordinate[0]),
        startTitle: "Current Location",
      },
    });
  };

  const handleSelectStart = (start: ApiPlace) => {
    if (!destinationId) return;

    if (start.latitude == null || start.longitude == null) return;
    const coordinate: MapCoordinate = [start.longitude, start.latitude];

    if (areSameLocation(coordinate, destination?.coordinate)) {
      showSameLocationToast();
      return;
    }

    if (session?.accessToken) {
      saveRecentPlace(start, session.accessToken).catch(() => undefined);
    }

    router.replace({
      pathname: "/home",
      params: {
        ...destinationParams,
        startId: start.id,
        startLat: String(start.latitude),
        startLng: String(start.longitude),
        startTitle: start.title,
      },
    });
  };

  const isSearching = query.trim().length >= 2;

  const handleSwapRoutePoints = () => {
    if (!destination) return;
    router.replace({
      pathname: '/home/search',
      params: {
        startLat: String(destination.coordinate[1]),
        startLng: String(destination.coordinate[0]),
        startTitle: destination.title,
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.backgroundElement }]}
    >
      <View style={styles.routeSelector}>
        <AppButton
          accessibilityLabel="Go back"
          hitSlop={Spacing.one}
          onPress={handleBack}
          pressedOpacity={0.7}
          style={[styles.backButton, styles.backButtonContainer]}
          variant="ghost"
        >
          <AntDesign name="arrow-left" size={20} color={theme.primary} />
        </AppButton>
        <View style={styles.routeFields}>
          <View style={[styles.startInputContainer, {
            backgroundColor: theme.background, borderColor: theme.primary, borderWidth: 1,
          }]}>
            <AntDesign name="pushpin" size={17} color={theme.text} />
        <TextInput
          accessibilityLabel="Search starting point"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          clearButtonMode="while-editing"
          onChangeText={setQuery}
          placeholder="Your starting point..."
          placeholderTextColor={theme.placeholder}
          returnKeyType="search"
          style={[styles.searchPrompt, { color: theme.text }]}
          value={query}
        />
          </View>

      {destination ? (
        <>
          <View pointerEvents="none" style={styles.inputConnector}>
            {[0, 1, 2].map((dot) => (
              <View key={dot} style={[styles.inputConnectorDot, { backgroundColor: theme.placeholder }]} />
            ))}
          </View>
        <View style={[styles.destinationRow, { backgroundColor: theme.background, borderColor: 'transparent' }]}>
          <AntDesign name="pushpin" size={17} color={theme.danger} />
          <Text
            numberOfLines={1}
            style={[styles.destinationText, { color: theme.text }]}
          >
            {destination.title}
          </Text>
        </View>
        </>
      ) : null}
        </View>
        <AppButton
          accessibilityLabel="Swap starting point and destination"
          disabled={!destination}
          onPress={handleSwapRoutePoints}
          style={styles.backButton}
          variant="ghost"
        >
          <AntDesign name="swap" size={18} color={theme.primary} style={{ transform: [{ rotate: '90deg' }] }} />
        </AppButton>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.list}
      >
        {!isSearching ? (
          <AppButton
            accessibilityLabel="Use current location"
            onPress={handleSelectCurrentLocation}
            pressedOpacity={0.72}
            style={[styles.currentLocationRow, { borderColor: theme.border }]}
            variant="ghost"
          >
            <View
              style={[
                styles.currentIconCircle,
                { backgroundColor: theme.backgroundSelected },
              ]}
            >
              <AntDesign name="usb" size={22} color={theme.primary} />
            </View>
            <View style={styles.locationCopy}>
              <Text style={[styles.locationTitle, { color: theme.text }]}>
                Current Location
              </Text>
              <Text
                style={[
                  styles.locationSubtitle,
                  { color: theme.textSecondary },
                ]}
              >
                Using GPS accuracy
              </Text>
            </View>
            <AntDesign name="arrow-right" size={18} color={theme.primary} />
          </AppButton>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: theme.primary }]}>
            {isSearching ? "Search results" : "Recents"}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={theme.primary} style={styles.loading} />
        ) : null}
        {!isLoading && error ? (
          <Text
            accessibilityRole="alert"
            style={[styles.emptyCopy, { color: theme.textSecondary }]}
          >
            {error}
          </Text>
        ) : null}
        {!isLoading && !error && startLocations.length === 0 ? (
          <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>
            {isSearching
              ? "No starting points found."
              : "No saved or recent starting points."}
          </Text>
        ) : null}
        {!isLoading &&
          startLocations.map((location) => (
            <AppButton
              accessibilityLabel={location.title}
              key={location.id}
              onPress={() => handleSelectStart(location)}
              pressedOpacity={0.72}
              style={[styles.locationRow, { borderColor: theme.border }]}
              variant="ghost"
            >
              <View
                style={[
                  styles.recentIconCircle,
                  { backgroundColor: theme.background },
                ]}
              >
                <AntDesign name="clock-circle" size={18} color={theme.text} />
              </View>
              <View style={styles.locationCopy}>
                <Text style={[styles.locationTitle, { color: theme.text }]}>
                  {location.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.locationSubtitle,
                    { color: theme.placeholder },
                  ]}
                >
                  {location.address}
                </Text>
              </View>
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
  inputConnectorDot: {
    width: 2,
    height: 2,
    borderRadius: Rounded.round,
  },
  inputConnector: {
    width: 16,
    height: Spacing.five,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginLeft: Spacing.four,
    paddingVertical: 2,
  },
  startInputContainer: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingLeft: Spacing.four,
    borderRadius: Rounded.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  routeFields: {
    flex: 1,
    minWidth: 0,
  },
  backButtonContainer: {
    width: 36,
    height: 36,
    minHeight: 36,
    alignSelf: 'flex-start',
  },
  routeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: 5,
    marginTop: Spacing.three,
  },
  screen: {
    flex: 1,
  },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: Rounded.md,
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
  destinationLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  destinationText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 700,
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
    paddingVertical: Spacing.two,
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
    fontSize: 18,
    fontWeight: 900,
  },
  sectionHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loading: { paddingVertical: Spacing.four },
  emptyCopy: {
    paddingVertical: Spacing.four,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  sectionLabel: {
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
    paddingVertical: Spacing.two * 1.1,
  },
  recentIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  locationTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 600,
  },
  locationSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
  },
  arrowIcon: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 600,
  },
});
