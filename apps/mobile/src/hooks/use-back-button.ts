import { Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";


export function useBackButton(href: Href) {
    const router = useRouter();
    useFocusEffect(
        useCallback(() => {
            const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
                router.replace(href);
                return true;
            })
            return () => subscription.remove();

        }, [href, router])
    );
}
