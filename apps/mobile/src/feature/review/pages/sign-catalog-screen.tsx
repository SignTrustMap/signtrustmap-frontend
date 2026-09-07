import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { ReviewBottomTabs } from '@/feature/review/components/review-bottom-tabs';
import {
  getCatalog,
  type CatalogCategory,
  type CatalogSign,
} from '@/feature/review/services/catalog-api';
import { useTheme } from '@/hooks/use-theme';

type CatalogFilter = 'all' | number;

const fallbackSignImage = require('@/assets/images/smaple_signs/stop_sign.webp');

function categoryColor(code: string) {
  const normalized = code.toUpperCase();
  if (normalized.includes('WARN') || normalized.includes('DANGER')) {
    return { background: '#FDE8E7', text: '#B42318' };
  }
  if (normalized.includes('GUIDE') || normalized.includes('INFO')) {
    return { background: '#DCFCE7', text: '#167A3D' };
  }
  if (normalized.includes('PROHIB')) return { background: '#FEE2E2', text: '#B91C1C' };
  if (normalized.includes('REGUL')) return { background: '#DDEBFF', text: '#175CD3' };
  return { background: '#F0E7FE', text: '#6938B8' };
}

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
  const colors = categoryColor(sign.category.code);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <View style={[styles.imageShell, { backgroundColor: theme.neutral }]}>
        <Image
          accessibilityLabel={`${sign.nameEn || sign.nameVi} example`}
          contentFit="cover"
          source={sign.representativeImageKey || fallbackSignImage}
          style={styles.signImage}
        />
      </View>
      <View style={styles.cardCopy}>
        <View style={[styles.categoryBadge, { backgroundColor: colors.background }]}>
          <Text style={[styles.categoryBadgeLabel, { color: colors.text }]}>
            {sign.category.nameEn.toUpperCase()}
          </Text>
        </View>
        <Text numberOfLines={1} style={[styles.signName, { color: theme.text }]}>
          {sign.nameEn || sign.nameVi}
        </Text>
        <Text numberOfLines={3} style={[styles.signDescription, { color: theme.textSecondary }]}>
          {sign.description || sign.signCode}
        </Text>
      </View>
    </View>
  );
}

export function SignCatalogScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();
  const [activeCategory, setActiveCategory] = useState<CatalogFilter>('all');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [catalogSigns, setCatalogSigns] = useState<CatalogSign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!session?.accessToken) return;
    getCatalog(session.accessToken)
      .then(({ categories: nextCategories, signs }) => {
        setCategories(nextCategories);
        setCatalogSigns(signs);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Unable to load the sign catalog.');
      })
      .finally(() => setIsLoading(false));
  }, [session?.accessToken]);

  const filteredSigns = useMemo(() => {
    const query = normalizeEnglishSearch(search);

    return catalogSigns.filter((sign) => {
      const matchesCategory = activeCategory === 'all' || sign.categoryId === activeCategory;
      const searchableText = normalizeEnglishSearch(
        `${sign.nameEn} ${sign.nameVi} ${sign.signCode} ${sign.category.nameEn} ${sign.description ?? ''}`,
      );

      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [activeCategory, catalogSigns, search]);

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
            {[{ id: 'all' as const, nameEn: 'All Signs' }, ...categories].map((category) => {
              const selected = activeCategory === category.id;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={category.id}
                  onPress={() => setActiveCategory(category.id)}
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
                    {category.nameEn}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {isLoading ? (
            <ActivityIndicator color={theme.tertiary} size="large" style={styles.loading} />
          ) : error ? (
            <View style={styles.emptyState}>
              <Text accessibilityRole="alert" style={[styles.emptyTitle, { color: theme.text }]}>Catalog unavailable</Text>
              <Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>{error}</Text>
            </View>
          ) : filteredSigns.length > 0 ? (
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
  loading: { paddingVertical: Spacing.six },
  emptyTitle: { fontFamily: Fonts.body, fontSize: 18, fontWeight: 800 },
  emptyCopy: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
