import React from 'react';
import { render } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, any> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => mockParams,
  Slot: () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(View, { testID: 'slot' }, React.createElement(Text, null, 'Slot Content'));
  },
}));

jest.mock('@/feature/review/pages/sign-catalog-screen', () => ({
  SignCatalogScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'sign-catalog-screen' }, 'Sign Catalog Screen');
  },
}));

jest.mock('@/feature/work/pages/submission-complete-screen', () => ({
  SubmissionCompleteScreen: ({ count, type }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(
      Text,
      { testID: 'submission-complete-screen' },
      `Complete: type=${type ?? 'none'}, count=${count ?? 'none'}`
    );
  },
}));

jest.mock('@/feature/review/pages/submission-review-screen', () => ({
  SubmissionReviewScreen: ({ state }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'submission-review-screen' }, `Review state: ${state}`);
  },
}));

jest.mock('@/feature/review/pages/submission-summary-screen', () => ({
  SubmissionSummaryScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'submission-summary-screen' }, 'Submission Summary Screen');
  },
}));

jest.mock('@/feature/upload/pages/survey-history-screen', () => ({
  SurveyHistoryScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'survey-history-screen' }, 'Survey History Screen');
  },
}));

jest.mock('@/feature/upload/pages/survey-submission-details-screen', () => ({
  SurveySubmissionDetailsScreen: ({ submissionId }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'survey-submission-details-screen' }, `Submission ID: ${submissionId}`);
  },
}));

jest.mock('@/feature/work/pages/work-screen', () => ({
  WorkScreen: ({ currentRole }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'work-screen' }, `Work Role: ${currentRole}`);
  },
}));

jest.mock('@/feature/work/pages/missions-screen', () => ({
  MissionsScreen: ({ initialRole }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'missions-screen' }, `Missions Role: ${initialRole}`);
  },
}));

jest.mock('@/feature/review/pages/reviewer-stats-screen', () => ({
  ReviewerStatsScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'reviewer-stats-screen' }, 'Reviewer Stats Screen');
  },
}));

jest.mock('@/feature/revalidation/pages/inspect-revalidate-screen', () => ({
  InspectRevalidateScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'inspect-revalidate-screen' }, 'Inspect Revalidate Screen');
  },
}));

jest.mock('@/feature/revalidation/pages/revalidation-map-screen', () => ({
  RevalidationMapScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'revalidation-map-screen' }, 'Revalidation Map Screen');
  },
}));

jest.mock('@/feature/revalidation/pages/revalidation-review-screen', () => ({
  RevalidationReviewScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'revalidation-review-screen' }, 'Revalidation Review Screen');
  },
}));

jest.mock('@/feature/revalidation/pages/recheck-evidence-screen', () => ({
  RecheckEvidenceScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'recheck-evidence-screen' }, 'Recheck Evidence Screen');
  },
}));

jest.mock('@/feature/work/pages/recapture-camera-screen', () => ({
  RecaptureCameraScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'recapture-camera-screen' }, 'Recapture Camera Screen');
  },
}));

jest.mock('@/feature/work/pages/recaptures-screen', () => ({
  RecapturesScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'recaptures-screen' }, 'Recaptures Screen');
  },
}));

jest.mock('@/feature/work/pages/recorded-signs-screen', () => ({
  RecordedSignsScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'recorded-signs-screen' }, 'Recorded Signs Screen');
  },
}));

jest.mock('@/feature/navigation/pages/navigation-history-screen', () => ({
  NavigationHistoryScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'navigation-history-screen' }, 'Navigation History Screen');
  },
}));

jest.mock('@/feature/upload/pages/new-survey-record-screen', () => ({
  NewSurveyRecordScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'new-survey-screen' }, 'New Survey Screen');
  },
}));

jest.mock('@/feature/upload/pages/survey-record-details-screen', () => ({
  SurveyRecordDetailsScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'survey-record-details-screen' }, 'Survey Record Details Screen');
  },
}));

jest.mock('@/feature/upload/pages/survey-route-map-screen', () => ({
  SurveyRouteMapScreen: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'survey-route-map-screen' }, 'Survey Route Map Screen');
  },
}));

jest.mock('@/feature/review/context/review-workflow-provider', () => ({
  ReviewWorkflowProvider: ({ children }: any) => {
    const React = require('react');
    return React.createElement(React.Fragment, null, children);
  },
}));

jest.mock('@/feature/revalidation/context/revalidation-workflow-provider', () => ({
  RevalidationWorkflowProvider: ({ children }: any) => {
    const React = require('react');
    return React.createElement(React.Fragment, null, children);
  },
}));

// Import target routes
import SignCatalogRoute from '@/app/(authenticated)/(tabs)/work/sign-catalog';
import SubmissionCompleteRoute from '@/app/(authenticated)/(tabs)/work/submission-complete';
import SubmissionFinishRoute from '@/app/(authenticated)/(tabs)/work/submission-finish';
import SubmissionReviewRoute from '@/app/(authenticated)/(tabs)/work/submission-review';
import SubmissionSummaryRoute from '@/app/(authenticated)/(tabs)/work/submission-summary';
import SurveyFinishRoute from '@/app/(authenticated)/(tabs)/work/survey-finish';
import SurveyHistoryRoute from '@/app/(authenticated)/(tabs)/work/survey-history';
import SurveySubmissionDetailsRoute from '@/app/(authenticated)/(tabs)/work/survey-submission-details';

