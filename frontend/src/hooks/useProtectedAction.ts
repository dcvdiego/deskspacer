import { useAuth } from '../context/AuthContext';

interface UseProtectedActionOptions {
  requirePremium?: boolean;
  onUnauthorized?: () => void;
  onNotPremium?: () => void;
}

/**
 * Hook to check if a user can perform a protected action
 * Returns a function that checks auth status before executing the action
 */
export const useProtectedAction = (options: UseProtectedActionOptions = {}) => {
  const { isAuthenticated, user } = useAuth();
  const { requirePremium = false, onUnauthorized, onNotPremium } = options;

  const checkAndExecute = <T extends unknown[]>(
    action: (...args: T) => void
  ) => {
    return (...args: T) => {
      if (!isAuthenticated) {
        if (onUnauthorized) {
          onUnauthorized();
        }
        return;
      }

      if (requirePremium && !user?.isPremium) {
        if (onNotPremium) {
          onNotPremium();
        }
        return;
      }

      action(...args);
    };
  };

  return {
    isAuthenticated,
    isPremium: user?.isPremium || false,
    checkAndExecute,
  };
};
