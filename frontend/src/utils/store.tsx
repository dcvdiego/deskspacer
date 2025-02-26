import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelInCanvas } from '../types/ModelTypes';

interface ModelStore {
  models: ModelInCanvas[];
  setModels: (models: ModelInCanvas[]) => void;
  addModel: (model: ModelInCanvas) => void;
  updateModel: (id: string, model: Partial<ModelInCanvas>) => void;
  deleteModel: (id: string) => void;
}
export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      models: [],
      setModels: (models: ModelInCanvas[]) => set({ models }),
      addModel: (model: ModelInCanvas) =>
        set((state: { models: ModelInCanvas[] }) => ({
          models: [...state.models, model],
        })),
      updateModel: (id: string, model: Partial<ModelInCanvas>) =>
        set((state: ModelStore) => ({
          models: state.models.map((m) =>
            m.id === id ? { ...m, ...model } : m
          ),
        })),
      deleteModel: (id: string) =>
        set((state: { models: ModelInCanvas[] }) => ({
          models: state.models.filter(
            (model: { id: string }) => model.id !== id
          ),
        })),
    }),
    {
      name: 'model-storage', // name of the item in the storage (must be unique)
    }
  )
);