// Additional work tab routes for full folder coverage
import WorkRoute from '@/app/(authenticated)/(tabs)/work/index';
import MissionsRoute from '@/app/(authenticated)/(tabs)/work/missions';
import ReviewerStatsRoute from '@/app/(authenticated)/(tabs)/work/reviewer-stats';
import InspectRevalidateRoute from '@/app/(authenticated)/(tabs)/work/inspect-revalidate';
import RevalidationMapRoute from '@/app/(authenticated)/(tabs)/work/revalidation-map';
import RevalidationReviewRoute from '@/app/(authenticated)/(tabs)/work/revalidation-review';
import RevalidationSummaryRoute from '@/app/(authenticated)/(tabs)/work/revalidation-summary';
import RecaptureCameraRoute from '@/app/(authenticated)/(tabs)/work/recapture-camera';
import RecapturesRoute from '@/app/(authenticated)/(tabs)/work/recaptures';
import RecordedSignsRoute from '@/app/(authenticated)/(tabs)/work/recorded-signs';
import NavigationHistoryRoute from '@/app/(authenticated)/(tabs)/work/navigation-history';
import NewSurveyRoute from '@/app/(authenticated)/(tabs)/work/new-survey';
import SurveyRecordDetailsRoute from '@/app/(authenticated)/(tabs)/work/new-survey/details';
import SurveyRouteMapRoute from '@/app/(authenticated)/(tabs)/work/new-survey/route-map';
import WorkLayout from '@/app/(authenticated)/(tabs)/work/_layout';

