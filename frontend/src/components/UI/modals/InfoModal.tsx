import {
  Modal,
  Typography,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Box,
  Alert,
} from '@mui/material';
import { ContentCopy, CheckCircle } from '@mui/icons-material';
import { Spacer } from '../Spacer';
import { StyledModal } from '../../../styles/Modal.styles';
import { useState } from 'react';
import SettingsModal from './SettingsModal';

interface InfoModalProps {
  modalType: 'tutorial' | 'share' | 'settings' | null;
  onClose: () => void;

  shareData?: {
    loading: boolean;
    error: boolean;
    url?: string | null;
  };
}

const InfoModal: React.FC<InfoModalProps> = ({
  modalType,
  onClose,
  shareData,
}) => {
  const [copied, setCopied] = useState(false);

  // Settings modal is now separate, handle it differently
  if (modalType === 'settings') {
    return <SettingsModal open={true} onClose={onClose} />;
  }

  if (!modalType) return null;

  const handleCopy = () => {
    if (shareData?.url) {
      navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderContent = () => {
    switch (modalType) {
      case 'tutorial':
        return (
          <main>
            <div>
              Welcome to{' '}
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ display: 'inline-block' }}
              >
                {' '}
                DESK{' '}
                <Spacer time={24} spacing={5}>
                  {' '}
                  SPACER
                </Spacer>
              </Typography>
            </div>
            <div>
              The left side menu has everything you need to add/remove/modify
              your canvas.
            </div>
            <div>
              The top menu has everything you need at a glance while inside the
              canvas.
            </div>
            <div>Have fun</div>
            <Button onClick={onClose}>Continue</Button>
          </main>
        );
      case 'share': {
        if (shareData?.loading) {
          return (
            <main>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3 }}>
                <CircularProgress aria-label="Generating shareable link" />
                <Typography>Generating shareable link...</Typography>
              </Box>
            </main>
          );
        }

        if (shareData?.error) {
          return (
            <main>
              <Alert severity="error">
                Failed to generate shareable link. Please try again.
              </Alert>
              <Button onClick={onClose} variant="contained" sx={{ mt: 2 }}>
                Close
              </Button>
            </main>
          );
        }

        return (
          <main>
            <Typography variant="h2" sx={{ fontSize: '1rem', mb: 2 }}>
              Here is the link, it expires in 15 days:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
              <TextField
                disabled
                id="outlined-disabled"
                label="Shareable link"
                value={shareData?.url ?? ''}
                slotProps={{
                  htmlInput: {
                    size: shareData?.url
                      ? shareData.url.split('#')[1].length + 14
                      : undefined,
                    readOnly: true,
                  },
                }}
                fullWidth
              />
              <IconButton
                onClick={handleCopy}
                color={copied ? 'success' : 'default'}
                disabled={!shareData?.url}
                aria-label="Copy link to clipboard"
              >
                {copied ? <CheckCircle /> : <ContentCopy />}
              </IconButton>
            </Box>
            {copied && (
              <Alert severity="success">
                Link copied to clipboard!
              </Alert>
            )}
            <Button onClick={onClose} variant="contained" sx={{ marginTop: 2 }}>
              Close
            </Button>
          </main>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Modal
      keepMounted
      open
      onClose={onClose}
      aria-labelledby="keep-mounted-modal-title"
      aria-describedby="keep-mounted-modal-description"
    >
      <StyledModal>{renderContent()}</StyledModal>
    </Modal>
  );
};

export default InfoModal;
