/// <reference types="vite-plugin-svgr/client" />
import { Canvas } from '@react-three/fiber';

import DefaultRoom from './components/models/rooms/DefaultRoom';
import { Suspense, useEffect, useRef, useState } from 'react';

import { Container } from './styles/global.styles';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import AddCircleIcon from '@mui/icons-material/AddCircle';

import { SwapHoriz, ContentCopy } from '@mui/icons-material';
import {
  Selection,
  EffectComposer,
  Outline,
} from '@react-three/postprocessing';
import { Autocomplete, Button, Modal, TextField } from '@mui/material';
import {
  Html,
  Loader,
  OrbitControls,
  PerformanceMonitor,
} from '@react-three/drei';
import { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { DrawerHeader, Header } from './components/UI/Header';
import { modelComponents } from './components/models/modelComponentsMapping';
import TransformModel from './components/models/TransformModel';
import PreviewModel from './components/models/PreviewModel';
import { purple } from '@mui/material/colors';
import * as THREE from 'three';
import { useModelStore } from './utils/store';
import { ModelInCanvas } from './types/ModelTypes';
import { Spacer } from './components/UI/Spacer';
import { StyledModal } from './components/UI/Modal';
import { useLazyQuery, useMutation } from '@apollo/client';
import STATES_BY_ID_QUERY from './graphql/state/statesById';
import ADD_STATE_QUERY from './graphql/state/addState';
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
  const { addModel, deleteModel } = useModelStore();
  const [transformMode, setTransformMode] = useState('');

  const [isHovered, setIsHovered] = useState<string | null>(null);

  const [isSelected, setIsSelected] = useState<string | null>(null);
  const [isAddObjectModalOpen, setIsAddObjectModalOpen] =
    useState<boolean>(false);
  const [contentModal, setContentModal] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [manualRemove, setManualRemove] = useState<boolean>(false);
  const [disableCamera, setDisableCamera] = useState<boolean>(false);
  const [dpr, setDpr] = useState(1.5);
  const [enableY, setEnableY] = useState<boolean>(false);

  const [
    getState,
    {
      data: queryStateData,
      loading: queryStateLoading,
      error: queryStateError,
      called: queryStateCalled,
    },
  ] = useLazyQuery(STATES_BY_ID_QUERY);
  const [
    addState,
    {
      data: addStateData,
      loading: addLoading,
      error: addError,
      called: addCalled,
      reset: addReset,
    },
  ] = useMutation(ADD_STATE_QUERY);
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
        selectedCategory === 'displays' ? 30 : 0,
        0
      ),
      rotation: new THREE.Quaternion(0, -0.7071068, 0, 0.7071068),
    });
    await useModelStore.persist.rehydrate();
    if (addCalled) addReset();
    setSelectedModel(null);
    setSelectedCategory(null);
    setIsAddObjectModalOpen(false);
  };
  const handleSwapModel = async (modelName: string) => {
    if (!isSelected) return;

    const model = useModelStore
      .getState()
      .models.find((m) => m.id === isSelected);

    deleteModel(isSelected);
    setIsSelected(null);

    const newId = `${modelName}__${
      useModelStore
        .getState()
        .models.filter((model: ModelInCanvas) => model.name === modelName)
        .length
    }`;
    addModel({
      name: modelName,
      id: newId,
      position: model!.position,
      rotation: model!.rotation,
    });

    await useModelStore.persist.rehydrate();
    if (addCalled) addReset();
    setSelectedModel(null);
    setSelectedCategory(null);
    setIsAddObjectModalOpen(false);
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
      throw new Error(
        `No title found for component: ${Object.keys(component)}`
      );
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
      if (addCalled) addReset();
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
  }, [isSelected, manualRemove, deleteModel, addCalled, addReset]);
  const sortedOptions = options.toSorted((a, b) => {
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
  const fragmentIdentifier = window.location.hash.substring(1);

  useEffect(() => {
    if (fragmentIdentifier.length > 0)
      getState({
        variables: {
          id: fragmentIdentifier,
        },
      });
  }, [fragmentIdentifier, getState]);

  useEffect(() => {
    if (!queryStateCalled) return;
    if (queryStateLoading) return;
    if (queryStateError) return;
    if (queryStateData) {
      useModelStore.setState({
        models: JSON.parse(queryStateData.statesById[0].stateData),
      });
      history.replaceState(
        '',
        document.title,
        window.location.pathname + window.location.search
      );
    }
  }, [queryStateData, queryStateLoading, queryStateError, queryStateCalled]);

  const handleShare = () => {
    addState({
      variables: {
        input: {
          sharedState: JSON.stringify(useModelStore.getState().models),
        },
      },
    });

    setContentModal('share');
  };

  // const DefaultRoomRef = useRef<THREE.Mesh>(null);

  // const boundsA = new THREE.Box3();
  // if (DefaultRoomRef.current) boundsA.setFromObject(DefaultRoomRef.current);
  // const StyledTransformModel = styled(TransformModel)`
  //   .annotations:after {
  //     content: 'm';
  //   }
  // `;

  // users should also have an option to save the scene as a glb
  // things to add to a potential context: transformMode, setTransformMode, isSelected, enableY, addCalled it removes 10 lines of code but adding context adds way more
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Header
          transformMode={transformMode}
          setTransformMode={setTransformMode}
          disableCamera={disableCamera}
          setDisableCamera={setDisableCamera}
          enableY={enableY}
          setEnableY={setEnableY}
          setContentModal={setContentModal}
          isSelected={isSelected}
          setManualRemove={setManualRemove}
          setIsAddObjectModalOpen={setIsAddObjectModalOpen}
          handleShare={handleShare}
          called={addCalled}
        />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <DrawerHeader />
          <Modal
            keepMounted
            open={isAddObjectModalOpen}
            onClose={() => setIsAddObjectModalOpen(false)}
            aria-labelledby="keep-mounted-modal-title"
            aria-describedby="keep-mounted-modal-description"
          >
            <StyledModal>
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
                style={{ width: '500px', height: '500px' }}
              >
                <ambientLight />
                <Html
                  as="div"
                  style={{
                    display: 'flex',
                    left: '-14rem',
                    gap: '20rem',
                  }}
                >
                  <ThemeProvider theme={darkTheme}>
                    {ModelPreview && (
                      <>
                        <IconButton>
                          <AddCircleIcon
                            onClick={() =>
                              selectedModel && handleAddModel(selectedModel)
                            }
                            fontSize="large"
                          />
                        </IconButton>
                        {isSelected && (
                          <IconButton>
                            <SwapHoriz
                              onClick={() =>
                                selectedModel && handleSwapModel(selectedModel)
                              }
                              fontSize="large"
                            />
                          </IconButton>
                        )}
                      </>
                    )}
                  </ThemeProvider>
                </Html>
                {ModelPreview && (
                  <PreviewModel cacheKey={selectedModel}>
                    <ModelPreview />
                  </PreviewModel>
                )}
              </Canvas>
            </StyledModal>
          </Modal>
          <Modal
            keepMounted
            open={typeof contentModal === 'string'}
            onClose={() => setContentModal(null)}
            aria-labelledby="keep-mounted-modal-title"
            aria-describedby="keep-mounted-modal-description"
          >
            <StyledModal>
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
              ) : contentModal === 'share' ? (
                <>
                  <div>Here is the link, it expires in 15 days:</div>
                  <div>
                    <TextField
                      disabled
                      id="outlined-disabled"
                      value={
                        addLoading
                          ? 'Loading'
                          : addError
                          ? 'An error has occurred'
                          : `http://localhost:5173/#${addStateData.addState.sharedState.id}`
                      }
                      slotProps={{
                        htmlInput: {
                          size: addLoading
                            ? undefined
                            : addStateData.addState.sharedState.id.length + 14,
                        },
                      }}
                    />
                    <IconButton
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `http://localhost:5173/#${addStateData.addState.sharedState.id}`
                        )
                      }
                    >
                      <ContentCopy />
                    </IconButton>
                  </div>
                </>
              ) : (
                <>
                  <div>Settings</div>
                  <div>These are the settings</div>
                </>
              )}
            </StyledModal>
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
                dpr={dpr}
              >
                <PerformanceMonitor
                  onIncline={() => setDpr(2)}
                  onDecline={() => setDpr(1)}
                />
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
                          setTransformMode={setTransformMode}
                          isHovered={isHovered}
                          setIsHovered={setIsHovered}
                          isSelected={isSelected}
                          setIsSelected={setIsSelected}
                          key={modelName.id}
                          orbit={orbit}
                          // boundsA={boundsA}
                          enableY={enableY}
                          called={addCalled}
                          reset={addReset}
                        >
                          <ModelComponent />
                        </TransformModel>
                      );
                    })}
                </Selection>
                {!disableCamera && <OrbitControls ref={orbit} />}
              </Canvas>
              <Loader />
            </Suspense>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
