import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ComponentProps, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { PrimaryGradientBackdrop } from '@/components/primary-gradient-backdrop';
import { UpdateModal } from '@/components/update-modal';
import { OfflineMapModal } from '@/components/offline-map-modal';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import {
  ACCOUNT_ROLES,
  type AccountRole,
  type OptionalAccountRole,
  useSession,
} from '@/context/session-provider';
import { useAppUpdate } from '@/hooks/use-app-update';
import { useTheme } from '@/hooks/use-theme';
import { getProfile, type UserProfileResponse } from '@/api/auth/auth';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const roleMap: Record<string, AccountRole> = {
  DRIVER: 'driver',
  REVIEWER: 'reviewer',
  SURVEYOR: 'surveyor',
  driver: 'driver',
  reviewer: 'reviewer',
  surveyor: 'surveyor',
};

const useScreenFocusEffect = typeof useFocusEffect === 'function' ? useFocusEffect : useEffect;

const roleLabels: Record<AccountRole, string> = {
  driver: 'Tài xế',
  reviewer: 'Thẩm định viên',
  surveyor: 'Khảo sát viên',
};

const roleIcons: Record<AccountRole, MaterialIconName> = {
  driver: 'car-outline',
  reviewer: 'shield-check-outline',
  surveyor: 'camera-outline',
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

function mapRolesList(roles?: readonly string[]): AccountRole[] {
  if (!Array.isArray(roles)) return [];
  return roles
    .map(
      (r) =>
        roleMap[r.toUpperCase()] || roleMap[r.toLowerCase()] || (r.toLowerCase() as AccountRole),
    )
    .filter((r): r is AccountRole => Boolean(roleLabels[r]));
}

export function ProfileScreen() {
  const router = useRouter();
  const { logOut, session, setRoleEnabled, updateAccount } = useSession();
  const theme = useTheme();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [togglingRole, setTogglingRole] = useState<OptionalAccountRole | null>(null);
  const isMountedRef = useRef(true);
  const updateAccountRef = useRef(updateAccount);
  updateAccountRef.current = updateAccount;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const data = await getProfile(session.accessToken);
      if (data && isMountedRef.current) {
        setProfile(data);
        const mappedRoles = Array.isArray(data.roles) ? mapRolesList(data.roles) : undefined;
        const mappedRegisteredRoles = Array.isArray(data.registeredRoles)
          ? mapRolesList(data.registeredRoles)
          : undefined;
        void updateAccountRef.current?.({
          ...(data.fullName ? { displayName: data.fullName } : {}),
          ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
          ...(data.address !== undefined ? { address: data.address } : {}),
          ...(mappedRoles ? { roles: mappedRoles } : {}),
          ...(mappedRegisteredRoles ? { registeredRoles: mappedRegisteredRoles } : {}),
        });
      }
    } catch {
      // ignore
    }
  }, [session?.accessToken]);

  useScreenFocusEffect(
    useCallback(() => {
      void fetchProfile();
    }, [fetchProfile]),
  );
  const { scrollTo, t } = useLocalSearchParams<{ scrollTo?: string; t?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const signFilterRef = useRef<View>(null);
  const menuButtonRef = useRef<View>(null);

  const [isRoleSectionOpen, setIsRoleSectionOpen] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 195, right: 20 });
  const [isOfflineMapModalOpen, setIsOfflineMapModalOpen] = useState(false);

  useEffect(() => {
    if (scrollTo === 'signFilter' || scrollTo === 'sign-filter') {
      router.push('/(authenticated)/(tabs)/profile/sign-filters');
    }
  }, [router, scrollTo, t]);

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

  const displayName =
    profile?.fullName ?? session?.account.displayName ?? 'Người dùng SignTrustMap';
  const email = profile?.email ?? session?.account.email ?? '';
  const avatarUrl =
    profile?.avatarUrl !== undefined ? profile.avatarUrl : (session?.account.avatarUrl ?? null);

  const rawRoles = profile?.roles ?? session?.account.roles ?? ['driver'];
  const userRoles = mapRolesList(rawRoles);
  const effectiveRoles: AccountRole[] = userRoles.includes('driver')
    ? userRoles
    : ['driver', ...userRoles];
  const activeRolesCount = effectiveRoles.length;

  const hasRegisteredRolesInfo =
    Array.isArray(profile?.registeredRoles) || Array.isArray(session?.account.registeredRoles);
  const rawRegisteredRoles = profile?.registeredRoles ?? session?.account.registeredRoles;
  const registeredRoleSet = new Set<AccountRole>(
    hasRegisteredRolesInfo
      ? [
          'driver' as AccountRole,
          ...mapRolesList(rawRegisteredRoles),
          ...effectiveRoles,
          ...(profile?.profileStats?.surveyor ? (['surveyor'] as const) : []),
          ...(profile?.profileStats?.reviewer ? (['reviewer'] as const) : []),
        ]
      : ACCOUNT_ROLES,
  );

  const handleToggleRole = async (role: OptionalAccountRole, nextEnabled: boolean) => {
    if (togglingRole) return;
    setTogglingRole(role);
    try {
      await setRoleEnabled(role, nextEnabled, { throwOnError: true });
      await fetchProfile();
    } catch (err: any) {
      Alert.alert(
        'Không thể cập nhật vai trò',
        err?.message || 'Không thể thay đổi trạng thái vai trò. Vui lòng thử lại.',
      );
    } finally {
      if (isMountedRef.current) {
        setTogglingRole(null);
      }
    }
  };

  const handleRegisterRole = (role: OptionalAccountRole) => {
    router.push({
      pathname: '/(authenticated)/(tabs)/profile/edit',
      params: { mode: 'register', role },
    });
  };

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
    Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          setIsMenuOpen(false);
          try {
            await logOut();
          } catch (err) {
            Alert.alert('Đăng xuất thất bại', 'Không thể đăng xuất. Vui lòng thử lại sau.');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.primary }]}>
      <PrimaryGradientBackdrop testIDPrefix="profile" />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Account Header Section over Full-screen Primary Gradient */}
        <View style={styles.accountHeader}>
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
                style={[styles.avatar, { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }]}
              >
                {avatarUrl ? (
                  <Image
                    resizeMode="cover"
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={[styles.avatarText, { color: theme.primary }]}>
                    {getInitials(displayName)}
                  </Text>
                )}
              </View>

              <View style={styles.userDetails}>
                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.name}>
                  {displayName}
                </Text>
                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.email}>
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
              accessibilityLabel={
                isRoleSectionOpen ? 'Thu gọn vai trò tài khoản' : 'Mở rộng vai trò tài khoản'
              }
              accessibilityRole="button"
              onPress={() => setIsRoleSectionOpen((prev) => !prev)}
              style={styles.collapsibleHeader}
            >
              <View style={styles.headerLeft}>
                <View style={[styles.sectionIconBadge]}>
                  <MaterialCommunityIcons
                    color={theme.primary}
                    name="account-switch-outline"
                    size={20}
                  />
                </View>
                <View style={styles.headerTitles}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Vai trò tài khoản
                  </Text>
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
                <View style={styles.roleList}>
                  {ACCOUNT_ROLES.map((role, index) => {
                    const isEnabled = effectiveRoles.includes(role);
                    const isRegistered = role === 'driver' || registeredRoleSet.has(role);
                    const isToggling = togglingRole === role;
                    const isLast = index === ACCOUNT_ROLES.length - 1;

                    const trailingControl = !isRegistered ? (
                      <Pressable
                        accessibilityLabel={`Đăng ký vai trò ${roleLabels[role]}`}
                        accessibilityRole="button"
                        onPress={() => handleRegisterRole(role as OptionalAccountRole)}
                        style={({ pressed }) => [
                          styles.registerButton,
                          {
                            backgroundColor: theme.primary,
                            borderColor: theme.primary,
                          },
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text style={styles.registerButtonText}>Đăng ký</Text>
                      </Pressable>
                    ) : (
                        <View
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor: isEnabled
                                ? theme.backgroundSelected
                                : theme.background,
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
                      );

                    const rowContent = (
                      <>
                        <View style={[styles.iconTile]}>
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
                            {role === 'driver'
                              ? 'Quyền điều hướng bản đồ'
                              : `Công cụ ${roleLabels[role]}`}
                          </Text>
                        </View>
                        {trailingControl}
                      </>
                    );

                    if (role === 'driver' || !isRegistered) {
                      return (
                        <View
                          key={role}
                          style={[
                            styles.roleRow,
                            !isLast && {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: theme.border,
                            },
                          ]}
                        >
                          {rowContent}
                        </View>
                      );
                    }

                    return (
                      <Pressable
                        accessibilityLabel={`${isEnabled ? 'Tắt' : 'Bật'} vai trò ${roleLabels[role]}`}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: isEnabled, disabled: Boolean(togglingRole) }}
                        disabled={Boolean(togglingRole)}
                        key={role}
                        onPress={() =>
                          void handleToggleRole(role as OptionalAccountRole, !isEnabled)
                        }
                        style={({ pressed }) => [
                          styles.roleRow,
                          !isLast && {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: theme.border,
                          },
                          (pressed || isToggling) && { opacity: 0.7 },
                        ]}
                      >
                        {rowContent}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>

          {/* Section 2: Sign Filter Navigation Card */}
          <View
            collapsable={false}
            ref={signFilterRef}
            style={[
              styles.collapsibleCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <Pressable
              accessibilityLabel="Mở màn hình bộ lọc biển báo"
              accessibilityRole="button"
              onPress={() => router.push('/(authenticated)/(tabs)/profile/sign-filters')}
              style={styles.collapsibleHeader}
            >
              <View style={styles.headerLeft}>
                <View style={[styles.sectionIconBadge]}>
                  <MaterialCommunityIcons color={theme.primary} name="filter-variant" size={20} />
                </View>
                <View style={styles.headerTitles}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Bộ lọc biển báo</Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.placeholder }]}>
                    Tùy chỉnh danh mục hiển thị trên bản đồ
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons color={theme.placeholder} name="chevron-right" size={22} />
            </Pressable>
          </View>

          {/* Section 3: Offline Maps Card */}
          <View
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
                <View style={[styles.sectionIconBadge]}>
                  <MaterialCommunityIcons color={theme.primary} name="map-marker-down" size={20} />
                </View>
                <View style={styles.headerTitles}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Bản đồ ngoại tuyến
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.placeholder }]}>
                    Tải và quản lý bản đồ ngoại tuyến
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons color={theme.placeholder} name="chevron-right" size={22} />
            </Pressable>
          </View>

          {/* Log out */}
          <View
            style={[
              styles.collapsibleCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <Pressable
              accessibilityLabel="Đăng xuất"
              accessibilityRole="button"
              onPress={() => handleLogOut()}
              style={styles.collapsibleHeader}
            >
              <View style={styles.headerLeft}>
                <View style={[styles.sectionIconBadge]}>
                  <MaterialCommunityIcons color={theme.danger} name="logout" size={20} />
                </View>
                <View style={styles.headerTitles}>
                  <Text style={[styles.sectionTitle, { color: theme.danger }]}>Đăng xuất</Text>
                </View>
              </View>
            </Pressable>
          </View>
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
                <Text style={[styles.dropdownItemLabel, { color: theme.text }]}>
                  Cập nhật ứng dụng
                </Text>
                <Text style={[styles.dropdownItemSublabel, { color: theme.placeholder }]}>
                  {status === 'checking' ? 'Đang kiểm tra...' : `Phiên bản ${currentVersion}`}
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
                <Text style={[styles.dropdownItemLabel, { color: theme.text }]}>
                  Bản đồ ngoại tuyến
                </Text>
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

      <OfflineMapModal
        accessToken={session?.accessToken}
        onClose={() => setIsOfflineMapModalOpen(false)}
        visible={isOfflineMapModalOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  accountHeader: {
    position: 'relative',
    paddingBottom: Spacing.three,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
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
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
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
    gap: 0,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 0,
    paddingVertical: Spacing.two,
    gap: Spacing.three,
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
  registerButton: {
    borderWidth: 1,
    borderRadius: Rounded.round,
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
