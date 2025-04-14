import { PivotControls } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
// import { Select as DreiSelect } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useModelStore } from '../../utils/store';
import { positionsAreEqual, quaternionsAreEqual } from '../../utils/utils';

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
  const { updateModel } = useModelStore();
  const [initialized, setInitialized] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [savedPosition, setSavedPosition] = useState<THREE.Vector3>();
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
    updateModel(isSelected, { position, rotation });
  };

  const model = useModelStore.getState().models.find((m) => m.id === name);
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
  useEffect(() => {
    if (model && ModelRef.current && GroupRef.current && !initialized) {
      const savedPosition = model.position;
      setSavedPosition(model.position);
      const savedRotation = model.rotation;
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
  }, [ModelRef, model, initialized, GroupRef]);

  const boundsModel = new THREE.Box3();
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
      updateModel(isSelected, { minBoundsZ: oldPosition.z + 0.01 });
    }
    if (maxBoundsZ.intersectsBox(boundsModel)) {
      setMaxZ(oldPosition.z - 0.01);
      updateModel(isSelected, { maxBoundsZ: oldPosition.z - 0.01 });
    }
    if (minBoundsY.intersectsBox(boundsModel)) {
      setMinY(oldPosition.y + 0.01);
      updateModel(isSelected, { minBoundsY: oldPosition.y + 0.01 });
    }
    if (maxBoundsX.intersectsBox(boundsModel)) {
      setMinX(oldPosition.x - 0.01);
      updateModel(isSelected, { minBoundsX: oldPosition.x - 0.01 });
    }
    if (minBoundsX.intersectsBox(boundsModel)) {
      setMaxX(oldPosition.x + 0.01);
      updateModel(isSelected, { maxBoundsX: oldPosition.x + 0.01 });
    }
    ModelRef.current.updateWorldMatrix(true, true);
  };

  //   use matrix to do a select all and be able to move multiple?
  const objPosition = new THREE.Vector3();
  const objQuaternion = new THREE.Quaternion();

  return (
    // https://github.com/pmndrs/drei/discussions/1495
    // <DreiSelect multiple box onChange={(selected) => console.log(selected)}>
    <Select enabled={isHovered === name || isSelected === name} name={name}>
      <group ref={GroupRef}>
        <PivotControls
          depthTest={false}
          // TODO: offset should match initial position somehow, scale could be calculated too-ish
          scale={25}
          offset={[0, 20, 0]}
          rotation={[0, Math.PI / 2, 0]}
          disableRotations={!['', 'rotate'].includes(transformMode)}
          disableScaling={!['', 'scale'].includes(transformMode)}
          disableSliders={!['', 'translate'].includes(transformMode)}
          disableAxes={!['', 'translate'].includes(transformMode)}
          activeAxes={[true, enableY, true]}
          onDragStart={() => {
            setIsRotating(true);
            if (called) reset();
          }}
          onDrag={() => {
            if (orbit.current) orbit.current.enabled = false;

            checkForCollision();
            if (ModelRef.current && model) {
              ModelRef.current.getWorldPosition(objPosition);
              ModelRef.current.getWorldQuaternion(objQuaternion);
              const hasPositionChanged = !positionsAreEqual(
                model?.position,
                objPosition
              );
              const hasRotationChanged = !quaternionsAreEqual(
                model?.rotation,
                objQuaternion
              );
              //TODO: this makes it difficult to only check if rotation is occurring, maybe instead of quaternions we need euler
              setIsRotating(!hasPositionChanged && hasRotationChanged);
            }
          }}
          onDragEnd={() => {
            setIsRotating(false);
            updateModelPosition();
            if (orbit.current) orbit.current.enabled = true;
          }}
          enabled={isSelected === name}
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
              setIsSelected(
                isSelected === getObjectWithName(e.object)
                  ? null
                  : getObjectWithName(e.object)
              );
              setTransformMode('');
            }}
            onPointerOver={(e) => setIsHovered(getObjectWithName(e.object))}
            onPointerOut={() => setIsHovered(null)}
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
