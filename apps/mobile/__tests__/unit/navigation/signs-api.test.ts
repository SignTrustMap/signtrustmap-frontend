import { getSignsInBounds } from '@/api/navigation/signs';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('@/feature/navigation/utils/signs', () => ({
  resolveImageUrl: jest.fn((url: string) => `https://cdn.signmap.site/${url}`),
}));

describe('Navigation Signs API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries /signs with bounding box coordinates and formats RouteSign list', async () => {
    const mockApiResponse = {
      signs: [
        {
          id: 'sign-101',
          latitude: 10.7725,
          longitude: 106.6985,
          signCropUrl: 'crops/p102.jpg',
          signType: {
            nameEn: 'No Entry',
            signCode: 'P.102',
          },
        },
      ],
    };

    (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockApiResponse);

    const southWest: [number, number] = [106.69, 10.77];
    const northEast: [number, number] = [106.70, 10.78];

    const result = await getSignsInBounds(southWest, northEast);

    expect(apiClient.apiRequest).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/signs\?maxLat=10\.78&maxLon=106\.7&minLat=10\.77&minLon=106\.69/,
      ),
      { signal: undefined },
    );

    expect(result).toEqual([
      {
        id: 'sign-101',
        coordinate: [106.6985, 10.7725],
        imageUrl: 'https://cdn.signmap.site/crops/p102.jpg',
        name: 'No Entry',
        signCode: 'P.102',
      },
    ]);
  });
});
