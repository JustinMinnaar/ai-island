// History Manager for Undo/Redo functionality
import { world } from './world.js';
import { renderer } from './renderer-3d.js';

class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 100;
    }

    record(action) {
        // action: { type, data, undo, redo }
        this.undoStack.push(action);
        this.redoStack = []; // Clear redo stack on new action

        // Limit stack size
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }

        console.log(`📝 Recorded: ${action.type}`);
    }

    recordBatch(actions, batchType) {
        // Batch multiple actions into single undo/redo operation
        if (actions.length === 0) return;

        const batchAction = {
            type: batchType,
            data: { count: actions.length },
            undo: () => {
                // Undo in reverse order
                for (let i = actions.length - 1; i >= 0; i--) {
                    actions[i].undo();
                }
            },
            redo: () => {
                // Redo in forward order
                for (let i = 0; i < actions.length; i++) {
                    actions[i].redo();
                }
            }
        };

        this.record(batchAction);
    }

    undo() {
        if (this.undoStack.length === 0) {
            console.log('⚠️ Nothing to undo');
            return false;
        }

        const action = this.undoStack.pop();
        action.undo();
        this.redoStack.push(action);
        renderer.dirty = true;

        console.log(`↶ Undo: ${action.type}`);
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) {
            console.log('⚠️ Nothing to redo');
            return false;
        }

        const action = this.redoStack.pop();
        action.redo();
        this.undoStack.push(action);
        renderer.dirty = true;

        console.log(`↷ Redo: ${action.type}`);
        return true;
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        console.log('🗑️ History cleared');
    }

    // Helper to create wall action
    createWallAction(x, y, z, direction, data) {
        return {
            type: 'PLACE_WALL',
            data: { x, y, z, direction, ...data },
            undo: () => world.removeWall(x, y, z, direction),
            redo: () => world.setWall(x, y, z, direction, data)
        };
    }

    createWallRemoveAction(x, y, z, direction, data) {
        return {
            type: 'REMOVE_WALL',
            data: { x, y, z, direction, ...data },
            undo: () => world.setWall(x, y, z, direction, data),
            redo: () => world.removeWall(x, y, z, direction)
        };
    }

    // Helper to create door action
    createDoorAction(x, y, z, direction, data) {
        return {
            type: 'PLACE_DOOR',
            data: { x, y, z, direction, ...data },
            undo: () => world.removeDoor(x, y, z, direction),
            redo: () => world.setDoor(x, y, z, direction, data)
        };
    }

    createDoorRemoveAction(x, y, z, direction, data) {
        return {
            type: 'REMOVE_DOOR',
            data: { x, y, z, direction, ...data },
            undo: () => world.setDoor(x, y, z, direction, data),
            redo: () => world.removeDoor(x, y, z, direction)
        };
    }

    // Helper to create floor action
    createFloorAction(x, y, z, data) {
        return {
            type: 'PLACE_FLOOR',
            data: { x, y, z, ...data },
            undo: () => world.removeCell(x, y, z),
            redo: () => world.setCell(x, y, z, data)
        };
    }

    createFloorRemoveAction(x, y, z, data) {
        return {
            type: 'REMOVE_FLOOR',
            data: { x, y, z, ...data },
            undo: () => world.setCell(x, y, z, data),
            redo: () => world.removeCell(x, y, z)
        };
    }
}

export const history = new HistoryManager();
