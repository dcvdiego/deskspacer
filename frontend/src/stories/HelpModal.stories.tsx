import type { Meta, StoryObj } from '@storybook/react-vite';
import HelpModal from '../components/UI/modals/HelpModal';

const meta: Meta<typeof HelpModal> = {
  title: 'UI/Modals/HelpModal',
  component: HelpModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HelpModal>;

export const Default: Story = {
  args: {
    open: true,
    onClose: () => console.log('Close clicked'),
  },
};
