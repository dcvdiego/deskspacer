import { useState } from 'react';
import {
  Modal,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  LinearProgress,
  Alert,
} from '@mui/material';
import { StyledModal } from '../../../styles/Modal.styles';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircle, Cancel } from '@mui/icons-material';

interface UserDashboardModalProps {
  open: boolean;
  onClose: () => void;
  onOpenPremiumUpgrade: () => void;
  onOpenGLBUpload: () => void;
}

const UserDashboardModal: React.FC<UserDashboardModalProps> = ({
  open,
  onClose,
  onOpenPremiumUpgrade,
  onOpenGLBUpload,
}) => {
  const { user, loading } = useAuth();

  if (!user && !loading) {
    return null;
  }

  const stateLimit = user?.isPremium ? 100 : 5;
  const glbLimit = user?.isPremium ? 10 : 0;
  const stateCount = user?.stateCount || 0;
  const glbCount = user?.glbCount || 0;

  const stateUsagePercent = (stateCount / stateLimit) * 100;
  const glbUsagePercent = user?.isPremium ? (glbCount / glbLimit) * 100 : 0;

  return (
    <Modal open={open} onClose={onClose}>
      <StyledModal>
        <Typography variant="h5" component="h2">
          Account Dashboard
        </Typography>

        {loading ? (
          <Box>
            <LinearProgress />
            <Typography sx={{ mt: 2 }}>Loading account information...</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* User Info */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">{user?.email}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Username
              </Typography>
              <Typography variant="body1">{user?.username}</Typography>
            </Box>

            {/* Premium Status */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Membership Status
              </Typography>
              {user?.isPremium ? (
                <Chip
                  icon={<CheckCircle />}
                  label="Premium Member"
                  color="success"
                  variant="outlined"
                />
              ) : (
                <Chip
                  icon={<Cancel />}
                  label="Free Account"
                  color="default"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Email Verification */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Email Verification
              </Typography>
              {user?.emailVerified ? (
                <Chip
                  icon={<CheckCircle />}
                  label="Verified"
                  color="success"
                  size="small"
                />
              ) : (
                <Alert severity="warning" sx={{ py: 0 }}>
                  Email not verified. Check your inbox for verification link.
                </Alert>
              )}
            </Box>

            <Divider />

            {/* Usage Stats */}
            <Typography variant="h6">Storage Usage</Typography>

            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">Saved States</Typography>
                <Typography variant="body2">
                  {stateCount} / {stateLimit}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(stateUsagePercent, 100)}
                color={stateUsagePercent > 80 ? 'warning' : 'primary'}
              />
            </Box>

            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">Custom GLB Files</Typography>
                <Typography variant="body2">
                  {glbCount} / {glbLimit}
                </Typography>
              </Box>
              {user?.isPremium ? (
                <LinearProgress
                  variant="determinate"
                  value={Math.min(glbUsagePercent, 100)}
                  color={glbUsagePercent > 80 ? 'warning' : 'primary'}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Premium feature
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Action Buttons */}
            {!user?.isPremium && (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => {
                  onClose();
                  onOpenPremiumUpgrade();
                }}
              >
                Upgrade to Premium
              </Button>
            )}

            {user?.isPremium && (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  onClose();
                  onOpenGLBUpload();
                }}
                disabled={glbCount >= glbLimit}
              >
                Upload Custom GLB
              </Button>
            )}

            <Button variant="outlined" fullWidth onClick={onClose}>
              Close
            </Button>
          </Box>
        )}
      </StyledModal>
    </Modal>
  );
};

export default UserDashboardModal;
