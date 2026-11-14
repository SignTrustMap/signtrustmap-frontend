import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';
import * as FileSystem from 'expo-file-system/legacy';
import { extractImageGpsCoordinates } from '@/feature/upload/utils/image-gps';
import { extractVideoMetadataAsync } from '@/feature/upload/utils/video-gps';
import {
  MAX_SURVEY_IMAGE_SIZE_BYTES,
  MAX_SURVEY_VIDEO_SIZE_BYTES,
} from '@/feature/upload/utils/video-processor';
import {
  IMAGE_SIZE_EXCEEDED_MESSAGE,
  MAX_UPLOAD_FILES_EXCEEDED_MESSAGE,
  UNABLE_TO_LOAD_PHOTO_LIBRARY_MESSAGE,
  VIDEO_SIZE_EXCEEDED_MESSAGE,
} from '@/constants/message';
import { AndroidGalleryModal } from '@/feature/upload/components/android-gallery-modal';

jest.mock('expo-media-library/legacy', () => ({
  getAssetsAsync: jest.fn(),
  getAssetInfoAsync: jest.fn(),
  MediaType: {
    photo: 'photo',
    video: 'video',
  },
  SortBy: {
    creationTime: 'creationTime',
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

jest.mock('expo-symbols', () => {
  const { View } = require('react-native');
  return {
    SymbolView: (props: any) => <View testID="symbol-view" {...props} />,
  };
});

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} />,
  };
});

jest.mock('@/feature/upload/utils/image-file-gps', () => ({
  extractGpsFromImageFile: jest.fn(),
}));

jest.mock('@/feature/upload/utils/image-gps', () => ({
  extractImageGpsCoordinates: jest.fn(),
}));

jest.mock('@/feature/upload/utils/video-gps', () => ({
  extractVideoMetadataAsync: jest.fn(),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F0FDFA',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#64748B',
    primary: '#0D9488',
    onPrimary: '#FFFFFF',
    placeholder: '#94A3B8',
    danger: '#EF4444',
  }),
}));

