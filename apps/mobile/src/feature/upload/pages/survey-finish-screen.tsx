import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useBackButton } from '@/hooks/use-back-button';
import { useTheme } from '@/hooks/use-theme';
import { useWorkRoute } from '@/hooks/use-work-route';


export function SurveyFinishScreen() {
    const router = useRouter();
    const { submissionId, submissionStatus } = useLocalSearchParams<{
        submissionId?: string;
        submissionStatus?: string;
    }>();
    const theme = useTheme();
    const surveyorWorkRoute = useWorkRoute('/work', { currentRole: 'surveyor' });

    useBackButton(surveyorWorkRoute);

    return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
            <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
                <View style={styles.content}>
                    <View
                        accessibilityLabel="Gửi khảo sát thành công"
                        accessibilityRole="image"
                        style={[styles.icon, { backgroundColor: theme.backgroundSelected }]}
                    >
                        <SymbolView
                            name={{ android: 'check', ios: 'checkmark', web: 'check' }}
                            size={40}
                            tintColor={theme.primary}
                        />
                    </View>

                    <View style={styles.copy}>
                        <Text style={[styles.title, { color: theme.text }]}>Đã gửi hồ sơ khảo sát</Text>
                        <Text style={[styles.description, { color: theme.textSecondary }]}>
                            Hình ảnh của bạn đã được tải lên thành công và đang được đưa vào hàng đợi xử lý.
                        </Text>
                        {submissionId ? (
                            <Text style={[styles.reference, { color: theme.placeholder }]}>
                                Mã tham chiếu {submissionId.slice(0, 8)} - {submissionStatus ?? 'ĐANG CHỜ'}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.actionFooter}>
                        <AppButton
                            label="Gửi khảo sát khác"
                            onPress={() => router.replace('/work/new-survey')}
                            style={styles.action}
                        />
                        <AppButton
                            label="Quay lại trang khảo sát"
                            onPress={() => router.replace(surveyorWorkRoute)}
                            style={styles.action}
                            variant="surface"
                        />
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        width: '100%',
        maxWidth: 480,
        flex: 1,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.four,
        padding: Spacing.four,
    },
    icon: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 40,
    },
    copy: {
        alignItems: 'center',
        gap: Spacing.one,
    },
    title: {
        fontFamily: Fonts.body,
        fontSize: 26,
        fontWeight: 900,
        lineHeight: 34,
    },
    description: {
        maxWidth: 340,
        fontFamily: Fonts.body,
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 21,
        textAlign: 'center',
    },
    reference: {
        fontFamily: Fonts.mono,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 17,
        textAlign: 'center',
    },
    actionFooter: {
        width: '100%',
    },
    action: {
        width: '100%',
        minHeight: 50,
        borderRadius: Rounded.md,
        marginTop: Spacing.two,
    },
});
