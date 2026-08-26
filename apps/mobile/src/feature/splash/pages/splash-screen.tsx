import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
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

import { Colors, Fonts } from '@/constants/theme';
import { EXIT_ANIMATION_DURATION_MS, SPLASH_PROGRESS_DURATION_MS } from '@/constants/const';

const EXIT_TRANSLATE_Y = Dimensions.get('screen').height;

export function AppSplashScreen() {
    const progress = useSharedValue(0);
    const shouldReduceMotion = useReducedMotion();
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

    useEffect(() => {
        void SplashScreen.hideAsync();

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
            [Colors.placeholder, Colors.tertiary],
        ),
        transform: [{ scaleX: progress.value }],
    }));

    return (
        <Animated.View
            exiting={exitKeyframe.duration(EXIT_ANIMATION_DURATION_MS)}
            style={styles.splashOverlay}
        >
            <Image
                accessibilityLabel="SignTrustMap logo"
                source={require('../../../../assets/images/app-logo.png')}
                style={styles.logo}
            />
            <Text style={styles.title}>SignTrustMap</Text>
            <View
                accessibilityLabel="Loading SignTrustMap"
                accessibilityRole="progressbar"
                style={styles.progressTrack}
            >
                <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
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
});
