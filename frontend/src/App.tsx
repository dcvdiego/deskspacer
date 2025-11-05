/// <reference types="vite-plugin-svgr/client" />
import { Canvas } from '@react-three/fiber';

import DefaultRoom from './components/models/rooms/DefaultRoom';
import { Suspense, useEffect, useRef, useState } from 'react';

import { Container } from './styles/global.styles';
import { ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';

import CssBaseline from '@mui/material/CssBaseline';
import {
  Selection,
  EffectComposer,
  Outline,
} from '@react-three/postprocessing';
import { Loader, OrbitControls, PerformanceMonitor } from '@react-three/drei';
import { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { DrawerHeader, Header } from './components/UI/Header';
import { modelComponents } from './components/models/modelComponentsMapping';
import TransformModel from './components/models/TransformModel';
import * as THREE from 'three';
import * as streamsaver from 'streamsaver';
import { useModelStore } from './utils/store';
import { ModelInCanvas } from './types/ModelTypes';
import { useLazyQuery, useMutation } from '@apollo/client';
import STATES_BY_ID_QUERY from './graphql/state/statesById';
import ADD_STATE_QUERY from './graphql/state/addState';
import {
  GLTFExporter,
  // GLTFLoader,
  // DRACOLoader,
} from 'three/examples/jsm/Addons.js';
import { darkTheme } from './styles/theme.styles';
import CollisionBounds from './components/models/utils/CollisionBounds';
import InfoModal from './components/UI/modals/InfoModal';
import AddModal from './components/UI/modals/AddModal';
// import Logo from '../public/logo.svg?react';

function App() {
  const { deleteModel, setModels, clearHistory } = useModelStore();

  const models = useModelStore.getState().models;
  const [transformMode, setTransformMode] = useState('');

  const [isHovered, setIsHovered] = useState<string | null>(null);

  const [isSelected, setIsSelected] = useState<string | null>(null);
  const [isAddObjectModalOpen, setIsAddObjectModalOpen] =
    useState<boolean>(false);
  const [contentModal, setContentModal] = useState<
    'tutorial' | 'share' | 'settings' | null
  >(null);
  const [manualRemove, setManualRemove] = useState<boolean>(false);
  const [disableCamera, setDisableCamera] = useState<boolean>(false);
  const [dpr, setDpr] = useState(1.5);
  const [enableY, setEnableY] = useState<boolean>(false);
  const [lockedModels, setLockedModels] = useState<string[]>(
    models
      ? models.filter((model) => model.locked === true).map((model) => model.id)
      : []
  );
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
  const orbitRef = useRef<OrbitControlsType>(null);
  const sceneRef = useRef(null);
  const minBoundsZRef = useRef<THREE.Mesh>(null);
  const maxBoundsZRef = useRef<THREE.Mesh>(null);
  const minBoundsXRef = useRef<THREE.Mesh>(null);
  const maxBoundsXRef = useRef<THREE.Mesh>(null);
  const minBoundsYRef = useRef<THREE.Mesh>(null);

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
      // Load shared state without saving to history and clear existing history
      setModels(JSON.parse(queryStateData.statesById[0].stateData), false);
      clearHistory();
      history.replaceState(
        '',
        document.title,
        window.location.pathname + window.location.search
      );
    }
  }, [queryStateData, queryStateLoading, queryStateError, queryStateCalled, setModels, clearHistory]);

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
  const infoModalShareData = {
    loading: addLoading,
    error: !!addError,
    url: addStateData?.addState?.sharedState?.id
      ? `${import.meta.env.VITE_WEB_URL}/#${
          addStateData.addState.sharedState.id
        }`
      : null,
  };
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
          lockedModels={lockedModels}
          setLockedModels={setLockedModels}
          // handleImport={handleImport}
        />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <DrawerHeader />
          <AddModal
            addCalled={addCalled}
            addReset={addReset}
            isAddObjectModalOpen={isAddObjectModalOpen}
            setIsAddObjectModalOpen={setIsAddObjectModalOpen}
            isSelected={isSelected}
            setIsSelected={setIsSelected}
          />
          <InfoModal
            modalType={contentModal}
            onClose={() => setContentModal(null)}
            shareData={infoModalShareData}
          />
          <Container style={{ paddingTop: 0 }}>
            <Suspense>
              <Canvas
                frameloop="demand"
                camera={{
                  fov: 50,
                  position: [165, 138, 230],
                }}
                style={{
                  height: '100vh',
                  width: '100%',
                  overflowX: 'hidden',
                }}
                dpr={dpr}
                onClick={() => isSelected && !isHovered && setIsSelected(null)}
              >
                <PerformanceMonitor
                  onIncline={() => setDpr(2)}
                  onDecline={() => setDpr(1)}
                />
                <ambientLight />
                <CollisionBounds
                  minBoundsZRef={minBoundsZRef}
                  maxBoundsZRef={maxBoundsZRef}
                  maxBoundsXRef={maxBoundsXRef}
                  minBoundsXRef={minBoundsXRef}
                  minBoundsYRef={minBoundsYRef}
                />
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
