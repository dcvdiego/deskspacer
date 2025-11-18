import { styled, Theme, CSSObject, useTheme } from '@mui/material/styles';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';

import MuiDrawer from '@mui/material/Drawer';
import {
  Box,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  ToggleButton,
  Toolbar,
  Tooltip,
  Typography,
  Button,
  Menu,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { Spacer } from './Spacer';
import {
  Help,
  ImportExport,
  LocationOn,
  Share,
  ThreeSixty,
  Download,
  Upload,
  MissedVideoCall,
  NoMeetingRoom,
  Undo,
  Redo,
  Lock,
  LockOpen,
  AccountCircle,
  Logout,
  Dashboard,
  WorkspacePremium,
} from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { OrbitControls } from 'three-stdlib';
import { useModelStore } from '../../utils/store';
import { darkTheme } from '../../styles/theme.styles';
import { useAuth } from '../../context/AuthContext';
import LoginModal from './modals/LoginModal';
import SignupModal from './modals/SignupModal';
import UserDashboardModal from './modals/UserDashboardModal';
import PremiumUpgradeModal from './modals/PremiumUpgradeModal';
import CustomGLBUploadModal from './modals/CustomGLBUploadModal';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

export const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      },
    },
  ],
}));

const TransformModeSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (event: SelectChangeEvent) => void;
}) => {
  return (
    <FormControl sx={{ m: 1, minWidth: 150 }}>
      <InputLabel id="demo-simple-select-autowidth-label">Transform</InputLabel>
      <Select
        labelId="demo-simple-select-autowidth-label"
        id="demo-simple-select-autowidth"
        value={value}
        onChange={onChange}
        autoWidth
        label="transform-mode"
        startAdornment={
          value !== '' && <ThreeDRotationIcon sx={{ marginRight: '12px' }} />
        }
      >
        <MenuItem value="">
          <em>All</em>
        </MenuItem>
        <MenuItem value={'translate'}>Translate</MenuItem>
        <MenuItem value={'rotate'}>Rotate</MenuItem>
        <MenuItem value={'scale'}>Scale</MenuItem>
      </Select>
    </FormControl>
  );
};
const LockedListSelect = ({
  lockedModels,
  setLockedModels,
}: {
  lockedModels: string[];
  setLockedModels: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const { updateModel } = useModelStore();
  // Subscribe to models array to react to undo/redo changes
  const models = useModelStore((state) => state.models);
  const previousLockedModels = useRef(lockedModels);
  const handleChange = (event: SelectChangeEvent<typeof lockedModels>) => {
    const {
      target: { value },
    } = event;
    const newLockedModels =
      typeof value === 'string' ? value.split(',') : value;
    // Find models that need to be locked
    const modelsToLock = newLockedModels.filter(
      (model) => !previousLockedModels.current.includes(model)
    );

    // Find models that need to be unlocked
    const modelsToUnlock = previousLockedModels.current.filter(
      (model) => !newLockedModels.includes(model)
    );

    setLockedModels(newLockedModels);

    modelsToLock.forEach(async (model) => {
      updateModel(model, { locked: true });
    });

    modelsToUnlock.forEach(async (model) => {
      updateModel(model, { locked: false });
    });

    previousLockedModels.current = newLockedModels;
    useModelStore.persist.rehydrate();
  };
  const ITEM_HEIGHT = 42;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 150,
      },
    },
  };
  function getStyles(
    name: string,
    lockedModels: readonly string[],
    theme: Theme
  ) {
    return {
      fontWeight: lockedModels.includes(name)
        ? theme.typography.fontWeightMedium
        : theme.typography.fontWeightRegular,
    };
  }
  //TODO: figure out why the dropdown chip does not update when lockedModels is updated
  return (
    <FormControl sx={{ m: 1, width: 200 }}>
      <InputLabel id="demo-multiple-chip-label">Locked Models List</InputLabel>
      <Select
        labelId="demo-multiple-chip-label"
        id="demo-multiple-chip"
        multiple
        value={lockedModels}
        onChange={handleChange}
        input={
          <OutlinedInput id="select-multiple-chip" label="Locked Models List" />
        }
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {models.map((name) => (
          <MenuItem
            key={name.id}
            value={name.id}
            style={getStyles(name.id, lockedModels, darkTheme)}
          >
            {name.id}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
const CameraToggle = ({
  disabled,
  onToggle,
}: {
  disabled: boolean;
  onToggle: () => void;
}) => {
  return (
    <Tooltip title={!disabled ? 'Disable Camera (C)' : 'Enable Camera (C)'} arrow>
      <ToggleButton
        value="Camera Toggle"
        selected={disabled}
        onChange={onToggle}
      >
        <ThreeSixty sx={!disabled ? { fill: 'lightgreen' } : { fill: 'red' }} />
      </ToggleButton>
    </Tooltip>
  );
};

const YAxisToggle = ({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) => {
  return (
    <Tooltip title={!enabled ? 'Enable Y-Axis (Y)' : 'Disable Y-Axis (Y)'} arrow>
      <ToggleButton
        value="Y-axis Toggle"
        selected={enabled}
        onChange={onToggle}
      >
        <ImportExport sx={enabled ? { fill: 'lightgreen' } : { fill: 'red' }} />
      </ToggleButton>
    </Tooltip>
  );
};
const LockToggle = ({
  isLocked,
  onToggle,
}: {
  isLocked: boolean;
  onToggle: () => void;
}) => {
  return (
    <Tooltip title={!isLocked ? 'Lock model' : 'Unlock model'} arrow>
      <ToggleButton value="Lock Toggle" selected={isLocked} onChange={onToggle}>
        {!isLocked ? <LockOpen /> : <Lock />}
      </ToggleButton>
    </Tooltip>
  );
};
interface ListToggleButtonProps {
  open: boolean;
  onClick: () => void;
  icon: any;
  text: string;
  disabled?: boolean;
}

const ListToggleButton = ({
  open,
  onClick,
  icon,
  text,
  disabled,
}: ListToggleButtonProps) => {
  return (
    <ListItemButton
      sx={[
        { minHeight: 48, px: 2.5 },
        open ? { justifyContent: 'initial' } : { justifyContent: 'center' },
      ]}
      onClick={onClick}
      disabled={disabled}
    >
      <ListItemIcon
        sx={[
          { minWidth: 0, justifyContent: 'center' },
          open ? { mr: 3 } : { mr: 'auto' },
        ]}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={text}
        sx={open ? { opacity: 1 } : { opacity: 0 }}
      />
    </ListItemButton>
  );
};
interface HeaderProps {
  transformMode: string;
  setTransformMode: React.Dispatch<React.SetStateAction<string>>;
  disableCamera: boolean;
  setDisableCamera: React.Dispatch<React.SetStateAction<boolean>>;
  enableY: boolean;
  setEnableY: React.Dispatch<React.SetStateAction<boolean>>;
  setContentModal: React.Dispatch<
    React.SetStateAction<'tutorial' | 'share' | 'settings' | null>
  >;
  isSelected: string | null;
  setManualRemove: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAddObjectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleShare: () => void;
  called: boolean;
  handleExport: () => void;
  orbitRef: React.RefObject<OrbitControls | null>;
  lockedModels: string[];
  setLockedModels: React.Dispatch<React.SetStateAction<string[]>>;
  // handleImport: (file: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  transformMode,
  setTransformMode,
  disableCamera,
  setDisableCamera,
  enableY,
  setEnableY,
  setContentModal,
  isSelected,
  setManualRemove,
  setIsAddObjectModalOpen,
  handleShare,
  called,
  handleExport,
  orbitRef,
  lockedModels,
  setLockedModels,
  // handleImport,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  // Auth state and modals
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [glbUploadModalOpen, setGlbUploadModalOpen] = useState(false);

  const { setModels, updateModel, undo, redo, canUndo, canRedo } = useModelStore();

  // Subscribe to models array to react to undo/redo changes
  const models = useModelStore((state) => state.models);
  const model = models.find((m) => m.id === isSelected);

  // Subscribe to store changes to reactively update button states
  const canUndoState = useModelStore((state) => state.canUndo());
  const canRedoState = useModelStore((state) => state.canRedo());

  const handleToggleCamera = () => setDisableCamera(!disableCamera);
  const handleToggleYAxis = () => setEnableY(!enableY);
  const handleToggleLock = () => {
    if (isSelected) updateModel(isSelected, { locked: !model?.locked });
    setLockedModels(
      models.filter((model) => model.locked === true).map((model) => model.id)
    );
  };
  const handleTransformChange = (event: SelectChangeEvent) =>
    setTransformMode(event.target.value);

  // Auth handlers
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
  };

  const handleOpenDashboard = () => {
    handleUserMenuClose();
    setDashboardModalOpen(true);
  };

  const handleOpenPremiumUpgrade = () => {
    setPremiumModalOpen(true);
  };

  const handleOpenGLBUpload = () => {
    setGlbUploadModalOpen(true);
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Undo: Ctrl/Cmd + Z (without Shift)
      if (ctrlOrCmd && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo()) {
          undo();
        }
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      else if (
        (ctrlOrCmd && event.shiftKey && event.key === 'z') ||
        (ctrlOrCmd && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
  // Note: Keyboard shortcuts are now centralized in useKeyboardShortcuts hook in App.tsx

  return (
    <>
      <AppBar position="fixed" open={open}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={() => setOpen(true)}
              edge="start"
              sx={[
                {
                  marginRight: 5,
                },
                open && { display: 'none' },
              ]}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              DESK{' '}
              <Spacer time={4800} spacing={100}>
                SPACER
              </Spacer>
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap="0.5rem">
            <TransformModeSelect
              value={transformMode}
              onChange={handleTransformChange}
            />
            <LockedListSelect
              lockedModels={lockedModels}
              setLockedModels={setLockedModels}
            />
            {isSelected && model && (
              <LockToggle isLocked={model.locked} onToggle={handleToggleLock} />
            )}
            <Tooltip title={canUndoState ? 'Undo (Ctrl+Z)' : 'Nothing to undo'} arrow>
              <span>
                <IconButton disabled={!canUndoState} onClick={() => undo()}>
                  <Undo />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={canRedoState ? 'Redo (Ctrl+Shift+Z)' : 'Nothing to redo'} arrow>
              <span>
                <IconButton disabled={!canRedoState} onClick={() => redo()}>
                  <Redo />
                </IconButton>
              </span>
            </Tooltip>
            <CameraToggle
              disabled={disableCamera}
              onToggle={handleToggleCamera}
            />
            <YAxisToggle enabled={enableY} onToggle={handleToggleYAxis} />
            <Tooltip title={'Reset Camera (Home)'} arrow>
              <IconButton
                onClick={() => {
                  orbitRef.current?.reset();
                }}
              >
                <MissedVideoCall />
              </IconButton>
            </Tooltip>

            <Tooltip title={'Share'} arrow>
              <IconButton disabled={called} onClick={() => handleShare()}>
                <Share />
              </IconButton>
            </Tooltip>
            <Tooltip title={'Help'} arrow>
              <IconButton onClick={() => setContentModal('tutorial')}>
                <Help />
              </IconButton>
            </Tooltip>

            {/* Auth UI */}
            {!isAuthenticated ? (
              <>
                <Button
                  color="inherit"
                  onClick={() => setLoginModalOpen(true)}
                  sx={{ ml: 1 }}
                >
                  Login
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => setSignupModalOpen(true)}
                  sx={{ ml: 1 }}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                {user?.isPremium && (
                  <Chip
                    icon={<WorkspacePremium />}
                    label="Premium"
                    color="primary"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
                <Tooltip title="Account" arrow>
                  <IconButton onClick={handleUserMenuOpen} sx={{ ml: 1 }}>
                    <AccountCircle />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleOpenDashboard}>
                    <ListItemIcon>
                      <Dashboard fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Dashboard</ListItemText>
                  </MenuItem>
                  {!user?.isPremium && (
                    <MenuItem onClick={handleOpenPremiumUpgrade}>
                      <ListItemIcon>
                        <WorkspacePremium fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Upgrade to Premium</ListItemText>
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={() => setOpen(false)}>
            {theme.direction === 'rtl' ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListToggleButton
              open={open}
              onClick={() => setIsAddObjectModalOpen(true)}
              icon={<AddCircleIcon />}
              text="Add object"
            />
          </ListItem>
          {isSelected && (
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListToggleButton
                open={open}
                onClick={() => setManualRemove(true)}
                icon={<RemoveCircleIcon />}
                text="Remove object"
              />
            </ListItem>
          )}
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListToggleButton
              open={open}
              disabled
              onClick={() => {}}
              icon={<LocationOn />}
              text="Change room"
            />
          </ListItem>

          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListToggleButton
              open={open}
              onClick={() => setModels([])}
              icon={<NoMeetingRoom />}
              text="Reset Room"
            />
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListToggleButton
              open={open}
              disabled
              onClick={() => setModels([])}
              icon={<Upload />}
              text="Import Custom File"
            />
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListToggleButton
              open={open}
              onClick={() => handleExport()}
              icon={<Download />}
              text="Download as GLB"
            />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListToggleButton
              open={open}
              onClick={() => setContentModal('settings')}
              icon={<SettingsIcon />}
              text="Settings"
            />
          </ListItem>
        </List>
      </Drawer>

      {/* Auth Modals */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToSignup={() => setSignupModalOpen(true)}
      />
      <SignupModal
        open={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        onSwitchToLogin={() => setLoginModalOpen(true)}
      />
      <UserDashboardModal
        open={dashboardModalOpen}
        onClose={() => setDashboardModalOpen(false)}
        onOpenPremiumUpgrade={handleOpenPremiumUpgrade}
        onOpenGLBUpload={handleOpenGLBUpload}
      />
      <PremiumUpgradeModal
        open={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
      />
      <CustomGLBUploadModal
        open={glbUploadModalOpen}
        onClose={() => setGlbUploadModalOpen(false)}
      />
    </>
  );
};
