import { render } from '@testing-library/react-native';

import { AppBottomTabs } from '../src/components/app-bottom-tabs';

// 1. Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
    }),
}));

// 2. Mock expo-symbols native view
jest.mock('expo-symbols', () => ({
    SymbolView: 'SymbolView',
}));

// 3. Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    return {
        SafeAreaView: ({ children, ...props }: any) =>
            React.createElement('SafeAreaView', props, children),
        useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
    };
});

describe('BottomTabs Test', () => {
    test('renders BottomTabs correctly', async () => {
        const { getByText } = await render(<AppBottomTabs activeRoute="/home" />);

        expect(getByText('Home')).toBeTruthy();
        expect(getByText('Work')).toBeTruthy();
        expect(getByText('Profile')).toBeTruthy();
    });
});
