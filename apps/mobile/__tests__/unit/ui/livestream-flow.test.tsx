import React from 'react';
import { render, fireEvent, act, cleanup, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCameraPermission: any = { granted: true };
let mockMicPermission: any = { granted: true };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
  }),
}));

let mockRecordAsync = jest.fn().mockImplementation(() => new Promise(() => {}));
let mockStopRecording = jest.fn();

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  const CameraView = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      recordAsync: mockRecordAsync,
      stopRecording: mockStopRecording,
    }));
    return React.createElement(View, { testID: 'camera-view', ...props });
  });
  return {
    CameraView,
    useCameraPermissions: () => [mockCameraPermission],
    useMicrophonePermissions: () => [mockMicPermission],
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`icon-${props.name}`} {...props} />,
  };
});

import { LivestreamBottomBanner } from '@/feature/streaming/components/livestream-bottom-banner';
import { LivestreamRecordControl } from '@/feature/streaming/components/livestream-record-control';
import { LivestreamTopBar } from '@/feature/streaming/components/livestream-top-bar';
import { LivestreamScreen } from '@/feature/streaming/pages/livestream-screen';

describe('Livestream Feature Components and Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCameraPermission = { granted: true };
    mockMicPermission = { granted: true };
  });

  afterEach(async () => {
    cleanup();
    jest.useRealTimers();
  });

  describe('LivestreamBottomBanner', () => {
    it('renders with disclaimer text and shield icon', async () => {
      const { getByText, getByTestId } = await render(<LivestreamBottomBanner />);
      expect(
        getByText('Phát trực tiếp giúp nhận diện biển báo theo thời gian thực')
      ).toBeTruthy();
      expect(getByTestId('icon-shield-check-outline')).toBeTruthy();
    });
  });

  describe('LivestreamRecordControl', () => {
    it('renders idle state with recording button label', async () => {
      const mockStop = jest.fn();
      const { getByLabelText } = await render(
        <LivestreamRecordControl isRecording={false} onStopRecording={mockStop} />
      );

      const btn = getByLabelText('Nút ghi hình');
      expect(btn).toBeTruthy();
      fireEvent.press(btn);
      expect(mockStop).not.toHaveBeenCalled();
    });

    it('renders active recording state and calls onStopRecording when tapped', async () => {
      const mockStop = jest.fn();
      const { getByLabelText } = await render(
        <LivestreamRecordControl isRecording={true} onStopRecording={mockStop} />
      );

      const stopBtn = getByLabelText('Dừng ghi hình');
      expect(stopBtn).toBeTruthy();

      await act(async () => {
        fireEvent.press(stopBtn);
      });
      expect(mockStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('LivestreamTopBar', () => {
    it('renders close button and triggers onClose', async () => {
      const mockClose = jest.fn();
      const { getByLabelText, queryByText } = await render(
        <LivestreamTopBar isRecording={false} elapsedSeconds={0} onClose={mockClose} />
      );

      const closeBtn = getByLabelText('Đóng phát trực tiếp');
      expect(closeBtn).toBeTruthy();
      fireEvent.press(closeBtn);
      expect(mockClose).toHaveBeenCalledTimes(1);

      // No timer displayed when not recording
      expect(queryByText('00:00')).toBeNull();
    });

    it('displays formatted elapsed timer when isRecording is true', async () => {
      const { getByText } = await render(
        <LivestreamTopBar isRecording={true} elapsedSeconds={125} onClose={jest.fn()} />
      );
      // 125 seconds = 02:05
      expect(getByText('02:05')).toBeTruthy();
    });
  });

  describe('LivestreamScreen', () => {
    it('displays permission prompt when camera/mic permissions are missing', async () => {
      mockCameraPermission = { granted: false };
      mockMicPermission = { granted: false };

      const { getByText, queryByTestId } = await render(<LivestreamScreen />);
      expect(getByText('Cần cấp quyền truy cập máy ảnh')).toBeTruthy();
      expect(queryByTestId('camera-view')).toBeNull();
    });

    it('renders CameraView and begins recording on camera ready', async () => {
      const { getByTestId } = await render(<LivestreamScreen />);

      const cameraView = getByTestId('camera-view');
      expect(cameraView).toBeTruthy();

      // Trigger camera ready
      await act(async () => {
        cameraView.props.onCameraReady();
      });

      expect(mockRecordAsync).toHaveBeenCalledWith({ maxDuration: 3600 });
    });

    it('handles stop recording button press and redirects to home', async () => {
      const { getByTestId, getByLabelText } = await render(<LivestreamScreen />);

      const cameraView = getByTestId('camera-view');
      await act(async () => {
        cameraView.props.onCameraReady();
      });

      const stopBtn = getByLabelText('Dừng ghi hình');
      await act(async () => {
        fireEvent.press(stopBtn);
      });

      expect(mockStopRecording).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/(authenticated)/(tabs)/home');
      });
    });

    it('handles close button and navigates back', async () => {
      const { getByLabelText } = await render(<LivestreamScreen />);
      const closeBtn = getByLabelText('Đóng phát trực tiếp');
      await act(async () => {
        fireEvent.press(closeBtn);
      });

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
