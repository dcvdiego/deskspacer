import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import LOGIN_MUTATION from '../graphql/auth/login';
import ME_QUERY from '../graphql/auth/me';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const mockUser = {
  id: '123',
  email: 'test@example.com',
  username: 'testuser',
  isPremium: false,
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  stateCount: 2,
  glbCount: 0,
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('useAuth hook', () => {
    it('should provide initial auth state as not authenticated', () => {
      const mocks: MockedResponse[] = [];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthProvider>{children}</AuthProvider>
        </MockedProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('login', () => {
    it('should login successfully and set tokens', async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOGIN_MUTATION,
            variables: {
              input: {
                email: 'test@example.com',
                password: 'password123',
              },
            },
          },
          result: {
            data: {
              login: {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                user: mockUser,
              },
            },
          },
        },
        {
          request: {
            query: ME_QUERY,
          },
          result: {
            data: {
              me: mockUser,
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthProvider>{children}</AuthProvider>
        </MockedProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await result.current.login('test@example.com', 'password123');

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(localStorageMock.getItem('accessToken')).toBe('access-token');
      expect(result.current.user?.email).toBe('test@example.com');
    });
  });
});
