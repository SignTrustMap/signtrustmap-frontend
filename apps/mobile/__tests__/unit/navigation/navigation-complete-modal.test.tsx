import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationCompleteModal } from '@/feature/navigation/components/navigation-complete-modal';
import { NAVIGATION_COMPLETE_MODAL_AUTO_DISMISS_MS } from '@/constants/const';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('NavigationCompleteModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders modal elements correctly when visible with destination title', async () => {
    const handleDismiss = jest.fn();
    const { getByText, getByTestId } = await render(
      <NavigationCompleteModal
        destinationTitle="Chợ Bến Thành, Quận 1"
        onDismiss={handleDismiss}
        visible={true}
      />
    );

    expect(getByTestId('navigation-complete-modal')).toBeTruthy();
    expect(getByText('Hành trình đã hoàn tất')).toBeTruthy();
    expect(getByText('Chợ Bến Thành, Quận 1')).toBeTruthy();
    expect(getByText('Tự động quay về trang chủ...')).toBeTruthy();
  });

  it('renders default subtitle when destination title is not provided', async () => {
    const handleDismiss = jest.fn();
    const { getByText } = await render(
      <NavigationCompleteModal
        onDismiss={handleDismiss}
        visible={true}
      />
    );

    expect(getByText('Hành trình đã hoàn tất')).toBeTruthy();
    expect(getByText('Bạn đã kết thúc điều hướng an toàn.')).toBeTruthy();
  });

  it('automatically calls onDismiss after NAVIGATION_COMPLETE_MODAL_AUTO_DISMISS_MS (2s)', async () => {
    const handleDismiss = jest.fn();
    await render(
      <NavigationCompleteModal
        destinationTitle="Hồ Con Rùa"
        onDismiss={handleDismiss}
        visible={true}
      />
    );

    expect(handleDismiss).not.toHaveBeenCalled();

    // Advance timer by 1999ms
    await act(async () => {
      jest.advanceTimersByTime(NAVIGATION_COMPLETE_MODAL_AUTO_DISMISS_MS - 1);
    });
    expect(handleDismiss).not.toHaveBeenCalled();

    // Advance timer past auto dismiss duration
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not trigger timer when visible is false', async () => {
    const handleDismiss = jest.fn();
    await render(
      <NavigationCompleteModal
        destinationTitle="Hồ Con Rùa"
        onDismiss={handleDismiss}
        visible={false}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(NAVIGATION_COMPLETE_MODAL_AUTO_DISMISS_MS + 500);
    });

    expect(handleDismiss).not.toHaveBeenCalled();
  });

  it('calls onDismiss when backdrop is pressed', async () => {
    const handleDismiss = jest.fn();
    const { getByTestId } = await render(
      <NavigationCompleteModal
        destinationTitle="Nhà Thờ Đức Bà"
        onDismiss={handleDismiss}
        visible={true}
      />
    );

    const backdrop = getByTestId('navigation-complete-backdrop');
    fireEvent.press(backdrop);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not dismiss when card itself is pressed (stopPropagation)', async () => {
    const handleDismiss = jest.fn();
    const { getByTestId } = await render(
      <NavigationCompleteModal
        destinationTitle="Nhà Thờ Đức Bà"
        onDismiss={handleDismiss}
        visible={true}
      />
    );

    const card = getByTestId('navigation-complete-card');
    fireEvent.press(card);

    expect(handleDismiss).not.toHaveBeenCalled();
  });

  it('cleans up timer on unmount before timeout triggers', async () => {
    const handleDismiss = jest.fn();
    const { unmount } = await render(
      <NavigationCompleteModal
        destinationTitle="Sân bay Tân Sơn Nhất"
        onDismiss={handleDismiss}
        visible={true}
      />
    );

    expect(handleDismiss).not.toHaveBeenCalled();

    await act(async () => {
      unmount();
    });

    await act(async () => {
      jest.advanceTimersByTime(NAVIGATION_COMPLETE_MODAL_AUTO_DISMISS_MS + 1000);
    });

    expect(handleDismiss).not.toHaveBeenCalled();
  });
});
