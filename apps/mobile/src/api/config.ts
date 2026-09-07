const apiBaseUrl = process.env.EXPO_BASE_URL || 'https://preview.api.signmap.site/';

if (!apiBaseUrl) {
    throw new Error('EXPO_BASE_URL is not defined in the environment variables.');
}

export const apiConfig = {
    baseUrl: apiBaseUrl,
    timeout: 10000,
} as const;