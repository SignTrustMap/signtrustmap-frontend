import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type DriverTab = {
  fallbackLabel: string;
  label: string;
  symbol: SymbolName;
  route: '/(driver)' | '/(driver)/tasks' | '/(driver)/credits' | '/(driver)/profile';
};

const tabs: DriverTab[] = [
  { fallbackLabel: 'H', label: 'Home', route: '/(driver)', symbol: { android: 'home', web: 'home' } },
  {
    fallbackLabel: 'T',
    label: 'Tasks',
    route: '/(driver)/tasks',
    symbol: { android: 'task', web: 'task' },
  },
  {
    fallbackLabel: 'C',
    label: 'Credits',
    route: '/(driver)/credits',
    symbol: { android: 'credit_card', web: 'credit_card' },
  },
  {
    fallbackLabel: 'P',
    label: 'Profile',
    route: '/(driver)/profile',
    symbol: { android: 'person', web: 'person' },
  },
];

export function DriverBottomTabs({ activeRoute }: { activeRoute: DriverTab['route'] }) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.route === activeRoute;

        return (
          <Pressable
            accessibilityRole="button"
            key={tab.route}
            onPress={() => router.replace(tab.route)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <SymbolView
              fallback={
                <Text style={[styles.iconFallback, { color: isActive ? theme.tertiary : theme.text }]}>
                  {tab.fallbackLabel}
                </Text>
              }
              name={tab.symbol}
              size={18}
              tintColor={isActive ? theme.tertiary : theme.text}
            />
            <Text style={[styles.label, { color: isActive ? theme.tertiary : theme.text }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 58,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.one,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 700,
  },
  iconFallback: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 900,
  },
});
