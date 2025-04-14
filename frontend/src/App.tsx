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
  Bounds,
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
import * as streamsaver from 'streamsaver';
import { useModelStore } from './utils/store';
import { ModelInCanvas } from './types/ModelTypes';
import { Spacer } from './components/UI/Spacer';
import { StyledModal } from './components/UI/Modal';
import { useLazyQuery, useMutation } from '@apollo/client';
import STATES_BY_ID_QUERY from './graphql/state/statesById';
import ADD_STATE_QUERY from './graphql/state/addState';
import {
  GLTFExporter,
  // GLTFLoader,
  // DRACOLoader,
} from 'three/examples/jsm/Addons.js';
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
const heightAdjustmentMap: Record<string, number> = {
  standing: 0.25,
  alex: -1.5,
  l_shaped: 0.87,
  regular: 1.08,
  linnmon: 0,
  malm: -1.7,
  output: 0.25,
  // ... other desk types
};
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    exportLoading,
    setExportLoading,
  ] = useState<boolean>(false);
  // const [importedFile, setImportedFile] = useState();
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
    const existingDeskName = useModelStore
      .getState()
      .models.find(
        (model: ModelInCanvas) =>
          modelComponents[model.name]?.category === 'desks'
      )?.name;

    const existingDeskPosition = useModelStore
      .getState()
      .models.find(
        (model: ModelInCanvas) =>
          modelComponents[model.name]?.category === 'desks'
      )?.position;
    // difference between starting position and existingDeskPosition
    const offsetPosition = new THREE.Vector3();
    // const existingDeskRotation = useModelStore
    //   .getState()
    //   .models.find(
    //     (model: ModelInCanvas) =>
    //       modelComponents[model.name]?.category === 'desks'
    //   )?.rotation;
    const initRotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, modelComponents[modelName].initRotationY, 0)
    );
    if (existingDeskName && existingDeskPosition)
      offsetPosition.subVectors(
        existingDeskPosition,
        new THREE.Vector3().fromArray(
          modelComponents[existingDeskName].initPosition
        )
      );
    const heightAdjustment =
      existingDeskName &&
      heightAdjustmentMap[existingDeskName.toLowerCase().split(' ')[0]]
        ? heightAdjustmentMap[existingDeskName.toLowerCase().split(' ')[0]]
        : 0;

    addModel({
      name: modelName,
      id: newId,
      position: new THREE.Vector3(
        modelComponents[modelName].initPosition[0] +
          (existingDeskPosition ? offsetPosition.x : 0),
        modelComponents[modelName].initPosition[1] +
          (existingDeskPosition ? offsetPosition.y + heightAdjustment : 0),
        modelComponents[modelName].initPosition[2] +
          (existingDeskPosition ? offsetPosition.z : 0)
      ),
      rotation:
        // TODO: fix deskRotation
        // existingDeskRotation
        // ? initRotation.multiplyQuaternions(initRotation, existingDeskRotation)
        // :
        initRotation,
      // TODO: change this to Number method
      minBoundsZ: -Infinity,
      maxBoundsZ: Infinity,
      minBoundsX: -Infinity,
      maxBoundsX: Infinity,
      minBoundsY: -Infinity,
      maxBoundsY: Infinity,
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

  const orbitRef = useRef<OrbitControlsType>(null);
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

  const exporter = new GLTFExporter();
  // TODO: old import logic needs to be updated
  // const gltfLoader = new GLTFLoader();
  // const dracoloader = new DRACOLoader();
  // dracoloader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  // gltfLoader.setDRACOLoader(dracoloader);
  // const handleImport = useCallback((file: Blob) => {
  //   const reader = new FileReader();
  //   reader.onabort = () => console.error('file reading was aborted');
  //   reader.onerror = () => console.error('file reading has failed');
  //   reader.onload = async () => {
  //     const buffer = reader.result;
  //     const result = await new Promise((resolve, reject) =>
  //       gltfLoader.parse(buffer!, '', resolve, reject)
  //     );
  //     setImportedFile(result);
  //   };
  //   reader.readAsArrayBuffer(file);
  // }, []);

  const handleExport = () => {
    // TODO: selfhost streamsaver https://github.com/jimmywarting/StreamSaver.js/issues/183
    setExportLoading(true);
    if (sceneRef.current) {
      exporter.parse(
        sceneRef.current,
        (glb) => {
          // Create a blob of the data
          const fileToSave = new Blob([glb as BlobPart], {
            type: 'application/octet-stream',
          });

          // Save the file
          const fileStream = streamsaver.createWriteStream('my-setup.glb', {
            size: fileToSave.size,
          });
          const readableStream = fileToSave.stream();
          if (window.WritableStream && readableStream.pipeTo) {
            return readableStream
              .pipeTo(fileStream)
              .then(() => console.log('done writing'));
          }

          // Write (pipe) manually
          const writer = fileStream.getWriter();
          const reader = readableStream.getReader();
          const pump = async () => {
            const res = await reader.read();
            if (res.done) {
              await writer.close();
            } else {
              await writer.write(res.value);
              await pump();
            }
          };

          pump();
          setExportLoading(false);
        },
        () => console.log('error'),
        { binary: true }
      );
    }
    setExportLoading(false);
  };

  const sceneRef = useRef(null);
  const minBoundsZRef = useRef<THREE.Mesh>(null);
  const maxBoundsZRef = useRef<THREE.Mesh>(null);
  const minBoundsXRef = useRef<THREE.Mesh>(null);
  const maxBoundsXRef = useRef<THREE.Mesh>(null);
  const minBoundsYRef = useRef<THREE.Mesh>(null);

  const minBoundsZ = new THREE.Box3();
  const maxBoundsZ = new THREE.Box3();
  const minBoundsX = new THREE.Box3();
  const maxBoundsX = new THREE.Box3();
  const minBoundsY = new THREE.Box3();
  if (minBoundsZRef.current) minBoundsZ.setFromObject(minBoundsZRef.current);

  if (minBoundsXRef.current) minBoundsX.setFromObject(minBoundsXRef.current);
  if (minBoundsYRef.current) minBoundsY.setFromObject(minBoundsYRef.current);

  if (maxBoundsZRef.current) maxBoundsZ.setFromObject(maxBoundsZRef.current);
  if (maxBoundsXRef.current) maxBoundsX.setFromObject(maxBoundsXRef.current);
  // const StyledTransformModel = styled(TransformModel)`
  //   .annotations:after {
  //     content: 'm';
  //   }
  // `;

  // things to add to a potential context: transformMode, setTransformMode, isSelected, enableY, addCalled, orbit it removes 10 lines of code but adding context adds way more
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
          handleExport={handleExport}
          orbitRef={orbitRef}
          // handleImport={handleImport}
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
                    groupBy={(option: { title: string; subcategory: string }) =>
                      option.subcategory
                    }
                    getOptionLabel={(option) => option.title}
                    sx={{ width: 300 }}
                    renderInput={(params: any) => (
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
                    onChange={(
                      _event: any,
                      value: {
                        title: React.SetStateAction<string | null>;
                      } | null
                    ) => {
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
                  <Bounds fit clip observe margin={2}>
                    <PreviewModel cacheKey={selectedModel}>
                      <ModelPreview />
                    </PreviewModel>
                  </Bounds>
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
                  <Button onClick={() => setContentModal(null)}>
                    Continue
                  </Button>
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
                            : `${import.meta.env.VITE_WEB_URL}/#${
                                addStateData.addState.sharedState.id
                              }`
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
                          `${import.meta.env.VITE_WEB_URL}/#${
                            addStateData.addState.sharedState.id
                          }`
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
                  position: [165, 138, 230],
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
                <mesh position={[0, 48, -120]} ref={minBoundsZRef}>
                  <boxGeometry args={[200, 155, 105]} />
                  <meshPhongMaterial color="#ff0000" opacity={0} transparent />
                </mesh>
                <mesh position={[0, 48, 125]} ref={maxBoundsZRef}>
                  <boxGeometry args={[200, 155, 105]} />
                  <meshPhongMaterial color="#ff0000" opacity={0} transparent />
                </mesh>
                <mesh position={[148, 48, 0]} ref={maxBoundsXRef}>
                  <boxGeometry args={[100, 155, 150]} />
                  <meshPhongMaterial color="#fbff00" opacity={0} transparent />
                </mesh>
                <mesh position={[-144.2, 48, 0]} ref={minBoundsXRef}>
                  <boxGeometry args={[100, 155, 150]} />
                  <meshPhongMaterial color="#003cff" opacity={0} transparent />
                </mesh>
                <mesh position={[0, -23.5, 0]} ref={minBoundsYRef}>
                  <boxGeometry args={[200, 105, 225]} />
                  <meshPhongMaterial color="#ff0000" opacity={0} transparent />
                </mesh>
                <group ref={sceneRef}>
                  <DefaultRoom position={[0, 28, 0]} />

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
                            orbit={orbitRef}
                            minBoundsZ={minBoundsZ}
                            maxBoundsZ={maxBoundsZ}
                            minBoundsX={minBoundsX}
                            maxBoundsX={maxBoundsX}
                            minBoundsY={minBoundsY}
                            enableY={enableY}
                            called={addCalled}
                            reset={addReset}
                          >
                            <ModelComponent />
                          </TransformModel>
                        );
                      })}
                    {/* {importedFile && (
                      <TransformModel
                        name={'imported'}
                        transformMode={transformMode}
                        setTransformMode={setTransformMode}
                        isHovered={isHovered}
                        setIsHovered={setIsHovered}
                        isSelected={isSelected}
                        setIsSelected={setIsSelected}
                        key={'imported'}
                        orbit={orbit}
                        // boundsA={boundsA}
                        enableY={enableY}
                        called={addCalled}
                        reset={addReset}
                      >
                        <primitive object={importedFile.scene} />
                      </TransformModel>
                    )} */}
                  </Selection>
                </group>

                {!disableCamera && (
                  <OrbitControls
                    ref={orbitRef}
                    // minPolarAngle={Math.PI / 8}
                    maxPolarAngle={Math.PI / 2}
                    maxDistance={400}
                  />
                )}
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
