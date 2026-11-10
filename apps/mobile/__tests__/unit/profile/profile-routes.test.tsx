import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@/feature/profile/pages/edit-profile-screen', () => {
  const { View, Text } = require('react-native');
  return {
    EditProfileScreen: () => (
      <View testID="edit-profile-screen">
        <Text>Edit Profile Screen</Text>
      </View>
    ),
  };
});

jest.mock('@/feature/profile/pages/profile-screen', () => {
  const { View, Text } = require('react-native');
  return {
    ProfileScreen: () => (
      <View testID="profile-screen">
        <Text>Profile Screen</Text>
      </View>
    ),
  };
});

import EditProfileRoute from '@/app/(authenticated)/(tabs)/profile/edit';
import ProfileRoute from '@/app/(authenticated)/(tabs)/profile/index';

describe('Profile Routes', () => {
  it('renders edit.tsx', async () => {
    const { getByTestId, getByText } = await render(<EditProfileRoute />);
    expect(getByTestId('edit-profile-screen')).toBeTruthy();
    expect(getByText('Edit Profile Screen')).toBeTruthy();
  });

  it('renders index.tsx', async () => {
    const { getByTestId, getByText } = await render(<ProfileRoute />);
    expect(getByTestId('profile-screen')).toBeTruthy();
    expect(getByText('Profile Screen')).toBeTruthy();
  });
});
