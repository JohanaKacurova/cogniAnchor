import React from 'react';
import { render } from '@testing-library/react-native';
import ScheduleCard from '../modules/core/components/ScheduleCard';
import { ThemeProvider } from '@/contexts/ThemeContext';

describe('ScheduleCard', () => {
  it('renders the schedule card with title and time', () => {
    const { getByText } = render(
      <ThemeProvider>
        <ScheduleCard
          title="Breakfast"
          time="8:00 AM"
          image=""
          completed={false}
          onVoicePrompt={() => {}}
        />
      </ThemeProvider>
    );
    expect(getByText('Breakfast')).toBeTruthy();
    expect(getByText('8:00 AM')).toBeTruthy();
  });
}); 