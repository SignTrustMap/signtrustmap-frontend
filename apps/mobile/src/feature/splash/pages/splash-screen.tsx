import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { Fonts } from '@/constants/theme';

const EXIT_TRANSLATE_Y = Dimensions.get('screen').height;
const EXIT_ANIMATION_DURATION = 500;

export function AppSplashScreen() {
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
        SplashScreen.hideAsync();
    }, []);

    return (
        <Animated.View
            exiting={exitKeyframe.duration(EXIT_ANIMATION_DURATION)}
            style={styles.splashOverlay}
        >
            <View style={styles.logoMark}>
                <Text style={styles.logoText}>STM</Text>
            </View>
            <Text style={styles.title}>SignTrustMap</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    splashOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: '#208AEF',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        zIndex: 1000,
    },
    logoMark: {
        width: 72,
        height: 72,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        color: '#208AEF',
        fontFamily: Fonts.body,
        fontSize: 18,
        fontWeight: 900,
    },
    title: {
        color: '#FFFFFF',
        fontFamily: Fonts.title,
        fontSize: 24,
        fontWeight: 700,
    },
});
