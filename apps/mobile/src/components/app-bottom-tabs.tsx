import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type AppTab = {
  fallbackLabel: string;
  label: string;
  symbol: SymbolName;
  route: '/home' | '/work' | '/credits' | '/profile';
};

const tabs: AppTab[] = [
  { fallbackLabel: 'H', label: 'Home', route: '/home', symbol: { android: 'home', web: 'home' } },
  {
    fallbackLabel: 'T',
    label: 'Work',
    route: '/work',
    symbol: { android: 'task', web: 'task' },
  },
  {
    fallbackLabel: 'P',
    label: 'Profile',
    route: '/profile',
    symbol: { android: 'person', web: 'person' },
  },
];

export function AppBottomTabs({ activeRoute }: { activeRoute: AppTab['route'] }) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = tab.route === activeRoute;

          return (
            <AppButton
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={tab.route}
              onPress={() => router.replace(tab.route)}
              pressedOpacity={0.7}
              style={styles.tab}
              variant="ghost"
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
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: isActive ? theme.tertiary : 'transparent' },
                ]}
              />
            </AppButton>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderTopWidth: 1,
  },
  container: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.one,
  },
  tab: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 700,
  },
  activeIndicator: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  iconFallback: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 900,
  },
});
