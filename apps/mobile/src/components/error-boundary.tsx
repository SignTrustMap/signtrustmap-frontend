import React, { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ============================================================================
// Types
// ============================================================================

export interface ErrorFallbackViewProps {
  error?: Error | null;
  onRetry?: () => void | Promise<void>;
  onGoHome?: () => void;
  title?: string;
  message?: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; resetError: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface RouteErrorBoundaryProps {
  error: Error;
  retry: () => Promise<void>;
}

// ============================================================================
// Presentation: ErrorFallbackView
// ============================================================================

export function ErrorFallbackView({
  error,
  onRetry,
  onGoHome,
  title = 'Đã xảy ra sự cố',
  message = 'Đã xảy ra lỗi không mong muốn trong ứng dụng. Bạn có thể thử tải lại màn hình hoặc quay về trang chủ.',
}: ErrorFallbackViewProps) {
  const theme = useTheme();
  const router = useRouter();

  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      console.warn('[ErrorBoundary] Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoHome = () => {
    try {
      if (onRetry) {
        void onRetry();
      }
      onGoHome?.();
      router.replace('/');
    } catch (err) {
      console.warn('[ErrorBoundary] Navigation to home failed:', err);
    }
  };

  const handleCopyDetails = async () => {
    const errorDetails = [
      `Name: ${error?.name || 'Error'}`,
      `Message: ${error?.message || 'Unknown error'}`,
      `Stack:\n${error?.stack || 'No stack trace available'}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    try {
      await Clipboard.setStringAsync(errorDetails);
      setIsCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 2200);
    } catch (err) {
      console.warn('[ErrorBoundary] Failed to copy to clipboard:', err);
    }
  };

  const errorMessage = error?.message || 'An unhandled exception occurred.';
  const errorName = error?.name || 'Application Error';

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Top Status Pill */}
          <View style={styles.statusPill}>
            <View style={styles.statusPillDot} />
            <Text style={styles.statusPillText}>Lỗi ứng dụng</Text>
          </View>

          {/* Icon Bubble */}
          <View style={styles.iconWrapper}>
            <View style={styles.iconHalo} />
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons color="#E11D48" name="alert-octagon-outline" size={40} />
            </View>
          </View>

          {/* Heading & Friendly Description */}
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.description, { color: theme.placeholder }]}>{message}</Text>

          {/* Primary Action Buttons */}
          <View style={styles.actionGroup}>
            {onRetry ? (
              <Pressable
                accessibilityLabel="Thử lại"
                accessibilityRole="button"
                disabled={isRetrying}
                onPress={handleRetry}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.primary },
                  pressed && styles.buttonPressed,
                ]}
              >
                {isRetrying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons color="#FFFFFF" name="refresh" size={18} />
                    <Text style={styles.primaryButtonText}>Thử lại</Text>
                  </>
                )}
              </Pressable>
            ) : null}

            <Pressable
              accessibilityLabel="Quay về trang chủ"
              accessibilityRole="button"
              onPress={handleGoHome}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                pressed && styles.buttonPressed,
              ]}
            >
              <MaterialCommunityIcons color={theme.text} name="home-variant-outline" size={18} />
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Quay về trang chủ</Text>
            </Pressable>
          </View>

          {/* Technical Details Accordion */}
          <View style={[styles.detailsCard, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <Pressable
              accessibilityLabel={showDetails ? 'Ẩn chi tiết kỹ thuật' : 'Xem chi tiết kỹ thuật'}
              accessibilityRole="button"
              onPress={() => setShowDetails((prev) => !prev)}
              style={styles.detailsToggleRow}
            >
              <View style={styles.detailsToggleLeft}>
                <MaterialCommunityIcons color={theme.placeholder} name="code-tags" size={18} />
                <Text style={[styles.detailsToggleText, { color: theme.text }]}>Chi tiết kỹ thuật</Text>
                <View style={styles.errorNameBadge}>
                  <Text numberOfLines={1} style={styles.errorNameBadgeText}>{errorName}</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                color={theme.placeholder}
                name={showDetails ? 'chevron-up' : 'chevron-down'}
                size={20}
              />
            </Pressable>

            {showDetails ? (
              <View style={styles.detailsBody}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeMessage}>{errorMessage}</Text>
                  {error?.stack ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Text style={styles.codeStack}>{error.stack}</Text>
                    </ScrollView>
                  ) : null}
                </View>

                <Pressable
                  accessibilityLabel="Sao chép chi tiết lỗi"
                  accessibilityRole="button"
                  onPress={handleCopyDetails}
                  style={styles.copyButton}
                >
                  <MaterialCommunityIcons
                    color={isCopied ? '#10B981' : '#64748B'}
                    name={isCopied ? 'check' : 'content-copy'}
                    size={15}
                  />
                  <Text style={[styles.copyButtonText, isCopied && { color: '#10B981' }]}>
                    {isCopied ? 'Đã sao chép vào bộ nhớ tạm' : 'Sao chép chi tiết'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// Core: React ErrorBoundary (Class Component)
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Hide splash screen so user is never trapped behind native splash screen
    SplashScreen.hideAsync().catch(() => {});
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught unhandled React error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback({ error, resetError: this.resetError });
      }
      if (fallback) {
        return fallback;
      }
      return <ErrorFallbackView error={error} onRetry={this.resetError} />;
    }

    return children;
  }
}

// ============================================================================
// Expo Router Integration
// ============================================================================

/**
 * Standard Expo Router error boundary adapter.
 * Export this directly from any `_layout.tsx` or route file to catch screen errors.
 */
export function RouteErrorBoundary({ error, retry }: RouteErrorBoundaryProps) {
  return <ErrorFallbackView error={error} onRetry={retry} />;
}

export default ErrorBoundary;

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  contentContainer: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Rounded.round,
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    marginBottom: Spacing.four,
  },
  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
  },
  statusPillText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  iconHalo: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: Spacing.two,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.five,
    paddingHorizontal: Spacing.two,
  },
  actionGroup: {
    width: '100%',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: Rounded.md,
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: Rounded.md,
    borderWidth: 1,
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  secondaryButtonText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  detailsCard: {
    width: '100%',
    borderRadius: Rounded.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailsToggleText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  errorNameBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 160,
  },
  errorNameBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  detailsBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  codeBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    maxHeight: 180,
    gap: 6,
  },
  codeMessage: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    color: '#F87171',
    lineHeight: 16,
  },
  codeStack: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 14,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  copyButtonText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});
