import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ReviewTab = 'catalog' | 'review';

const tabs = [
  {
    id: 'review',
    label: 'Review',
    route: '/work/submission-review',
    symbol: { android: 'fact_check', ios: 'checkmark.rectangle.stack', web: 'fact_check' },
  },
  {
    id: 'catalog',
    label: 'Catalog',
    route: '/work/sign-catalog',
    symbol: { android: 'menu_book', ios: 'books.vertical', web: 'menu_book' },
  },
] as const;

export function ReviewBottomTabs({ activeTab }: { activeTab: ReviewTab }) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.safeArea,
        { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
      ]}
    >
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <AppButton
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={tab.id}
              onPress={() => router.replace(tab.route)}
              style={styles.tab}
              variant="ghost"
            >
              <SymbolView
                name={tab.symbol}
                size={20}
                tintColor={isActive ? theme.tertiary : theme.placeholder}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? theme.tertiary : theme.placeholder },
                ]}
              >
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
  safeArea: { borderTopWidth: 1 },
  tabs: { height: 60, flexDirection: 'row', paddingHorizontal: Spacing.one },
  tab: {
    flex: 1,
    alignSelf: 'stretch',
    gap: 3,
    minHeight: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: Spacing.half,
  },
  tabLabel: { fontFamily: Fonts.body, fontSize: 11, fontWeight: 700 },
  activeIndicator: { width: 34, height: 2, borderRadius: 1 },
});
