import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import {
  AVAILABLE_PAYMENT_GATEWAYS,
  DEFAULT_TOP_UP_PACKAGES,
  formatVnd,
  type PaymentGatewayOption,
} from '@/api/wallet/wallet';
import { AppButton } from '@/components/button';
import { PAYMENT_FAILED_MESSAGE } from '@/constants/message';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CreditScreenHeader } from '../components/credit-screen-header';
import {
  useGetWallet,
  useGetTopUpPackages,
  useTopUp,
  useTopUpCustom,
} from '../hooks/use-wallet';

export function TopUpScreen() {
  const router = useRouter();
  const theme = useTheme();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { amount: amountParam } = useLocalSearchParams<{ amount?: string }>();
  const customAmount = Number(amountParam);
  const initialAmount = Number.isFinite(customAmount) && customAmount > 0 ? customAmount : null;
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [customCredit, setCustomCredit] = useState<number | null>(initialAmount);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayOption['id']>('MOMO');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const { data: walletData } = useGetWallet();
  const {
    data: packages = [],
    isLoading: loadingPackages,
    isError: errorPackages,
    refetch: refetchPackages,
  } = useGetTopUpPackages();
  const { mutateAsync: topUp, isPending: isConfirmingPkg } = useTopUp();
  const { mutateAsync: topUpCustom, isPending: isConfirmingCustom } = useTopUpCustom();

  const isConfirming = isConfirmingPkg || isConfirmingCustom;
  const balance = walletData?.wallet?.balance ?? 0;

  // Resolved list of packages (uses BE data or standard defaults if DB has no rows)
  const displayPackages = useMemo(() => {
    return packages.length > 0 ? packages : DEFAULT_TOP_UP_PACKAGES;
  }, [packages]);

  // Chunk packages into pairs for a clean 2x2 grid layout
  const packageRows = useMemo(() => {
    const rows: (typeof displayPackages)[] = [];
    for (let i = 0; i < displayPackages.length; i += 2) {
      rows.push(displayPackages.slice(i, i + 2));
    }
    return rows;
  }, [displayPackages]);

  // Pre-select popular or first package if neither package nor custom amount is selected yet
  useEffect(() => {
    if (selectedPackageId === null && customCredit === null && displayPackages.length > 0) {
      const defaultPkg = displayPackages.find((p) => p.creditAmount === 1000) ?? displayPackages[0];
      if (defaultPkg) {
        setSelectedPackageId(defaultPkg.id);
      }
    }
  }, [displayPackages, selectedPackageId, customCredit]);

  // Resolve which package/amount will be paid
  const effectivePackage = displayPackages.find((p) => p.id === selectedPackageId);
  const displayAmount = effectivePackage?.creditAmount ?? customCredit ?? 0;

  // Format equivalent VND price (standard rate: 100 VND per Credit)
  const displayPriceVnd = useMemo(() => {
    if (effectivePackage) {
      return formatVnd(effectivePackage.priceVnd);
    }
    if (customCredit) {
      return formatVnd(customCredit * 100);
    }
    return '0 ₫';
  }, [effectivePackage, customCredit]);

  const handleConfirm = async () => {
    setConfirmError(null);
    setRedirectNotice(null);
    try {
      let orderRes;
      if (effectivePackage) {
        orderRes = await topUp({ packageId: effectivePackage.id, gateway: selectedGateway });
      } else if (customCredit) {
        orderRes = await topUpCustom({ amount: customCredit, gateway: selectedGateway });
      } else {
        return;
      }

      setConfirmSuccess(true);

      // If backend returns a payment redirect URL (e.g. MoMo web payUrl or deeplink)
      if (orderRes?.payUrl) {
        setRedirectNotice('Đang mở cổng thanh toán MoMo…');
        try {
          if (Platform.OS === 'web') {
            if (typeof window !== 'undefined') {
              window.open(orderRes.payUrl, '_blank');
            }
          } else {
            await WebBrowser.openBrowserAsync(orderRes.payUrl, {
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            });
          }
        } catch {
          await Linking.openURL(orderRes.payUrl);
        }
      }

      redirectTimerRef.current = setTimeout(() => router.replace('/credits'), 1500);
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : PAYMENT_FAILED_MESSAGE);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <CreditScreenHeader onBack={() => router.back()} title="Nạp Credits" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current balance */}
        <View style={[styles.balancePanel, { backgroundColor: theme.backgroundSelected }]}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Số điểm hiện tại</Text>
          <Text style={[styles.balanceValue, { color: theme.text }]}>
            {balance} <Text style={styles.balanceUnit}>Credits</Text>
          </Text>
        </View>

        {/* Package selection header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Chọn gói nạp</Text>
          {loadingPackages ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : null}
        </View>

        {errorPackages && displayPackages.length === 0 ? (
          <View style={[styles.errorBox, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.errorText, { color: theme.danger ?? '#C62929' }]}>
              Không thể tải gói nạp từ hệ thống.
            </Text>
            <AppButton
              label="Thử lại"
              onPress={() => refetchPackages()}
              style={[styles.retryButton, { borderColor: theme.border }]}
              variant="surface"
            />
          </View>
        ) : (
          <View style={styles.packageGrid}>
            {packageRows.map((row, rowIndex) => (
              <View key={`pkg-row-${rowIndex}`} style={styles.packageRow}>
                {row.map((pkg) => {
                  const selected = selectedPackageId === pkg.id && customCredit === null;
                  const isPopular = pkg.creditAmount === 1000;
                  return (
                    <AppButton
                      accessibilityLabel={`Gói ${pkg.packageName}, ${pkg.creditAmount} Credits, giá ${formatVnd(pkg.priceVnd)}`}
                      key={pkg.id}
                      onPress={() => {
                        setSelectedPackageId(pkg.id);
                        setCustomCredit(null);
                      }}
                      style={[
                        styles.packageCard,
                        {
                          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                          borderColor: selected ? theme.primary : theme.border,
                        },
                      ]}
                      variant="surface"
                    >
                      {isPopular ? (
                        <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
                          <Text style={[styles.popularBadgeText, { color: theme.onPrimary }]}>PHỔ BIẾN</Text>
                        </View>
                      ) : null}
                      <View style={styles.packageCardHeader}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.packageName,
                            { color: selected ? theme.primary : theme.textSecondary },
                          ]}
                        >
                          {pkg.packageName}
                        </Text>
                        <View
                          style={[
                            styles.radio,
                            { borderColor: selected ? theme.primary : theme.border },
                          ]}
                        >
                          {selected ? (
                            <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />
                          ) : null}
                        </View>
                      </View>
                      <View style={styles.packageCreditsRow}>
                        <Text style={[styles.packageCredits, { color: theme.text }]}>
                          +{pkg.creditAmount.toLocaleString('vi-VN')}
                        </Text>
                        <Text style={[styles.packageCreditsUnit, { color: theme.textSecondary }]}>
                          Credits
                        </Text>
                      </View>
                      <View style={[styles.packagePriceRow, { borderTopColor: theme.border }]}>
                        <Text style={[styles.packagePrice, { color: selected ? theme.primary : theme.text }]}>
                          {formatVnd(pkg.priceVnd)}
                        </Text>
                      </View>
                    </AppButton>
                  );
                })}
                {row.length === 1 ? <View style={styles.packagePlaceholder} /> : null}
              </View>
            ))}
          </View>
        )}

        {/* Custom credit amount option */}
        <AppButton
          accessibilityLabel="Nhập số lượng Credits tùy chỉnh"
          onPress={() => router.push('/credits/custom-amount')}
          style={[
            styles.customAmountButton,
            {
              backgroundColor: customCredit !== null ? theme.backgroundSelected : theme.backgroundElement,
              borderColor: customCredit !== null ? theme.primary : theme.border,
            },
          ]}
          variant="surface"
        >
          <View style={styles.customAmountContent}>
            <View style={[styles.customAmountIconBox, { backgroundColor: theme.background }]}>
              <Text style={[styles.customAmountIcon, { color: theme.primary }]}>＋</Text>
            </View>
            <View style={styles.customAmountTextCol}>
              <Text style={[styles.customAmountTitle, { color: theme.text }]}>
                {customCredit !== null
                  ? `Đã chọn: ${customCredit.toLocaleString('vi-VN')} Credits`
                  : 'Nhập số lượng tùy chỉnh'}
              </Text>
              <Text style={[styles.customAmountSubtitle, { color: theme.textSecondary }]}>
                {customCredit !== null
                  ? `Tương đương ${formatVnd(customCredit * 100)}`
                  : 'Nạp số lượng tín chỉ theo nhu cầu cá nhân'}
              </Text>
            </View>
          </View>
          <View style={[styles.radio, { borderColor: customCredit !== null ? theme.primary : theme.border }]}>
            {customCredit !== null ? (
              <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />
            ) : null}
          </View>
        </AppButton>

        {/* Summary card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Số Credits nhận được</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              +{displayAmount.toLocaleString('vi-VN')} Credits
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryTotalLabel, { color: theme.text }]}>Tổng thanh toán</Text>
            <Text style={[styles.summaryTotalValue, { color: theme.primary }]}>
              {displayPriceVnd}
            </Text>
          </View>
        </View>

        {/* Payment methods */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Phương thức thanh toán</Text>
        <View style={[styles.paymentCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {AVAILABLE_PAYMENT_GATEWAYS.map((gateway, index) => {
            const selected = gateway.id === selectedGateway;
            const isMoMo = gateway.id === 'MOMO';
            const isMock = gateway.id === 'MOCK';
            const isVietQR = gateway.id === 'VIETQR';

            const badgeBg = isMoMo ? '#FCE7F3' : isMock ? '#FEF3C7' : theme.backgroundSelected;
            const badgeTextColor = isMoMo ? '#BE185D' : isMock ? '#B45309' : theme.primary;
            const iconBg = isMoMo ? '#FDF2F8' : isVietQR ? '#EFF6FF' : '#FFFBEB';
            const iconColor = isMoMo ? '#D82D8B' : isVietQR ? '#0284C7' : '#D97706';

            return (
              <AppButton
                accessibilityLabel={`Thanh toán bằng ${gateway.name}`}
                key={gateway.id}
                onPress={() => setSelectedGateway(gateway.id)}
                style={[
                  styles.paymentRow,
                  index < AVAILABLE_PAYMENT_GATEWAYS.length - 1
                    ? { borderBottomColor: theme.border, borderBottomWidth: 1 }
                    : null,
                ]}
                variant="ghost"
              >
                <View style={[styles.methodIcon, { backgroundColor: iconBg }]}>
                  <Text style={[styles.methodSymbol, { color: iconColor }]}>
                    {gateway.iconSymbol}
                  </Text>
                </View>
                <View style={styles.methodCopy}>
                  <View style={styles.methodTitleRow}>
                    <Text style={[styles.methodLabel, { color: theme.text }]}>
                      {gateway.name}
                    </Text>
                    {gateway.badge ? (
                      <View style={[styles.methodBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.methodBadgeText, { color: badgeTextColor }]}>
                          {gateway.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.methodDetail, { color: theme.textSecondary }]}>
                    {gateway.detail}
                  </Text>
                </View>
                <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.border }]}>
                  {selected ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
                </View>
              </AppButton>
            );
          })}
        </View>

        {/* Error / success feedback */}
        {confirmError ? (
          <Text style={[styles.feedbackText, { color: theme.danger ?? '#C62929' }]}>{confirmError}</Text>
        ) : null}
        {confirmSuccess ? (
          <Text style={[styles.feedbackText, { color: '#087A3D' }]}>
            {redirectNotice
              ? `✓ ${redirectNotice}`
              : '✓ Đơn nạp Credits đã được tạo! Đang chuyển hướng…'}
          </Text>
        ) : null}
      </ScrollView>

      <SafeAreaView
        edges={['bottom']}
        style={[styles.footer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      >
        <AppButton
          accessibilityLabel={`Thanh toán ${displayPriceVnd} cho ${displayAmount} Credits`}
          disabled={displayAmount <= 0 || isConfirming || confirmSuccess}
          label={
            isConfirming
              ? 'Đang xử lý giao dịch…'
              : confirmSuccess
                ? 'Thanh toán thành công!'
                : `Xác nhận thanh toán ${displayPriceVnd}`
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
    minHeight: 104,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  balanceLabel: { fontFamily: Fonts.body, fontSize: 13, fontWeight: 700 },
  balanceValue: { fontFamily: Fonts.body, fontSize: 30, fontWeight: 900 },
  balanceUnit: { fontSize: 16, fontWeight: 700 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  sectionTitle: { fontFamily: Fonts.body, fontSize: 18, fontWeight: 900 },
  packageGrid: {
    gap: Spacing.two,
  },
  packageRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  packageCard: {
    flex: 1,
    minHeight: 124,
    borderRadius: Rounded.lg,
    borderWidth: 2,
    padding: Spacing.three,
    alignItems: 'stretch',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  packagePlaceholder: {
    flex: 1,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: Rounded.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  popularBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 0.5,
  },
  packageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  packageName: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 800,
    flex: 1,
    marginRight: Spacing.two,
  },
  packageCreditsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: Spacing.one,
  },
  packageCredits: {
    fontFamily: Fonts.body,
    fontSize: 22,
    fontWeight: 900,
  },
  packageCreditsUnit: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 700,
  },
  packagePriceRow: {
    borderTopWidth: 1,
    paddingTop: Spacing.one,
    width: '100%',
  },
  packagePrice: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 800,
  },
  customAmountButton: {
    borderWidth: 2,
    borderRadius: Rounded.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    minHeight: 64,
  },
  customAmountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  customAmountIconBox: {
    width: 36,
    height: 36,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAmountIcon: {
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: 900,
  },
  customAmountTextCol: {
    flex: 1,
    gap: 2,
  },
  customAmountTitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 800,
  },
  customAmountSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: Rounded.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
  },
  summaryValue: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 800,
  },
  summaryDivider: {
    height: 1,
    width: '100%',
  },
  summaryTotalLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 800,
  },
  summaryTotalValue: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: 900,
  },
  paymentCard: { overflow: 'hidden', borderWidth: 1, borderRadius: Rounded.lg },
  paymentRow: {
    minHeight: 74,
    borderRadius: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  methodIcon: { width: 44, height: 44, borderRadius: Rounded.md, alignItems: 'center', justifyContent: 'center' },
  methodSymbol: { fontFamily: Fonts.body, fontSize: 18, fontWeight: 900 },
  methodCopy: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: 2 },
  methodTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flexWrap: 'wrap' },
  methodLabel: { fontFamily: Fonts.body, fontSize: 14, fontWeight: 800 },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Rounded.round,
  },
  methodBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 800,
  },
  methodDetail: { fontFamily: Fonts.body, fontSize: 12, fontWeight: 500, lineHeight: 16 },
  radio: { width: 22, height: 22, borderWidth: 2, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  footer: { borderTopWidth: 1, padding: Spacing.four, paddingTop: Spacing.two },
  payButton: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  errorBox: {
    borderWidth: 1,
    borderRadius: Rounded.lg,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 36,
    paddingHorizontal: Spacing.three,
  },
  feedbackText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'center',
    paddingVertical: Spacing.one,
  },
});

