import { Platform } from "react-native";
import * as SecureStore from 'expo-secure-store';

export async function setStorageItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
        try {
            if (localStorage !== undefined) {
                localStorage.setItem(key, value);
            }
        } catch (error) {
            console.error("Error setting item in localStorage:", error);
        }
    } else {
        await SecureStore.setItemAsync(key, value);
    }

}

export async function getStorageItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
        try {
            if (localStorage !== undefined) {
                return localStorage.getItem(key);
            }
        } catch (error) {
            console.error("Error getting item from localStorage:", error);
        }
    } else {
        return await SecureStore.getItemAsync(key);
    }

    return null;
}

export async function removeStorageItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
        try {
            if (localStorage !== undefined) {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error("Error removing item from localStorage:", error);
        }
    } else {
        await SecureStore.deleteItemAsync(key);
    }
}
