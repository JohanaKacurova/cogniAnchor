import React from 'react';
import { render } from '@testing-library/react-native';
import ScheduleCard from '../ScheduleCard';

// Mock useTheme to provide necessary context for ScheduleCard
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      colors: {
        primary: '#4682B4',
        background: '#FFFFFF',
        surface: '#F8F9FA',
        text: '#2C3E50',
        textSecondary: '#6B7280',
        border: '#E6E6FA',
        accent: '#87CEEB',
      },
    },
    currentTextScale: { id: 'normal', name: 'Normal', multiplier: 1 },
    calmMode: false,
    scaleText: (n: number) => n,
    getCalmModeTextColor: () => '#2C3E50',
  }),
}));

describe('ScheduleCard', () => {
  it('renders the schedule card with title and time', () => {
    const { getByText } = render(
      <ScheduleCard
        title="Breakfast"
        time="8:00 AM"
        image=""
        completed={false}
        onVoicePrompt={() => {}}
      />
    );
    expect(getByText('Breakfast')).toBeTruthy();
    expect(getByText('8:00 AM')).toBeTruthy();
  });
}); 