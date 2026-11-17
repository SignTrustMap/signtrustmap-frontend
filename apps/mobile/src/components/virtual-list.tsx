import {
  FlashList,
  type FlashListProps,
  type FlashListRef,
  type ListRenderItem,
} from '@shopify/flash-list';
import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type { FlashListRef, ListRenderItem };

export interface VirtualListProps<T> extends FlashListProps<T> {
  /**
   * Approximate size of an item in the direction of scroll (optional in FlashList v2).
   */
  estimatedItemSize?: number;

  /**
   * Shows an inline loading indicator instead of empty state when data is pending.
   */
  isLoading?: boolean;

  /**
   * Title displayed when data is empty and no custom ListEmptyComponent is provided.
   */
  emptyTitle?: string;

  /**
   * Description displayed when data is empty and no custom ListEmptyComponent is provided.
   */
  emptyDescription?: string;

  /**
   * Container style for the empty state.
   */
  emptyContainerStyle?: StyleProp<ViewStyle>;
}

function VirtualListInner<T>(
  props: VirtualListProps<T>,
  ref: React.ForwardedRef<FlashListRef<T>>,
) {
  const {
    data,
    estimatedItemSize: _estimatedItemSize,
    isLoading = false,
    emptyTitle,
    emptyDescription,
    emptyContainerStyle,
    ListEmptyComponent,
    ...rest
  } = props;

  const theme = useTheme();

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.primary} size="large" testID="virtual-list-loading" />
        </View>
      );
    }

    if (ListEmptyComponent) {
      if (React.isValidElement(ListEmptyComponent)) {
        return ListEmptyComponent;
      }
      const EmptyComp = ListEmptyComponent as React.ComponentType<any>;
      return <EmptyComp />;
    }

    if (emptyTitle || emptyDescription) {
      return (
        <View style={[styles.emptyContainer, emptyContainerStyle]}>
          {emptyTitle ? (
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{emptyTitle}</Text>
          ) : null}
          {emptyDescription ? (
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              {emptyDescription}
            </Text>
          ) : null}
        </View>
      );
    }

    return null;
  };

  return (
    <FlashList
      ref={ref}
      data={data}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={renderEmptyComponent}
      {...rest}
    />
  );
}

export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<FlashListRef<T>> },
) => React.ReactElement;

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
  },
  emptyTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
