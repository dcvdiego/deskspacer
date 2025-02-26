import { styled, Theme, CSSObject, useTheme } from '@mui/material/styles';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';

import MuiDrawer from '@mui/material/Drawer';
import {
  Box,
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
  Select,
  SelectChangeEvent,
  ToggleButton,
  Toolbar,
  Tooltip,
  Typography,
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
} from '@mui/icons-material';
import { useState } from 'react';

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

const CameraToggle = ({
  disabled,
  onToggle,
}: {
  disabled: boolean;
  onToggle: () => void;
}) => {
  return (
    <Tooltip title={!disabled ? 'Disable Camera' : 'Enable Camera'} arrow>
      <span>
        <ToggleButton
          value="Camera Toggle"
          selected={disabled}
          onChange={onToggle}
        >
          <ThreeSixty
            sx={!disabled ? { fill: 'lightgreen' } : { fill: 'red' }}
          />
        </ToggleButton>
      </span>
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
    <Tooltip title={!enabled ? 'Enable Y-Axis' : 'Disable Y-Axis'} arrow>
      <span>
        <ToggleButton
          value="Y-axis Toggle"
          selected={enabled}
          onChange={onToggle}
        >
          <ImportExport
            sx={enabled ? { fill: 'lightgreen' } : { fill: 'red' }}
          />
        </ToggleButton>
      </span>
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
  setContentModal: React.Dispatch<React.SetStateAction<string | null>>;
  isSelected: string | null;
  setManualRemove: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAddObjectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleToggleCamera = () => setDisableCamera(!disableCamera);
  const handleToggleYAxis = () => setEnableY(!enableY);
  const handleTransformChange = (event: SelectChangeEvent) =>
    setTransformMode(event.target.value);
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
            <CameraToggle
              disabled={disableCamera}
              onToggle={handleToggleCamera}
            />
            <YAxisToggle enabled={enableY} onToggle={handleToggleYAxis} />
            <IconButton
              disabled
              // onClick={() => handleShare()}
            >
              <Share />
            </IconButton>
            <IconButton onClick={() => setContentModal('tutorial')}>
              <Help />
            </IconButton>
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
              onClick={() => console.log('toggleRoom')}
              icon={<LocationOn />}
              text="Change room"
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
    </>
  );
};
