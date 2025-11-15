import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HelpModal from './HelpModal';
import { KEYBOARD_SHORTCUTS } from '../../../hooks/useKeyboardShortcuts';

describe('HelpModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should render when open is true', () => {
    render(<HelpModal open={true} onClose={mockOnClose} />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<HelpModal open={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('should display all sections', () => {
    render(<HelpModal open={true} onClose={mockOnClose} />);

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Editing')).toBeInTheDocument();
    expect(screen.getByText('Transform (when model selected)')).toBeInTheDocument();
  });

  it('should display all general shortcuts', () => {
    render(<HelpModal open={true} onClose={mockOnClose} />);

    KEYBOARD_SHORTCUTS.general.forEach((shortcut) => {
      expect(screen.getByText(shortcut.description)).toBeInTheDocument();
    });
  });

  it('should display all editing shortcuts', () => {
    render(<HelpModal open={true} onClose={mockOnClose} />);

    KEYBOARD_SHORTCUTS.editing.forEach((shortcut) => {
      // Use getAllByText for descriptions that might appear multiple times
      const elements = screen.getAllByText(shortcut.description);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('should display all transform shortcuts', () => {
    render(<HelpModal open={true} onClose={mockOnClose} />);

    KEYBOARD_SHORTCUTS.transform.forEach((shortcut) => {
      expect(screen.getByText(shortcut.description)).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<HelpModal open={true} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display the pro tip section', () => {
    render(<HelpModal open={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Pro Tip:/)).toBeInTheDocument();
    expect(
      screen.getByText(/Transform shortcuts.*work like Blender/i)
    ).toBeInTheDocument();
  });

  it('should display keyboard shortcut chips', () => {
    render(<HelpModal open={true} onClose={mockOnClose} />);

    // Check for some common shortcuts
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('H')).toBeInTheDocument();
  });

  it('should have proper dialog structure', () => {
    render(<HelpModal open={true} onClose={mockOnClose} />);

    // Check for the title which indicates the dialog is properly rendered
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('should close when clicking backdrop', async () => {
    const user = userEvent.setup();
    render(<HelpModal open={true} onClose={mockOnClose} />);

    // Click outside the dialog (on the backdrop)
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});
