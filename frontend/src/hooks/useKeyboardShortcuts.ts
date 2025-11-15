import { useEffect } from 'react';
import { useModelStore } from '../utils/store';

export interface KeyboardShortcutsConfig {
  isSelected: string | null;
  deleteModel: (id: string) => void;
  setTransformMode: (mode: string) => void;
  setIsAddObjectModalOpen: (open: boolean) => void;
  setShowHelp: (show: boolean) => void;
  setHideUI: (hide: boolean) => void;
}

/**
 * Custom hook to handle all keyboard shortcuts for the DeskSpacer application
 * Centralizes keyboard event handling to avoid conflicts and improve maintainability
 */
export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  const {
    isSelected,
    deleteModel,
    setTransformMode,
    setIsAddObjectModalOpen,
    setShowHelp,
    setHideUI,
  } = config;

  const { undo, redo, canUndo, canRedo } = useModelStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field or textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Undo: Ctrl/Cmd + Z (without Shift)
      if (ctrlOrCmd && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo()) {
          undo();
        }
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if (
        (ctrlOrCmd && event.shiftKey && event.key === 'z') ||
        (ctrlOrCmd && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
        return;
      }

      // Delete: Delete or Backspace key (when model is selected)
      if ((event.key === 'Delete' || event.key === 'Backspace') && isSelected) {
        event.preventDefault();
        deleteModel(isSelected);
        return;
      }

      // Transform modes (only when model is selected)
      if (isSelected) {
        // G = Move (translate)
        if (event.key === 'g' || event.key === 'G') {
          event.preventDefault();
          setTransformMode('translate');
          return;
        }

        // R = Rotate
        if (event.key === 'r' || event.key === 'R') {
          event.preventDefault();
          setTransformMode('rotate');
          return;
        }

        // S = Scale
        if (event.key === 's' || event.key === 'S') {
          event.preventDefault();
          setTransformMode('scale');
          return;
        }

        // Escape = Clear transform mode
        if (event.key === 'Escape') {
          event.preventDefault();
          setTransformMode('');
          return;
        }
      }

      // Add model: A key
      if (event.key === 'a' || event.key === 'A') {
        event.preventDefault();
        setIsAddObjectModalOpen(true);
        return;
      }

      // Toggle UI: H key
      if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        setHideUI((prev) => !prev);
        return;
      }

      // Help overlay: ? key (Shift + /)
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        setShowHelp(true);
        return;
      }

      // Close help: Escape key
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowHelp(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isSelected,
    deleteModel,
    setTransformMode,
    setIsAddObjectModalOpen,
    setShowHelp,
    setHideUI,
    undo,
    redo,
    canUndo,
    canRedo,
  ]);
};

/**
 * Keyboard shortcuts reference for the help overlay
 */
export const KEYBOARD_SHORTCUTS = {
  general: [
    { keys: ['?'], description: 'Show this help overlay' },
    { keys: ['A'], description: 'Add new model' },
    { keys: ['H'], description: 'Toggle UI visibility' },
    { keys: ['Escape'], description: 'Clear selection / Close modals' },
  ],
  editing: [
    { keys: ['Ctrl', 'Z'], description: 'Undo', mac: ['⌘', 'Z'] },
    {
      keys: ['Ctrl', 'Shift', 'Z'],
      description: 'Redo',
      mac: ['⌘', 'Shift', 'Z'],
    },
    { keys: ['Ctrl', 'Y'], description: 'Redo (alternative)', mac: ['⌘', 'Y'] },
    { keys: ['Delete'], description: 'Delete selected model' },
    { keys: ['Backspace'], description: 'Delete selected model' },
  ],
  transform: [
    { keys: ['G'], description: 'Move (translate) selected model' },
    { keys: ['R'], description: 'Rotate selected model' },
    { keys: ['S'], description: 'Scale selected model' },
    { keys: ['Escape'], description: 'Clear transform mode' },
  ],
};
