import { MaterialIcons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    interpolateColor,
    Keyframe,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { AppButton } from '@/components/button';
import {
    EXIT_ANIMATION_DURATION_MS,
    SPLASH_PROGRESS_DURATION_MS,
} from '@/constants/const';
import {
    GPS_REQUIRED_SPLASH_MESSAGE,
    GPS_REQUIRED_SPLASH_TITLE,
    GPS_SERVICE_DISABLED_MESSAGE,
    GPS_SERVICE_DISABLED_TITLE,
} from '@/constants/message';
import { Colors, Fonts, Rounded, Spacing } from '@/constants/theme';
import type {
    GpsDenialReason,
    GpsPermissionStatus,
} from '@/services/location-permission';

const EXIT_TRANSLATE_Y = Dimensions.get('screen').height;

export type AppSplashScreenProps = {
    gpsStatus?: GpsPermissionStatus;
    gpsDenialReason?: GpsDenialReason;
    isRetryingGps?: boolean;
    onRetryGps?: () => void;
    onOpenSettings?: () => void;
};

export function AppSplashScreen({
    gpsStatus = 'checking',
    gpsDenialReason = 'permission',
    isRetryingGps = false,
    onRetryGps,
    onOpenSettings,
}: AppSplashScreenProps = {}) {
    const progress = useSharedValue(0);
    const shouldReduceMotion = useReducedMotion();
    const hasHiddenNativeSplashRef = useRef(false);
    const exitKeyframe = new Keyframe({
        0: {
            transform: [{ translateY: 0 }],
            opacity: 1,
        },
        100: {
            transform: [{ translateY: EXIT_TRANSLATE_Y }],
            opacity: 1,
            easing: Easing.out(Easing.cubic),
        },
    });

    const handleOverlayLayout = useCallback(() => {
        if (hasHiddenNativeSplashRef.current) return;
        hasHiddenNativeSplashRef.current = true;
        void SplashScreen.hideAsync();
    }, []);

    useEffect(() => {
        progress.value = withTiming(1, {
            duration: shouldReduceMotion ? 0 : SPLASH_PROGRESS_DURATION_MS,
            easing: Easing.linear,
        });

        return () => cancelAnimation(progress);
    }, [progress, shouldReduceMotion]);

    const progressStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            progress.value,
            [0, 1],
            [Colors.placeholder, Colors.primary],
        ),
        transform: [{ scaleX: progress.value }],
    }));

    return (
        <Animated.View
            exiting={exitKeyframe.duration(EXIT_ANIMATION_DURATION_MS)}
            onLayout={handleOverlayLayout}
            style={styles.splashOverlay}
            testID="app-splash-overlay"
        >
            <Image
                accessibilityLabel="Logo SignTrustMap"
                source={require('../../../../assets/images/app-logo.png')}
                style={styles.logo}
            />
            <Text style={styles.title}>SignTrustMap</Text>
            <View
                accessibilityLabel="Đang tải SignTrustMap"
                accessibilityRole="progressbar"
                style={styles.progressTrack}
            >
                <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>

            {gpsStatus === 'denied' ? (
                <View style={styles.gpsPromptCard} testID="splash-gps-required-prompt">
                    <View style={styles.gpsPromptHeader}>
                        <View style={styles.gpsIconBadge}>
                            <MaterialIcons name="location-off" size={22} color={Colors.primary} />
                        </View>
                        <Text style={styles.gpsPromptTitle}>
                            {gpsDenialReason === 'service'
                                ? GPS_SERVICE_DISABLED_TITLE
                                : GPS_REQUIRED_SPLASH_TITLE}
                        </Text>
                    </View>
                    <Text style={styles.gpsPromptMessage}>
                        {gpsDenialReason === 'service'
                            ? GPS_SERVICE_DISABLED_MESSAGE
                            : GPS_REQUIRED_SPLASH_MESSAGE}
                    </Text>
                    <View style={styles.gpsPromptActions}>
                        <AppButton
                            disabled={isRetryingGps}
                            label={
                                isRetryingGps
                                    ? 'Đang kiểm tra...'
                                    : gpsDenialReason === 'service'
                                      ? 'Thử lại'
                                      : 'Cấp quyền GPS'
                            }
                            onPress={onRetryGps}
                            testID="splash-gps-retry-button"
                            variant="primary"
                        />
                        <AppButton
                            label={
                                gpsDenialReason === 'service'
                                    ? 'Mở Cài đặt vị trí'
                                    : 'Mở Cài đặt'
                            }
                            onPress={onOpenSettings}
                            testID="splash-gps-settings-button"
                            variant="surface"
                        />
                    </View>
                </View>
            ) : null}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    splashOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingHorizontal: Spacing.four,
        zIndex: 1000,
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 24,
    },
    title: {
        color: Colors.text,
        fontFamily: Fonts.title,
        fontSize: 24,
        fontWeight: 700,
    },
    progressTrack: {
        width: 220,
        height: 6,
        overflow: 'hidden',
        borderRadius: 3,
        backgroundColor: Colors.border,
    },
    progressFill: {
        width: '100%',
        height: '100%',
        borderRadius: 3,
        transformOrigin: 'left center',
    },
    gpsPromptCard: {
        width: '100%',
        maxWidth: 340,
        marginTop: Spacing.two,
        padding: Spacing.four,
        borderRadius: Rounded.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        gap: Spacing.two,
    },
    gpsPromptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
    },
    gpsIconBadge: {
        width: 36,
        height: 36,
        borderRadius: Rounded.round,
        backgroundColor: Colors.backgroundSelected,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gpsPromptTitle: {
        flex: 1,
        color: Colors.text,
        fontFamily: Fonts.body,
        fontSize: 16,
        fontWeight: 700,
    },
    gpsPromptMessage: {
        color: Colors.grey,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
    },
    gpsPromptActions: {
        marginTop: Spacing.one,
        gap: Spacing.two,
    },
});
