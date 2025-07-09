import React from 'react';
import { render } from '@testing-library/react-native';
import ShapePuzzleWithProvider from '../shape-puzzle';

describe('ShapePuzzleWithProvider', () => {
  it('renders the puzzle screen and all drop zones', () => {
    const { getByText, getAllByLabelText } = render(<ShapePuzzleWithProvider />);
    expect(getByText('Match the Shapes')).toBeTruthy();
    expect(getAllByLabelText(/Drop zone for/).length).toBeGreaterThan(0);
  });

  // More detailed logic and interaction tests can be added here
}); 