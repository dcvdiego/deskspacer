import {
  Autocomplete,
  Button,
  IconButton,
  Modal,
  TextField,
  ThemeProvider,
} from '@mui/material';
import React, { useState } from 'react';
import { StyledModal } from '../../../styles/Modal.styles';
import { useModelStore } from '../../../utils/store';
import { modelComponents } from '../../models/modelComponentsMapping';
import { ModelInCanvas } from '../../../types/ModelTypes';

import * as THREE from 'three';
import { heightAdjustmentMap } from '../../../utils/constants';
import { Canvas } from '@react-three/fiber';
import { Bounds, Html } from '@react-three/drei';
import { darkTheme } from '../../../styles/theme.styles';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import { SwapHoriz } from '@mui/icons-material';
import PreviewModel from '../../models/PreviewModel';

interface AddModalProps {
  addCalled: boolean;
  addReset: () => void;
  isAddObjectModalOpen: boolean;
  setIsAddObjectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSelected: string | null;
  setIsSelected: React.Dispatch<React.SetStateAction<string | null>>;
}

const AddModal = ({
  addCalled,
  addReset,
  isAddObjectModalOpen,
  setIsAddObjectModalOpen,
  isSelected,
  setIsSelected,
}: AddModalProps) => {
  const { addModel, deleteModel } = useModelStore();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
  const sortedOptions = options.toSorted((a, b) => {
    if (a.subcategory !== b.subcategory) {
      return a.subcategory.localeCompare(b.subcategory);
    } else {
      return a.title.localeCompare(b.title);
    }
  });
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
      minBoundsZ: -Infinity,
      maxBoundsZ: Infinity,
      minBoundsX: -Infinity,
      maxBoundsX: Infinity,
      minBoundsY: -Infinity,
      maxBoundsY: Infinity,
      locked: false,
    });
    await useModelStore.persist.rehydrate();
    if (addCalled) addReset();
    setSelectedModel(null);
    setSelectedCategory(null);
    setIsAddObjectModalOpen(false);
  };
  const handleSwapModel = async (modelName: string) => {
    // TODO: utilize handleAdd logic inside of this, maybe add a are u sure u want to swap models from different categories
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
      locked: false,
    });

    await useModelStore.persist.rehydrate();
    if (addCalled) addReset();
    setSelectedModel(null);
    setSelectedCategory(null);
    setIsAddObjectModalOpen(false);
  };

  return (
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
  );
};

export default AddModal;
