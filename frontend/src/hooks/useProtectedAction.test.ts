import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProtectedAction } from './useProtectedAction';

const mockUser = {
  id: '123',
  email: 'test@example.com',
  username: 'testuser',
  isPremium: false,
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
};

const mockPremiumUser = {
  ...mockUser,
  isPremium: true,
};

let mockAuthContext = {
  user: null,
  loading: false,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refetchUser: vi.fn(),
};

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => mockAuthContext,
  };
});

describe('useProtectedAction', () => {
  it('should return isAuthenticated status', () => {
    mockAuthContext = {
      ...mockAuthContext,
      isAuthenticated: true,
      user: mockUser,
    };

    const { result } = renderHook(() => useProtectedAction());
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should return isPremium status', () => {
    mockAuthContext = {
      ...mockAuthContext,
      isAuthenticated: true,
      user: mockPremiumUser,
    };

    const { result } = renderHook(() => useProtectedAction());
    expect(result.current.isPremium).toBe(true);
  });

  it('should execute action when authenticated', () => {
    const mockAction = vi.fn();
    mockAuthContext = {
      ...mockAuthContext,
      isAuthenticated: true,
      user: mockUser,
    };

    const { result } = renderHook(() => useProtectedAction());
    const protectedAction = result.current.checkAndExecute(mockAction);
    protectedAction();

    expect(mockAction).toHaveBeenCalled();
  });

  it('should not execute when not authenticated', () => {
    const mockAction = vi.fn();
    const mockOnUnauthorized = vi.fn();
    mockAuthContext = {
      ...mockAuthContext,
      isAuthenticated: false,
      user: null,
    };

    const { result } = renderHook(() =>
      useProtectedAction({ onUnauthorized: mockOnUnauthorized })
    );
    const protectedAction = result.current.checkAndExecute(mockAction);
    protectedAction();

    expect(mockAction).not.toHaveBeenCalled();
    expect(mockOnUnauthorized).toHaveBeenCalled();
  });
});
