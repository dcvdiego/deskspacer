import type { Meta, StoryObj } from '@storybook/react-vite';
import InfoModal from '../components/UI/modals/InfoModal';

const meta: Meta<typeof InfoModal> = {
  title: 'UI/Modals/InfoModal',
  component: InfoModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    modalType: {
      control: 'select',
      options: ['tutorial', 'share', 'settings'],
      description: 'Type of modal to display',
    },
    onClose: {
      action: 'closed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InfoModal>;

export const Tutorial: Story = {
  args: {
    modalType: 'tutorial',
    onClose: () => console.log('Close clicked'),
  },
};

export const ShareLoading: Story = {
  args: {
    modalType: 'share',
    onClose: () => console.log('Close clicked'),
    shareData: {
      loading: true,
      error: false,
      url: null,
    },
  },
};

export const ShareSuccess: Story = {
  args: {
    modalType: 'share',
    onClose: () => console.log('Close clicked'),
    shareData: {
      loading: false,
      error: false,
      url: 'https://deskspacer.com/#abc123def456',
    },
  },
};

export const ShareError: Story = {
  args: {
    modalType: 'share',
    onClose: () => console.log('Close clicked'),
    shareData: {
      loading: false,
      error: true,
      url: null,
    },
  },
};

export const Settings: Story = {
  args: {
    modalType: 'settings',
    onClose: () => console.log('Close clicked'),
  },
  parameters: {
    a11y: {
      disable: ['color-contrast'], // Material UI theme default has insufficient contrast on Tabs
    },
  },
};
