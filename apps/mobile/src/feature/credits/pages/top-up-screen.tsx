import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CreditScreenHeader } from '../components/credit-screen-header';
import {
  useGetWallet,
  useGetTopUpPackages,
  useGetPaymentMethods,
  useTopUp,
} from '../hooks/use-wallet';

export function TopUpScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { amount: amountParam } = useLocalSearchParams<{ amount?: string }>();
  const customAmount = Number(amountParam);
  const initialAmount = Number.isFinite(customAmount) && customAmount > 0 ? customAmount : null;
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [customCredit, setCustomCredit] = useState<number | null>(initialAmount);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const { data: walletData } = useGetWallet();
  const { data: packages = [], isLoading: loadingPackages } = useGetTopUpPackages();
  const { data: paymentMethods = [], isLoading: loadingMethods } = useGetPaymentMethods();
  const { mutateAsync: topUp, isPending: isConfirming } = useTopUp();

  const balance = walletData?.wallet?.balance ?? 0;

  // Effective selected method (default to first if none chosen)
  const effectiveMethodId = paymentMethodId ?? paymentMethods[0]?.id ?? null;
  const selectedMethod = useMemo(
    () => paymentMethods.find((m) => m.id === effectiveMethodId),
    [paymentMethods, effectiveMethodId],
  );

  // Resolve which package/amount will be paid
  const effectivePackage = packages.find((p) => p.id === selectedPackageId);
  const displayAmount = effectivePackage?.creditAmount ?? customCredit ?? 0;

  const handleConfirm = async () => {
    setConfirmError(null);
    try {
      if (effectivePackage) {
        await topUp({ packageId: effectivePackage.id });
      }
      setConfirmSuccess(true);
      setTimeout(() => router.replace('/credits'), 1200);
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : 'Payment failed. Please try again.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <CreditScreenHeader onBack={() => router.back()} title="Top Up Credits" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current balance */}
        <View style={[styles.balancePanel, { backgroundColor: theme.backgroundSelected }]}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Current balance</Text>
          <Text style={[styles.balanceValue, { color: theme.text }]}>
            {balance} <Text style={styles.balanceUnit}>credits</Text>
          </Text>
        </View>

        {/* Package selection */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Select amount</Text>
        {loadingPackages ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <View style={styles.amountRow}>
            {packages.map((pkg) => {
              const selected = selectedPackageId === pkg.id;
              return (
                <AppButton
                  key={pkg.id}
                  label={`${pkg.creditAmount}`}
                  onPress={() => {
                    setSelectedPackageId(pkg.id);
                    setCustomCredit(null);
                  }}
                  style={[
                    styles.amountButton,
                    {
                      backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                      borderColor: selected ? theme.primary : theme.border,
                    },
                  ]}
                  textStyle={{ color: theme.text }}
                  variant="surface"
                />
              );
            })}
          </View>
        )}
        <AppButton
          onPress={() => router.push('/credits/custom-amount')}
          style={[styles.customAmountButton, { borderColor: theme.border }]}
          variant="surface"
        >
          <Text style={[styles.customAmountIcon, { color: theme.primary }]}>＋</Text>
          <Text style={[styles.customAmountText, { color: theme.text }]}>
            {customCredit ? `Custom: ${customCredit} credits selected` : 'Enter custom amount'}
          </Text>
        </AppButton>

        {/* Payment methods */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment method</Text>
        <View style={[styles.paymentCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {loadingMethods ? (
            <ActivityIndicator color={theme.primary} style={{ padding: Spacing.four }} />
          ) : paymentMethods.length === 0 ? (
            <Text style={[styles.emptyMethods, { color: theme.placeholder }]}>
              No saved payment methods
            </Text>
          ) : (
            paymentMethods.map((method, index) => {
              const selected = method.id === effectiveMethodId;
              const label = `${method.cardBrand} ···· ${method.cardLast4}`;
              const detail = `Expires ${method.expiryMonth}/${method.expiryYear}`;
              return (
                <AppButton
                  accessibilityLabel={`Pay with ${label}`}
                  key={method.id}
                  onPress={() => setPaymentMethodId(method.id)}
                  style={[
                    styles.paymentRow,
                    index < paymentMethods.length - 1
                      ? { borderBottomColor: theme.border, borderBottomWidth: 1 }
                      : null,
                  ]}
                  variant="ghost"
                >
                  <View style={[styles.methodIcon, { backgroundColor: theme.backgroundSelected }]}>
                    <Text style={[styles.methodSymbol, { color: theme.primary }]}>▰</Text>
                  </View>
                  <View style={styles.methodCopy}>
                    <Text style={[styles.methodLabel, { color: theme.text }]}>{label}</Text>
                    <Text style={[styles.methodDetail, { color: theme.placeholder }]}>{detail}</Text>
                  </View>
                  <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.border }]}>
                    {selected ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
                  </View>
                </AppButton>
              );
            })
          )}
          <AppButton
            label="＋  Add new payment method"
            onPress={() => router.push('/credits/add-card')}
            style={styles.addMethodButton}
            textStyle={{ color: theme.primary }}
            variant="ghost"
          />
        </View>

        {/* Error / success feedback */}
        {confirmError ? (
          <Text style={[styles.feedbackText, { color: theme.danger ?? '#C62929' }]}>{confirmError}</Text>
        ) : null}
        {confirmSuccess ? (
          <Text style={[styles.feedbackText, { color: '#087A3D' }]}>
            ✓ Top-up order placed! Redirecting…
          </Text>
        ) : null}
      </ScrollView>

      <SafeAreaView
        edges={['bottom']}
        style={[styles.footer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      >
        <AppButton
          accessibilityLabel={`Pay ${displayAmount} credits with ${selectedMethod ? `${selectedMethod.cardBrand} ···· ${selectedMethod.cardLast4}` : 'selected payment method'}`}
          disabled={displayAmount <= 0 || isConfirming || confirmSuccess}
          label={
            isConfirming
              ? 'Processing…'
              : `Confirm and pay  (${displayAmount} credits)`
          }
          onPress={handleConfirm}
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
  emptyMethods: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 500,
    padding: Spacing.three,
    textAlign: 'center',
  },
  feedbackText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'center',
    paddingVertical: Spacing.one,
  },
});
