import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import LOGIN_MUTATION from '../graphql/auth/login';
import REGISTER_MUTATION from '../graphql/auth/register';
import LOGOUT_MUTATION from '../graphql/auth/logout';
import ME_QUERY from '../graphql/auth/me';

interface User {
  id: string;
  email: string;
  username: string;
  isPremium: boolean;
  emailVerified: boolean;
  createdAt: string;
  stateCount?: number;
  glbCount?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // GraphQL mutations and queries
  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  const { data: meData, loading: meLoading, refetch: refetchUser } = useQuery(ME_QUERY, {
    skip: !localStorage.getItem('accessToken'),
    fetchPolicy: 'network-only',
  });

  // Listen for auth logout events from Apollo error link
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // Update user state when me query completes
  useEffect(() => {
    if (meData?.me) {
      setUser(meData.me);
      setIsAuthenticated(true);
    } else if (!meLoading && !localStorage.getItem('accessToken')) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [meData, meLoading]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await loginMutation({
        variables: {
          input: { email, password },
        },
      });

      if (data?.login) {
        localStorage.setItem('accessToken', data.login.accessToken);
        localStorage.setItem('refreshToken', data.login.refreshToken);
        setUser(data.login.user);
        setIsAuthenticated(true);
        await refetchUser();
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      const { data } = await registerMutation({
        variables: {
          input: { email, username, password },
        },
      });

      if (data?.register) {
        localStorage.setItem('accessToken', data.register.accessToken);
        localStorage.setItem('refreshToken', data.register.refreshToken);
        setUser(data.register.user);
        setIsAuthenticated(true);
        await refetchUser();
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user state regardless of mutation success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const loading = loginLoading || registerLoading || meLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
