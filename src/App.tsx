/// <reference types="vite-plugin-svgr/client" />
import { Canvas } from '@react-three/fiber';

import DefaultRoom from './components/models/rooms/DefaultRoom';
import { Suspense, useEffect, useRef } from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useState } from 'react';
import { Container } from './styles/global.styles';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { LocationOn } from '@mui/icons-material';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import {
  Selection,
  EffectComposer,
  Outline,
} from '@react-three/postprocessing';
import {
  Autocomplete,
  Button,
  Modal,
  TextField,
  ToggleButton,
} from '@mui/material';
import { Html, OrbitControls } from '@react-three/drei';
import { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { AppBar, Drawer, DrawerHeader } from './components/UI/Header';
import { modelComponents } from './components/models/modelComponentsMapping';
import TransformModel from './components/models/TransformModel';
import PreviewModel from './components/models/PreviewModel';
import { purple } from '@mui/material/colors';
import styled, { keyframes } from 'styled-components';
import * as THREE from 'three';
import { useModelStore } from './utils/store';
import { ModelInCanvas } from './types/ModelTypes';
// import Logo from '../public/logo.svg?react';
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: purple['500'],
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: 'white',
        },
      },
    },
  },
});

function App() {
  const increaseLetterSpacing = (x: number) => keyframes`
 0% {
    letter-spacing: 0px;
  }
  100% {
    letter-spacing: ${x}px; 
  }

`;
  interface SpacerProps {
    time: number;
    spacing: number;
  }
  const Spacer = styled.b<SpacerProps>`
    animation: ${(props) => increaseLetterSpacing(props.spacing)}
      ${(props) => props.time}s ease forwards;
  `;

  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };
  const { addModel, deleteModel } = useModelStore();
  const [transformMode, setTransformMode] = useState('');

  const handleChange = (event: SelectChangeEvent) => {
    setTransformMode(event.target.value);
  };

  const [isHovered, setIsHovered] = useState<string | null>(null);

  const [isSelected, setIsSelected] = useState<string | null>(null);
  const [isAddObjectModalOpen, setIsAddObjectModalOpen] =
    useState<boolean>(false);
  const [contentModal, setContentModal] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [manualRemove, setManualRemove] = useState<boolean>(false);
  const [previewHover, setPreviewHover] = useState<boolean>(false);
  const [disableCamera, setDisableCamera] = useState<boolean>(false);

  const [enableY, setEnableY] = useState<boolean>(false);
  const handleAddModel = async (modelName: string) => {
    const newId = `${modelName}__${
      useModelStore
        .getState()
        .models.filter((model: ModelInCanvas) => model.name === modelName)
        .length
    }`;
    addModel({
      name: modelName,
      id: newId,
      position: new THREE.Vector3(
        0,
        // selectedCategory === 'displays' ? 30 : 0,
        0,
        0
      ),
      rotation: new THREE.Quaternion(),
      // 0, -0.7071068, 0, 0.7071068
    });
    await useModelStore.persist.rehydrate();
    setSelectedModel(null);
    setSelectedCategory(null);
    setIsAddObjectModalOpen(false);
  };
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };
  const orbit = useRef<OrbitControlsType>(null);
  const ModelPreview = selectedModel
    ? modelComponents[selectedModel].model
    : null;
  const categories = Array.from(
    new Set(
      Object.values(modelComponents).map((component) => component.category)
    )
  );
  const filteredComponents = selectedCategory
    ? Object.values(modelComponents).filter(
        (component) => component.category === selectedCategory
      )
    : [];
  const options = filteredComponents.map((component) => {
    const title = Object.keys(modelComponents).find(
      (key) => modelComponents[key] === component
    );
    if (!title) {
      throw new Error(`No title found for component: ${component}`);
    }
    return {
      title: title,
      subcategory: component.subcategory,
    };
  });
  useEffect(() => {
    if (!isSelected) return;
    const handleModelDelete = () => {
      deleteModel(isSelected);
      setIsSelected(null);
    };
    if (manualRemove) {
      handleModelDelete();
      setManualRemove(false);
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' && isSelected) handleModelDelete();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelected, manualRemove, deleteModel]);
  const sortedOptions = options.sort((a, b) => {
    if (a.subcategory !== b.subcategory) {
      return a.subcategory.localeCompare(b.subcategory);
    } else {
      return a.title.localeCompare(b.title);
    }
  });
  // TODO: Make Logo drawable (currently paths but need strokes)
  // const StyledLogo = styled(Logo)`
  //   width: 35px;
  //   height: 35px;
  //   margin: 0.25rem;
  //   path {
  //     fill: white;

  //     stroke: white;
  //     stroke-width: 15;
  //     stroke-dasharray: 1000;
  //     stroke-dashoffset: 1000;
  //     animation: draw 2s ease-out;
  //   }
  // `;
  // const handleLoad = async () => {
  //   // this will have to be from a backend that generates a unique URL for every config :D
  //   // this means users should also have an option to save the scene as a glb
  //   const fragmentIdentifier = window.location.hash.substring(1);
  //   if (fragmentIdentifier) {
  //     try {
  //       const blob = await fetch(fragmentIdentifier).then((response) =>
  //         response.blob()
  //       );
  //       const json = await blob.text();
  //       const models = JSON.parse(json);
  //       // Update your state with the parsed models
  //       console.log(models, 'model from fragment');
  //       // useModelStore.setState({ models });
  //     } catch (error) {
  //       console.error('Error parsing fragment identifier:', error);
  //     }
  //   }
  // };
  // useEffect(() => {
  //   handleLoad();
  // }, []);
  // const handleShare = () => {
  //   const blob = new Blob([JSON.stringify(useModelStore.getState().models)], {
  //     type: 'application/json',
  //   });
  //   // const fragmentIdentifier = URL.createObjectURL(blob);
  //   console.log(blob, 'blob');
  // };
  // const DefaultRoomRef = useRef<THREE.Mesh>(null);

  // const boundsA = new THREE.Box3();
  // if (DefaultRoomRef.current) boundsA.setFromObject(DefaultRoomRef.current);
  // const StyledTransformModel = styled(TransformModel)`
  //   .annotations:after {
  //     content: 'm';
  //   }
  // `;
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" open={open}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
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
                <Spacer time={2400} spacing={100}>
                  SPACER
                </Spacer>
              </Typography>
            </Box>

            <Box display="flex">
              <FormControl sx={{ m: 1, minWidth: 150 }}>
                <InputLabel id="demo-simple-select-autowidth-label">
                  Transform
                </InputLabel>
                <Select
                  labelId="demo-simple-select-autowidth-label"
                  id="demo-simple-select-autowidth"
                  value={transformMode}
                  onChange={handleChange}
                  autoWidth
                  label="transform-mode"
                  startAdornment={
                    transformMode !== '' && (
                      <ThreeDRotationIcon sx={{ marginRight: '12px' }} />
                    )
                  }
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value={'translate'}>Translate</MenuItem>
                  <MenuItem value={'rotate'}>Rotate</MenuItem>
                  <MenuItem value={'scale'}>Scale</MenuItem>
                </Select>
              </FormControl>

              <Button
                disabled
                // onClick={() => handleShare()}
              >
                Share
              </Button>
              <ToggleButton
                value="Camera Toggle"
                selected={disableCamera}
                onChange={() => setDisableCamera(!disableCamera)}
              >
                {!disableCamera ? 'Disable' : 'Enable'} Camera
              </ToggleButton>
              <ToggleButton
                value="Y-axis Toggle"
                selected={enableY}
                onChange={() => setEnableY(!enableY)}
              >
                {!enableY ? 'Enable' : 'Disable'} Y-Axis
              </ToggleButton>

              <Button onClick={() => setContentModal('tutorial')}>Help</Button>
            </Box>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
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
              <ListItemButton
                sx={[
                  { minHeight: 48, px: 2.5 },
                  open
                    ? { justifyContent: 'initial' }
                    : { justifyContent: 'center' },
                ]}
                onClick={() => setIsAddObjectModalOpen(true)}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: 'center' },
                    open ? { mr: 3 } : { mr: 'auto' },
                  ]}
                >
                  <AddCircleIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Add object"
                  sx={open ? { opacity: 1 } : { opacity: 0 }}
                />
              </ListItemButton>
            </ListItem>
            {isSelected && (
              <ListItem disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  sx={[
                    { minHeight: 48, px: 2.5 },
                    open
                      ? { justifyContent: 'initial' }
                      : { justifyContent: 'center' },
                  ]}
                  onClick={() => setManualRemove(true)}
                >
                  <ListItemIcon
                    sx={[
                      { minWidth: 0, justifyContent: 'center' },
                      open ? { mr: 3 } : { mr: 'auto' },
                    ]}
                  >
                    <RemoveCircleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Remove object"
                    sx={open ? { opacity: 1 } : { opacity: 0 }}
                  />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={[
                  { minHeight: 48, px: 2.5 },
                  open
                    ? { justifyContent: 'initial' }
                    : { justifyContent: 'center' },
                ]}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: 'center' },
                    open ? { mr: 3 } : { mr: 'auto' },
                  ]}
                >
                  <LocationOn />
                </ListItemIcon>
                <ListItemText
                  primary="Change room"
                  sx={open ? { opacity: 1 } : { opacity: 0 }}
                />
              </ListItemButton>
            </ListItem>
          </List>

          <Divider />

          <List>
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={[
                  { minHeight: 48, px: 2.5 },
                  open
                    ? { justifyContent: 'initial' }
                    : { justifyContent: 'center' },
                ]}
                onClick={() => setContentModal('settings')}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: 'center' },
                    open ? { mr: 3 } : { mr: 'auto' },
                  ]}
                >
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Settings"
                  sx={open ? { opacity: 1 } : { opacity: 0 }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <DrawerHeader />
          <Modal
            keepMounted
            open={isAddObjectModalOpen}
            onClose={() => setIsAddObjectModalOpen(false)}
            aria-labelledby="keep-mounted-modal-title"
            aria-describedby="keep-mounted-modal-description"
          >
            <Box sx={modalStyle}>
              {categories.map((category) =>
                selectedCategory === category ? (
                  <Autocomplete
                    key={category}
                    options={sortedOptions}
                    groupBy={(option) => option.subcategory}
                    getOptionLabel={(option) => option.title}
                    sx={{ width: 300 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={`Select a${
                          category.toLowerCase().startsWith('a') ||
                          category.toLowerCase().startsWith('e') ||
                          category.toLowerCase().startsWith('i') ||
                          category.toLowerCase().startsWith('o') ||
                          category.toLowerCase().startsWith('u')
                            ? 'n '
                            : ' '
                        }${category.slice(0, -1)}`}
                      />
                    )}
                    onChange={(_event, value) => {
                      if (value !== null) {
                        setSelectedModel(value.title);
                      } else {
                        setSelectedModel(null);
                      }
                    }}
                  />
                ) : (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() +
                      category.slice(1).replace('-', ' ')}
                  </Button>
                )
              )}
              <Canvas
                camera={{
                  position: [70, 35, 20],
                }}
                onClick={() => selectedModel && handleAddModel(selectedModel)}
                onPointerEnter={() => setPreviewHover(true)}
                onPointerLeave={() => setPreviewHover(false)}
              >
                <ambientLight />
                <Html
                  as="div"
                  style={{
                    pointerEvents: 'none',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {previewHover && ModelPreview && (
                    <AddCircleIcon sx={{}} fontSize="large" />
                  )}
                </Html>
                {ModelPreview && (
                  <PreviewModel cacheKey={selectedModel}>
                    <ModelPreview />
                  </PreviewModel>
                )}
              </Canvas>
            </Box>
          </Modal>
          <Modal
            keepMounted
            open={typeof contentModal === 'string'}
            onClose={() => setContentModal(null)}
            aria-labelledby="keep-mounted-modal-title"
            aria-describedby="keep-mounted-modal-description"
          >
            <Box sx={modalStyle}>
              {contentModal === 'tutorial' ? (
                <>
                  <div>
                    Welcome to{' '}
                    <Typography variant="h6" noWrap component="div">
                      DESK{' '}
                      <Spacer time={24} spacing={5}>
                        SPACER
                      </Spacer>
                    </Typography>
                  </div>
                  <div>
                    The left side menu has everything you need to
                    add/remove/modify your canvas.
                  </div>
                  <div>
                    The top menu has everything you need at a glance while
                    inside the canvas.
                  </div>
                  <div>Have fun</div>
                </>
              ) : (
                <>
                  <div>Settings</div>
                </>
              )}
            </Box>
          </Modal>
          <Container style={{ paddingTop: 0 }}>
            <Suspense>
              <Canvas
                frameloop="demand"
                camera={{
                  fov: 45,
                  position: [165, 110, 230],
                }}
                style={{
                  height: '100vh',
                  width: '100%',
                  overflowX: 'hidden',
                }}
              >
                <ambientLight />

                <DefaultRoom position={[0, -2.5, 0]} />
                <Selection>
                  <EffectComposer multisampling={0} autoClear={false}>
                    <Outline
                      visibleEdgeColor={0xffffff}
                      hiddenEdgeColor={0xffffff}
                      blur
                      width={1000}
                      edgeStrength={100}
                    />
                  </EffectComposer>
                  {useModelStore
                    .getState()
                    .models.map((modelName: ModelInCanvas) => {
                      const ModelComponent =
                        modelComponents[modelName.name].model;
                      return (
                        <TransformModel
                          name={modelName.id}
                          transformMode={transformMode}
                          isHovered={isHovered}
                          setIsHovered={setIsHovered}
                          isSelected={isSelected}
                          setIsSelected={setIsSelected}
                          setTransformMode={setTransformMode}
                          key={modelName.id}
                          orbit={orbit}
                          // boundsA={boundsA}
                          enableY={enableY}
                        >
                          <ModelComponent />
                        </TransformModel>
                      );
                    })}
                </Selection>
                {!disableCamera && <OrbitControls ref={orbit} />}
              </Canvas>
            </Suspense>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
