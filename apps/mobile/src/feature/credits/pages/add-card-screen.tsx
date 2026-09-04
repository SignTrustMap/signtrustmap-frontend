import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CreditFlowState } from '../components/credit-flow-state';
import { CreditScreenHeader } from '../components/credit-screen-header';

type CardFlowStatus = 'form' | 'loading' | 'success';

export function AddCardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [status, setStatus] = useState<CardFlowStatus>('form');
  const [cardholderName, setCardholderName] = useState('John Doe');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [billingZip, setBillingZip] = useState('700000');
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleAddCard = () => {
    setStatus('loading');
    timeoutRef.current = setTimeout(() => setStatus('success'), 1200);
  };

  if (status === 'success') {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <CreditScreenHeader onBack={() => router.replace('/credits/top-up')} title="Payment Methods" />
        <CreditFlowState
          actionLabel="Continue to top up"
          detail={<SavedCardPreview isDefault={isDefault} />}
          message="Your Visa ending in 4242 is ready for top-ups and payments."
          onAction={() => router.replace('/credits/top-up')}
          title="Card added successfully"
          variant="success"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <CreditScreenHeader onBack={() => router.back()} title="Add New Card" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cardPreview, { backgroundColor: theme.primary }]}>
          <View style={styles.previewTopRow}>
            <Text style={styles.contactless}>)))</Text>
            <Text style={styles.visa}>VISA</Text>
          </View>
          <Text style={styles.maskedNumber}>••••  ••••  ••••  {cardNumber.slice(-4) || '4242'}</Text>
          <View style={styles.previewBottomRow}>
            <View>
              <Text style={styles.previewLabel}>CARDHOLDER</Text>
              <Text style={styles.previewValue}>{cardholderName.toUpperCase() || 'CARDHOLDER NAME'}</Text>
            </View>
            <View style={styles.previewExpiry}>
              <Text style={styles.previewLabel}>EXPIRES</Text>
              <Text style={styles.previewValue}>{expiry || 'MM/YY'}</Text>
            </View>
          </View>
        </View>

        <CardField label="Cardholder name" onChangeText={setCardholderName} value={cardholderName} />
        <CardField
          keyboardType="number-pad"
          label="Card number"
          maxLength={19}
          onChangeText={(value) => setCardNumber(formatCardNumber(value))}
          value={cardNumber}
        />
        <View style={styles.fieldRow}>
          <CardField
            containerStyle={styles.halfField}
            keyboardType="number-pad"
            label="Expiry date"
            maxLength={5}
            onChangeText={setExpiry}
            placeholder="MM/YY"
            value={expiry}
          />
          <CardField
            containerStyle={styles.halfField}
            keyboardType="number-pad"
            label="CVV"
            maxLength={3}
            onChangeText={setCvv}
            secureTextEntry
            value={cvv}
          />
        </View>
        <CardField
          keyboardType="number-pad"
          label="Billing ZIP code"
          onChangeText={setBillingZip}
          value={billingZip}
        />

        <View style={styles.defaultRow}>
          <View style={styles.defaultCopy}>
            <Text style={[styles.defaultTitle, { color: theme.text }]}>Set as default payment method</Text>
            <Text style={[styles.defaultDetail, { color: theme.placeholder }]}>Use this card for future top-ups</Text>
          </View>
          <Switch
            onValueChange={setIsDefault}
            thumbColor={theme.onPrimary}
            trackColor={{ false: theme.border, true: theme.primary }}
            value={isDefault}
          />
        </View>
        <AppButton label="＋  Add Card" onPress={handleAddCard} style={styles.addCardButton} />
      </ScrollView>
      {status === 'loading' ? (
        <CreditFlowState
          message="This only takes a moment."
          presentation="overlay"
          title="Verifying your card…"
          variant="loading"
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

type CardFieldProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  label: string;
};

function CardField({ containerStyle, label, style, ...inputProps }: CardFieldProps) {
  const theme = useTheme();

  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.placeholder}
        selectionColor={theme.primary}
        style={[
          styles.fieldInput,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text },
          style,
        ]}
        {...inputProps}
      />
    </View>
  );
}

function SavedCardPreview({ isDefault }: { isDefault: boolean }) {
  const theme = useTheme();

  return (
    <View style={[styles.savedCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.savedCardTopRow}>
        <Text style={[styles.savedCardIcon, { color: theme.primary }]}>▰</Text>
        {isDefault ? (
          <Text style={[styles.defaultBadge, { color: theme.textSecondary, borderColor: theme.border }]}>DEFAULT</Text>
        ) : null}
      </View>
      <Text style={[styles.savedCardNumber, { color: theme.text }]}>••••  ••••  ••••  4242</Text>
      <Text style={[styles.savedCardExpiry, { color: theme.placeholder }]}>EXPIRES 12/28</Text>
    </View>
  );
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
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
  cardPreview: {
    height: 220,
    borderRadius: Rounded.lg,
    justifyContent: 'space-between',
    padding: Spacing.four,
    marginBottom: Spacing.one,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 7,
  },
  previewTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  contactless: { color: '#FFFFFF', fontFamily: Fonts.body, fontSize: 20, fontWeight: 900 },
  visa: { color: '#FFFFFF', fontFamily: Fonts.body, fontSize: 24, fontStyle: 'italic', fontWeight: 900 },
  maskedNumber: { color: '#FFFFFF', fontFamily: Fonts.mono, fontSize: 18, fontWeight: 900, letterSpacing: 2 },
  previewBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  previewExpiry: { alignItems: 'flex-end' },
  previewLabel: { color: 'rgba(255,255,255,0.72)', fontFamily: Fonts.body, fontSize: 9, fontWeight: 800 },
  previewValue: { color: '#FFFFFF', fontFamily: Fonts.body, fontSize: 14, fontWeight: 900, marginTop: 4 },
  field: { gap: Spacing.one },
  fieldRow: { flexDirection: 'row', gap: Spacing.two },
  halfField: { flex: 1 },
  fieldLabel: { fontFamily: Fonts.body, fontSize: 13, fontWeight: 700 },
  fieldInput: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 600,
  },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.one },
  defaultCopy: { flex: 1, minWidth: 0 },
  defaultTitle: { fontFamily: Fonts.body, fontSize: 14, fontWeight: 900 },
  defaultDetail: { fontFamily: Fonts.body, fontSize: 12, fontWeight: 600, marginTop: 3 },
  addCardButton: { marginTop: Spacing.two },
  savedCard: {
    width: '100%',
    maxWidth: 430,
    minHeight: 156,
    borderWidth: 1,
    borderRadius: Rounded.lg,
    justifyContent: 'space-between',
    padding: Spacing.four,
    marginTop: Spacing.four,
  },
  savedCardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  savedCardIcon: { fontFamily: Fonts.body, fontSize: 24, fontWeight: 900 },
  defaultBadge: { borderWidth: 1, borderRadius: Rounded.sm, paddingHorizontal: Spacing.one, paddingVertical: 4, fontFamily: Fonts.body, fontSize: 10, fontWeight: 800 },
  savedCardNumber: { fontFamily: Fonts.mono, fontSize: 18, fontWeight: 900, letterSpacing: 1.5 },
  savedCardExpiry: { fontFamily: Fonts.body, fontSize: 11, fontWeight: 800 },
});
