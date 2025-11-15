import { useState } from 'react';
import {
  Modal,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { StyledModal } from '../../../styles/Modal.styles';
import { useMutation } from '@apollo/client';
import CREATE_CHECKOUT_SESSION_MUTATION from '../../../graphql/payment/createCheckoutSession';

interface PremiumUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  open,
  onClose,
}) => {
  const [error, setError] = useState<string | null>(null);

  const [createCheckoutSession, { loading }] = useMutation(
    CREATE_CHECKOUT_SESSION_MUTATION,
    {
      onCompleted: (data) => {
        if (data?.createCheckoutSession?.url) {
          // Redirect to Stripe checkout
          window.location.href = data.createCheckoutSession.url;
        }
      },
      onError: (err) => {
        setError(err.message || 'Failed to start checkout. Please try again.');
      },
    }
  );

  const handleUpgrade = async () => {
    setError(null);
    await createCheckoutSession();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <StyledModal>
        <Typography variant="h5" component="h2">
          Upgrade to Premium
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="body1">
            Unlock the full potential of DeskSpacer with Premium:
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Save up to 100 desk setups"
                secondary="vs. 5 for free accounts"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Upload custom 3D models (GLB files)"
                secondary="Up to 10 custom models, 5MB each"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Priority support"
                secondary="Get help faster with dedicated support"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Early access to new features"
                secondary="Be the first to try new 3D models and tools"
              />
            </ListItem>
          </List>

          <Box
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" component="div">
              $9.99/month
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cancel anytime
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={handleUpgrade}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Redirecting to checkout...' : 'Upgrade Now'}
          </Button>

          <Button variant="text" fullWidth onClick={onClose}>
            Maybe Later
          </Button>
        </Box>
      </StyledModal>
    </Modal>
  );
};

export default PremiumUpgradeModal;
