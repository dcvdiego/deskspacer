import { PivotControls } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useModelStore } from '../../utils/store';
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
  } = props;
  const { updateModel } = useModelStore();
  const [initialized, setInitialized] = useState<boolean>(false);
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
    console.log(position, rotation);
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
  return (
    <Select enabled={isHovered === name || isSelected === name} name={name}>
      <group ref={GroupRef}>
        <PivotControls
          scale={25}
          offset={[0, 20, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          disableRotations={transformMode !== '' && transformMode !== 'rotate'}
          disableScaling={transformMode !== '' && transformMode !== 'scale'}
          disableSliders={transformMode !== '' && transformMode !== 'translate'}
          disableAxes={transformMode !== '' && transformMode !== 'translate'}
          activeAxes={[true, enableY, true]}
          onDrag={() => {
            if (orbit.current) orbit.current.enabled = false;
            // checkForCollision();
          }}
          onDragEnd={() => {
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
          // TODO: do a check if sliders then annotations, else remove it
          annotationsClass="annotations"
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
  );
};

export default TransformModel;