describe('AndroidGalleryModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const mockAssets = [
    {
      id: 'asset-1',
      filename: 'photo1.jpg',
      mediaType: 'photo',
      uri: 'file:///media/photo1.jpg',
      duration: 0,
      creationTime: 1700000000000,
    },
    {
      id: 'asset-2',
      filename: 'video1.mp4',
      mediaType: 'video',
      uri: 'file:///media/video1.mp4',
      duration: 15,
      creationTime: 1700000001000,
    },
    {
      id: 'asset-3',
      filename: 'photo2.jpg',
      mediaType: 'photo',
      uri: 'file:///media/photo2.jpg',
      duration: 0,
      creationTime: 1700000002000,
    },
    {
      id: 'asset-4',
      filename: 'photo3.jpg',
      mediaType: 'photo',
      uri: 'file:///media/photo3.jpg',
      duration: 0,
      creationTime: 1700000003000,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (LegacyMediaLibrary.getAssetsAsync as jest.Mock).mockResolvedValue({
      assets: mockAssets,
      endCursor: 'cursor-1',
      hasNextPage: false,
    });
    (LegacyMediaLibrary.getAssetInfoAsync as jest.Mock).mockImplementation((asset: any) =>
      Promise.resolve({
        localUri: asset.uri,
        location: { latitude: 10.7769, longitude: 106.7009 },
      })
    );
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: 1024 * 500, // 500KB
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('loads media library assets on visible and renders list', async () => {
    const { getByText, getAllByLabelText } = await render(
      <AndroidGalleryModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(getByText('Chọn ảnh hoặc video')).toBeTruthy();

    await waitFor(() => {
      expect(getAllByLabelText(/^Chọn /).length).toBe(4);
    });

    const selectButtons = getAllByLabelText(/^Chọn /);
    await act(async () => {
      fireEvent.press(selectButtons[0]);
    });
    expect(getByText(/Đã chọn 1 tệp/)).toBeTruthy();
  });

  it('displays error when loading media library fails', async () => {
    (LegacyMediaLibrary.getAssetsAsync as jest.Mock).mockRejectedValue(new Error('Permission denied'));

    const { getByText } = await render(
      <AndroidGalleryModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    await waitFor(() => {
      expect(getByText(UNABLE_TO_LOAD_PHOTO_LIBRARY_MESSAGE)).toBeTruthy();
    });
  });

  it('enforces maximum 3 files selection limit', async () => {
    const { getByText, getAllByLabelText } = await render(
      <AndroidGalleryModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const selectButtons = getAllByLabelText(/^Chọn /);

    // Select 3 files
    await act(async () => {
      fireEvent.press(selectButtons[0]);
      fireEvent.press(selectButtons[1]);
      fireEvent.press(selectButtons[2]);
    });
    expect(getByText(/Đã chọn 3 tệp/)).toBeTruthy();

    // Try selecting 4th file
    await act(async () => {
      fireEvent.press(selectButtons[3]);
    });
    expect(getByText(MAX_UPLOAD_FILES_EXCEEDED_MESSAGE)).toBeTruthy();
  });

  it('confirms selected assets and invokes onConfirm callback', async () => {
    (extractImageGpsCoordinates as jest.Mock).mockReturnValue({
      latitude: 10.7769,
      longitude: 106.7009,
    });
    (extractVideoMetadataAsync as jest.Mock).mockResolvedValue({
      durationSeconds: 15,
      hasDeviceGps: true,
      startCoordinate: [106.7009, 10.7769],
      capturedAt: '2026-11-07T12:00:00Z',
    });

    const { getByText, getAllByLabelText } = await render(
      <AndroidGalleryModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const selectButtons = getAllByLabelText(/^Chọn /);
    await act(async () => {
      fireEvent.press(selectButtons[0]); // photo
      fireEvent.press(selectButtons[1]); // video
    });

    const confirmBtn = getByText('Xác nhận (2)');
    await act(async () => {
      fireEvent.press(confirmBtn);
    });

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ assetId: 'asset-1', type: 'image' }),
          expect.objectContaining({ assetId: 'asset-2', type: 'video' }),
        ])
      );
    });
  });

  it('rejects video exceeding maximum allowed size', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: MAX_SURVEY_VIDEO_SIZE_BYTES + 1024,
    });

    const { getByText, getAllByLabelText } = await render(
      <AndroidGalleryModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const selectButtons = getAllByLabelText(/^Chọn /);
    await act(async () => {
      fireEvent.press(selectButtons[1]); // video1.mp4
    });

    const confirmBtn = getByText('Xác nhận (1)');
    await act(async () => {
      fireEvent.press(confirmBtn);
    });

    await waitFor(() => {
      expect(getByText(VIDEO_SIZE_EXCEEDED_MESSAGE)).toBeTruthy();
    });
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('rejects image exceeding maximum allowed size', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: MAX_SURVEY_IMAGE_SIZE_BYTES + 1024,
    });

    const { getByText, getAllByLabelText } = await render(
      <AndroidGalleryModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const selectButtons = getAllByLabelText(/^Chọn /);
    await act(async () => {
      fireEvent.press(selectButtons[0]); // photo1.jpg
    });

    const confirmBtn = getByText('Xác nhận (1)');
    await act(async () => {
      fireEvent.press(confirmBtn);
    });

    await waitFor(() => {
      expect(getByText(IMAGE_SIZE_EXCEEDED_MESSAGE)).toBeTruthy();
    });
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('closes modal when close button is pressed', async () => {
    const { getByText } = await render(
      <AndroidGalleryModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    await act(async () => {
      fireEvent.press(getByText('Đóng'));
    });

    expect(mockOnClose).toHaveBeenCalled();
  });
});
