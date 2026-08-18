import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CreditScreenHeader } from '../components/credit-screen-header';
import { walletSummary } from '../data/mock-credit-data';

export function CustomAmountScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [amount, setAmount] = useState('75');
  const numericAmount = Number(amount) || 0;

  const addAmount = (increment: number) => {
    setAmount(String(numericAmount + increment));
  };

  const continueToPayment = () => {
    if (numericAmount <= 0) return;
    router.replace({ pathname: '/credits/top-up', params: { amount } });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <CreditScreenHeader onBack={() => router.back()} title="Custom Amount" />
      <View style={styles.content}>
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Current balance</Text>
          <Text style={[styles.balanceValue, { color: theme.text }]}>
            {walletSummary.balance} credits
          </Text>
        </View>
        <View style={styles.amountEntry}>
          <Text style={[styles.customLabel, { color: theme.textSecondary }]}>Custom amount</Text>
          <View style={[styles.inputRow, { borderColor: theme.tertiary }]}>
            <Text style={[styles.currency, { color: theme.text }]}>C</Text>
            <TextInput
              accessibilityLabel="Custom credit amount"
              autoFocus
              keyboardType="number-pad"
              onChangeText={(value) => setAmount(value.replace(/[^0-9]/g, ''))}
              selectionColor={theme.tertiary}
              style={[styles.input, { color: theme.text }]}
              value={amount}
            />
          </View>
          <View style={styles.incrementRow}>
            {[5, 10, 20].map((increment) => (
              <AppButton
                key={increment}
                label={`+${increment}`}
                onPress={() => addAmount(increment)}
                style={[styles.incrementButton, { borderColor: theme.border }]}
                textStyle={{ color: theme.textSecondary }}
                variant="surface"
              />
            ))}
          </View>
        </View>
      </View>
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <AppButton
          disabled={numericAmount <= 0}
          label={`Continue with ${numericAmount.toFixed(2)} credits`}
          onPress={continueToPayment}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: Spacing.four,
  },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontFamily: Fonts.body, fontSize: 14, fontWeight: 700 },
  balanceValue: { fontFamily: Fonts.body, fontSize: 18, fontWeight: 900 },
  amountEntry: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  customLabel: { fontFamily: Fonts.body, fontSize: 15, fontWeight: 700 },
  inputRow: {
    width: '72%',
    maxWidth: 360,
    borderBottomWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: { width: 48, fontFamily: Fonts.body, fontSize: 30, fontWeight: 900 },
  input: { flex: 1, paddingVertical: Spacing.one, fontFamily: Fonts.body, fontSize: 38, fontWeight: 900, textAlign: 'center' },
  incrementRow: { flexDirection: 'row', gap: Spacing.one },
  incrementButton: { minHeight: 36, borderWidth: 1, borderRadius: Rounded.lg, paddingHorizontal: Spacing.three, paddingVertical: 0 },
  footer: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: Spacing.four },
});
