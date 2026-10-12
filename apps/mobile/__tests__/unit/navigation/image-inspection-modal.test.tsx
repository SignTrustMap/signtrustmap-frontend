import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ImageInspectionModal } from '@/components/image-inspection-modal';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

describe('ImageInspectionModal', () => {
  it('renders image, title and triggers onClose when close button tapped', async () => {
    const handleClose = jest.fn();
    const { getByText, getByLabelText } = await render(
      <ImageInspectionModal
        visible={true}
        onClose={handleClose}
        imageUrl="https://images.example.com/actual-crop.jpg"
        title="Biển Báo P.102"
        subtitle="10.7725, 106.6980"
      />
    );

    expect(getByText('Biển Báo P.102')).toBeTruthy();
    expect(getByText('10.7725, 106.6980')).toBeTruthy();

    const closeBtn = getByLabelText('Close photo inspection');
    fireEvent.press(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders null when imageUrl is empty', async () => {
    const { queryByText } = await render(
      <ImageInspectionModal
        visible={true}
        onClose={jest.fn()}
        imageUrl=""
      />
    );

    expect(queryByText('Ảnh Xác Thực Thực Địa')).toBeNull();
  });
});
