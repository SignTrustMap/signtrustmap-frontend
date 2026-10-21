import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ComponentProps, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { SignFilterManager } from '../components/sign-filter-manager';
import { UpdateModal } from '@/components/update-modal';
// import { OfflineMapModal } from '@/components/offline-map-modal';
import { AppButton } from '@/components/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import {
  ACCOUNT_ROLES,
  type AccountRole,
  type OptionalAccountRole,
  useSession,
} from '@/context/session-provider';
import { useAppUpdate } from '@/hooks/use-app-update';
import { useTheme } from '@/hooks/use-theme';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const roleLabels: Record<AccountRole, string> = {
  driver: 'Tài xế',
  reviewer: 'Thẩm định viên',
  surveyor: 'Khảo sát viên',
};

const roleIcons: Record<AccountRole, MaterialIconName> = {
  driver: 'car-outline',
  reviewer: 'shield-check-outline',
  surveyor: 'map-marker-path',
};

function getInitials(displayName?: string) {
  if (!displayName) return 'ST';

  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

// Continuous 256-step linear gradient from brand primary teal (#007B8B) to white (#FFFFFF)
const GRADIENT_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAEACAYAAAByPhyYAAADQ0lEQVR4nH3EdVAWdgDH4e+6u5xzrru7u7t36936Vre6xc1AZ4K0dHdJg5QgJQiCtAiCSElIi4gSfna/lxcXt9vzxyMtWIP+vyP+1UJL9taO/I+O+qtFlhzQ0f/sGEuLZzt2sePfO86SzWzH2zhZO2HJbCfO5GztpKWznTyTCzrlj9lOnckVnbZsttNNZyxfa+3Mw521ws3a2aZzVlpyR+daWuWOzjPNWeWB5qz2QOeb5q72RHNtPdEFpnm2XmienRe60DTfzhvNX+ONLjJdbLrE3sfapQ4+6DIHX3S5JUc/dIXpSic/dJWTv7Wrnf3RNc4B6FqXAHTdTIHoetdAdINrELpxbRC6yXSzW7C1W9yD0a3uIeg20+0eoegO052eoeguzzB0t5elcHSPdzi61zsC3ecTge43PeAbiR40PeQXhR42PeIfjR41PRYQjR4PiEFPBMagJwPXoaeC1qGng2LRM8Gx6NngOPRcSBx6PiQevRAaj140vRSWgF42vRKeiF6NSESvRSSh1yOT0BuRyejNqGT0VlQKejs6Bb0TnYrejUlF761bj943fRCbhj40fRSXjj6OT0efxGegTxMy0GcJmejzxCz0RVIW+jJpA/oqeQP6OjkbfZOSjb5NzUHfmb5fvxH9kLYR/ZiWi35Kz0M/m37JyEe/Zuaj3zIL0O9ZBWjBhkK00LQoexOyySlCS0xLNxajZbnFaHnuZrQirwStzC9Bq/NLkW1BKbIr3ILsC8uQw6Yy5FhUjpxNLsVbkevmCuRmci+pRJ6llchrSxXy3lKNfMuqkV95DfIvr0WBW2tRUEUdCqnchkJNYVX1KKK6HkXWbEfRNQ0oprYBxdY1orhtO1C8KbG+CSVtb0YpDc0otWEnSmtsQek7WlBm0y6U1dSKsptbUc7ONpTb0o7ydrWjgl0dqLC1ExW17UbF7btRSXsXKu3oRmWd3Wjr7h5U0dWLqrp7UXX3HlTb04fqevtR/Z5+1NA3gBr7BlFT/xBqHhhCLYPDqHVoBLUNj6CO4b2oc2QUde3dh3pG96HefWOob2w/GhgbR4P7x9Hw+AG098BBNHpwAo1NTKDxyUl0YHIKTUxNo6npaTR96BAC+BN/8b+pDO2n3AAAAABJRU5ErkJggg==';

function PrimaryToWhiteGradient() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        resizeMode="stretch"
        source={{ uri: GRADIENT_BASE64 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { logOut, session, setRoleEnabled } = useSession();
  const theme = useTheme();
  const { scrollTo, t } = useLocalSearchParams<{ scrollTo?: string; t?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const signFilterRef = useRef<View>(null);
  const menuButtonRef = useRef<View>(null);

  const [isRoleSectionOpen, setIsRoleSectionOpen] = useState(true);
  const [isFilterSectionOpen, setIsFilterSectionOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 195, right: 20 });
  const [isOfflineMapModalOpen, setIsOfflineMapModalOpen] = useState(false);

  const performScrollToSignFilter = useCallback(() => {
    if (scrollTo !== 'signFilter' && scrollTo !== 'sign-filter') return;
    setIsFilterSectionOpen(true);

    setTimeout(() => {
      if (signFilterRef.current && scrollViewRef.current) {
        signFilterRef.current.measureLayout(
          scrollViewRef.current as any,
          (_x, y) => {
            if (y > 0) {
              scrollViewRef.current?.scrollTo({
                y: Math.max(0, y - 16),
                animated: true,
              });
            }
          },
          () => { }
        );
      }
    }, 200);
  }, [scrollTo]);

  useEffect(() => {
    if (scrollTo === 'signFilter' || scrollTo === 'sign-filter') {
      setIsFilterSectionOpen(true);
      performScrollToSignFilter();
      const timer = setTimeout(performScrollToSignFilter, 400);
      return () => clearTimeout(timer);
    }
  }, [scrollTo, t, performScrollToSignFilter]);

  const {
    checkForUpdates,
    closeModal,
    currentCommit,
    currentVersion,
    errorMessage,
    isModalOpen,
    releaseInfo,
    status,
  } = useAppUpdate();

  const displayName = session?.account.displayName ?? 'Người dùng SignTrustMap';
  const email = session?.account.email ?? '';
  const activeRolesCount = session?.account.roles?.length ?? 1;

  const handleEditPress = () => {
    router.push('/(authenticated)/(tabs)/profile/edit');
  };

  const handleOpenMenu = () => {
    setIsMenuOpen(true);
    menuButtonRef.current?.measureInWindow?.((_x, y, _width, height) => {
      if (y > 0) {
        setDropdownPosition({
          top: y + height + 6,
          right: Spacing.four,
        });
      }
    });
  };

  const handleLogOut = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            void logOut();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Account Header Section with Theme Primary to White Gradient */}
        <View style={styles.accountHeader}>
          {/* Linear gradient from theme.primary to white */}
          <PrimaryToWhiteGradient />

          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            {/* Top Bar with Back Button */}
            <View style={styles.topBar}>
              <Pressable
                accessibilityLabel="Quay lại"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(authenticated)/(tabs)/home');
                  }
                }}
                style={styles.backButton}
              >
                <MaterialCommunityIcons color="#FFFFFF" name="arrow-left" size={24} />
              </Pressable>
            </View>

            {/* Profile Info Row: Avatar on Left, Name & Email on Right */}
            <View style={styles.profileInfoRow}>
              <View
                accessibilityLabel={`Ảnh đại diện của ${displayName}`}
                style={[
                  styles.avatar,
                  { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
                ]}
              >
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {getInitials(displayName)}
                </Text>
              </View>

              <View style={styles.userDetails}>
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={styles.name}
                >
                  {displayName}
                </Text>
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={styles.email}
                >
                  {email || 'Chưa cập nhật email'}
                </Text>
              </View>
            </View>

            {/* Action Buttons Row: Chỉnh sửa pill, gear, 3-dots */}
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel="Chỉnh sửa thông tin"
                accessibilityRole="button"
                onPress={handleEditPress}
                style={({ pressed }) => [
                  styles.editButton,
                  {
                    borderColor: theme.border,
                    backgroundColor: pressed ? theme.background : '#FFFFFF',
                  },
                ]}
              >
                <Text style={[styles.editButtonText, { color: theme.text }]}>Chỉnh sửa</Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Kiểm tra cập nhật"
                accessibilityRole="button"
                onPress={checkForUpdates}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    borderColor: theme.border,
                    backgroundColor: pressed ? theme.background : '#FFFFFF',
                  },
                ]}
              >
                <MaterialCommunityIcons color={theme.text} name="cog-outline" size={20} />
              </Pressable>

              <View ref={menuButtonRef} collapsable={false}>
                <Pressable
                  accessibilityLabel="Tùy chọn tài khoản"
                  accessibilityRole="button"
                  onPress={handleOpenMenu}
                  style={({ pressed }) => [
                    styles.iconButton,
                    {
                      borderColor: theme.border,
                      backgroundColor: pressed ? theme.background : '#FFFFFF',
                    },
                  ]}
                >
                  <MaterialCommunityIcons color={theme.text} name="dots-vertical" size={20} />
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Body Content with Collapsible Sections */}
        <View style={styles.bodyContent}>
          {/* Section 1: Collapsible Role Toggle Section */}
          <View
            style={[
              styles.collapsibleCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <Pressable
              accessibilityLabel={isRoleSectionOpen ? 'Thu gọn vai trò tài khoản' : 'Mở rộng vai trò tài khoản'}
              accessibilityRole="button"
              onPress={() => setIsRoleSectionOpen((prev) => !prev)}
              style={styles.collapsibleHeader}
            >
              <View style={styles.headerLeft}>
                <View style={[styles.sectionIconBadge, { backgroundColor: theme.secondary }]}>
                  <MaterialCommunityIcons color={theme.primary} name="account-switch-outline" size={20} />
                </View>
                <View style={styles.headerTitles}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Vai trò tài khoản</Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.placeholder }]}>
                    {activeRolesCount} vai trò đang kích hoạt
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                color={theme.placeholder}
                name={isRoleSectionOpen ? 'chevron-up' : 'chevron-down'}
                size={22}
              />
            </Pressable>

            {isRoleSectionOpen ? (
              <View style={[styles.collapsibleBody, { borderTopColor: theme.border }]}>
                <Text style={[styles.roleHintText, { color: theme.textSecondary }]}>
                  Quyền Tài xế luôn được kích hoạt mặc định
                </Text>

                <View style={styles.roleList}>
                  {ACCOUNT_ROLES.map((role) => {
                    const isEnabled = session?.account.roles.includes(role) ?? role === 'driver';

                    const rowContent = (
                      <>
                        <View style={[styles.iconTile, { backgroundColor: theme.secondary }]}>
                          <MaterialCommunityIcons
                            color={theme.primary}
                            name={roleIcons[role]}
                            size={20}
                          />
                        </View>
                        <View style={styles.rowCopy}>
                          <Text style={[styles.rowTitle, { color: theme.text }]}>
                            {roleLabels[role]}
                          </Text>
                          <Text style={[styles.rowDescription, { color: theme.placeholder }]}>
                            {role === 'driver' ? 'Quyền điều hướng bản đồ' : `Công cụ ${roleLabels[role]}`}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor: isEnabled ? theme.backgroundSelected : theme.background,
                              borderColor: isEnabled ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: isEnabled ? theme.primary : theme.placeholder },
                            ]}
                          >
                            {isEnabled ? 'Bật' : 'Tắt'}
                          </Text>
                        </View>
                      </>
                    );

                    if (role === 'driver') {
                      return (
                        <View key={role} style={[styles.roleRow, { borderColor: theme.border }]}>
                          {rowContent}
                        </View>
                      );
                    }

                    return (
                      <AppButton
                        accessibilityLabel={`${isEnabled ? 'Tắt' : 'Bật'} vai trò ${roleLabels[role]}`}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: isEnabled }}
                        key={role}
                        onPress={() => setRoleEnabled(role as OptionalAccountRole, !isEnabled)}
                        style={[styles.roleRow, { borderColor: theme.border }]}
                        variant="ghost"
                      >
                        {rowContent}
                      </AppButton>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>

          {/* Section 2: Collapsible Sign Filter Section */}
          <View
            collapsable={false}
            ref={signFilterRef}
            style={[
              styles.collapsibleCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <Pressable
              accessibilityLabel={isFilterSectionOpen ? 'Thu gọn bộ lọc biển báo' : 'Mở rộng bộ lọc biển báo'}
              accessibilityRole="button"
              onPress={() => setIsFilterSectionOpen((prev) => !prev)}
              style={styles.collapsibleHeader}
            >
              <View style={styles.headerLeft}>
                <View style={[styles.sectionIconBadge, { backgroundColor: theme.secondary }]}>
                  <MaterialCommunityIcons color={theme.primary} name="filter-variant" size={20} />
                </View>
                <View style={styles.headerTitles}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Bộ lọc biển báo</Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.placeholder }]}>
                    Tùy chỉnh danh mục hiển thị trên bản đồ
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                color={theme.placeholder}
                name={isFilterSectionOpen ? 'chevron-up' : 'chevron-down'}
                size={22}
              />
            </Pressable>

            {isFilterSectionOpen ? (
              <View style={[styles.collapsibleBody, { borderTopColor: theme.border }]}>
                <SignFilterManager />
              </View>
            ) : null}
          </View>

          {/* Section 3: Offline Maps Card */}
          {/* <View
            style={[
              styles.collapsibleCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <Pressable
              accessibilityLabel="Mở quản lý bản đồ ngoại tuyến"
              accessibilityRole="button"
              onPress={() => setIsOfflineMapModalOpen(true)}
              style={styles.collapsibleHeader}
            >
              <View style={styles.headerLeft}>
                <View style={[styles.sectionIconBadge, { backgroundColor: theme.secondary }]}>
                  <MaterialCommunityIcons color={theme.primary} name="map-marker-down" size={20} />
                </View>
                <View style={styles.headerTitles}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Bản đồ ngoại tuyến</Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.placeholder }]}>
                    Tải và quản lý gói dữ liệu PMTiles ngoại tuyến
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                color={theme.placeholder}
                name="chevron-right"
                size={22}
              />
            </Pressable>
          </View> */}
        </View>
      </ScrollView>

      {/* Floating Dropdown Menu (Anchored below 3-dots button) */}
      <Modal
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
        transparent
        visible={isMenuOpen}
      >
        <Pressable
          accessibilityLabel="Đóng menu"
          onPress={() => setIsMenuOpen(false)}
          style={styles.dropdownBackdrop}
        >
          <View
            style={[
              styles.dropdownCard,
              {
                top: dropdownPosition.top,
                right: dropdownPosition.right,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <Pressable
              accessibilityLabel="Cập nhật ứng dụng"
              accessibilityRole="button"
              onPress={() => {
                setIsMenuOpen(false);
                checkForUpdates();
              }}
              style={({ pressed }) => [
                styles.dropdownItem,
                { backgroundColor: pressed ? theme.background : 'transparent' },
              ]}
            >
              <MaterialCommunityIcons color={theme.primary} name="cellphone-arrow-down" size={18} />
              <View style={styles.dropdownItemTextGroup}>
                <Text style={[styles.dropdownItemLabel, { color: theme.text }]}>Cập nhật ứng dụng</Text>
                <Text style={[styles.dropdownItemSublabel, { color: theme.placeholder }]}>
                  {status === 'checking'
                    ? 'Đang kiểm tra...'
                    : `Phiên bản ${currentVersion}`}
                </Text>
              </View>
            </Pressable>

            <View style={[styles.dropdownDivider, { backgroundColor: theme.border }]} />

            <Pressable
              accessibilityLabel="Bản đồ ngoại tuyến"
              accessibilityRole="button"
              onPress={() => {
                setIsMenuOpen(false);
                setIsOfflineMapModalOpen(true);
              }}
              style={({ pressed }) => [
                styles.dropdownItem,
                { backgroundColor: pressed ? theme.background : 'transparent' },
              ]}
            >
              <MaterialCommunityIcons color={theme.primary} name="map-marker-down" size={18} />
              <View style={styles.dropdownItemTextGroup}>
                <Text style={[styles.dropdownItemLabel, { color: theme.text }]}>Bản đồ ngoại tuyến</Text>
                <Text style={[styles.dropdownItemSublabel, { color: theme.placeholder }]}>
                  Quản lý gói PMTiles
                </Text>
              </View>
            </Pressable>

            <View style={[styles.dropdownDivider, { backgroundColor: theme.border }]} />

            <Pressable
              accessibilityLabel="Đăng xuất"
              accessibilityRole="button"
              onPress={() => {
                setIsMenuOpen(false);
                handleLogOut();
              }}
              style={({ pressed }) => [
                styles.dropdownItem,
                { backgroundColor: pressed ? theme.background : 'transparent' },
              ]}
            >
              <MaterialCommunityIcons color={theme.danger} name="logout" size={18} />
              <Text style={[styles.dropdownItemLabel, { color: theme.danger }]}>Đăng xuất</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <UpdateModal
        currentCommit={currentCommit}
        currentVersion={currentVersion}
        errorMessage={errorMessage}
        onClose={closeModal}
        onRetry={checkForUpdates}
        releaseInfo={releaseInfo}
        status={status}
        visible={isModalOpen}
      />

      {/* <OfflineMapModal
        accessToken={session?.accessToken}
        onClose={() => setIsOfflineMapModalOpen(false)}
        visible={isOfflineMapModalOpen}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  accountHeader: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    paddingBottom: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E4E3',
  },
  headerSafeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  topBar: {
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    paddingTop: Spacing.one,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontFamily: Fonts.title,
    fontSize: 28,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontFamily: Fonts.body,
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 28,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  email: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  editButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 8,
    borderRadius: Rounded.round,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  editButtonText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  bodyContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  collapsibleCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
    minWidth: 0,
  },
  sectionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  sectionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  collapsibleBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  roleHintText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  roleList: {
    gap: Spacing.two,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    gap: Spacing.two,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  rowDescription: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: Rounded.round,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '800',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  dropdownCard: {
    position: 'absolute',
    width: 210,
    borderRadius: Rounded.md,
    borderWidth: 1,
    paddingVertical: Spacing.half,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  dropdownItemTextGroup: {
    flex: 1,
  },
  dropdownItemLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownItemSublabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 1,
  },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
});
