import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ComponentProps } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

const ACTIVE_CIRCLE_SIZE = 48;

type AppTab = {
  fallbackLabel: string;
  label: string;
  symbol: SymbolName;
  route: '/home' | '/work' | '/profile';
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
  const [selectedRoute, setSelectedRoute] = useState(activeRoute);
  const [containerWidth, setContainerWidth] = useState(0);
  const initialTabIndex = Math.max(0, tabs.findIndex((tab) => tab.route === activeRoute));
  const [activePosition] = useState(() => new Animated.Value(initialTabIndex));
  const tabWidth = Math.max(0, containerWidth - Spacing.one * 2) / tabs.length;

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const handleTabPress = (route: AppTab['route']) => {
    const nextTabIndex = tabs.findIndex((tab) => tab.route === route);

    setSelectedRoute(route);
    Animated.timing(activePosition, {
      toValue: nextTabIndex,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    router.replace(route);
  };

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
      <View onLayout={handleContainerLayout} style={styles.container}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeCircle,
            {
              backgroundColor: theme.primary,
              borderColor: theme.backgroundElement,
              left: Spacing.one + Math.max(0, (tabWidth - ACTIVE_CIRCLE_SIZE) / 2),
              opacity: containerWidth > 0 ? 1 : 0,
              transform: [{ translateX: Animated.multiply(activePosition, tabWidth) }],
            },
          ]}
        />
        {tabs.map((tab) => {
          const isActive = tab.route === selectedRoute;

          return (
            <AppButton
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={tab.route}
              onPress={() => handleTabPress(tab.route)}
              pressedOpacity={0.7}
              style={styles.tab}
              variant="ghost"
            >
              <View
                style={[
                  styles.iconCircle,
                  isActive && styles.activeIconContent,
                ]}
              >
                <SymbolView
                  fallback={
                    <Text
                      style={[
                        styles.iconFallback,
                        { color: isActive ? theme.onPrimary : theme.text },
                      ]}
                    >
                      {tab.fallbackLabel}
                    </Text>
                  }
                  name={tab.symbol}
                  size={isActive ? 22 : 20}
                  tintColor={isActive ? theme.onPrimary : theme.text}
                />
              </View>
              <Text style={[styles.label, { color: isActive ? theme.primary : theme.text }]}>
                {tab.label}
              </Text>
            </AppButton>
          );
        })}
      </View>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  container: {
    height: 58,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.one,
  },
  tab: {
    zIndex: 1,
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    minHeight: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 700,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContent: {
    transform: [{ translateY: -12 }],
  },
  activeCircle: {
    position: 'absolute',
    top: -12,
    width: ACTIVE_CIRCLE_SIZE,
    height: ACTIVE_CIRCLE_SIZE,
    borderRadius: ACTIVE_CIRCLE_SIZE / 2,
    borderWidth: 4,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 9,
    elevation: 8,
  },
  iconFallback: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 900,
  },
});
