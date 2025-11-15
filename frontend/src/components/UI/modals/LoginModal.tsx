import { useState } from 'react';
import {
  Modal,
  Typography,
  Button,
  TextField,
  Alert,
  Link,
  Box,
} from '@mui/material';
import { StyledModal } from '../../../styles/Modal.styles';
import { useAuth } from '../../../context/AuthContext';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  open,
  onClose,
  onSwitchToSignup,
}) => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      onClose();
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to login. Please check your credentials.';
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <StyledModal>
        <Typography variant="h5" component="h2">
          Login to DeskSpacer
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <Typography variant="body2" align="center">
              Don't have an account?{' '}
              <Link
                component="button"
                type="button"
                onClick={() => {
                  handleClose();
                  onSwitchToSignup();
                }}
                sx={{ cursor: 'pointer' }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </form>
      </StyledModal>
    </Modal>
  );
};

export default LoginModal;
