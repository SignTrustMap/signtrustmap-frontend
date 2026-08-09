import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { useRouter } from 'expo-router';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import * as THREE from 'three';
import { useSession } from '@/context/session-provider';

const EXIT_TRANSLATE_Y = Dimensions.get('screen').height;
const EXIT_ANIMATION_DURATION = 500;
const DELAY_BEFORE_EXIT = 1000;
function Cube() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((_, delta) => {
        if (!meshRef.current) return;

        meshRef.current.rotation.x += delta * 1.2;
        meshRef.current.rotation.y += delta * 1.5;
    });

    return (
        <mesh ref={meshRef}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />

            <meshStandardMaterial
                color="#fff"
                metalness={0.2}
                roughness={0.35}
            />
        </mesh>
    );
}

function ThreeScene() {
    return (
        <>
            <ambientLight intensity={1.5} />

            <directionalLight
                position={[3, 3, 5]}
                intensity={3}
            />

            <Cube />
        </>
    );
}

export function AppSplashScreen() {
    const { session, loading } = useSession();
    const router = useRouter();

    const [visible, setVisible] = useState(true);

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
        if (loading) return;

        const navigate = async () => {
            await SplashScreen.hideAsync();


            if (session) {
                router.replace('/');
            } else {
                router.replace('/login');
            }

            setTimeout(() => {
                setVisible(false);
            }, DELAY_BEFORE_EXIT);
        };

        navigate();
    }, [loading, router, session]);

    if (!visible) {
        return null;
    }

    return (
        <Animated.View
            exiting={exitKeyframe.duration(EXIT_ANIMATION_DURATION)}
            style={styles.splashOverlay}
        >
            <Canvas
                camera={{
                    position: [0, 0, 4],
                    fov: 45,
                }}
            >
                <ThreeScene />
            </Canvas>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    splashOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: '#208AEF',
        zIndex: 1000,
    },
});
