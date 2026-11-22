jest.unmock('@/hooks/use-offline-maps');

import React from 'react';
import { fireEvent, render, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('allows starting download on an uninstalled pack', async () => {
    const { getByLabelText } = await render(
      <OfflineMapModal onClose={jest.fn()} visible={true} />,
    );

    const downloadBtn = getByLabelText('Tải xuống gói bản đồ Bản đồ Việt Nam (PMTiles Offline)');
    await act(async () => {
      fireEvent.press(downloadBtn);
    });

    expect(offlineMapService.startDownload).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'vietnam-osm' }),
      undefined,
    );
  });

  it('renders installed pack, toggles active state, and prompts to delete pack', async () => {
    (offlineMapService.loadMetadata as jest.Mock).mockResolvedValueOnce({
      installedPacks: {
        'vietnam-osm': {
          id: 'vietnam-osm',
          name: 'Bản đồ Việt Nam (PMTiles Offline)',
          installedAt: 1700000000000,
          sizeBytes: 439804651,
        },
      },
      activePackId: 'vietnam-osm',
    });

    const alertSpy = jest.spyOn(Alert, 'alert');

    const { findByText, getByLabelText } = await render(
      <OfflineMapModal onClose={jest.fn()} visible={true} />,
    );

    // Vietnam pack is active
    expect(await findByText('Đang kích hoạt')).toBeTruthy();
    const toggleBtn = getByLabelText('Bỏ kích hoạt bản đồ');
    await act(async () => {
      fireEvent.press(toggleBtn);
    });

    expect(offlineMapService.setActiveOfflinePack).toHaveBeenCalledWith(null);

    // Delete pack button triggers alert
    const deleteBtn = getByLabelText('Xóa bản đồ đã tải');
    await act(async () => {
      fireEvent.press(deleteBtn);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Xóa bản đồ ngoại tuyến',
      expect.stringContaining('Bản đồ Việt Nam'),
      expect.any(Array),
    );

    // Confirm delete in alert
    const alertButtons = alertSpy.mock.calls[0][2];
    const deleteConfirm = alertButtons?.find((b: any) => b.style === 'destructive');
    await act(async () => {
      deleteConfirm?.onPress?.();
    });

    expect(offlineMapService.deleteInstalledPack).toHaveBeenCalledWith('vietnam-osm');
    alertSpy.mockRestore();
  });

  it('handles downloading, paused, and error progress states', async () => {
    let progressCallback: any = null;
    (offlineMapService.subscribeToProgress as jest.Mock).mockImplementation((cb) => {
      progressCallback = cb;
      return () => {};
    });

    const { findByText, getByLabelText } = await render(
      <OfflineMapModal onClose={jest.fn()} visible={true} />,
    );

    expect(await findByText('Bản đồ Việt Nam (PMTiles Offline)')).toBeTruthy();

    // 1. Simulate downloading state
    await act(async () => {
      progressCallback?.({
        packId: 'vietnam-osm',
        status: 'downloading',
        percentage: 45,
        downloadedBytes: 200000000,
        totalBytes: 439804651,
      });
    });

    expect(await findByText('Đang tải 45%')).toBeTruthy();

    // Pause download
    const pauseBtn = getByLabelText('Tạm dừng tải');
    await act(async () => {
      fireEvent.press(pauseBtn);
    });
    expect(offlineMapService.pauseDownload).toHaveBeenCalledWith('vietnam-osm');

    // 2. Simulate paused state
    await act(async () => {
      progressCallback?.({
        packId: 'vietnam-osm',
        status: 'paused',
        percentage: 45,
        downloadedBytes: 200000000,
        totalBytes: 439804651,
      });
    });

    expect(await findByText('Tạm dừng')).toBeTruthy();

    // Resume download
    const resumeBtn = getByLabelText('Tiếp tục tải');
    await act(async () => {
      fireEvent.press(resumeBtn);
    });
    expect(offlineMapService.resumeDownload).toHaveBeenCalledWith('vietnam-osm');

    // Cancel download
    const cancelBtn = getByLabelText('Hủy tải xuống');
    await act(async () => {
      fireEvent.press(cancelBtn);
    });
    expect(offlineMapService.cancelDownload).toHaveBeenCalledWith('vietnam-osm');

    // 3. Simulate error state with message
    await act(async () => {
      progressCallback?.({
        packId: 'vietnam-osm',
        status: 'error',
        percentage: 0,
        downloadedBytes: 0,
        totalBytes: 439804651,
        errorMessage: 'Lỗi mạng khi tải PMTiles',
      });
    });

    expect(await findByText('Lỗi mạng khi tải PMTiles')).toBeTruthy();
  });
});
