import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { TransactionList } from '../components/transaction-list';
import { recentCreditTransactions, walletSummary } from '../data/mock-credit-data';

export function CreditsOverviewScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.balanceCard, { backgroundColor: theme.tertiary }]}>
            <Text style={[styles.balanceLabel, { color: theme.onTertiary }]}>Current balance</Text>
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceValue, { color: theme.onTertiary }]}>
                {walletSummary.balance}
              </Text>
              <Text style={[styles.balanceUnit, { color: theme.onTertiary }]}>credits</Text>
            </View>
            <View style={styles.balanceMetaRow}>
              <View>
                <Text style={styles.metaLabel}>STATUS</Text>
                <Text style={styles.metaValue}>{walletSummary.status}</Text>
              </View>
              <View style={styles.metaRight}>
                <Text style={styles.metaLabel}>NEXT PAYOUT</Text>
                <Text style={styles.metaValue}>{walletSummary.nextPayout}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent activity</Text>
            <AppButton
              accessibilityLabel="View all credit activity"
              label="View all"
              onPress={() => router.push('/credits/history')}
              style={styles.viewAllButton}
              textStyle={{ color: theme.tertiary }}
              variant="ghost"
            />
          </View>
          <TransactionList transactions={recentCreditTransactions} />
          <AppButton
          label="＋  Add credits"
            onPress={() => router.push('/credits/top-up')}
            style={styles.addButton}
          />
        </ScrollView>
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
  scrollContent: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
  },
  balanceCard: {
    minHeight: 188,
    borderRadius: Rounded.lg,
    justifyContent: 'space-between',
    padding: Spacing.four,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  balanceLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 800,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  balanceValue: {
    fontFamily: Fonts.title,
    fontSize: 42,
    fontWeight: 900,
  },
  balanceUnit: {
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: 800,
  },
  balanceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 800,
  },
  metaValue: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 900,
    marginTop: 3,
  },
  sectionHeading: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: 900,
  },
  viewAllButton: {
    minHeight: 40,
    paddingHorizontal: 0,
  },
  addButton: {
    marginTop: Spacing.one,
  },
});
