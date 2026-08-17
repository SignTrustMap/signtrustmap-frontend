import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { CreditTransaction } from '../data/mock-credit-data';

export function TransactionList({ transactions }: { transactions: CreditTransaction[] }) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {transactions.map((transaction, index) => (
        <View
          key={transaction.id}
          style={[
            styles.row,
            index < transactions.length - 1 ? { borderBottomColor: theme.border, borderBottomWidth: 1 } : null,
          ]}
        >
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>{transaction.title}</Text>
            <Text numberOfLines={1} style={[styles.detail, { color: theme.placeholder }]}>
              {transaction.date}{transaction.detail ? ` · ${transaction.detail}` : ''}
            </Text>
          </View>
          <Text style={[styles.amount, { color: transaction.amount >= 0 ? '#087A3D' : '#C62929' }]}>
            {formatCreditAmount(transaction.amount)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function formatCreditAmount(amount: number) {
  const sign = amount >= 0 ? '+' : '−';
  return `${sign} ${Math.abs(amount).toFixed(2)}`;
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: Rounded.lg,
  },
  row: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 800,
  },
  detail: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
  },
  amount: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 900,
  },
});
