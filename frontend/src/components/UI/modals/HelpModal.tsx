import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { KEYBOARD_SHORTCUTS } from '../../../hooks/useKeyboardShortcuts';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

const KeyboardShortcutRow = ({
  keys,
  description,
  mac,
}: {
  keys: string[];
  description: string;
  mac?: string[];
}) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const displayKeys = isMac && mac ? mac : keys;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
      }}
    >
      <Typography variant="body2">{description}</Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {displayKeys.map((key, index) => (
          <Chip
            key={index}
            label={key}
            size="small"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 'bold',
              minWidth: '40px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5" component="div">
          Keyboard Shortcuts
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* General Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            General
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {KEYBOARD_SHORTCUTS.general.map((shortcut, index) => (
            <KeyboardShortcutRow
              key={index}
              keys={shortcut.keys}
              description={shortcut.description}
            />
          ))}
        </Box>

        {/* Editing Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Editing
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {KEYBOARD_SHORTCUTS.editing.map((shortcut, index) => (
            <KeyboardShortcutRow
              key={index}
              keys={shortcut.keys}
              description={shortcut.description}
              mac={shortcut.mac}
            />
          ))}
        </Box>

        {/* Transform Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Transform (when model selected)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {KEYBOARD_SHORTCUTS.transform.map((shortcut, index) => (
            <KeyboardShortcutRow
              key={index}
              keys={shortcut.keys}
              description={shortcut.description}
            />
          ))}
        </Box>

        {/* Camera Section */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Camera Controls
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {KEYBOARD_SHORTCUTS.camera.map((shortcut, index) => (
            <KeyboardShortcutRow
              key={index}
              keys={shortcut.keys}
              description={shortcut.description}
            />
          ))}
        </Box>

        {/* Pro Tip */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderRadius: 1,
            borderLeft: '4px solid #2196f3',
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            <strong>Pro Tip:</strong> Transform shortcuts (G, R, S) work like
            Blender - select a model first, then press the key to enter that
            transform mode!
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
