import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useModelStore } from './store';
import * as THREE from 'three';
import { ModelInCanvas } from '../types/ModelTypes';

describe('Model Store', () => {
  beforeEach(() => {
    // Clear the store before each test
    useModelStore.setState({ models: [] });

    // Clear localStorage mock
    localStorage.clear();
  });

  describe('setModels', () => {
    it('should set models array', () => {
      const testModels: ModelInCanvas[] = [
        {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        },
      ];

      useModelStore.getState().setModels(testModels);

      expect(useModelStore.getState().models).toHaveLength(1);
      expect(useModelStore.getState().models[0].id).toBe('test-1');
    });

    it('should replace existing models', () => {
      const initialModels: ModelInCanvas[] = [
        {
          name: 'Initial',
          id: 'initial-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        },
      ];

      const newModels: ModelInCanvas[] = [
        {
          name: 'New Model',
          id: 'new-1',
          position: new THREE.Vector3(1, 1, 1),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        },
      ];

      useModelStore.getState().setModels(initialModels);
      expect(useModelStore.getState().models).toHaveLength(1);

      useModelStore.getState().setModels(newModels);
      expect(useModelStore.getState().models).toHaveLength(1);
      expect(useModelStore.getState().models[0].id).toBe('new-1');
    });

    it('should accept empty array', () => {
      const testModels: ModelInCanvas[] = [
        {
          name: 'Test',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        },
      ];

      useModelStore.getState().setModels(testModels);
      expect(useModelStore.getState().models).toHaveLength(1);

      useModelStore.getState().setModels([]);
      expect(useModelStore.getState().models).toHaveLength(0);
    });
  });

  describe('addModel', () => {
    it('should add a model to empty store', () => {
      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position: new THREE.Vector3(5, 10, 15),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model);

      const models = useModelStore.getState().models;
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('test-1');
      expect(models[0].name).toBe('Test Model');
    });

    it('should add multiple models', () => {
      const model1: ModelInCanvas = {
        name: 'Model 1',
        id: 'model-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      const model2: ModelInCanvas = {
        name: 'Model 2',
        id: 'model-2',
        position: new THREE.Vector3(10, 10, 10),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: true,
      };

      useModelStore.getState().addModel(model1);
      useModelStore.getState().addModel(model2);

      const models = useModelStore.getState().models;
      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('model-1');
      expect(models[1].id).toBe('model-2');
      expect(models[1].locked).toBe(true);
    });

    it('should preserve model position and rotation', () => {
      const position = new THREE.Vector3(1.5, 2.5, 3.5);
      const rotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(Math.PI / 4, Math.PI / 2, 0)
      );

      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position,
        rotation,
        locked: false,
      };

      useModelStore.getState().addModel(model);

      const addedModel = useModelStore.getState().models[0];
      expect(addedModel.position).toEqual(position);
      expect(addedModel.rotation.x).toBeCloseTo(rotation.x);
      expect(addedModel.rotation.y).toBeCloseTo(rotation.y);
      expect(addedModel.rotation.z).toBeCloseTo(rotation.z);
      expect(addedModel.rotation.w).toBeCloseTo(rotation.w);
    });

    it('should add model with bounds properties', () => {
      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        minBoundsX: -10,
        maxBoundsX: 10,
        minBoundsY: 0,
        maxBoundsY: 20,
        minBoundsZ: -5,
        maxBoundsZ: 5,
        locked: false,
      };

      useModelStore.getState().addModel(model);

      const addedModel = useModelStore.getState().models[0];
      expect(addedModel.minBoundsX).toBe(-10);
      expect(addedModel.maxBoundsX).toBe(10);
      expect(addedModel.minBoundsY).toBe(0);
      expect(addedModel.maxBoundsY).toBe(20);
      expect(addedModel.minBoundsZ).toBe(-5);
      expect(addedModel.maxBoundsZ).toBe(5);
    });
  });

  describe('updateModel', () => {
    it('should update an existing model', () => {
      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model);

      const newPosition = new THREE.Vector3(10, 20, 30);
      useModelStore.getState().updateModel('test-1', { position: newPosition });

      const updatedModel = useModelStore.getState().models[0];
      expect(updatedModel.position).toEqual(newPosition);
    });

    it('should update only specified properties', () => {
      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position: new THREE.Vector3(5, 5, 5),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model);

      useModelStore.getState().updateModel('test-1', { locked: true });

      const updatedModel = useModelStore.getState().models[0];
      expect(updatedModel.locked).toBe(true);
      expect(updatedModel.position.x).toBe(5);
      expect(updatedModel.name).toBe('Test Model');
    });

    it('should update rotation', () => {
      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model);

      const newRotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(Math.PI / 2, 0, 0)
      );
      useModelStore.getState().updateModel('test-1', { rotation: newRotation });

      const updatedModel = useModelStore.getState().models[0];
      expect(updatedModel.rotation.x).toBeCloseTo(newRotation.x);
      expect(updatedModel.rotation.y).toBeCloseTo(newRotation.y);
      expect(updatedModel.rotation.z).toBeCloseTo(newRotation.z);
      expect(updatedModel.rotation.w).toBeCloseTo(newRotation.w);
    });

    it('should update bounds properties', () => {
      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model);

      useModelStore.getState().updateModel('test-1', {
        minBoundsX: -20,
        maxBoundsX: 20,
        minBoundsY: -10,
        maxBoundsY: 10,
      });

      const updatedModel = useModelStore.getState().models[0];
      expect(updatedModel.minBoundsX).toBe(-20);
      expect(updatedModel.maxBoundsX).toBe(20);
      expect(updatedModel.minBoundsY).toBe(-10);
      expect(updatedModel.maxBoundsY).toBe(10);
    });

    it('should not affect other models when updating one', () => {
      const model1: ModelInCanvas = {
        name: 'Model 1',
        id: 'model-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      const model2: ModelInCanvas = {
        name: 'Model 2',
        id: 'model-2',
        position: new THREE.Vector3(5, 5, 5),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model1);
      useModelStore.getState().addModel(model2);

      useModelStore.getState().updateModel('model-1', { locked: true });

      const models = useModelStore.getState().models;
      expect(models[0].locked).toBe(true);
      expect(models[1].locked).toBe(false);
      expect(models[1].position.x).toBe(5);
    });

    it('should handle non-existent model ID gracefully', () => {
      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model);

      // Try to update a model that doesn't exist
      useModelStore.getState().updateModel('non-existent', { locked: true });

      const models = useModelStore.getState().models;
      expect(models).toHaveLength(1);
      expect(models[0].locked).toBe(false); // Should remain unchanged
    });
  });

  describe('deleteModel', () => {
    it('should delete a model by id', () => {
      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model);
      expect(useModelStore.getState().models).toHaveLength(1);

      useModelStore.getState().deleteModel('test-1');
      expect(useModelStore.getState().models).toHaveLength(0);
    });

    it('should delete only the specified model', () => {
      const model1: ModelInCanvas = {
        name: 'Model 1',
        id: 'model-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      const model2: ModelInCanvas = {
        name: 'Model 2',
        id: 'model-2',
        position: new THREE.Vector3(5, 5, 5),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      const model3: ModelInCanvas = {
        name: 'Model 3',
        id: 'model-3',
        position: new THREE.Vector3(10, 10, 10),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model1);
      useModelStore.getState().addModel(model2);
      useModelStore.getState().addModel(model3);

      useModelStore.getState().deleteModel('model-2');

      const models = useModelStore.getState().models;
      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('model-1');
      expect(models[1].id).toBe('model-3');
    });

    it('should handle deleting non-existent model', () => {
      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model);

      useModelStore.getState().deleteModel('non-existent');

      const models = useModelStore.getState().models;
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('test-1');
    });

    it('should handle deleting from empty store', () => {
      useModelStore.getState().deleteModel('non-existent');
      expect(useModelStore.getState().models).toHaveLength(0);
    });
  });

  describe('persistence', () => {
    it('should persist store to localStorage', async () => {
      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position: new THREE.Vector3(1, 2, 3),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model);

      // Manually trigger persist rehydration
      await useModelStore.persist.rehydrate();

      // Check if localStorage was called (it should contain 'model-storage')
      const stored = localStorage.getItem('model-storage');
      expect(stored).toBeTruthy();
    });

    it('should have correct storage name', () => {
      // The persist config should use 'model-storage' as the key
      expect(useModelStore.persist).toBeDefined();
      // We can verify this by checking that operations write to this key
      const model: ModelInCanvas = {
        name: 'Test',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model);

      // After state change, localStorage should have 'model-storage' key
      const keys = Object.keys(localStorage);
      expect(keys).toContain('model-storage');
    });
  });

  describe('complex operations', () => {
    it('should handle adding, updating, and deleting in sequence', () => {
      const model1: ModelInCanvas = {
        name: 'Model 1',
        id: 'model-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      const model2: ModelInCanvas = {
        name: 'Model 2',
        id: 'model-2',
        position: new THREE.Vector3(5, 5, 5),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      // Add two models
      useModelStore.getState().addModel(model1);
      useModelStore.getState().addModel(model2);
      expect(useModelStore.getState().models).toHaveLength(2);

      // Update first model
      useModelStore.getState().updateModel('model-1', { locked: true });
      expect(useModelStore.getState().models[0].locked).toBe(true);

      // Delete second model
      useModelStore.getState().deleteModel('model-2');
      expect(useModelStore.getState().models).toHaveLength(1);
      expect(useModelStore.getState().models[0].id).toBe('model-1');
    });

    it('should handle multiple updates to same model', () => {
      const model: ModelInCanvas = {
        name: 'Test Model',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(model);

      useModelStore.getState().updateModel('test-1', {
        position: new THREE.Vector3(1, 1, 1),
      });
      useModelStore.getState().updateModel('test-1', {
        locked: true,
      });
      useModelStore.getState().updateModel('test-1', {
        minBoundsX: -10,
        maxBoundsX: 10,
      });

      const updatedModel = useModelStore.getState().models[0];
      expect(updatedModel.position.x).toBe(1);
      expect(updatedModel.locked).toBe(true);
      expect(updatedModel.minBoundsX).toBe(-10);
      expect(updatedModel.maxBoundsX).toBe(10);
    });
  });

  describe('Undo/Redo', () => {
    beforeEach(() => {
      useModelStore.setState({
        models: [],
        past: [],
        future: [],
        historyVersion: 0,
      });
      localStorage.clear();
    });

    describe('Basic undo/redo flow', () => {
      it('should undo adding a model', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(1, 2, 3),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        expect(useModelStore.getState().models).toHaveLength(1);

        useModelStore.getState().undo();
        expect(useModelStore.getState().models).toHaveLength(0);
      });

      it('should redo after undo', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(1, 2, 3),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().undo();
        expect(useModelStore.getState().models).toHaveLength(0);

        useModelStore.getState().redo();
        expect(useModelStore.getState().models).toHaveLength(1);
        expect(useModelStore.getState().models[0].id).toBe('test-1');
      });

      it('should handle multiple undo operations', () => {
        const model1: ModelInCanvas = {
          name: 'Model 1',
          id: 'model-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        const model2: ModelInCanvas = {
          name: 'Model 2',
          id: 'model-2',
          position: new THREE.Vector3(5, 5, 5),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model1);
        useModelStore.getState().addModel(model2);
        expect(useModelStore.getState().models).toHaveLength(2);

        useModelStore.getState().undo();
        expect(useModelStore.getState().models).toHaveLength(1);
        expect(useModelStore.getState().models[0].id).toBe('model-1');

        useModelStore.getState().undo();
        expect(useModelStore.getState().models).toHaveLength(0);
      });

      it('should handle multiple redo operations', () => {
        const model1: ModelInCanvas = {
          name: 'Model 1',
          id: 'model-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        const model2: ModelInCanvas = {
          name: 'Model 2',
          id: 'model-2',
          position: new THREE.Vector3(5, 5, 5),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model1);
        useModelStore.getState().addModel(model2);
        useModelStore.getState().undo();
        useModelStore.getState().undo();

        useModelStore.getState().redo();
        expect(useModelStore.getState().models).toHaveLength(1);
        expect(useModelStore.getState().models[0].id).toBe('model-1');

        useModelStore.getState().redo();
        expect(useModelStore.getState().models).toHaveLength(2);
        expect(useModelStore.getState().models[1].id).toBe('model-2');
      });

      it('should undo model deletion', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(1, 2, 3),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().deleteModel('test-1');
        expect(useModelStore.getState().models).toHaveLength(0);

        useModelStore.getState().undo();
        expect(useModelStore.getState().models).toHaveLength(1);
        expect(useModelStore.getState().models[0].id).toBe('test-1');
      });

      it('should undo model update', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().updateModel('test-1', { locked: true });
        expect(useModelStore.getState().models[0].locked).toBe(true);

        useModelStore.getState().undo();
        expect(useModelStore.getState().models[0].locked).toBe(false);
      });
    });

    describe('canUndo/canRedo states', () => {
      it('should return false for canUndo initially', () => {
        expect(useModelStore.getState().canUndo()).toBe(false);
      });

      it('should return false for canRedo initially', () => {
        expect(useModelStore.getState().canRedo()).toBe(false);
      });

      it('should return true for canUndo after adding a model', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        expect(useModelStore.getState().canUndo()).toBe(true);
      });

      it('should return true for canRedo after undo', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().undo();
        expect(useModelStore.getState().canRedo()).toBe(true);
      });

      it('should return false for canRedo after redo back to current', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().undo();
        useModelStore.getState().redo();
        expect(useModelStore.getState().canRedo()).toBe(false);
      });

      it('should return false for canUndo after undoing all changes', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().undo();
        expect(useModelStore.getState().canUndo()).toBe(false);
      });
    });

    describe('History limit', () => {
      it('should limit history to 50 entries', () => {
        for (let i = 0; i < 52; i++) {
          const model: ModelInCanvas = {
            name: `Model ${i}`,
            id: `model-${i}`,
            position: new THREE.Vector3(i, i, i),
            rotation: new THREE.Quaternion(0, 0, 0, 1),
            locked: false,
          };
          useModelStore.getState().addModel(model);
        }

        const { past } = useModelStore.getState();
        expect(past.length).toBeLessThanOrEqual(50);
      });

      it('should drop oldest history when limit is exceeded', () => {
        for (let i = 0; i < 52; i++) {
          const model: ModelInCanvas = {
            name: `Model ${i}`,
            id: `model-${i}`,
            position: new THREE.Vector3(i, i, i),
            rotation: new THREE.Quaternion(0, 0, 0, 1),
            locked: false,
          };
          useModelStore.getState().addModel(model);
        }

        let undoCount = 0;
        while (useModelStore.getState().canUndo()) {
          useModelStore.getState().undo();
          undoCount++;
        }

        expect(undoCount).toBeLessThanOrEqual(50);
      });
    });

    describe('clearHistory', () => {
      it('should clear past and future', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().undo();
        expect(useModelStore.getState().canUndo()).toBe(false);
        expect(useModelStore.getState().canRedo()).toBe(true);

        useModelStore.getState().clearHistory();
        expect(useModelStore.getState().canUndo()).toBe(false);
        expect(useModelStore.getState().canRedo()).toBe(false);
      });

      it('should reset historyVersion to 0', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().undo();
        expect(useModelStore.getState().historyVersion).toBeGreaterThan(0);

        useModelStore.getState().clearHistory();
        expect(useModelStore.getState().historyVersion).toBe(0);
      });

      it('should not affect current models', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().clearHistory();
        expect(useModelStore.getState().models).toHaveLength(1);
        expect(useModelStore.getState().models[0].id).toBe('test-1');
      });
    });

    describe('historyVersion', () => {
      it('should increment historyVersion on undo', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        const versionBefore = useModelStore.getState().historyVersion;
        useModelStore.getState().undo();
        const versionAfter = useModelStore.getState().historyVersion;
        expect(versionAfter).toBe(versionBefore + 1);
      });

      it('should increment historyVersion on redo', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().undo();
        const versionBefore = useModelStore.getState().historyVersion;
        useModelStore.getState().redo();
        const versionAfter = useModelStore.getState().historyVersion;
        expect(versionAfter).toBe(versionBefore + 1);
      });

      it('should increment historyVersion multiple times', () => {
        const model1: ModelInCanvas = {
          name: 'Model 1',
          id: 'model-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        const model2: ModelInCanvas = {
          name: 'Model 2',
          id: 'model-2',
          position: new THREE.Vector3(5, 5, 5),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model1);
        useModelStore.getState().addModel(model2);

        const initialVersion = useModelStore.getState().historyVersion;
        useModelStore.getState().undo();
        useModelStore.getState().undo();
        useModelStore.getState().redo();
        useModelStore.getState().redo();

        expect(useModelStore.getState().historyVersion).toBe(initialVersion + 4);
      });
    });

    describe('Three.js serialization', () => {
      it('should properly serialize Vector3 in undo', () => {
        const position = new THREE.Vector3(1.5, 2.5, 3.5);
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position,
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().deleteModel('test-1');
        useModelStore.getState().undo();

        const restoredModel = useModelStore.getState().models[0];
        expect(restoredModel.position).toEqual(position);
        expect(typeof restoredModel.position).toBe('object');
      });

      it('should properly serialize Quaternion in undo', () => {
        const rotation = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(Math.PI / 4, Math.PI / 2, 0)
        );
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation,
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().deleteModel('test-1');
        useModelStore.getState().undo();

        const restoredModel = useModelStore.getState().models[0];
        expect(restoredModel.rotation.x).toBeCloseTo(rotation.x);
        expect(restoredModel.rotation.y).toBeCloseTo(rotation.y);
        expect(restoredModel.rotation.z).toBeCloseTo(rotation.z);
        expect(restoredModel.rotation.w).toBeCloseTo(rotation.w);
      });

      it('should properly serialize in redo', () => {
        const position = new THREE.Vector3(7.5, 8.5, 9.5);
        const rotation = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, Math.PI / 3, 0)
        );
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position,
          rotation,
          locked: false,
        };

        useModelStore.getState().addModel(model);
        useModelStore.getState().undo();
        useModelStore.getState().redo();

        const restoredModel = useModelStore.getState().models[0];
        expect(restoredModel.position).toEqual(position);
        expect(restoredModel.rotation.x).toBeCloseTo(rotation.x);
        expect(restoredModel.rotation.y).toBeCloseTo(rotation.y);
        expect(restoredModel.rotation.z).toBeCloseTo(rotation.z);
        expect(restoredModel.rotation.w).toBeCloseTo(rotation.w);
      });
    });

    describe('Edge cases', () => {
      it('should do nothing when undo is called with no history', () => {
        useModelStore.getState().undo();
        expect(useModelStore.getState().models).toHaveLength(0);
        expect(useModelStore.getState().canUndo()).toBe(false);
      });

      it('should do nothing when redo is called with no future', () => {
        useModelStore.getState().redo();
        expect(useModelStore.getState().models).toHaveLength(0);
        expect(useModelStore.getState().canRedo()).toBe(false);
      });

      it('should clear future when new action is performed after undo', () => {
        const model1: ModelInCanvas = {
          name: 'Model 1',
          id: 'model-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        const model2: ModelInCanvas = {
          name: 'Model 2',
          id: 'model-2',
          position: new THREE.Vector3(5, 5, 5),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model1);
        useModelStore.getState().undo();
        expect(useModelStore.getState().canRedo()).toBe(true);

        useModelStore.getState().addModel(model2);
        expect(useModelStore.getState().canRedo()).toBe(false);
      });

      it('should handle undo/redo with empty models array', () => {
        useModelStore.getState().setModels([]);
        useModelStore.getState().undo();
        expect(useModelStore.getState().models).toHaveLength(0);

        useModelStore.getState().redo();
        expect(useModelStore.getState().models).toHaveLength(0);
      });
    });

    describe('Integration with CRUD operations', () => {
      it('should save to history when addModel is called', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        expect(useModelStore.getState().canUndo()).toBe(false);
        useModelStore.getState().addModel(model);
        expect(useModelStore.getState().canUndo()).toBe(true);
      });

      it('should save to history when deleteModel is called', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        const pastLengthBefore = useModelStore.getState().past.length;
        useModelStore.getState().deleteModel('test-1');
        const pastLengthAfter = useModelStore.getState().past.length;
        expect(pastLengthAfter).toBe(pastLengthBefore + 1);
      });

      it('should save to history when updateModel is called with saveHistory=true', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        const pastLengthBefore = useModelStore.getState().past.length;
        useModelStore.getState().updateModel('test-1', { locked: true }, true);
        const pastLengthAfter = useModelStore.getState().past.length;
        expect(pastLengthAfter).toBe(pastLengthBefore + 1);
      });

      it('should not save to history when updateModel is called with saveHistory=false', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().addModel(model);
        const pastLengthBefore = useModelStore.getState().past.length;
        useModelStore.getState().updateModel('test-1', { locked: true }, false);
        const pastLengthAfter = useModelStore.getState().past.length;
        expect(pastLengthAfter).toBe(pastLengthBefore);
      });

      it('should save to history when setModels is called with saveHistory=true and non-empty store', () => {
        const model1: ModelInCanvas = {
          name: 'Model 1',
          id: 'model-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        const model2: ModelInCanvas = {
          name: 'Model 2',
          id: 'model-2',
          position: new THREE.Vector3(5, 5, 5),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        useModelStore.getState().setModels([model1]);
        const pastLengthBefore = useModelStore.getState().past.length;
        useModelStore.getState().setModels([model2], true);
        const pastLengthAfter = useModelStore.getState().past.length;
        expect(pastLengthAfter).toBe(pastLengthBefore + 1);
      });

      it('should not save to history when setModels is called with saveHistory=false', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        const pastLengthBefore = useModelStore.getState().past.length;
        useModelStore.getState().setModels([model], false);
        const pastLengthAfter = useModelStore.getState().past.length;
        expect(pastLengthAfter).toBe(pastLengthBefore);
      });

      it('should not save to history when setModels is called on empty store', () => {
        const model: ModelInCanvas = {
          name: 'Test Model',
          id: 'test-1',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Quaternion(0, 0, 0, 1),
          locked: false,
        };

        expect(useModelStore.getState().models).toHaveLength(0);
        const pastLengthBefore = useModelStore.getState().past.length;
        useModelStore.getState().setModels([model], true);
        const pastLengthAfter = useModelStore.getState().past.length;
        expect(pastLengthAfter).toBe(pastLengthBefore);
      });
    });
  });
});
