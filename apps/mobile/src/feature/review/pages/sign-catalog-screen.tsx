import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { ReviewBottomTabs } from '@/feature/review/components/review-bottom-tabs';
import {
  catalogSigns,
  signCategories,
  type CatalogSign,
  type SignCategory,
} from '@/feature/review/data/sign-catalog';
import { useTheme } from '@/hooks/use-theme';

type CatalogFilter = 'All Signs' | SignCategory;

const categoryColors: Record<SignCategory, { background: string; text: string }> = {
  Danger: { background: '#FDE8E7', text: '#B42318' },
  Guidance: { background: '#DCFCE7', text: '#167A3D' },
  Prohibition: { background: '#FEE2E2', text: '#B91C1C' },
  Regulatory: { background: '#DDEBFF', text: '#175CD3' },
  Supplementary: { background: '#F0E7FE', text: '#6938B8' },
};

function normalizeEnglishSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-US')
    .trim()
    .replace(/\s+/g, ' ');
}

function SignCard({ sign }: { sign: CatalogSign }) {
  const theme = useTheme();
  const categoryColor = categoryColors[sign.category];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <View style={[styles.imageShell, { backgroundColor: theme.neutral }]}>
        <Image
          accessibilityLabel={`${sign.name} example`}
          contentFit="cover"
          source={sign.image}
          style={styles.signImage}
        />
      </View>
      <View style={styles.cardCopy}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor.background }]}>
          <Text style={[styles.categoryBadgeLabel, { color: categoryColor.text }]}>
            {sign.category.toUpperCase()}
          </Text>
        </View>
        <Text numberOfLines={1} style={[styles.signName, { color: theme.text }]}>
          {sign.name}
        </Text>
        <Text numberOfLines={3} style={[styles.signDescription, { color: theme.textSecondary }]}>
          {sign.description}
        </Text>
      </View>
    </View>
  );
}

export function SignCatalogScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState<CatalogFilter>('All Signs');
  const [search, setSearch] = useState('');

  const filteredSigns = useMemo(() => {
    const query = normalizeEnglishSearch(search);

    return catalogSigns.filter((sign) => {
      const matchesCategory = activeCategory === 'All Signs' || sign.category === activeCategory;
      const searchableText = normalizeEnglishSearch(
        `${sign.name} ${sign.category} ${sign.description}`,
      );

      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [activeCategory, search]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View
          style={[
            styles.header,
            { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border },
          ]}
        >
          <AppButton
            accessibilityLabel="Back to reviewer work"
            hitSlop={Spacing.one}
            onPress={() => router.replace('/work/submission-review')}
            style={styles.backButton}
            variant="ghost"
          >
            <SymbolView
              name={{ android: 'arrow_back', ios: 'chevron.left', web: 'arrow_back' }}
              size={22}
              tintColor={theme.text}
            />
          </AppButton>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Sign Catalog</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.searchShell,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <SymbolView
              name={{ android: 'search', ios: 'magnifyingglass', web: 'search' }}
              size={19}
              tintColor={theme.placeholder}
            />
            <TextInput
              accessibilityLabel="Search signs"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearch}
              placeholder="Search signs..."
              placeholderTextColor={theme.placeholder}
              returnKeyType="search"
              style={[styles.searchInput, { color: theme.text }]}
              value={search}
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.filters}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {signCategories.map((category) => {
              const selected = activeCategory === category;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={category}
                  onPress={() => setActiveCategory(category)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selected ? theme.primary : theme.backgroundElement,
                      borderColor: selected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterLabel,
                      { color: selected ? theme.onPrimary : theme.text },
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {filteredSigns.length > 0 ? (
            <View style={styles.grid}>
              {filteredSigns.map((sign) => (
                <SignCard key={sign.id} sign={sign} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No signs found</Text>
              <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}> 
                Try another English name, description, or category.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <ReviewBottomTabs activeTab="catalog" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.half,
  },
  backButton: { width: 48, height: 48, minHeight: 48, paddingHorizontal: 0, paddingVertical: 0 },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 24,
    textAlign: 'center',
  },
  headerSpacer: { width: 48 },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    paddingBottom: Spacing.four,
  },
  searchShell: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Rounded.lg,
    paddingHorizontal: Spacing.two,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: Spacing.one,
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  filters: { gap: Spacing.one, paddingRight: Spacing.two },
  filterChip: {
    minHeight: 34,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: Spacing.two,
  },
  filterLabel: { fontFamily: Fonts.body, fontSize: 11, fontWeight: 700 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  card: {
    width: '48%',
    minHeight: 262,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: Rounded.lg,
    padding: Spacing.one,
    shadowColor: '#0C5963',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  imageShell: {
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: Rounded.md,
  },
  signImage: { width: '100%', height: '100%' },
  cardCopy: { gap: Spacing.half, paddingTop: Spacing.one },
  categoryBadge: { alignSelf: 'flex-start', borderRadius: Rounded.sm, paddingHorizontal: 5, paddingVertical: 2 },
  categoryBadgeLabel: { fontFamily: Fonts.body, fontSize: 8, fontWeight: 900, letterSpacing: 0.35 },
  signName: { fontFamily: Fonts.body, fontSize: 15, fontWeight: 800, lineHeight: 20 },
  signDescription: { fontFamily: Fonts.body, fontSize: 11, fontWeight: 500, lineHeight: 15 },
  emptyState: { alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.six },
  emptyTitle: { fontFamily: Fonts.body, fontSize: 18, fontWeight: 800 },
  emptyCopy: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
