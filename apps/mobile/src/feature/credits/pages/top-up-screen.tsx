import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CreditScreenHeader } from '../components/credit-screen-header';
import { paymentMethods, walletSummary } from '../data/mock-credit-data';

const presetAmounts = [100, 500, 1000];

export function TopUpScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { amount: amountParam } = useLocalSearchParams<{ amount?: string }>();
  const customAmount = Number(amountParam);
  const initialAmount = Number.isFinite(customAmount) && customAmount > 0 ? customAmount : 500;
  const [amount, setAmount] = useState(initialAmount);
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0].id);
  const selectedMethod = useMemo(
    () => paymentMethods.find((method) => method.id === paymentMethodId),
    [paymentMethodId],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <CreditScreenHeader onBack={() => router.back()} title="Top Up Credits" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.balancePanel, { backgroundColor: theme.backgroundSelected }]}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Current balance</Text>
          <Text style={[styles.balanceValue, { color: theme.text }]}>
            {walletSummary.balance} <Text style={styles.balanceUnit}>credits</Text>
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Select amount</Text>
        <View style={styles.amountRow}>
          {presetAmounts.map((preset) => {
            const selected = amount === preset;
            return (
              <AppButton
                key={preset}
                label={`${preset}`}
                onPress={() => setAmount(preset)}
                style={[
                  styles.amountButton,
                  {
                    backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                    borderColor: selected ? theme.tertiary : theme.border,
                  },
                ]}
                textStyle={{ color: theme.text }}
                variant="surface"
              />
            );
          })}
        </View>
        <AppButton
          onPress={() => router.push('/(driver)/credits/custom-amount')}
          style={[styles.customAmountButton, { borderColor: theme.border }]}
          variant="surface"
        >
          <Text style={[styles.customAmountIcon, { color: theme.tertiary }]}>＋</Text>
          <Text style={[styles.customAmountText, { color: theme.text }]}>Enter custom amount</Text>
        </AppButton>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment method</Text>
        <View style={[styles.paymentCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {paymentMethods.map((method, index) => {
            const selected = method.id === paymentMethodId;
            return (
              <AppButton
                accessibilityLabel={`Pay with ${method.label}`}
                key={method.id}
                onPress={() => setPaymentMethodId(method.id)}
                style={[
                  styles.paymentRow,
                  index < paymentMethods.length - 1 ? { borderBottomColor: theme.border, borderBottomWidth: 1 } : null,
                ]}
                variant="ghost"
              >
                <View style={[styles.methodIcon, { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={[styles.methodSymbol, { color: theme.tertiary }]}>{method.symbol}</Text>
                </View>
                <View style={styles.methodCopy}>
                  <Text style={[styles.methodLabel, { color: theme.text }]}>{method.label}</Text>
                  {method.detail ? (
                    <Text style={[styles.methodDetail, { color: theme.placeholder }]}>{method.detail}</Text>
                  ) : null}
                </View>
                <View style={[styles.radio, { borderColor: selected ? theme.tertiary : theme.border }]}>
                  {selected ? <View style={[styles.radioDot, { backgroundColor: theme.tertiary }]} /> : null}
                </View>
              </AppButton>
            );
          })}
          <AppButton
            label="＋  Add new payment method"
            onPress={() => router.push('/(driver)/credits/add-card')}
            style={styles.addMethodButton}
            textStyle={{ color: theme.tertiary }}
            variant="ghost"
          />
        </View>
      </ScrollView>
      <SafeAreaView
        edges={['bottom']}
        style={[styles.footer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      >
        <AppButton
          accessibilityLabel={`Pay ${amount} credits with ${selectedMethod?.label ?? 'selected payment method'}`}
          label={`Confirm and pay  (${amount.toFixed(2)} credits)`}
          onPress={() => router.replace('/(driver)/credits')}
          style={styles.payButton}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  balancePanel: {
    minHeight: 116,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  balanceLabel: { fontFamily: Fonts.body, fontSize: 14, fontWeight: 700 },
  balanceValue: { fontFamily: Fonts.body, fontSize: 30, fontWeight: 900 },
  balanceUnit: { fontSize: 17, fontWeight: 700 },
  sectionTitle: { fontFamily: Fonts.body, fontSize: 19, fontWeight: 900, marginTop: Spacing.one },
  amountRow: { flexDirection: 'row', gap: Spacing.two },
  amountButton: { flex: 1, borderWidth: 2 },
  customAmountButton: {
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.two,
  },
  customAmountIcon: { fontFamily: Fonts.body, fontSize: 20, fontWeight: 900 },
  customAmountText: { fontFamily: Fonts.body, fontSize: 15, fontWeight: 700 },
  paymentCard: { overflow: 'hidden', borderWidth: 1, borderRadius: Rounded.lg },
  paymentRow: {
    minHeight: 76,
    borderRadius: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  methodIcon: { width: 44, height: 44, borderRadius: Rounded.md, alignItems: 'center', justifyContent: 'center' },
  methodSymbol: { fontFamily: Fonts.body, fontSize: 17, fontWeight: 900 },
  methodCopy: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: 2 },
  methodLabel: { fontFamily: Fonts.body, fontSize: 14, fontWeight: 800 },
  methodDetail: { fontFamily: Fonts.body, fontSize: 12, fontWeight: 600 },
  radio: { width: 22, height: 22, borderWidth: 2, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  addMethodButton: { minHeight: 54, alignItems: 'flex-start', paddingHorizontal: Spacing.three },
  footer: { borderTopWidth: 1, padding: Spacing.four, paddingTop: Spacing.two },
  payButton: { width: '100%', maxWidth: 600, alignSelf: 'center' },
});
