import { PivotControls } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
// import { Select as DreiSelect } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useModelStore } from '../../utils/store';
import { positionsAreEqual, quaternionsAreEqual } from '../../utils/utils';
import { useFrame, useThree } from '@react-three/fiber';
import { isTouchDevice } from './utils/general';

const TransformModel = ({ ...props }) => {
  const {
    transformMode,
    setTransformMode,
    isHovered,
    setIsHovered,
    isSelected,
    setIsSelected,
    name,
    orbit,
    children,
    minBoundsZ,
    maxBoundsZ,
    minBoundsX,
    maxBoundsX,
    minBoundsY,
    enableY,
    called,
    reset,
  } = props;
  const { updateModel, saveToHistory } = useModelStore();

  // Subscribe to historyVersion to detect undo/redo without causing constant re-renders
  const historyVersion = useModelStore((state) => state.historyVersion);

  // Get model snapshot (non-reactive) - prevents re-render conflicts during drag
  // Also normalizes position/rotation to THREE.js objects (handles localStorage deserialization)
  const getModel = () => {
    const model = useModelStore.getState().models.find((m) => m.id === name);
    if (!model) return undefined;

    // Ensure position and rotation are proper THREE.js objects, not plain objects from localStorage
    const position =
      model.position instanceof THREE.Vector3
        ? model.position
        : new THREE.Vector3(model.position.x, model.position.y, model.position.z);

    const rotation =
      model.rotation instanceof THREE.Quaternion
        ? model.rotation
        : new THREE.Quaternion(
            model.rotation.x,
            model.rotation.y,
            model.rotation.z,
            model.rotation.w
          );

    return { ...model, position, rotation };
  };

  const [initialized, setInitialized] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [savedPosition, setSavedPosition] = useState<THREE.Vector3>();
  const [drag, setDrag] = useState<boolean>(false);

  // Use ref for drag state to avoid it triggering the sync effect
  const dragRef = useRef<boolean>(false);
  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  const getObjectWithName = (object: any) => {
    if (object.parent === null) return null;
    if (object.name !== '') return object.name;
    return getObjectWithName(object.parent);
  };
  const [oldPosition, setOldPosition] = useState<any>();
  const ModelRef = useRef<THREE.Group<THREE.Object3DEventMap>>(null);
  const GroupRef = useRef<THREE.Group<THREE.Object3DEventMap>>(null);
  const updateModelPosition = () => {
    if (!ModelRef.current) return;
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    ModelRef.current.getWorldPosition(position);
    ModelRef.current.getWorldQuaternion(rotation);
    // Don't save to history here - we save at drag start instead
    updateModel(isSelected, { position, rotation }, false);
  };

  const model = getModel();
  const [minZ, setMinZ] = useState<number>(
    model?.minBoundsZ && model.minBoundsZ > -Infinity
      ? model.minBoundsZ
      : -Infinity
  );
  const [maxZ, setMaxZ] = useState<number>(
    model?.maxBoundsZ && model.maxBoundsZ < Infinity
      ? model.maxBoundsZ
      : Infinity
  );
  const [minX, setMinX] = useState<number>(
    model?.minBoundsX && model.minBoundsX > -Infinity
      ? model.minBoundsX
      : -Infinity
  );
  const [maxX, setMaxX] = useState<number>(
    model?.maxBoundsX && model.maxBoundsX < Infinity
      ? model.maxBoundsX
      : Infinity
  );
  const [minY, setMinY] = useState<number>(
    model?.minBoundsY && model.minBoundsY > -Infinity
      ? model.minBoundsY
      : -Infinity
  );

  // Initialize position/rotation on mount
  useEffect(() => {
    const currentModel = getModel();
    if (currentModel && ModelRef.current && GroupRef.current && !initialized) {
      const savedPosition = currentModel.position;
      setSavedPosition(currentModel.position);
      const savedRotation = currentModel.rotation;
      GroupRef.current.position.set(
        savedPosition.x,
        savedPosition.y,
        savedPosition.z
      );
      GroupRef.current.quaternion.fromArray(
        savedRotation as unknown as number[]
      );
      GroupRef.current.updateMatrixWorld();
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  // Sync 3D object with store changes when historyVersion changes (undo/redo)
  // Trigger re-initialization by resetting the initialized flag
  // This forces the initialization effect to run, which properly sets positions
  useEffect(() => {
    if (!initialized || dragRef.current) return;

    // Reset ModelRef to clear drag offset
    if (ModelRef.current) {
      ModelRef.current.position.set(0, 0, 0);
      ModelRef.current.quaternion.identity();
    }

    // Force re-initialization by setting initialized = false
    // This triggers the initialization effect which properly applies positions from store
    setInitialized(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyVersion]);
  const { camera } = useThree();
  const boundsModel = new THREE.Box3();
  const [offset, setOffset] = useState<[number, number, number]>([0, 0, 0]);

  // Predefined face data with normals and center computation
  const faces = useMemo(
    () => [
      {
        normal: new THREE.Vector3(0, 0, 1),
        computeCenter: (
          bbox: {
            min: { x: number; y: number };
            max: { x: number; y: number; z: number };
          },
          target: { set: (arg0: number, arg1: number, arg2: any) => any }
        ) =>
          target.set(
            (bbox.min.x + bbox.max.x) / 2,
            (bbox.min.y + bbox.max.y) / 2,
            bbox.max.z
          ),
      },
      {
        normal: new THREE.Vector3(0, 0, -1),
        computeCenter: (
          bbox: {
            min: { x: number; y: number; z: number };
            max: { x: number; y: number };
          },
          target: { set: (arg0: number, arg1: number, arg2: any) => any }
        ) =>
          target.set(
            (bbox.min.x + bbox.max.x) / 2,
            (bbox.min.y + bbox.max.y) / 2,
            bbox.min.z
          ),
      },
      {
        normal: new THREE.Vector3(-1, 0, 0),
        computeCenter: (
          bbox: {
            min: { x: number; y: number; z: number };
            max: { y: number; z: number };
          },
          target: { set: (arg0: any, arg1: number, arg2: number) => any }
        ) =>
          target.set(
            bbox.min.x,
            (bbox.min.y + bbox.max.y) / 2,
            (bbox.min.z + bbox.max.z) / 2
          ),
      },
      {
        normal: new THREE.Vector3(1, 0, 0),
        computeCenter: (
          bbox: {
            max: { x: number; y: number; z: number };
            min: { y: number; z: number };
          },
          target: { set: (arg0: any, arg1: number, arg2: number) => any }
        ) =>
          target.set(
            bbox.max.x,
            (bbox.min.y + bbox.max.y) / 2,
            (bbox.min.z + bbox.max.z) / 2
          ),
      },
      {
        normal: new THREE.Vector3(0, 1, 0),
        computeCenter: (
          bbox: {
            min: { x: number; z: number };
            max: { x: number; y: number; z: number };
          },
          target: { set: (arg0: number, arg1: any, arg2: number) => any }
        ) =>
          target.set(
            (bbox.min.x + bbox.max.x) / 2,
            bbox.max.y,
            (bbox.min.z + bbox.max.z) / 2
          ),
      },
      {
        normal: new THREE.Vector3(0, -1, 0),
        computeCenter: (
          bbox: {
            min: { x: number; y: number; z: number };
            max: { x: number; z: number };
          },
          target: { set: (arg0: number, arg1: any, arg2: number) => any }
        ) =>
          target.set(
            (bbox.min.x + bbox.max.x) / 2,
            bbox.min.y,
            (bbox.min.z + bbox.max.z) / 2
          ),
      },
    ],
    []
  );

  // Reusable vectors to avoid garbage collection
  const cameraForward = useMemo(() => new THREE.Vector3(), []);
  const bbox = useMemo(() => new THREE.Box3(), []); // better than BoundsModel because two different logics in updating them
  const componentPosition = useMemo(() => new THREE.Vector3(), []);
  const faceCenter = useMemo(() => new THREE.Vector3(), []);
  const offsetVector = useMemo(() => new THREE.Vector3(), []);
  const offsetRef = useRef<[number, number, number]>([0, 0, 0]);

  useFrame(() => {
    // TODO: improve offset calculations and apply rotations to different faces too?
    if (!ModelRef.current) return;

    // Update bounding box and camera direction
    bbox.setFromObject(ModelRef.current);
    camera.getWorldDirection(cameraForward);

    // Find the closest face
    let maxDot = -Infinity;
    let closestFace = null;
    faces.forEach((face) => {
      const dot = cameraForward.dot(face.normal);
      if (dot > maxDot) {
        maxDot = dot;
        closestFace = face;
      }
    });

    if (closestFace) {
      closestFace.computeCenter(bbox, faceCenter);
      ModelRef.current.getWorldPosition(componentPosition);
      offsetVector.subVectors(faceCenter, componentPosition);

      // Update state only if offset changes significantly
      if (
        Math.abs(offsetVector.x - offsetRef.current[0]) > 0.001 ||
        Math.abs(offsetVector.y - offsetRef.current[1]) > 0.001 ||
        Math.abs(offsetVector.z - offsetRef.current[2]) > 0.001
      ) {
        offsetRef.current = [offsetVector.x, offsetVector.y, offsetVector.z];
        setOffset([...offsetRef.current]);
      }
    }
  });
  // TODO: Investigate bug where you have to drag once outside of collision before collision logic works
  // rotation limits should take in place if in collision, tricky one... calculated per rotation no need to be saved
  const checkForCollision = () => {
    const oldPositionInit = new THREE.Vector3();
    if (!GroupRef.current || !ModelRef.current) return;
    ModelRef.current.getWorldPosition(oldPositionInit);
    setOldPosition(oldPositionInit);
    boundsModel.setFromObject(ModelRef.current);

    if (minBoundsZ.intersectsBox(boundsModel)) {
      setMinZ(oldPosition.z + 0.01);
      updateModel(isSelected, { minBoundsZ: oldPosition.z + 0.01 }, false);
    }
    if (maxBoundsZ.intersectsBox(boundsModel)) {
      setMaxZ(oldPosition.z - 0.01);
      updateModel(isSelected, { maxBoundsZ: oldPosition.z - 0.01 }, false);
    }
    if (minBoundsY.intersectsBox(boundsModel)) {
      setMinY(oldPosition.y + 0.01);
      updateModel(isSelected, { minBoundsY: oldPosition.y + 0.01 }, false);
    }
    if (maxBoundsX.intersectsBox(boundsModel)) {
      setMinX(oldPosition.x - 0.01);
      updateModel(isSelected, { minBoundsX: oldPosition.x - 0.01 }, false);
    }
    if (minBoundsX.intersectsBox(boundsModel)) {
      setMaxX(oldPosition.x + 0.01);
      updateModel(isSelected, { maxBoundsX: oldPosition.x + 0.01 }, false);
    }
    ModelRef.current.updateWorldMatrix(true, true);
  };

  //   use matrix to do a select all and be able to move multiple?
  const objPosition = new THREE.Vector3();
  const objQuaternion = new THREE.Quaternion();

  return (
    // https://github.com/pmndrs/drei/discussions/1495
    // <DreiSelect multiple box onChange={(selected) => console.log(selected)}>
    <Select
      enabled={(isHovered === name || isSelected === name) && !getModel()?.locked}
      name={name}
    >
      <group ref={GroupRef}>
        <PivotControls
          depthTest={false}
          // TODO: offset should match initial position somehow
          scale={150}
          offset={offset}
          fixed
          rotation={[0, Math.PI / 2, 0]}
          disableRotations={!['', 'rotate'].includes(transformMode)}
          disableScaling={!['', 'scale'].includes(transformMode)}
          disableSliders={!['', 'translate'].includes(transformMode)}
          disableAxes={!['', 'translate'].includes(transformMode)}
          activeAxes={[true, enableY, true]}
          onDragStart={() => {
            // Save to history before any changes are made
            saveToHistory();
            setIsRotating(true);
            setDrag(true);
            if (called) reset();
          }}
          onDrag={() => {
            if (orbit.current) orbit.current.enabled = false;

            checkForCollision();
            const currentModel = getModel();
            if (ModelRef.current && currentModel) {
              ModelRef.current.getWorldPosition(objPosition);
              ModelRef.current.getWorldQuaternion(objQuaternion);
              const hasPositionChanged = !positionsAreEqual(
                currentModel.position,
                objPosition
              );
              const hasRotationChanged = !quaternionsAreEqual(
                currentModel.rotation,
                objQuaternion
              );
              //TODO: this makes it difficult to only check if rotation is occurring, maybe instead of quaternions we need euler
              setIsRotating(!hasPositionChanged && hasRotationChanged);
            }
          }}
          onDragEnd={() => {
            setDrag(false);
            setIsRotating(false);
            updateModelPosition();
            if (orbit.current) orbit.current.enabled = true;
          }}
          enabled={isSelected === name && !getModel()?.locked}
          translationLimits={[
            savedPosition
              ? [minX - savedPosition.x, maxX - savedPosition.x]
              : [minX, maxX],
            savedPosition
              ? [minY - savedPosition.y, 100 - savedPosition.y]
              : [minY, 100],
            savedPosition
              ? [minZ - savedPosition.z, maxZ - savedPosition.z]
              : [minZ, maxZ],
          ]}
          annotations
          annotationsClass={isRotating ? undefined : 'annotations'}
        >
          <group
            {...props}
            ref={ModelRef}
            onClick={(e) => {
              const currentModel = getModel();
              setIsSelected(
                isSelected === getObjectWithName(e.object) || currentModel?.locked
                  ? null
                  : getObjectWithName(e.object)
              );
              setTransformMode('');
            }}
            onPointerOver={(e) => setIsHovered(getObjectWithName(e.object))}
            onPointerOut={() => setIsHovered(null)}
            onPointerDown={(e) => {
              if (!drag && isTouchDevice()) {
                const currentModel = getModel();
                setIsSelected(
                  isSelected === getObjectWithName(e.object) || currentModel?.locked
                    ? null
                    : getObjectWithName(e.object)
                );
                setTransformMode('');
              }
            }}
          >
            {children}
          </group>
        </PivotControls>
      </group>
    </Select>
    // </DreiSelect>
  );
};

export default TransformModel;
