import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CreditScreenHeader } from '../components/credit-screen-header';
import { TransactionList } from '../components/transaction-list';
import { creditHistoryGroups } from '../data/mock-credit-data';

export function CreditHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <CreditScreenHeader onBack={() => router.back()} title="Credit History" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.dateFields}>
          <DateField label="From date" value="01 Aug 2026" />
          <DateField label="To date" value="17 Aug 2026" />
        </View>
        {creditHistoryGroups.map((group) => (
          <View key={group.label} style={styles.group}>
            <Text style={[styles.groupLabel, { color: theme.placeholder }]}>{group.label}</Text>
            <TransactionList transactions={group.transactions} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function DateField({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.dateField}>
      <Text style={[styles.dateLabel, { color: theme.placeholder }]}>{label}</Text>
      <AppButton
        accessibilityLabel={`${label}: ${value}`}
        style={[styles.dateButton, { borderColor: theme.border }]}
        variant="surface"
      >
        <Text style={[styles.calendarIcon, { color: theme.tertiary }]}>▣</Text>
        <Text numberOfLines={1} style={[styles.dateValue, { color: theme.text }]}>{value}</Text>
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  dateFields: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  dateField: {
    flex: 1,
    gap: Spacing.one,
  },
  dateLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  dateButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: Rounded.md,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  calendarIcon: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 900,
  },
  dateValue: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  group: {
    gap: Spacing.two,
  },
  groupLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 0.8,
  },
});
