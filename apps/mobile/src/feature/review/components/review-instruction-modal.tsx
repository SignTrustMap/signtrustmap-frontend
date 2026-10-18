import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/button';
import { useTheme } from '@/hooks/use-theme';
import { Fonts, Spacing } from '@/constants/theme';

export function ReviewInstructionModal({ isHelpModalVisible, setIsHelpModalVisible }: { isHelpModalVisible: boolean, setIsHelpModalVisible: (value: boolean) => void }) {
    const theme = useTheme();

    return (
        <Modal
            animationType="fade"
            onRequestClose={() => setIsHelpModalVisible(false)}
            statusBarTranslucent
            transparent
            visible={isHelpModalVisible}
        >
            <Pressable
                accessibilityLabel="Đóng hướng dẫn"
                onPress={() => setIsHelpModalVisible(false)}
                style={styles.helpModalBackdrop}
            >
                <Pressable
                    onPress={(e) => e.stopPropagation()}
                    style={[
                        styles.helpDialogCard,
                        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.helpDialogHeader}>
                        <View style={[styles.helpHeaderIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                            <MaterialCommunityIcons color={theme.primary} name="gesture-swipe" size={24} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.helpDialogTitle, { color: theme.text }]}>Hướng dẫn quẹt thẻ</Text>
                            <Text style={[styles.helpDialogSubtitle, { color: theme.textSecondary }]}>
                                Thao tác nhanh trên ảnh minh chứng
                            </Text>
                        </View>
                        <Pressable
                            accessibilityLabel="Đóng"
                            hitSlop={8}
                            onPress={() => setIsHelpModalVisible(false)}
                            style={styles.helpCloseBtn}
                        >
                            <MaterialCommunityIcons color={theme.textSecondary} name="close" size={20} />
                        </Pressable>
                    </View>

                    {/* Directions List */}
                    <View style={styles.helpGuideList}>
                        {/* Right: Approve */}
                        <View style={[styles.helpGuideItem, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
                            <View style={[styles.helpItemIconBadge, { backgroundColor: '#16A34A' }]}>
                                <MaterialCommunityIcons color="#FFFFFF" name="arrow-right-bold" size={16} />
                            </View>
                            <View style={styles.helpItemContent}>
                                <Text style={[styles.helpItemTitle, { color: '#16A34A' }]}>Quẹt sang PHẢI: Đồng ý</Text>
                                <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                                    Phê duyệt biển báo đúng theo hình ảnh thực tế.
                                </Text>
                            </View>
                        </View>

                        {/* Left: Decline */}
                        <View style={[styles.helpGuideItem, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                            <View style={[styles.helpItemIconBadge, { backgroundColor: '#DC2626' }]}>
                                <MaterialCommunityIcons color="#FFFFFF" name="arrow-left-bold" size={16} />
                            </View>
                            <View style={styles.helpItemContent}>
                                <Text style={[styles.helpItemTitle, { color: '#DC2626' }]}>Quẹt sang TRÁI: Từ chối</Text>
                                <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                                    Từ chối hoặc chọn gợi ý biển báo chính xác hơn.
                                </Text>
                            </View>
                        </View>

                        {/* Up: Skip */}
                        <View style={[styles.helpGuideItem, { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' }]}>
                            <View style={[styles.helpItemIconBadge, { backgroundColor: '#2563EB' }]}>
                                <MaterialCommunityIcons color="#FFFFFF" name="arrow-up-bold" size={16} />
                            </View>
                            <View style={styles.helpItemContent}>
                                <Text style={[styles.helpItemTitle, { color: '#2563EB' }]}>Quẹt LÊN TRÊN: Bỏ qua</Text>
                                <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                                    Bỏ qua biển báo nếu không thể nhận diện.
                                </Text>
                            </View>
                        </View>

                        {/* Down: Report */}
                        <View style={[styles.helpGuideItem, { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }]}>
                            <View style={[styles.helpItemIconBadge, { backgroundColor: '#EA580C' }]}>
                                <MaterialCommunityIcons color="#FFFFFF" name="arrow-down-bold" size={16} />
                            </View>
                            <View style={styles.helpItemContent}>
                                <Text style={[styles.helpItemTitle, { color: '#EA580C' }]}>Quẹt XUỐNG DƯỚI: Báo cáo</Text>
                                <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                                    Báo cáo dữ liệu bị sai lệch, trùng lặp hoặc vi phạm.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.helpTipBox}>
                        <MaterialCommunityIcons color={theme.placeholder} name="information-outline" size={14} />
                        <Text style={[styles.helpTipText, { color: theme.textSecondary }]}>
                            Bạn cũng có thể bấm trực tiếp vào 4 nút tròn kim cương ở dưới để đưa ra quyết định.
                        </Text>
                    </View>

                    {/* Confirm button */}
                    <AppButton
                        label="Đã hiểu"
                        onPress={() => setIsHelpModalVisible(false)}
                        style={styles.helpConfirmBtn}
                        variant="primary"
                    />
                </Pressable>
            </Pressable>
        </Modal>
    )
}

const styles = StyleSheet.create({
    helpModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.three,
    },
    helpDialogCard: {
        width: '100%',
        maxWidth: 348,
        borderRadius: 20,
        borderWidth: 1,
        padding: 18,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    helpDialogHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    helpHeaderIconContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    helpDialogTitle: {
        fontFamily: Fonts.body,
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 20,
    },
    helpDialogSubtitle: {
        fontFamily: Fonts.body,
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    helpCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    helpGuideList: {
        gap: 8,
        marginBottom: 12,
    },
    helpGuideItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    helpItemIconBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    helpItemContent: {
        flex: 1,
    },
    helpItemTitle: {
        fontFamily: Fonts.body,
        fontSize: 12,
        fontWeight: '800',
    },
    helpItemDesc: {
        fontFamily: Fonts.body,
        fontSize: 10.5,
        fontWeight: '500',
        lineHeight: 14,
        marginTop: 1,
    },
    helpTipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        marginBottom: 14,
    },
    helpTipText: {
        flex: 1,
        fontSize: 10.5,
        fontWeight: '500',
        lineHeight: 14,
    },
    helpConfirmBtn: {
        minHeight: 44,
        borderRadius: 12,
    },
})

