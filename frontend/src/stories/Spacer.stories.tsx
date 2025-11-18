import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spacer } from '../components/UI/Spacer';
import { Typography } from '@mui/material';

const meta: Meta<typeof Spacer> = {
  title: 'UI/Spacer',
  component: Spacer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    time: {
      control: { type: 'range', min: 0, max: 10, step: 0.1 },
      description: 'Animation duration in seconds',
    },
    spacing: {
      control: { type: 'range', min: 0, max: 200, step: 5 },
      description: 'Final letter spacing in pixels',
    },
  },
  decorators: [
    (Story) => (
      <main>
        <Story />
      </main>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Spacer>;

export const Default: Story = {
  args: {
    time: 4.8,
    spacing: 100,
    children: 'SPACER',
  },
  render: (args) => (
    <Typography variant="h6" noWrap component="div">
      DESK <Spacer {...args}>{args.children}</Spacer>
    </Typography>
  ),
};

export const Fast: Story = {
  args: {
    time: 1,
    spacing: 50,
    children: 'SPACER',
  },
  render: (args) => (
    <Typography variant="h6" noWrap component="div">
      DESK <Spacer {...args}>{args.children}</Spacer>
    </Typography>
  ),
};

export const Slow: Story = {
  args: {
    time: 10,
    spacing: 150,
    children: 'SPACER',
  },
  render: (args) => (
    <Typography variant="h6" noWrap component="div">
      DESK <Spacer {...args}>{args.children}</Spacer>
    </Typography>
  ),
};

export const CustomText: Story = {
  args: {
    time: 3,
    spacing: 80,
    children: 'CUSTOM',
  },
  render: (args) => (
    <Typography variant="h4" noWrap component="div">
      MY <Spacer {...args}>{args.children}</Spacer>
    </Typography>
  ),
};
