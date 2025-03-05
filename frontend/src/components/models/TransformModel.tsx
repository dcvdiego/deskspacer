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
    // boundsA,
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

  //   TODO: figure out collision with floor/walls
  // https://codepen.io/boytchev/pen/oNVoQwE and https://discourse.threejs.org/t/how-to-stop-dragging-of-an-object-when-collision-detected/60765/11
  //   const oldPosition = new THREE.Vector3();

  //   const boundsB = new THREE.Box3();
  //   const checkForCollision = () => {
  //     if (!ModelRef.current) return;
  //     ModelRef.current.getWorldPosition(oldPosition);
  //     // ModelRef.current.geometry.computeBoundingBox()
  //     boundsB.setFromObject(ModelRef.current);
  //     if (boundsA.intersectsBox(boundsB)) {
  //       ModelRef.current.position.set(
  //         oldPosition.x,
  //         oldPosition.y,
  //         oldPosition.z
  //       );
  //     } else {
  //       ModelRef.current.getWorldPosition(oldPosition);
  //     }
  //     ModelRef.current.updateWorldMatrix(true, true);
  //   };

  //   use matrix to do a select all and be able to move multiple?
  const objPosition = new THREE.Vector3();
  const objQuaternion = new THREE.Quaternion();

  return (
    // https://github.com/pmndrs/drei/discussions/1495
    // <DreiSelect multiple box onChange={(selected) => console.log(selected)}>
    <Select enabled={isHovered === name || isSelected === name} name={name}>
      <group ref={GroupRef}>
        <PivotControls
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
              setIsRotating(!hasPositionChanged && hasRotationChanged);
            }

            // checkForCollision();
          }}
          onDragEnd={() => {
            setIsRotating(false);
            updateModelPosition();
            if (orbit.current) orbit.current.enabled = true;
          }}
          enabled={isSelected === name}
          translationLimits={[
            undefined,
            [savedPosition ? -savedPosition.y - 0.1 : 0.1, 100],
            undefined,
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
