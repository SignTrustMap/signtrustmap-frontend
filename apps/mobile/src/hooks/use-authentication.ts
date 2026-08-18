import { useEffect, useState } from 'react';
import { getStorageItemAsync } from './use-storage';

export const useAuthentication = (key: string) => {
    const [user, setUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = await getStorageItemAsync(key);
                if (currentUser) {
                    setUser(currentUser);
                }
            } catch {
                console.log('No user signed in');
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, [key]);

    return { user, loading };
};


