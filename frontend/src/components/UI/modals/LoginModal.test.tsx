import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../../../styles/theme.styles';
import LoginModal from './LoginModal';
import { MockedProvider } from '@apollo/client/testing';

const mockLogin = vi.fn();
const mockAuthContext = {
  user: null,
  loading: false,
  isAuthenticated: false,
  login: mockLogin,
  register: vi.fn(),
  logout: vi.fn(),
  refetchUser: vi.fn(),
};

vi.mock('../../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => mockAuthContext,
  };
});

describe('LoginModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSwitchToSignup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLoginModal = (open = true) => {
    return render(
      <ThemeProvider theme={darkTheme}>
        <MockedProvider>
          <LoginModal
            open={open}
            onClose={mockOnClose}
            onSwitchToSignup={mockOnSwitchToSignup}
          />
        </MockedProvider>
      </ThemeProvider>
    );
  };

  it('should not render when closed', () => {
    renderLoginModal(false);
    expect(screen.queryByText('Login to DeskSpacer')).not.toBeInTheDocument();
  });

  it('should render login form when open', () => {
    renderLoginModal(true);
    expect(screen.getByText('Login to DeskSpacer')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should allow typing in fields', async () => {
    const user = userEvent.setup();
    renderLoginModal(true);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should call login on submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    renderLoginModal(true);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
