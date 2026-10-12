import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CatalogCategory, CatalogSign } from '@/api/reviews/catalog';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useGetCatalog } from '@/feature/review/hooks/use-review';
import { useTheme } from '@/hooks/use-theme';

export interface RevalidationSignPickerModalProps {
  onClose: () => void;
  onSelectSign?: (sign: CatalogSign) => void;
  selectedSignId?: number | null;
  title?: string;
  visible: boolean;
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function categoryBadgeColor(code?: string) {
  const normalized = (code ?? '').toUpperCase();
  if (normalized.includes('WARN') || normalized.includes('DANGER') || normalized.startsWith('W')) {
    return { background: '#FEF3C7', text: '#B45309' };
  }
  if (normalized.includes('GUIDE') || normalized.includes('INFO') || normalized.startsWith('I')) {
    return { background: '#DCFCE7', text: '#15803D' };
  }
  if (normalized.includes('PROHIB') || normalized.startsWith('P')) {
    return { background: '#FEE2E2', text: '#B91C1C' };
  }
  if (normalized.includes('REGUL') || normalized.startsWith('R')) {
    return { background: '#DBEAFE', text: '#1D4ED8' };
  }
  return { background: '#F3E8FF', text: '#7E22CE' };
}

export function RevalidationSignPickerModal({
  onClose,
  onSelectSign,
  selectedSignId,
  title = 'Chọn loại biển báo thay thế',
  visible,
}: RevalidationSignPickerModalProps) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | number>('all');

  const { data: catalog, isPending: isLoading } = useGetCatalog(visible);
  const categories: CatalogCategory[] = useMemo(() => catalog?.categories ?? [], [catalog]);
  const catalogSigns: CatalogSign[] = useMemo(() => catalog?.signs ?? [], [catalog]);