describe('Work Tab Route Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  describe('User-Requested Target Routes', () => {
    it('renders sign-catalog.tsx correctly', async () => {
      const { getByTestId, getByText } = await render(<SignCatalogRoute />);
      expect(getByTestId('sign-catalog-screen')).toBeTruthy();
      expect(getByText('Sign Catalog Screen')).toBeTruthy();
    });

    it('renders submission-complete.tsx correctly', async () => {
      const { getByTestId, getByText } = await render(<SubmissionCompleteRoute />);
      expect(getByTestId('submission-complete-screen')).toBeTruthy();
      expect(getByText('Complete: type=none, count=none')).toBeTruthy();
    });

    it('renders submission-finish.tsx with valid count param', async () => {
      mockParams = { count: '12' };
      const { getByText } = await render(<SubmissionFinishRoute />);
      expect(getByText('Complete: type=review_submission, count=12')).toBeTruthy();
    });

    it('renders submission-finish.tsx with undefined count param (defaults to 0)', async () => {
      mockParams = {};
      const { getByText } = await render(<SubmissionFinishRoute />);
      expect(getByText('Complete: type=review_submission, count=0')).toBeTruthy();
    });

    it('renders submission-finish.tsx with non-numeric count param (NaN fallback to 0)', async () => {
      mockParams = { count: 'invalid-number' };
      const { getByText } = await render(<SubmissionFinishRoute />);
      expect(getByText('Complete: type=review_submission, count=0')).toBeTruthy();
    });

    it('renders submission-review.tsx with valid review state "ready"', async () => {
      mockParams = { state: 'ready' };
      const { getByText } = await render(<SubmissionReviewRoute />);
      expect(getByText('Review state: ready')).toBeTruthy();
    });

    it('renders submission-review.tsx with valid review state "loading"', async () => {
      mockParams = { state: 'loading' };
      const { getByText } = await render(<SubmissionReviewRoute />);
      expect(getByText('Review state: loading')).toBeTruthy();
    });

    it('renders submission-review.tsx with valid review state "reviewed"', async () => {
      mockParams = { state: 'reviewed' };
      const { getByText } = await render(<SubmissionReviewRoute />);
      expect(getByText('Review state: reviewed')).toBeTruthy();
    });

    it('renders submission-review.tsx with invalid state (defaults to "ready")', async () => {
      mockParams = { state: 'some-unknown-state' };
      const { getByText } = await render(<SubmissionReviewRoute />);
      expect(getByText('Review state: ready')).toBeTruthy();
    });

    it('renders submission-summary.tsx correctly', async () => {
      const { getByTestId, getByText } = await render(<SubmissionSummaryRoute />);
      expect(getByTestId('submission-summary-screen')).toBeTruthy();
      expect(getByText('Submission Summary Screen')).toBeTruthy();
    });

    it('renders survey-finish.tsx correctly with upload_submission type', async () => {
      const { getByTestId, getByText } = await render(<SurveyFinishRoute />);
      expect(getByTestId('submission-complete-screen')).toBeTruthy();
      expect(getByText('Complete: type=upload_submission, count=none')).toBeTruthy();
    });

    it('renders survey-history.tsx correctly', async () => {
      const { getByTestId, getByText } = await render(<SurveyHistoryRoute />);
      expect(getByTestId('survey-history-screen')).toBeTruthy();
      expect(getByText('Survey History Screen')).toBeTruthy();
    });

    it('renders survey-submission-details.tsx with specified id param', async () => {
      mockParams = { id: 'submission-uuid-999' };
      const { getByTestId, getByText } = await render(<SurveySubmissionDetailsRoute />);
      expect(getByTestId('survey-submission-details-screen')).toBeTruthy();
      expect(getByText('Submission ID: submission-uuid-999')).toBeTruthy();
    });

    it('renders survey-submission-details.tsx with undefined id param', async () => {
      mockParams = {};
      const { getByTestId, getByText } = await render(<SurveySubmissionDetailsRoute />);
      expect(getByTestId('survey-submission-details-screen')).toBeTruthy();
      expect(getByText('Submission ID: undefined')).toBeTruthy();
    });
  });

  describe('Additional Work Tab Routes Coverage', () => {
    it('renders work/index.tsx with valid roles (driver, surveyor, reviewer)', async () => {
      mockParams = { currentRole: 'surveyor' };
      const { getByText: getText1 } = await render(<WorkRoute />);
      expect(getText1('Work Role: surveyor')).toBeTruthy();

      mockParams = { currentRole: 'reviewer' };
      const { getByText: getText2 } = await render(<WorkRoute />);
      expect(getText2('Work Role: reviewer')).toBeTruthy();

      mockParams = { currentRole: 'driver' };
      const { getByText: getText3 } = await render(<WorkRoute />);
      expect(getText3('Work Role: driver')).toBeTruthy();
    });

    it('renders work/index.tsx with invalid role defaulting to "driver"', async () => {
      mockParams = { currentRole: 'unknown' };
      const { getByText } = await render(<WorkRoute />);
      expect(getByText('Work Role: driver')).toBeTruthy();
    });

    it('renders missions.tsx with valid role and fallback', async () => {
      mockParams = { role: 'reviewer' };
      const { getByText: getText1 } = await render(<MissionsRoute />);
      expect(getText1('Missions Role: reviewer')).toBeTruthy();

      mockParams = { role: 'admin' };
      const { getByText: getText2 } = await render(<MissionsRoute />);
      expect(getText2('Missions Role: driver')).toBeTruthy();
    });

    it('renders reviewer-stats.tsx correctly', async () => {
      const { getByTestId } = await render(<ReviewerStatsRoute />);
      expect(getByTestId('reviewer-stats-screen')).toBeTruthy();
    });

    it('renders inspect-revalidate.tsx correctly', async () => {
      const { getByTestId } = await render(<InspectRevalidateRoute />);
      expect(getByTestId('inspect-revalidate-screen')).toBeTruthy();
    });

    it('renders revalidation-map.tsx correctly', async () => {
      const { getByTestId } = await render(<RevalidationMapRoute />);
      expect(getByTestId('revalidation-map-screen')).toBeTruthy();
    });

    it('renders revalidation-review.tsx correctly', async () => {
      const { getByTestId } = await render(<RevalidationReviewRoute />);
      expect(getByTestId('revalidation-review-screen')).toBeTruthy();
    });

    it('renders revalidation-summary.tsx correctly', async () => {
      const { getByTestId } = await render(<RevalidationSummaryRoute />);
      expect(getByTestId('recheck-evidence-screen')).toBeTruthy();
    });

    it('renders recapture-camera.tsx correctly', async () => {
      const { getByTestId } = await render(<RecaptureCameraRoute />);
      expect(getByTestId('recapture-camera-screen')).toBeTruthy();
    });

    it('renders recaptures.tsx correctly', async () => {
      const { getByTestId } = await render(<RecapturesRoute />);
      expect(getByTestId('recaptures-screen')).toBeTruthy();
    });

    it('renders recorded-signs.tsx correctly', async () => {
      const { getByTestId } = await render(<RecordedSignsRoute />);
      expect(getByTestId('recorded-signs-screen')).toBeTruthy();
    });

    it('renders navigation-history.tsx correctly', async () => {
      const { getByTestId } = await render(<NavigationHistoryRoute />);
      expect(getByTestId('navigation-history-screen')).toBeTruthy();
    });

    it('renders new-survey.tsx correctly', async () => {
      const { getByTestId } = await render(<NewSurveyRoute />);
      expect(getByTestId('new-survey-screen')).toBeTruthy();
    });

    it('renders new-survey/details.tsx correctly', async () => {
      const { getByTestId } = await render(<SurveyRecordDetailsRoute />);
      expect(getByTestId('survey-record-details-screen')).toBeTruthy();
    });

    it('renders new-survey/route-map.tsx correctly', async () => {
      const { getByTestId } = await render(<SurveyRouteMapRoute />);
      expect(getByTestId('survey-route-map-screen')).toBeTruthy();
    });

    it('renders _layout.tsx wrapping Slot with providers', async () => {
      const { getByTestId, getByText } = await render(<WorkLayout />);
      expect(getByTestId('slot')).toBeTruthy();
      expect(getByText('Slot Content')).toBeTruthy();
    });
  });
});
