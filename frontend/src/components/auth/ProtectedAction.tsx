import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ProtectedActionProps {
  children: ReactNode;
  fallback?: ReactNode;
  requirePremium?: boolean;
  onUnauthorized?: () => void;
}

/**
 * Component that conditionally renders children based on authentication status
 * Used to protect actions that require authentication or premium status
 */
const ProtectedAction: React.FC<ProtectedActionProps> = ({
  children,
  fallback = null,
  requirePremium = false,
  onUnauthorized,
}) => {
  const { isAuthenticated, user } = useAuth();

  // Check authentication
  if (!isAuthenticated) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    return <>{fallback}</>;
  }

  // Check premium requirement
  if (requirePremium && !user?.isPremium) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedAction;
