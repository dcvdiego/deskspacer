import {
  Modal,
  Typography,
  Button,
  TextField,
  IconButton,
} from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { Spacer } from '../Spacer';
import { StyledModal } from '../../../styles/Modal.styles';

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
  if (!modalType) return null;

  const renderContent = () => {
    switch (modalType) {
      case 'tutorial':
        return (
          <>
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
            <Button onClick={onClose}>Continue</Button> {/* Use onClose prop */}
          </>
        );
      case 'share': {
        return (
          <>
            <div>Here is the link, it expires in 15 days:</div>
            <div>
              <TextField
                disabled
                id="outlined-disabled"
                value={
                  shareData?.loading
                    ? 'Loading'
                    : shareData?.error
                      ? 'An error has occurred'
                      : shareData?.url ?? ''
                }
                slotProps={{
                  htmlInput: {
                    size: shareData?.loading
                      ? undefined
                      : shareData?.url
                        ? shareData?.url?.split('#')[1].length + 14
                        : undefined,
                    readOnly: true,
                  },
                }}
              />
              <IconButton
                onClick={() =>
                  shareData?.url &&
                  navigator.clipboard.writeText(shareData?.url)
                }
              >
                <ContentCopy />
              </IconButton>
            </div>
            <Button onClick={onClose} sx={{ marginTop: 2 }}>
              Close
            </Button>
          </>
        );
      }
      case 'settings':
        return (
          <>
            <div>Settings</div>
            <div>These are the settings</div>
            <Button onClick={onClose}>Close</Button>
          </>
        );
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
