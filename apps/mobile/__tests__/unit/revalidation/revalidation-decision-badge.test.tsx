import React from 'react';
import { Animated, Text, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import {
  RevalidationDecisionBadge,
  RevalidationSwipeBadges,
} from '@/feature/revalidation/components/revalidation-decision-badge';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    text: '#0F172A',
    textSecondary: '#64748B',
    placeholder: '#94A3B8',
    border: '#E2E8F0',
    primary: '#0671EB',
    surface: '#FFFFFF',
  }),
}));

describe('RevalidationDecisionBadge', () => {
  const mockHandleAgree = jest.fn();
  const mockHandleDecline = jest.fn();
  const mockHandleSkip = jest.fn();
  const mockHandleReport = jest.fn();
  const mockOnOpenCatalog = jest.fn();
  const mockOnOpenHelp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });



  it('renders all four action buttons (Agree, Decline, Skip, Report) with labels', async () => {
    const { getByText, getByLabelText } = await render(
      <RevalidationDecisionBadge
        handleAgree={mockHandleAgree}
        handleDecline={mockHandleDecline}
        handleReport={mockHandleReport}
        handleSkip={mockHandleSkip}
      />,
    );

    expect(getByText('Đồng ý')).toBeTruthy();
    expect(getByText('Từ chối')).toBeTruthy();
    expect(getByText('Bỏ qua')).toBeTruthy();
    expect(getByText('Báo cáo')).toBeTruthy();

    expect(getByLabelText('Đồng ý với kết luận của điều tra viên')).toBeTruthy();
    expect(getByLabelText('Từ chối kết luận của điều tra viên')).toBeTruthy();
    expect(getByLabelText('Bỏ qua minh chứng này')).toBeTruthy();
    expect(getByLabelText('Báo cáo minh chứng này')).toBeTruthy();
  });

  it('calls handleAgree when Agree button is pressed', async () => {
    const { getByLabelText } = await render(
      <RevalidationDecisionBadge
        handleAgree={mockHandleAgree}
        handleDecline={mockHandleDecline}
        handleReport={mockHandleReport}
        handleSkip={mockHandleSkip}
      />,
    );

    fireEvent.press(getByLabelText('Đồng ý với kết luận của điều tra viên'));
    expect(mockHandleAgree).toHaveBeenCalledTimes(1);
  });

  it('calls handleDecline when Decline button is pressed', async () => {
    const { getByLabelText } = await render(
      <RevalidationDecisionBadge
        handleAgree={mockHandleAgree}
        handleDecline={mockHandleDecline}
        handleReport={mockHandleReport}
        handleSkip={mockHandleSkip}
      />,
    );

    fireEvent.press(getByLabelText('Từ chối kết luận của điều tra viên'));
    expect(mockHandleDecline).toHaveBeenCalledTimes(1);
  });

  it('calls handleSkip when Skip button is pressed', async () => {
    const { getByLabelText } = await render(
      <RevalidationDecisionBadge
        handleAgree={mockHandleAgree}
        handleDecline={mockHandleDecline}
        handleReport={mockHandleReport}
        handleSkip={mockHandleSkip}
      />,
    );

    fireEvent.press(getByLabelText('Bỏ qua minh chứng này'));
    expect(mockHandleSkip).toHaveBeenCalledTimes(1);
  });

  it('calls handleReport when Report button is pressed', async () => {
    const { getByLabelText } = await render(
      <RevalidationDecisionBadge
        handleAgree={mockHandleAgree}
        handleDecline={mockHandleDecline}
        handleReport={mockHandleReport}
        handleSkip={mockHandleSkip}
      />,
    );

    fireEvent.press(getByLabelText('Báo cáo minh chứng này'));
    expect(mockHandleReport).toHaveBeenCalledTimes(1);
  });

  it('invokes onOpenCatalog when Catalog button is pressed', async () => {
    const { getByLabelText } = await render(
      <RevalidationDecisionBadge
        handleAgree={mockHandleAgree}
        handleDecline={mockHandleDecline}
        handleReport={mockHandleReport}
        handleSkip={mockHandleSkip}
        onOpenCatalog={mockOnOpenCatalog}
      />,
    );

    fireEvent.press(getByLabelText('Xem danh mục biển báo'));
    expect(mockOnOpenCatalog).toHaveBeenCalledTimes(1);
  });

  it('invokes onOpenHelp when Help button is pressed', async () => {
    const { getByLabelText } = await render(
      <RevalidationDecisionBadge
        handleAgree={mockHandleAgree}
        handleDecline={mockHandleDecline}
        handleReport={mockHandleReport}
        handleSkip={mockHandleSkip}
        onOpenHelp={mockOnOpenHelp}
      />,
    );

    fireEvent.press(getByLabelText('Hướng dẫn thao tác quẹt'));
    expect(mockOnOpenHelp).toHaveBeenCalledTimes(1);
  });

  it('renders RevalidationSwipeBadges with all direction labels', async () => {
    const dummyAnim = new Animated.Value(1);
    const { getByText } = await render(
      <RevalidationSwipeBadges
        agreeOpacity={dummyAnim as any}
        declineOpacity={dummyAnim as any}
        reportOpacity={dummyAnim as any}
        skipOpacity={dummyAnim as any}
      />,
    );

    expect(getByText('ĐỒNG Ý')).toBeTruthy();
    expect(getByText('TỪ CHỐI')).toBeTruthy();
    expect(getByText('BỎ QUA')).toBeTruthy();
    expect(getByText('BÁO CÁO')).toBeTruthy();
  });
});
