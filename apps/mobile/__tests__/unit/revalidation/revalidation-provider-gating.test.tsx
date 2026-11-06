import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// ---------------------------------------------------------------------------
// 1. Navigation Mock
// ---------------------------------------------------------------------------
let mockSegments: string[] = ['(authenticated)', '(tabs)', 'work'];

jest.mock('expo-router', () => ({
  useSegments: () => mockSegments,
}));

// ---------------------------------------------------------------------------
// 2. React Query & Wallet Mocks
// ---------------------------------------------------------------------------
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useInvalidateWalletAndStats: () => jest.fn(),
}));

// ---------------------------------------------------------------------------
// 3. Session Mock
// ---------------------------------------------------------------------------
let mockSessionData: any = {
  accessToken: 'valid-token',
  account: {
    id: 'user-1',
    roles: ['driver'],
  },
};

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: mockSessionData,
  }),
}));

// ---------------------------------------------------------------------------
// 4. Revalidation Query Hook Mock
// ---------------------------------------------------------------------------
const mockUseGetRevalidationEvidenceQueue = jest.fn();
const mockUseVoteOnRevalidationEvidence = jest.fn();

jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetRevalidationEvidenceQueue: (...args: any[]) => mockUseGetRevalidationEvidenceQueue(...args),
  useVoteOnRevalidationEvidence: () => ({
    mutateAsync: mockUseVoteOnRevalidationEvidence,
  }),
}));

import { RevalidationWorkflowProvider } from '@/feature/revalidation/context/revalidation-workflow-provider';

describe('RevalidationWorkflowProvider Query Gating & 403 Prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetRevalidationEvidenceQueue.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn(),
    });
  });

  it('disables revalidation evidence queue query when browsing work dashboard (not on reval review screen)', () => {
    mockSegments = ['(authenticated)', '(tabs)', 'work'];
    mockSessionData = {
      accessToken: 'valid-token',
      account: { id: 'rev-1', roles: ['reviewer'] },
    };

    render(
      <RevalidationWorkflowProvider>
        <View>
          <Text>Work Screen Child</Text>
        </View>
      </RevalidationWorkflowProvider>,
    );

    expect(mockUseGetRevalidationEvidenceQueue).toHaveBeenCalledWith(
      { pageSize: 50 },
      false, // isQueryEnabled must be FALSE on work dashboard
    );
  });

  it('disables revalidation evidence queue query for non-reviewer accounts (preventing 403 Forbidden)', () => {
    mockSegments = ['(authenticated)', '(tabs)', 'work', 'revalidation-review'];
    mockSessionData = {
      accessToken: 'driver-token',
      account: { id: 'driver-1', roles: ['driver'] }, // NOT a reviewer
    };

    render(
      <RevalidationWorkflowProvider>
        <View>
          <Text>Review Screen Child</Text>
        </View>
      </RevalidationWorkflowProvider>,
    );

    expect(mockUseGetRevalidationEvidenceQueue).toHaveBeenCalledWith(
      { pageSize: 50 },
      false, // isQueryEnabled must be FALSE for driver/surveyor accounts
    );
  });

  it('enables revalidation evidence queue query when user is reviewer AND on revalidation review screen', () => {
    mockSegments = ['(authenticated)', '(tabs)', 'work', 'revalidation-review'];
    mockSessionData = {
      accessToken: 'reviewer-token',
      account: { id: 'rev-1', roles: ['reviewer'] },
    };

    render(
      <RevalidationWorkflowProvider>
        <View>
          <Text>Review Screen Child</Text>
        </View>
      </RevalidationWorkflowProvider>,
    );

    expect(mockUseGetRevalidationEvidenceQueue).toHaveBeenCalledWith(
      { pageSize: 50 },
      true, // isQueryEnabled must be TRUE
    );
  });
});
