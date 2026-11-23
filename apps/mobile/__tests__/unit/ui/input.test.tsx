import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { View, Text } from 'react-native';

import { AppInput, type AppInputDropdownOption } from '@/components/input';

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} {...props} />,
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    primary: '#007B8B',
    text: '#0F172A',
    textSecondary: '#64748B',
    placeholder: '#94A3B8',
  }),
}));

describe('AppInput Component', () => {
  it('renders text input with label, placeholder, and triggers onChangeText/callback', async () => {
    const handleChangeText = jest.fn();
    const handleCallback = jest.fn();

    const { getByText, getByPlaceholderText } = await render(
      <AppInput
        label="Họ và tên"
        placeholder="Nhập tên của bạn"
        callback={handleCallback}
        onChangeText={handleChangeText}
        type="text"
      />
    );

    expect(getByText('Họ và tên')).toBeTruthy();
    const input = getByPlaceholderText('Nhập tên của bạn');

    await act(async () => {
      fireEvent.changeText(input, 'Nguyễn Văn A');
    });

    expect(handleChangeText).toHaveBeenCalledWith('Nguyễn Văn A');
    expect(handleCallback).toHaveBeenCalledWith('Nguyễn Văn A');
  });

  it('renders password input and toggles visibility button', async () => {
    const { getByPlaceholderText, getByText, getByLabelText } = await render(
      <AppInput
        type="password"
        placeholder="Nhập mật khẩu"
        value="secret123"
      />
    );

    const input = getByPlaceholderText('Nhập mật khẩu');
    expect(input.props.secureTextEntry).toBe(true);

    const toggleBtn = getByLabelText('Hiện mật khẩu');
    expect(getByText('Hiện')).toBeTruthy();

    await act(async () => {
      fireEvent.press(toggleBtn);
    });

    expect(input.props.secureTextEntry).toBe(false);
    expect(getByText('Ẩn')).toBeTruthy();

    // Toggle back
    await act(async () => {
      fireEvent.press(getByLabelText('Ẩn mật khẩu'));
    });
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('applies correct config for email, phone, and search input types', async () => {
    const { getByPlaceholderText: getEmail } = await render(
      <AppInput type="email" placeholder="Email" />
    );
    expect(getEmail('Email').props.keyboardType).toBe('email-address');

    const { getByPlaceholderText: getPhone } = await render(
      <AppInput type="phone" placeholder="Phone" />
    );
    expect(getPhone('Phone').props.keyboardType).toBe('phone-pad');

    const { getByPlaceholderText: getSearch } = await render(
      <AppInput type="search" placeholder="Search" />
    );
    expect(getSearch('Search').props.keyboardType).toBe('default');
  });

  it('renders leadingIcon, trailingIcon, and error alert', async () => {
    const { getByText, getByTestId } = await render(
      <AppInput
        placeholder="Input test"
        error="Trường này là bắt buộc"
        leadingIcon={<View testID="test-leading-icon" />}
        trailingIcon={<View testID="test-trailing-icon" />}
      />
    );

    expect(getByTestId('test-leading-icon')).toBeTruthy();
    expect(getByTestId('test-trailing-icon')).toBeTruthy();
    const errorText = getByText('Trường này là bắt buộc');
    expect(errorText).toBeTruthy();
    expect(errorText.props.accessibilityRole).toBe('alert');
  });

  it('renders dropdown type, opens modal, and selects option', async () => {
    const options: AppInputDropdownOption[] = [
      { label: 'Xe máy', value: 'MOTORCYCLE', sublabel: '2 bánh', color: '#10B981' },
      { label: 'Ô tô', value: 'CAR', sublabel: '4 bánh', color: '#3B82F6' },
    ];

    const handleSelectOption = jest.fn();
    const handleCallback = jest.fn();

    const { getByText, queryByText, getByLabelText } = await render(
      <AppInput
        type="dropdown"
        label="Phương tiện"
        placeholder="Chọn loại xe"
        dropdownTitle="Chọn phương tiện di chuyển"
        dropdownOptions={options}
        selectedOptionValue="MOTORCYCLE"
        onSelectOption={handleSelectOption}
        callback={handleCallback}
      />
    );

    expect(getByText('Phương tiện')).toBeTruthy();
    expect(getByText('Xe máy')).toBeTruthy();

    // Open dropdown
    const trigger = getByLabelText('Phương tiện');
    await act(async () => {
      fireEvent.press(trigger);
    });

    expect(getByText('Chọn phương tiện di chuyển')).toBeTruthy();
    expect(getByText('Ô tô')).toBeTruthy();
    expect(getByText('4 bánh')).toBeTruthy();

    // Select second option
    const carOption = getByLabelText('Ô tô, chưa chọn');
    await act(async () => {
      fireEvent.press(carOption);
    });

    expect(handleSelectOption).toHaveBeenCalledWith(options[1]);
    expect(handleCallback).toHaveBeenCalledWith('CAR');
  });

  it('closes dropdown modal via close button', async () => {
    const options: AppInputDropdownOption[] = [
      { label: 'Tùy chọn A', value: 'A' },
    ];

    const { getByLabelText, getByText, queryByText } = await render(
      <AppInput
        type="dropdown"
        label="Lựa chọn"
        dropdownOptions={options}
      />
    );

    await act(async () => {
      fireEvent.press(getByLabelText('Lựa chọn'));
    });

    expect(getByText('Tùy chọn A')).toBeTruthy();

    // Close via close button
    const closeBtn = getByLabelText('Đóng');
    await act(async () => {
      fireEvent.press(closeBtn);
    });
  });

  it('does not open dropdown when disabled is true', async () => {
    const options: AppInputDropdownOption[] = [
      { label: 'Tùy chọn A', value: 'A' },
    ];

    const { getByLabelText, queryByText } = await render(
      <AppInput
        type="dropdown"
        label="Disabled input"
        disabled={true}
        dropdownOptions={options}
      />
    );

    const trigger = getByLabelText('Disabled input');
    await act(async () => {
      fireEvent.press(trigger);
    });

    expect(queryByText('Tùy chọn A')).toBeNull();
  });
});
