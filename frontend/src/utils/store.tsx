import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelInCanvas } from '../types/ModelTypes';

// Helper function to deep clone a model with proper Vector3 and Quaternion cloning
const cloneModel = (model: ModelInCanvas): ModelInCanvas => ({
  ...model,
  position: model.position.clone(),
  rotation: model.rotation.clone(),
});

// Helper function to deep clone the entire models array
const cloneModelsArray = (models: ModelInCanvas[]): ModelInCanvas[] =>
  models.map(cloneModel);

interface ModelStore {
  models: ModelInCanvas[];
  // History state
  past: ModelInCanvas[][];
  future: ModelInCanvas[][];
  historyLimit: number;

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
        const { models, past, future } = get();
        if (past.length === 0) return;

        const newPast = [...past];
        const previousState = newPast.pop()!;
        const newFuture = [cloneModelsArray(models), ...future];

        set({ models: previousState, past: newPast, future: newFuture });
      },

      // Redo: move current state to past, restore from future
      redo: () => {
        const { models, past, future } = get();
        if (future.length === 0) return;

        const newFuture = [...future];
        const nextState = newFuture.shift()!;
        const newPast = [...past, cloneModelsArray(models)];

        set({ models: nextState, past: newPast, future: newFuture });
      },

      // Check if undo is available
      canUndo: () => get().past.length > 0,

      // Check if redo is available
      canRedo: () => get().future.length > 0,

      // Clear history (useful when loading a new shared state)
      clearHistory: () => set({ past: [], future: [] }),

      // Set models (used for loading shared states, reset room)
      // saveHistory defaults to true, but can be disabled for initial loads
      setModels: (models: ModelInCanvas[], saveHistory = true) => {
        if (saveHistory && get().models.length > 0) {
          get().saveToHistory();
        }
        set({ models });
      },

      // Add a model (always saves to history)
      addModel: (model: ModelInCanvas) => {
        get().saveToHistory();
        set((state: { models: ModelInCanvas[] }) => ({
          models: [...state.models, model],
        }));
      },

      // Update a model
      // saveHistory defaults to true, but can be disabled for intermediate updates
      // (e.g., during collision detection, bounds updates)
      updateModel: (id: string, model: Partial<ModelInCanvas>, saveHistory = true) => {
        if (saveHistory) {
          get().saveToHistory();
        }
        set((state: ModelStore) => ({
          models: state.models.map((m) =>
            m.id === id ? { ...m, ...model } : m
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
