import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reducer } from '@/hooks/use-toast';
import type { ToasterToast } from '@/hooks/use-toast';

interface State {
  toasts: ToasterToast[];
}

describe('toast reducer', () => {
  let initialState: State;

  beforeEach(() => {
    initialState = { toasts: [] };
  });

  describe('ADD_TOAST', () => {
    it('should add a toast to the beginning of the list', () => {
      const newToast: ToasterToast = {
        id: '1',
        title: 'Test',
        open: true,
      };

      const newState = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      });

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0]).toEqual(newToast);
    });

    it('should respect TOAST_LIMIT (1) by only keeping the newest', () => {
      const state1 = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: { id: '1', title: 'First', open: true },
      });

      expect(state1.toasts).toHaveLength(1);

      const state2 = reducer(state1, {
        type: 'ADD_TOAST',
        toast: { id: '2', title: 'Second', open: true },
      });

      // Only the newest toast should remain due to TOAST_LIMIT=1
      expect(state2.toasts).toHaveLength(1);
      expect(state2.toasts[0].id).toBe('2');
    });
  });

  describe('UPDATE_TOAST', () => {
    it('should update toast by id', () => {
      const stateWithToast: State = {
        toasts: [{ id: '1', title: 'Original', open: true }],
      };

      const newState = reducer(stateWithToast, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      });

      expect(newState.toasts[0].title).toBe('Updated');
    });
  });

  describe('DISMISS_TOAST', () => {
    it('should mark specific toast as open: false', () => {
      const stateWithToast: State = {
        toasts: [{ id: '1', title: 'Test', open: true }],
      };

      const newState = reducer(stateWithToast, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });

      expect(newState.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when toastId is undefined', () => {
      const stateWithToasts: State = {
        toasts: [
          { id: '1', title: 'First', open: true },
          { id: '2', title: 'Second', open: true },
        ],
      };

      const newState = reducer(stateWithToasts, {
        type: 'DISMISS_TOAST',
        toastId: undefined,
      });

      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(false);
    });
  });

  describe('REMOVE_TOAST', () => {
    it('should remove specific toast by id', () => {
      const stateWithToasts: State = {
        toasts: [
          { id: '1', title: 'Keep', open: true },
          { id: '2', title: 'Remove', open: true },
        ],
      };

      const newState = reducer(stateWithToasts, {
        type: 'REMOVE_TOAST',
        toastId: '2',
      });

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe('1');
    });

    it('should remove all toasts when toastId is undefined', () => {
      const stateWithToasts: State = {
        toasts: [
          { id: '1', title: 'First', open: false },
          { id: '2', title: 'Second', open: false },
        ],
      };

      const newState = reducer(stateWithToasts, {
        type: 'REMOVE_TOAST',
        toastId: undefined,
      });

      expect(newState.toasts).toHaveLength(0);
    });

    it('should handle removing from empty state', () => {
      const newState = reducer(initialState, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      });

      expect(newState.toasts).toHaveLength(0);
    });
  });

  describe('Toast lifecycle', () => {
    it('should handle add -> update -> dismiss -> remove sequence', () => {
      let state = initialState;

      // Add
      state = reducer(state, {
        type: 'ADD_TOAST',
        toast: { id: '1', title: 'Message', open: true, description: 'Initial' },
      });
      expect(state.toasts).toHaveLength(1);

      // Update
      state = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', description: 'Updated' },
      });
      expect(state.toasts[0].description).toBe('Updated');

      // Dismiss
      state = reducer(state, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });
      expect(state.toasts[0].open).toBe(false);

      // Remove
      state = reducer(state, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      });
      expect(state.toasts).toHaveLength(0);
    });
  });
});
