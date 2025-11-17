import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from './useKeyboardShortcuts';
import { useModelStore } from '../utils/store';
import * as THREE from 'three';
import { ModelInCanvas } from '../types/ModelTypes';

describe('useKeyboardShortcuts', () => {
  let mockDeleteModel: ReturnType<typeof vi.fn>;
  let mockSetTransformMode: ReturnType<typeof vi.fn>;
  let mockSetIsAddObjectModalOpen: ReturnType<typeof vi.fn>;
  let mockSetShowHelp: ReturnType<typeof vi.fn>;
  let mockSetHideUI: ReturnType<typeof vi.fn>;
  let mockSetIsSelected: ReturnType<typeof vi.fn>;
  let mockSetDisableCamera: ReturnType<typeof vi.fn>;
  let mockSetEnableY: ReturnType<typeof vi.fn>;
  let mockResetCamera: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear the store before each test
    useModelStore.setState({
      models: [],
      past: [],
      future: [],
      historyVersion: 0,
    });

    // Create mock functions
    mockDeleteModel = vi.fn();
    mockSetTransformMode = vi.fn();
    mockSetIsAddObjectModalOpen = vi.fn();
    mockSetShowHelp = vi.fn();
    mockSetHideUI = vi.fn();
    mockSetIsSelected = vi.fn();
    mockSetDisableCamera = vi.fn();
    mockSetEnableY = vi.fn();
    mockResetCamera = vi.fn();
  });

  const setupHook = (
    isSelected: string | null = null,
    disableCamera = false,
    enableY = false
  ) => {
    return renderHook(() =>
      useKeyboardShortcuts({
        isSelected,
        setIsSelected: mockSetIsSelected,
        deleteModel: mockDeleteModel,
        setTransformMode: mockSetTransformMode,
        setIsAddObjectModalOpen: mockSetIsAddObjectModalOpen,
        setShowHelp: mockSetShowHelp,
        setHideUI: mockSetHideUI,
        setDisableCamera: mockSetDisableCamera,
        disableCamera,
        setEnableY: mockSetEnableY,
        enableY,
        resetCamera: mockResetCamera,
      })
    );
  };

  const createKeyboardEvent = (
    key: string,
    options: Partial<KeyboardEvent> = {}
  ): KeyboardEvent => {
    return new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
  };

  describe('Undo/Redo shortcuts', () => {
    it('should trigger undo on Ctrl+Z', () => {
      const testModel: ModelInCanvas = {
        name: 'Test',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      // Add model and save to history
      useModelStore.getState().addModel(testModel);
      useModelStore.getState().saveToHistory();
      useModelStore.getState().deleteModel('test-1');

      expect(useModelStore.getState().models).toHaveLength(0);
      expect(useModelStore.getState().canUndo()).toBe(true);

      setupHook();

      const event = createKeyboardEvent('z', { ctrlKey: true });
      act(() => {
        window.dispatchEvent(event);
      });

      expect(useModelStore.getState().models).toHaveLength(1);
    });

    it('should trigger redo on Ctrl+Y', () => {
      const testModel: ModelInCanvas = {
        name: 'Test',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(testModel);
      useModelStore.getState().saveToHistory();
      useModelStore.getState().deleteModel('test-1');
      useModelStore.getState().undo();

      expect(useModelStore.getState().canRedo()).toBe(true);

      setupHook();

      const event = createKeyboardEvent('y', { ctrlKey: true });
      act(() => {
        window.dispatchEvent(event);
      });

      expect(useModelStore.getState().models).toHaveLength(0);
    });

    it('should trigger redo on Ctrl+Shift+Z', () => {
      const testModel: ModelInCanvas = {
        name: 'Test',
        id: 'test-1',
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Quaternion(0, 0, 0, 1),
        locked: false,
      };

      useModelStore.getState().addModel(testModel);
      useModelStore.getState().saveToHistory();
      useModelStore.getState().deleteModel('test-1');
      useModelStore.getState().undo();

      expect(useModelStore.getState().canRedo()).toBe(true);

      setupHook();

      const event = createKeyboardEvent('z', { ctrlKey: true, shiftKey: true });
      act(() => {
        window.dispatchEvent(event);
      });

      expect(useModelStore.getState().models).toHaveLength(0);
    });

    it('should not undo when canUndo is false', () => {
      setupHook();

      expect(useModelStore.getState().canUndo()).toBe(false);

      const event = createKeyboardEvent('z', { ctrlKey: true });
      window.dispatchEvent(event);

      // Should still be false since nothing to undo
      expect(useModelStore.getState().canUndo()).toBe(false);
    });

    it('should not redo when canRedo is false', () => {
      setupHook();

      expect(useModelStore.getState().canRedo()).toBe(false);

      const event = createKeyboardEvent('y', { ctrlKey: true });
      window.dispatchEvent(event);

      // Should still be false since nothing to redo
      expect(useModelStore.getState().canRedo()).toBe(false);
    });
  });

  describe('Delete shortcuts', () => {
    it('should call deleteModel on Delete key when model is selected', () => {
      setupHook('test-model-1');

      const event = createKeyboardEvent('Delete');
      window.dispatchEvent(event);

      expect(mockDeleteModel).toHaveBeenCalledWith('test-model-1');
    });

    it('should call deleteModel on Backspace key when model is selected', () => {
      setupHook('test-model-1');

      const event = createKeyboardEvent('Backspace');
      window.dispatchEvent(event);

      expect(mockDeleteModel).toHaveBeenCalledWith('test-model-1');
    });

    it('should not delete when no model is selected', () => {
      setupHook(null);

      const event = createKeyboardEvent('Delete');
      window.dispatchEvent(event);

      expect(mockDeleteModel).not.toHaveBeenCalled();
    });
  });

  describe('Transform mode shortcuts', () => {
    it('should set translate mode on G key when model is selected', () => {
      setupHook('test-model-1');

      const event = createKeyboardEvent('g');
      window.dispatchEvent(event);

      expect(mockSetTransformMode).toHaveBeenCalledWith('translate');
    });

    it('should set rotate mode on R key when model is selected', () => {
      setupHook('test-model-1');

      const event = createKeyboardEvent('r');
      window.dispatchEvent(event);

      expect(mockSetTransformMode).toHaveBeenCalledWith('rotate');
    });

    it('should set scale mode on S key when model is selected', () => {
      setupHook('test-model-1');

      const event = createKeyboardEvent('s');
      window.dispatchEvent(event);

      expect(mockSetTransformMode).toHaveBeenCalledWith('scale');
    });

    it('should work with uppercase keys', () => {
      setupHook('test-model-1');

      window.dispatchEvent(createKeyboardEvent('G'));
      expect(mockSetTransformMode).toHaveBeenCalledWith('translate');

      window.dispatchEvent(createKeyboardEvent('R'));
      expect(mockSetTransformMode).toHaveBeenCalledWith('rotate');

      window.dispatchEvent(createKeyboardEvent('S'));
      expect(mockSetTransformMode).toHaveBeenCalledWith('scale');
    });

    it('should not set transform mode when no model is selected', () => {
      setupHook(null);

      window.dispatchEvent(createKeyboardEvent('g'));
      window.dispatchEvent(createKeyboardEvent('r'));
      window.dispatchEvent(createKeyboardEvent('s'));

      expect(mockSetTransformMode).not.toHaveBeenCalled();
    });
  });

  describe('Escape key', () => {
    it('should clear selection on Escape when model is selected', () => {
      setupHook('test-model-1');

      const event = createKeyboardEvent('Escape');
      window.dispatchEvent(event);

      expect(mockSetIsSelected).toHaveBeenCalledWith(null);
      expect(mockSetTransformMode).toHaveBeenCalledWith('');
    });

    it('should close help modal on Escape', () => {
      setupHook();

      const event = createKeyboardEvent('Escape');
      window.dispatchEvent(event);

      expect(mockSetShowHelp).toHaveBeenCalledWith(false);
    });
  });

  describe('Add model shortcut', () => {
    it('should open add object modal on A key', () => {
      setupHook();

      const event = createKeyboardEvent('a');
      window.dispatchEvent(event);

      expect(mockSetIsAddObjectModalOpen).toHaveBeenCalledWith(true);
    });

    it('should work with uppercase A', () => {
      setupHook();

      const event = createKeyboardEvent('A');
      window.dispatchEvent(event);

      expect(mockSetIsAddObjectModalOpen).toHaveBeenCalledWith(true);
    });
  });

  describe('Toggle UI shortcut', () => {
    it('should toggle UI on H key', () => {
      setupHook();

      const event = createKeyboardEvent('h');
      window.dispatchEvent(event);

      expect(mockSetHideUI).toHaveBeenCalledTimes(1);
    });

    it('should work with uppercase H', () => {
      setupHook();

      const event = createKeyboardEvent('H');
      window.dispatchEvent(event);

      expect(mockSetHideUI).toHaveBeenCalledTimes(1);
    });
  });

  describe('Help overlay shortcut', () => {
    it('should show help on ? key', () => {
      setupHook();

      const event = createKeyboardEvent('?', { shiftKey: true });
      window.dispatchEvent(event);

      expect(mockSetShowHelp).toHaveBeenCalledWith(true);
    });

    it('should show help on Shift+/', () => {
      setupHook();

      const event = createKeyboardEvent('/', { shiftKey: true });
      window.dispatchEvent(event);

      expect(mockSetShowHelp).toHaveBeenCalledWith(true);
    });
  });

  describe('Camera controls', () => {
    it('should toggle camera on C key', () => {
      setupHook(null, false, false);

      const event = createKeyboardEvent('c');
      window.dispatchEvent(event);

      expect(mockSetDisableCamera).toHaveBeenCalledWith(true);
    });

    it('should work with uppercase C', () => {
      setupHook(null, true, false);

      const event = createKeyboardEvent('C');
      window.dispatchEvent(event);

      expect(mockSetDisableCamera).toHaveBeenCalledWith(false);
    });

    it('should toggle Y-axis on Y key', () => {
      setupHook(null, false, false);

      const event = createKeyboardEvent('y');
      window.dispatchEvent(event);

      expect(mockSetEnableY).toHaveBeenCalledWith(true);
    });

    it('should work with uppercase Y', () => {
      setupHook(null, false, true);

      const event = createKeyboardEvent('Y');
      window.dispatchEvent(event);

      expect(mockSetEnableY).toHaveBeenCalledWith(false);
    });

    it('should reset camera on Home key', () => {
      setupHook();

      const event = createKeyboardEvent('Home');
      window.dispatchEvent(event);

      expect(mockResetCamera).toHaveBeenCalled();
    });
  });

  describe('Input field handling', () => {
    it('should not trigger shortcuts when typing in input field', () => {
      setupHook('test-model-1');

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 'g',
        bubbles: true,
        cancelable: true,
      });

      Object.defineProperty(event, 'target', {
        value: input,
        writable: false,
      });

      window.dispatchEvent(event);

      expect(mockSetTransformMode).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not trigger shortcuts when typing in textarea', () => {
      setupHook('test-model-1');

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', {
        key: 'g',
        bubbles: true,
        cancelable: true,
      });

      Object.defineProperty(event, 'target', {
        value: textarea,
        writable: false,
      });

      window.dispatchEvent(event);

      expect(mockSetTransformMode).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });
  });

  describe('Event prevention', () => {
    it('should prevent default on keyboard shortcuts', () => {
      setupHook('test-model-1');

      const event = createKeyboardEvent('g');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});

describe('KEYBOARD_SHORTCUTS constant', () => {
  it('should have general shortcuts section', () => {
    expect(KEYBOARD_SHORTCUTS.general).toBeDefined();
    expect(Array.isArray(KEYBOARD_SHORTCUTS.general)).toBe(true);
    expect(KEYBOARD_SHORTCUTS.general.length).toBeGreaterThan(0);
  });

  it('should have editing shortcuts section', () => {
    expect(KEYBOARD_SHORTCUTS.editing).toBeDefined();
    expect(Array.isArray(KEYBOARD_SHORTCUTS.editing)).toBe(true);
    expect(KEYBOARD_SHORTCUTS.editing.length).toBeGreaterThan(0);
  });

  it('should have transform shortcuts section', () => {
    expect(KEYBOARD_SHORTCUTS.transform).toBeDefined();
    expect(Array.isArray(KEYBOARD_SHORTCUTS.transform)).toBe(true);
    expect(KEYBOARD_SHORTCUTS.transform.length).toBeGreaterThan(0);
  });

  it('should have proper structure for shortcuts', () => {
    const allShortcuts = [
      ...KEYBOARD_SHORTCUTS.general,
      ...KEYBOARD_SHORTCUTS.editing,
      ...KEYBOARD_SHORTCUTS.transform,
    ];

    allShortcuts.forEach((shortcut) => {
      expect(shortcut).toHaveProperty('keys');
      expect(shortcut).toHaveProperty('description');
      expect(Array.isArray(shortcut.keys)).toBe(true);
      expect(typeof shortcut.description).toBe('string');
    });
  });
});
