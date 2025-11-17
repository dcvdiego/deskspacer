import type { Preview } from '@storybook/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme } from '../src/styles/theme.styles';
import React from 'react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#121212',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
    a11y: {
      // Axe configuration
      config: {
        rules: [
          // Configure specific rules if needed
        ],
      },
      // Axe options - run WCAG 2.0 and 2.1 Level A and AA rules
      options: {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
      },
      // Fail tests on accessibility violations for CI
      test: 'error',
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
