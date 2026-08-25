import { apiConfig } from '../config';
import { API_PATHS } from '../api';

const sampleData = {
    "originLatitude": 10.7725,
    "originLongitude": 106.6980,
    "destinationLatitude": 10.7950,
    "destinationLongitude": 106.7218,
    "alternativeThresholdPercent": 20,
    "maxAlternatives": 2,
    "snapRadiusMeters": 100
}

export async function routing(signal?: AbortSignal): Promise<any> {
    const response = await fetch(`${apiConfig.baseUrl}${API_PATHS.DIRECTIONS}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleData),
        signal,
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch routes: ${response.statusText}`);
    }

    return response.json();
}