import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Sample sign image from assets
const SIGN_IMAGE = require('@/assets/images/smaple_signs/stop_sign.webp');

type RecordedSign = {
  id: string;
  name: string;
  timestamp: string;
};

const RECORDED_SIGNS: RecordedSign[] = [
  {
    id: '1',
    name: 'Stop Sign',
    timestamp: '09:14 AM',
  },
  {
    id: '2',
    name: 'No Entry Sign',
    timestamp: '09:21 AM',
  },
  {
    id: '3',
    name: 'Speed Limit 40',
    timestamp: '09:35 AM',
  },
];

export function RecordedSignsScreen() {
  const router = useRouter();
  const theme = useTheme();

  function handleSubmit() {
    // TODO: integrate with actual submission API
    router.back();
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
          <AppButton
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            pressedOpacity={0.6}
            style={styles.backButton}
            variant="ghost"
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
          </AppButton>
          <View style={styles.topBarTitle}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>Recorded Signs</Text>
            <Text style={[styles.screenSubtitle, { color: theme.grey }]}>
              {RECORDED_SIGNS.length} signs captured this session
            </Text>
          </View>
        </View>

        {/* Sign tile list */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {RECORDED_SIGNS.map((sign) => (
            <View
              key={sign.id}
              style={[
                styles.signTile,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={[styles.signImageWrapper, { backgroundColor: `${theme.grey}10` }]}>
                <Image
                  accessibilityLabel={sign.name}
                  resizeMode="contain"
                  source={SIGN_IMAGE}
                  style={styles.signImage}
                />
              </View>
              <View style={styles.signInfo}>
                <Text style={[styles.signName, { color: theme.text }]}>{sign.name}</Text>
                <View style={styles.signMeta}>
                  <MaterialCommunityIcons color={theme.grey} name="clock-outline" size={14} />
                  <Text style={[styles.signTimestamp, { color: theme.grey }]}>
                    Captured at {sign.timestamp}
                  </Text>
                </View>
                <View style={[styles.signBadge, { backgroundColor: '#10B98118' }]}>
                  <MaterialCommunityIcons color="#10B981" name="check-circle-outline" size={13} />
                  <Text style={[styles.signBadgeText, { color: '#10B981' }]}>Livestream capture</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Sticky bottom area */}
        <View
          style={[
            styles.bottomArea,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.noticeText, { color: '#EF4444' }]}>
            ⚠ The recorded signs will be submitted every 1 hour or you can submit it now
          </Text>
          <AppButton
            accessibilityLabel="Submit recorded signs"
            label="Submit Now"
            onPress={handleSubmit}
            style={styles.submitButton}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  backButton: {
    width: 40,
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    gap: 2,
  },
  screenTitle: {
    fontFamily: Fonts.title,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  screenSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  signTile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Rounded.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  signImageWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signImage: {
    width: 80,
    height: 80,
  },
  signInfo: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  signName: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  signMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signTimestamp: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  signBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: Spacing.one,
    paddingVertical: 3,
    borderRadius: Rounded.round,
  },
  signBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  bottomArea: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    borderTopWidth: 1,
    gap: Spacing.three,
  },
  noticeText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },
  submitButton: {
    width: '100%',
    shadowColor: '#0671eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
});
