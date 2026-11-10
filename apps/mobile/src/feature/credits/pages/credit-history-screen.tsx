import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateFilterSortList } from '@/components/date-filter-sort-list';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGetWallet } from '../hooks/use-wallet';

import { CreditScreenHeader } from '../components/credit-screen-header';
import { TransactionList, type CreditTransaction } from '../components/transaction-list';

export interface CreditTransactionItem extends CreditTransaction {
  createdAt: string;
}

const DEFAULT_TRANSACTIONS: CreditTransactionItem[] = [
  {
    id: '1',
    type: 'transaction',
    name: 'Gia hạn gói Pro',
    title: 'Gia hạn gói Pro',
    amount: -129000,
    timestamp: '01 Th08 2026, 10:30',
    createdAt: '2026-08-01T10:30:00.000Z',
  },
  {
    id: '2',
    type: 'transaction',
    name: 'Nâng cấp lên gói Pro',
    title: 'Nâng cấp lên gói Pro',
    amount: -129000,
    timestamp: '15 Th07 2026, 14:20',
    createdAt: '2026-07-15T14:20:00.000Z',
  },
  {
    id: '3',
    type: 'transaction',
    name: 'Nạp tiền lần 1',
    title: 'Nạp tiền lần 1',
    amount: 100000,
    timestamp: '01 Th07 2026, 09:00',
    createdAt: '2026-07-01T09:00:00.000Z',
  },
  {
    id: '4',
    type: 'transaction',
    name: 'Thưởng đóng góp biển báo',
    title: 'Thưởng đóng góp biển báo',
    amount: 25000,
    timestamp: '20 Th06 2026, 16:45',
    createdAt: '2026-06-20T16:45:00.000Z',
  },
  {
    id: '5',
    type: 'transaction',
    name: 'Xác thực biển báo thành công',
    title: 'Xác thực biển báo thành công',
    amount: 10000,
    timestamp: '10 Th06 2026, 11:15',
    createdAt: '2026-06-10T11:15:00.000Z',
  },
];

export function CreditHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: walletData } = useGetWallet();

  const transactions: CreditTransactionItem[] = useMemo(() => {
    const apiTransactions = walletData?.recentTransactions;
    if (apiTransactions && apiTransactions.length > 0) {
      return apiTransactions.map((t) => ({
        id: t.id,
        title: t.description || t.transactionType,
        name: t.description || t.transactionType,
        amount: t.amount,
        createdAt: t.createdAt,
        timestamp: new Date(t.createdAt).toLocaleString('vi-VN'),
        date: new Date(t.createdAt).toLocaleString('vi-VN'),
        detail: t.referenceType ? `${t.referenceType}` : undefined,
      }));
    }
    return DEFAULT_TRANSACTIONS;
  }, [walletData?.recentTransactions]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <CreditScreenHeader onBack={() => router.back()} title="Lịch sử Credits" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DateFilterSortList<CreditTransactionItem>
          items={transactions}
          getDate={(item) => item.createdAt}
          headerTitle="Lọc theo ngày"
          startDateLabel="Từ ngày"
          endDateLabel="Đến ngày"
          showPresets
          showSortToggle
          showCountBadge
        >
          {({ items }) => (
            items.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                  Không có giao dịch nào trong khoảng thời gian này
                </Text>
              </View>
            ) : (
              <View style={styles.listWrapper}>
                <TransactionList transactions={items} />
              </View>
            )
          )}
        </DateFilterSortList>
      </ScrollView>
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
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  listWrapper: {
    marginTop: Spacing.two,
  },
  emptyCard: {
    marginTop: Spacing.two,
    padding: Spacing.five,
    borderWidth: 1,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
});