  const filteredSigns = useMemo(() => {
    const query = normalizeSearch(search);
    return catalogSigns.filter((sign) => {
      const matchesCategory =
        selectedCategory === 'all' || sign.categoryId === selectedCategory;
      const searchableText = normalizeSearch(
        `${sign.nameVi ?? ''} ${sign.nameEn ?? ''} ${sign.signCode ?? ''} ${(sign.category as any)?.nameVi ?? ''} ${sign.category?.nameEn ?? ''} ${sign.description ?? ''}`,
      );
      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [catalogSigns, search, selectedCategory]);

  const handleClose = () => {
    setSearch('');
    setSelectedCategory('all');
    onClose();
  };

  const renderSignItem = ({ item }: { item: CatalogSign }) => {
    const isSelected = selectedSignId === item.id;
    const colors = categoryBadgeColor(item.category?.code || item.signCode);
    const imageUrl = item.representativeImageKey
      ? resolveS3Url(item.representativeImageKey)
      : '';

    return (
      <Pressable
        accessibilityLabel={`Chọn biển báo ${item.signCode} - ${item.nameVi || item.nameEn}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        key={item.id}
        onPress={() => {
          onSelectSign?.(item);
          handleClose();
        }}
        style={({ pressed }) => [
          styles.signCard,
          {
            backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement,
            borderColor: isSelected ? theme.primary : theme.border,
          },
          pressed && styles.signCardPressed,
        ]}
      >
        <View style={[styles.signCardImageWrapper, { backgroundColor: theme.neutral }]}>
          {imageUrl ? (
            <Image
              contentFit="contain"
              source={{ uri: imageUrl }}
              style={styles.signCardImage}
              transition={120}
            />
          ) : (
            <MaterialCommunityIcons color={theme.placeholder} name="traffic-light" size={28} />
          )}
          {isSelected ? (
            <View style={[styles.signCardCheckBadge, { backgroundColor: theme.primary }]}>
              <MaterialCommunityIcons color="#FFFFFF" name="check" size={12} />
            </View>
          ) : null}
        </View>

        <View style={styles.signCardContent}>
          <View style={styles.signCodeRow}>
            <View style={[styles.signCodeBadge, { backgroundColor: colors.background }]}>
              <Text style={[styles.signCodeBadgeText, { color: colors.text }]}>
                {item.signCode}
              </Text>
            </View>
          </View>
          <Text numberOfLines={2} style={[styles.signCardTitle, { color: theme.text }]}>
            {item.nameVi || item.nameEn}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Đóng" onPress={handleClose} style={styles.backdrop} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={styles.sheetPositioner}
        >
          <SafeAreaView
            edges={['bottom']}
            style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}
          >
            {/* Header Handle */}
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View style={styles.headerTitleWrap}>
                <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.text }]}>
                  {title}
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                  {filteredSigns.length} biển báo trong danh mục
                </Text>
              </View>
              <AppButton
                accessibilityLabel="Đóng"
                onPress={handleClose}
                style={styles.closeBtn}
                variant="ghost"
              >
                <MaterialCommunityIcons color={theme.text} name="close" size={22} />
              </AppButton>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBarWrapper}>
              <View
                style={[
                  styles.searchShell,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons color={theme.placeholder} name="magnify" size={20} />
                <TextInput
                  accessibilityLabel="Tìm kiếm biển báo"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setSearch}
                  placeholder="Tìm theo mã (P.102...), tên biển..."
                  placeholderTextColor={theme.placeholder}
                  returnKeyType="search"
                  style={[styles.searchInput, { color: theme.text }]}
                  value={search}
                />
                {search.length > 0 ? (
                  <Pressable hitSlop={8} onPress={() => setSearch('')}>
                    <MaterialCommunityIcons
                      color={theme.placeholder}
                      name="close-circle"
                      size={18}
                    />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Category Filter Chips */}
            <View style={styles.categoriesWrapper}>
              <ScrollView
                contentContainerStyle={styles.categoryScroll}
                horizontal
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelectedCategory('all')}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        selectedCategory === 'all'
                          ? theme.primary
                          : theme.neutral,
                      borderColor:
                        selectedCategory === 'all' ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color:
                          selectedCategory === 'all'
                            ? '#FFFFFF'
                            : theme.textSecondary,
                        fontWeight: selectedCategory === 'all' ? '800' : '600',
                      },
                    ]}
                  >
                    Tất cả
                  </Text>
                </Pressable>

                {categories.map((c) => {
                  const isCatSelected = selectedCategory === c.id;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={c.id}
                      onPress={() => setSelectedCategory(c.id)}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isCatSelected
                            ? theme.primary
                            : theme.neutral,
                          borderColor: isCatSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color: isCatSelected
                              ? '#FFFFFF'
                              : theme.textSecondary,
                            fontWeight: isCatSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {c.nameVi || c.nameEn}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Content: Signs Grid or States */}
            {isLoading && catalogSigns.length === 0 ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator color={theme.primary} size="large" />
                <Text style={[styles.stateText, { color: theme.textSecondary }]}>
                  Đang tải danh mục biển báo...
                </Text>
              </View>
            ) : filteredSigns.length === 0 ? (
              <View style={styles.centerContainer}>
                <MaterialCommunityIcons
                  color={theme.placeholder}
                  name="file-search-outline"
                  size={42}
                />
                <Text style={[styles.stateTitle, { color: theme.text }]}>
                  Không tìm thấy biển báo
                </Text>
                <Text style={[styles.stateText, { color: theme.textSecondary }]}>
                  Thử tìm theo từ khóa khác hoặc chuyển danh mục biển báo.
                </Text>
              </View>
            ) : (
              <FlatList
                contentContainerStyle={styles.listContent}
                data={filteredSigns}
                initialNumToRender={10}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                maxToRenderPerBatch={10}
                numColumns={2}
                renderItem={renderSignItem}
                windowSize={5}
              />
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  sheetPositioner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '92%',
    height: '86%',
    borderTopLeftRadius: Rounded.lg,
    borderTopRightRadius: Rounded.lg,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHandle: {
    width: 34,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
    marginTop: Spacing.one,
  },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrapper: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    paddingVertical: 0,
    height: '100%',
  },
  categoriesWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    paddingBottom: Spacing.one,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.three,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipText: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  listContent: {
    padding: Spacing.two,
    gap: Spacing.two,
  },
  signCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 140,
  },
  signCardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },
  signCardImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  signCardImage: {
    width: 52,
    height: 52,
  },
  signCardCheckBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signCardContent: {
    width: '100%',
    alignItems: 'center',
  },
  signCodeRow: {
    marginBottom: 2,
  },
  signCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  signCodeBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '800',
  },
  signCardTitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.four,
  },
  stateTitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  stateText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
});
