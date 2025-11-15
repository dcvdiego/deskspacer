import { lazy, ComponentType } from 'react';
import { ModelComponentType } from '../../types/ModelTypes';

// Cache for lazy-loaded components
const componentCache = new Map<string, ComponentType<any>>();

/**
 * Dynamically imports a model component based on its path
 * This enables code splitting for 3D models
 */
export function lazyLoadModel(importPath: string): ModelComponentType {
  if (componentCache.has(importPath)) {
    return componentCache.get(importPath)!;
  }

  const LazyComponent = lazy(() => import(/* @vite-ignore */ `${importPath}`));
  componentCache.set(importPath, LazyComponent);

  return LazyComponent as ModelComponentType;
}

/**
 * Creates a lazy-loaded model component from a relative path
 * Path should be relative to the models directory
 */
export function createLazyModel(relativePath: string): ModelComponentType {
  return lazyLoadModel(`./${relativePath}`);
}
