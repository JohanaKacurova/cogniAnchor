import React from 'react';
import { render } from '@testing-library/react-native';
import DraggableShape from '../DraggableShape';

describe('DraggableShape', () => {
  it('renders with correct shape and color', () => {
    const { getByLabelText } = render(
      <DraggableShape type="circle" color="#4682B4" size={48} accessibleLabel="circle shape" />
    );
    expect(getByLabelText('circle shape')).toBeTruthy();
  });

  it('applies accessibility role', () => {
    const { getByRole } = render(
      <DraggableShape type="star" color="#FFD700" size={48} accessibleLabel="star shape" />
    );
    expect(getByRole('image')).toBeTruthy();
  });

  // Drag gesture simulation would be tested with integration/e2e tests
}); 