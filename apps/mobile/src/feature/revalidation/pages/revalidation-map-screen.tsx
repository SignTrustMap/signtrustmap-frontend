import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '@/components/ui/button';
import { Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RouteSign } from '@/api/navigation/navigation';
import type { MapCoordinate } from '@/types/navigationType';
import type { FindSignsInBoundsParams } from '@/types/signMapType';
import { useGetSignsInBounds } from '@/feature/navigation/hooks/use-signs';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';

import { RevalidationMapView } from '../components/revalidation-map-view';
import { getFreshnessInfo } from '../components/revalidation-sign-marker';
import { RevalidationSignDetailsCard } from '../components/revalidation-sign-details-card';

type FreshnessFilter = 'ALL' | 'NEEDS_REVALIDATION' | 'MODERATE' | 'FRESH';

export function RevalidationMapScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [bounds, setBounds] = useState<FindSignsInBoundsParams>();
  const [selectedSign, setSelectedSign] = useState<RouteSign | null>(null);
  const [userCoordinate, setUserCoordinate] = useState<MapCoordinate>();
  const [focusCoordinate, setFocusCoordinate] = useState<MapCoordinate>();
  const [focusRequestId, setFocusRequestId] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FreshnessFilter>('ALL');

  // Fetch verified signs within current map bounds
  const { data: rawSigns = [] } = useGetSignsInBounds(bounds, true);

  // Initial user location fetch
  useEffect(() => {
    let isMounted = true;
    void fetchFreshGpsPosition().then((pos) => {
      if (isMounted && pos) {
        setUserCoordinate(pos);
        setFocusCoordinate(pos);
        setFocusRequestId((prev) => prev + 1);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRecenter = useCallback(() => {
    if (userCoordinate) {
      setFocusCoordinate(userCoordinate);
      setFocusRequestId((prev) => prev + 1);
    } else {
      void fetchFreshGpsPosition().then((pos) => {
        if (pos) {
          setUserCoordinate(pos);
          setFocusCoordinate(pos);
          setFocusRequestId((prev) => prev + 1);
        }
      });
    }
  }, [userCoordinate]);

  const handleSignPress = useCallback((sign: RouteSign) => {
    setSelectedSign((prev) => (prev?.id === sign.id ? null : sign));
    setFocusCoordinate(sign.coordinate);
    setFocusRequestId((prev) => prev + 1);
  }, []);

  // Filter signs based on active freshness tab
  const filteredSigns = useMemo(() => {
    return rawSigns.filter((sign) => {
      const { isStale, isModerate, isFresh } = getFreshnessInfo(sign);
      if (activeFilter === 'NEEDS_REVALIDATION') return isStale;
      if (activeFilter === 'MODERATE') return isModerate;
      if (activeFilter === 'FRESH') return isFresh;
      return true;
    });
  }, [rawSigns, activeFilter]);

  // Statistics for header summary
  const staleCount = useMemo(() => {
    return rawSigns.filter((s) => getFreshnessInfo(s).isStale).length;
  }, [rawSigns]);

  const handleRevalidateAction = (sign: RouteSign) => {
    // =========================================================================
    // TODO: Implement action API call (submit revalidation evidence / trigger re-evaluation task)
    // once the backend APIs are provided.
    // Example: await submitRevalidationEvidence(sign.id, { latitude, longitude, image });
    // =========================================================================
    console.log('[Revalidation] Action triggered for sign:', sign.id, sign.signCode);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Interactive Map (No destination search bar) */}
      <RevalidationMapView
        focusCoordinate={focusCoordinate}
        focusRequestId={focusRequestId}
        onBoundsChange={setBounds}
        onSignPress={handleSignPress}
        selectedSignId={selectedSign?.id}
        signs={filteredSigns}
        userCoordinate={userCoordinate}
      />

      {/* Floating Header UI */}
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.topOverlay}>
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              shadowColor: '#09233C',
            },
          ]}
        >
          <View style={styles.headerTopRow}>
            {/* Back Button */}
            <AppButton
              accessibilityLabel="Back to Work"
              onPress={() => router.back()}
              style={styles.backButton}
              variant="ghost"
            >
              <MaterialCommunityIcons color={theme.text} name="arrow-left" size={22} />
            </AppButton>

            {/* Header Titles */}
            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Revalidation Map</Text>
              <Text style={[styles.headerSubtitle, { color: theme.grey }]}>
                {rawSigns.length > 0
                  ? `${rawSigns.length} signs in view · ${staleCount} need re-evaluation`
                  : 'Pan map to inspect sign freshness'}
              </Text>
            </View>

            {/* Recenter GPS Button */}
            <AppButton
              accessibilityLabel="Recenter map to my location"
              onPress={handleRecenter}
              style={[styles.iconButton, { backgroundColor: theme.backgroundSelected }]}
              variant="ghost"
            >
              <MaterialCommunityIcons color={theme.primary} name="crosshairs-gps" size={20} />
            </AppButton>
          </View>

          {/* Freshness Filter Chips */}
          <View style={styles.filterRow}>
            <AppButton
              accessibilityLabel="Show all signs"
              onPress={() => setActiveFilter('ALL')}
              style={[
                styles.filterChip,
                activeFilter === 'ALL' && [styles.filterChipActive, { backgroundColor: theme.primary }],
              ]}
              variant="ghost"
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: activeFilter === 'ALL' ? '#FFFFFF' : theme.text },
                ]}
              >
                All ({rawSigns.length})
              </Text>
            </AppButton>

            <AppButton
              accessibilityLabel="Show signs needing re-evaluation"
              onPress={() => setActiveFilter('NEEDS_REVALIDATION')}
              style={[
                styles.filterChip,
                activeFilter === 'NEEDS_REVALIDATION' && [
                  styles.filterChipActive,
                  { backgroundColor: '#EF4444' },
                ],
              ]}
              variant="ghost"
            >
              <MaterialCommunityIcons
                color={activeFilter === 'NEEDS_REVALIDATION' ? '#FFFFFF' : '#EF4444'}
                name="alert-circle"
                size={14}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: activeFilter === 'NEEDS_REVALIDATION' ? '#FFFFFF' : '#EF4444' },
                ]}
              >
                Needs Re-eval ({staleCount})
              </Text>
            </AppButton>

            <AppButton
              accessibilityLabel="Show moderate signs"
              onPress={() => setActiveFilter('MODERATE')}
              style={[
                styles.filterChip,
                activeFilter === 'MODERATE' && [
                  styles.filterChipActive,
                  { backgroundColor: '#F59E0B' },
                ],
              ]}
              variant="ghost"
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: activeFilter === 'MODERATE' ? '#FFFFFF' : theme.text },
                ]}
              >
                Moderate
              </Text>
            </AppButton>

            <AppButton
              accessibilityLabel="Show fresh signs"
              onPress={() => setActiveFilter('FRESH')}
              style={[
                styles.filterChip,
                activeFilter === 'FRESH' && [
                  styles.filterChipActive,
                  { backgroundColor: '#10B981' },
                ],
              ]}
              variant="ghost"
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: activeFilter === 'FRESH' ? '#FFFFFF' : theme.text },
                ]}
              >
                Fresh
              </Text>
            </AppButton>
          </View>
        </View>
      </SafeAreaView>

      {/* Selected Sign Details Bottom Card */}
      {selectedSign ? (
        <RevalidationSignDetailsCard
          onClose={() => setSelectedSign(null)}
          onRevalidate={handleRevalidateAction}
          sign={selectedSign}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
  },
  headerCard: {
    borderRadius: Rounded.lg ?? 16,
    padding: Spacing.three,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: Spacing.two,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(150, 150, 150, 0.12)',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#0671eb',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
