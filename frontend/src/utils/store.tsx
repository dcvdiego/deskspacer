import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelInCanvas } from '../types/ModelTypes';
import * as THREE from 'three';

// Helper function to deep clone a model with proper Vector3 and Quaternion cloning
// Handles both THREE.js objects and plain objects (from localStorage deserialization)
const cloneModel = (model: ModelInCanvas): ModelInCanvas => {
  // Check if position is a THREE.Vector3 or plain object from localStorage
  const position =
    model.position instanceof THREE.Vector3
      ? model.position.clone()
      : new THREE.Vector3(model.position.x, model.position.y, model.position.z);

  // Check if rotation is a THREE.Quaternion or plain object from localStorage
  const rotation =
    model.rotation instanceof THREE.Quaternion
      ? model.rotation.clone()
      : new THREE.Quaternion(
          model.rotation.x,
          model.rotation.y,
          model.rotation.z,
          model.rotation.w
        );

  return {
    ...model,
    position,
    rotation,
  };
};

// Helper function to deep clone the entire models array
const cloneModelsArray = (models: ModelInCanvas[]): ModelInCanvas[] =>
  models.map(cloneModel);

interface ModelStore {
  models: ModelInCanvas[];
  // History state
  past: ModelInCanvas[][];
  future: ModelInCanvas[][];
  historyLimit: number;
  historyVersion: number; // Increments on undo/redo to trigger component updates

  // Core model actions
  setModels: (models: ModelInCanvas[], saveHistory?: boolean) => void;
  addModel: (model: ModelInCanvas) => void;
  updateModel: (id: string, model: Partial<ModelInCanvas>, saveHistory?: boolean) => void;
  deleteModel: (id: string) => void;

  // History actions
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set, get) => ({
      models: [],
      past: [],
      future: [],
      historyLimit: 50,
      historyVersion: 0,

      // Save current state to history before making changes
      saveToHistory: () => {
        const { models, past, historyLimit } = get();
        const newPast = [...past, cloneModelsArray(models)];

        // Limit history size to prevent memory issues
        if (newPast.length > historyLimit) {
          newPast.shift();
        }

        set({ past: newPast, future: [] });
      },

      // Undo: move current state to future, restore from past
      undo: () => {
        const { models, past, future, historyVersion } = get();
        if (past.length === 0) return;

        const newPast = [...past];
        const previousState = newPast.pop()!;
        const newFuture = [cloneModelsArray(models), ...future];

        set({
          models: previousState,
          past: newPast,
          future: newFuture,
          historyVersion: historyVersion + 1, // Trigger component updates
        });
      },

      // Redo: move current state to past, restore from future
      redo: () => {
        const { models, past, future, historyVersion } = get();
        if (future.length === 0) return;

        const newFuture = [...future];
        const nextState = newFuture.shift()!;
        const newPast = [...past, cloneModelsArray(models)];

        set({
          models: nextState,
          past: newPast,
          future: newFuture,
          historyVersion: historyVersion + 1, // Trigger component updates
        });
      },

      // Check if undo is available
      canUndo: () => get().past.length > 0,

      // Check if redo is available
      canRedo: () => get().future.length > 0,

      // Clear history (useful when loading a new shared state)
      clearHistory: () => set({ past: [], future: [], historyVersion: 0 }),

      // Set models (used for loading shared states, reset room)
      // saveHistory defaults to true, but can be disabled for initial loads
      setModels: (models: ModelInCanvas[], saveHistory = true) => {
        if (saveHistory && get().models.length > 0) {
          get().saveToHistory();
        }

        // Convert THREE.js objects to plain objects for reliable serialization
        const serializableModels = models.map((model) => ({
          ...model,
          position: model.position instanceof THREE.Vector3
            ? { x: model.position.x, y: model.position.y, z: model.position.z }
            : model.position,
          rotation: model.rotation instanceof THREE.Quaternion
            ? { x: model.rotation.x, y: model.rotation.y, z: model.rotation.z, w: model.rotation.w }
            : model.rotation,
        }));

        set({ models: serializableModels });
      },

      // Add a model (always saves to history)
      addModel: (model: ModelInCanvas) => {
        console.log('[STORE.addModel]', model.name, 'Received rotation:', {
          x: model.rotation.x,
          y: model.rotation.y,
          z: model.rotation.z,
          w: model.rotation.w,
          isQuaternion: model.rotation instanceof THREE.Quaternion
        });

        // Convert THREE.js objects to plain objects for reliable serialization
        const serializableModel: ModelInCanvas = {
          ...model,
          position: model.position instanceof THREE.Vector3
            ? { x: model.position.x, y: model.position.y, z: model.position.z }
            : model.position,
          rotation: model.rotation instanceof THREE.Quaternion
            ? { x: model.rotation.x, y: model.rotation.y, z: model.rotation.z, w: model.rotation.w }
            : model.rotation,
        };

        console.log('[STORE.addModel]', model.name, 'Serialized rotation:', {
          rotation: serializableModel.rotation
        });

        get().saveToHistory();
        set((state: { models: ModelInCanvas[] }) => ({
          models: [...state.models, serializableModel],
        }));
        console.log('[STORE.addModel]', model.name, 'After set, checking store:', {
          rotation: useModelStore.getState().models.find(m => m.id === model.id)?.rotation
        });
      },

      // Update a model
      // saveHistory defaults to true, but can be disabled for intermediate updates
      // (e.g., during collision detection, bounds updates)
      updateModel: (id: string, model: Partial<ModelInCanvas>, saveHistory = true) => {
        if (saveHistory) {
          get().saveToHistory();
        }

        // Convert THREE.js objects to plain objects for reliable serialization
        const serializableUpdate: Partial<ModelInCanvas> = { ...model };
        if (model.position && model.position instanceof THREE.Vector3) {
          serializableUpdate.position = {
            x: model.position.x,
            y: model.position.y,
            z: model.position.z,
          };
        }
        if (model.rotation && model.rotation instanceof THREE.Quaternion) {
          serializableUpdate.rotation = {
            x: model.rotation.x,
            y: model.rotation.y,
            z: model.rotation.z,
            w: model.rotation.w,
          };
        }

        set((state: ModelStore) => ({
          models: state.models.map((m) =>
            m.id === id ? { ...m, ...serializableUpdate } : m
          ),
        }));
      },

      // Delete a model (always saves to history)
      deleteModel: (id: string) => {
        get().saveToHistory();
        set((state: { models: ModelInCanvas[] }) => ({
          models: state.models.filter(
            (model: { id: string }) => model.id !== id
          ),
        }));
      },
    }),
    {
      name: 'model-storage',
      // Don't persist history to avoid storage bloat
      partialize: (state) => ({ models: state.models }),
    }
  )
);
