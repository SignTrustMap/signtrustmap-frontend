import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import {
  ReviewHistoryItemCard,
  isVoteEditable,
  getVoteLabel,
  type ReviewHistoryRecord,
} from '@/feature/review/components/review-history-item-card';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#64748B',
    placeholder: '#94A3B8',
    primary: '#007B8B',
  }),
}));

jest.mock('expo-image', () => ({
  Image: (props: any) => {
    const { View } = require('react-native');
    return <View testID="expo-image" {...props} />;
  },
}));

describe('isVoteEditable Business Rule', () => {
  const referenceTime = new Date('2026-11-22T12:00:00Z');

  it('allows editing when vote is within 24 hours and candidate status is PENDING', () => {
    const record: ReviewHistoryRecord = {
      candidateId: 'cand-1',
      candidate: {
        id: 'cand-1',
        createdAt: '2026-11-22T08:00:00Z',
        submissionId: 'sub-1',
        status: 'PENDING',
      },
      reviewedAt: '2026-11-22T09:30:00Z',
      vote: 1,
    };

    expect(isVoteEditable(record, referenceTime)).toBe(true);
  });

  it('allows editing across midnight boundary as long as within 24 hours', () => {
    const record: ReviewHistoryRecord = {
      candidateId: 'cand-midnight',
      candidate: {
        id: 'cand-midnight',
        createdAt: '2026-11-21T23:00:00Z',
        submissionId: 'sub-midnight',
        status: 'PENDING',
      },
      reviewedAt: '2026-11-21T23:30:00Z',
      vote: 1,
    };

    expect(isVoteEditable(record, referenceTime)).toBe(true);
  });

  it('allows editing when candidate status is unset/undefined and vote is within 24 hours', () => {
    const record: ReviewHistoryRecord = {
      candidateId: 'cand-2',
      candidate: {
        id: 'cand-2',
        createdAt: '2026-11-22T08:00:00Z',
        submissionId: 'sub-2',
      },
      reviewedAt: '2026-11-22T10:00:00Z',
      vote: 2,
    };

    expect(isVoteEditable(record, referenceTime)).toBe(true);
  });

  it('forbids editing when candidate status is already published/approved', () => {
    const record: ReviewHistoryRecord = {
      candidateId: 'cand-3',
      candidate: {
        id: 'cand-3',
        createdAt: '2026-11-22T08:00:00Z',
        submissionId: 'sub-3',
        status: 'APPROVED',
      },
      reviewedAt: '2026-11-22T10:00:00Z',
      vote: 1,
    };

    expect(isVoteEditable(record, referenceTime)).toBe(false);
  });

  it('forbids editing when candidate was voted more than 24 hours ago (outside 24h time limit)', () => {
    const record: ReviewHistoryRecord = {
      candidateId: 'cand-4',
      candidate: {
        id: 'cand-4',
        createdAt: '2026-11-21T08:00:00Z',
        submissionId: 'sub-4',
        status: 'PENDING',
      },
      reviewedAt: '2026-11-21T10:00:00Z',
      vote: 1,
    };

    expect(isVoteEditable(record, referenceTime)).toBe(false);
  });
});

describe('getVoteLabel Helper', () => {
  it('maps vote codes correctly to labels and symbols', () => {
    expect(getVoteLabel(1).label).toBe('Phê duyệt');
    expect(getVoteLabel(2).label).toBe('Từ chối');
    expect(getVoteLabel(3).label).toBe('Báo cáo');
    expect(getVoteLabel(4).label).toBe('Bỏ qua');
  });
});

describe('ReviewHistoryItemCard Component', () => {
  const referenceDate = new Date('2026-11-22T12:00:00Z');

  it('renders sign info, previous vote, and edit button when editable', async () => {
    const mockEdit = jest.fn();
    const record: ReviewHistoryRecord = {
      candidateId: 'cand-edit-1',
      candidate: {
        id: 'cand-edit-1',
        createdAt: '2026-11-22T08:00:00Z',
        submissionId: 'sub-1',
        status: 'PENDING',
        predictedSignType: {
          id: 102,
          nameVi: 'Cấm đi ngược chiều',
          nameEn: 'No Entry',
          signCode: 'P.102',
        },
      },
      reviewedAt: '2026-11-22T09:30:00Z',
      vote: 1,
    };

    const { getByText, getByTestId } = await render(
      <ReviewHistoryItemCard onEdit={mockEdit} record={record} referenceDate={referenceDate} />,
    );

    expect(getByText('Cấm đi ngược chiều')).toBeTruthy();
    expect(getByText('✓ Phê duyệt')).toBeTruthy();
    expect(getByText('Có thể sửa (Hôm nay)')).toBeTruthy();

    const editBtn = getByTestId('btn-edit-vote-cand-edit-1');
    fireEvent.press(editBtn);
    expect(mockEdit).toHaveBeenCalledWith(record);
  });

  it('renders locked status and hides edit button when candidate is published', async () => {
    const mockEdit = jest.fn();
    const record: ReviewHistoryRecord = {
      candidateId: 'cand-locked-1',
      candidate: {
        id: 'cand-locked-1',
        createdAt: '2026-11-22T08:00:00Z',
        submissionId: 'sub-1',
        status: 'PUBLISHED',
        predictedSignType: {
          id: 103,
          nameVi: 'Biển báo nguy hiểm',
          nameEn: 'Danger Sign',
          signCode: 'W.201',
        },
      },
      reviewedAt: '2026-11-22T09:30:00Z',
      vote: 2,
      declineReason: 'Incorrect Sign Type',
    };

    const { getByText, queryByTestId } = await render(
      <ReviewHistoryItemCard onEdit={mockEdit} record={record} referenceDate={referenceDate} />,
    );

    expect(getByText('Biển báo nguy hiểm')).toBeTruthy();
    expect(getByText('× Từ chối')).toBeTruthy();
    expect(getByText('Đã công bố')).toBeTruthy();
    expect(queryByTestId('btn-edit-vote-cand-locked-1')).toBeNull();
  });
});
