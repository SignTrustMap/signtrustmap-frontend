import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { OfflineMapModal } from '@/components/offline-map-modal';
import { offlineMapService } from '@/services/offline-map-service';

jest.mock('@/services/offline-map-service', () => {
  const actual = jest.requireActual('@/services/offline-map-service');
  return {
    ...actual,
    offlineMapService: {
      loadMetadata: jest.fn().mockResolvedValue({
        installedPacks: {},
        activePackId: null,
      }),
      fetchAvailablePacks: jest.fn().mockResolvedValue([
        {
          id: 'vietnam-osm',
          name: 'Bản đồ Việt Nam (PMTiles Offline)',
          description: 'Dữ liệu bản đồ vector toàn quốc',
          region: 'Toàn quốc',
          countryCode: 'VN',
          format: 'pmtiles',
          fileName: 'vietnam.pmtiles',
          sizeBytes: 439804651,
          sizeMb: 419.43,
          minZoom: 0,
          maxZoom: 15,
          bounds: [102.14, 8.18, 109.46, 23.39],
          isAvailable: true,
          downloadUrl: '/spatial/tiles/offline/download/vietnam-osm',
        },
        {
          id: 'hanoi-north-osm',
          name: 'Khu vực Miền Bắc & Hà Nội',
          description: 'Bản đồ vector chi tiết Hà Nội',
          region: 'Miền Bắc',
          countryCode: 'VN',
          format: 'pmtiles',
          fileName: 'hanoi-north.pmtiles',
          sizeBytes: 149422080,
          sizeMb: 142.5,
          minZoom: 6,
          maxZoom: 16,
          bounds: [105.2, 20.5, 106.5, 21.6],
          isAvailable: true,
          downloadUrl: '/spatial/tiles/offline/download/hanoi-north-osm',
        },
      ]),
      subscribeToProgress: jest.fn(() => () => {}),
      subscribeToMetadata: jest.fn(() => () => {}),
      startDownload: jest.fn().mockResolvedValue(undefined),
      pauseDownload: jest.fn().mockResolvedValue(undefined),
      resumeDownload: jest.fn().mockResolvedValue(undefined),
      cancelDownload: jest.fn().mockResolvedValue(undefined),
      deleteInstalledPack: jest.fn().mockResolvedValue(undefined),
      setActiveOfflinePack: jest.fn().mockResolvedValue(undefined),
    },
  };
});

describe('OfflineMapModal', () => {
  it('renders modal header and options correctly', async () => {
    const handleClose = jest.fn();
    const { findByText, getByLabelText } = await render(
      <OfflineMapModal onClose={handleClose} visible={true} />,
    );

    expect(await findByText('Bản đồ ngoại tuyến (PMTiles)')).toBeTruthy();
    expect(await findByText('Bản đồ Việt Nam (PMTiles Offline)')).toBeTruthy();
    expect(await findByText('Khu vực Miền Bắc & Hà Nội')).toBeTruthy();

    const closeBtn = getByLabelText('Đóng cửa sổ bản đồ ngoại tuyến');
    fireEvent.press(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
