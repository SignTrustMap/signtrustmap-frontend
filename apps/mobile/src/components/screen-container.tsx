/**
 * @file screen-container.tsx
 * @description Standardized responsive layout container for mobile screens.
 * Integrates SafeAreaView, cross-platform KeyboardAvoidingView, and dynamic inset padding.
 */

import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export interface ScreenContainerProps {
  children: ReactNode;
  /** Whether the container body should be scrollable (default: false) */
  scrollable?: boolean;
  /** Safe area edges to pad (default: ['top', 'bottom', 'left', 'right']) */
  edges?: Edge[];
  /** Container custom style */
  style?: StyleProp<ViewStyle>;
  /** Content container style when scrollable is true */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Additional vertical offset for KeyboardAvoidingView */
  keyboardOffset?: number;
  /** Whether to add dynamic bottom inset padding to content */
  includeBottomInset?: boolean;
  /** Background color override (defaults to theme.background) */
  backgroundColor?: string;
}

export function ScreenContainer({
  children,
  scrollable = false,
  edges = ['top', 'bottom', 'left', 'right'],
  style,
  contentContainerStyle,
  keyboardOffset = 0,
  includeBottomInset = true,
  backgroundColor,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const containerBg = backgroundColor || theme.background;
  const bottomPadding = includeBottomInset ? insets.bottom + Spacing.two : Spacing.two;

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safeArea, { backgroundColor: containerBg }, style]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
        style={styles.keyboardAvoid}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: bottomPadding },
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.staticContent, contentContainerStyle]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
