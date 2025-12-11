
import { CONFIG } from '../config.js';
import { world } from '../world.js';
import { history } from '../history.js';
import { roomManager } from '../room-manager.js';
import { ToolBase } from './tool-base.js';

export class DoorTool extends ToolBase {
    update(endPos, activeColor) {
        this.previewItems = [];
        if (!this.startCell) return;

        // Use edge from startCell if available (clicked on edge)
        const direction = this.startCell.edge || this.getWallDirection(this.startCell, endPos);

        this.previewItems.push({
            type: 'door',
            x: this.startCell.x,
            y: this.startCell.y,
            z: this.startCell.z,
            direction,
            isOpen: false
        });
    }

    finish(endPos, activeColor) {
        if (!this.startCell) return;
        const x = this.startCell.x;
        const y = this.startCell.y;
        const z = this.startCell.z;
        const direction = this.startCell.edge || this.getWallDirection(this.startCell, endPos);

        // 0. Check if door exists -> Cycle Pivot
        const existingDoor = world.getDoor(x, y, z, direction);
        if (existingDoor) {
            // Cycle Pivot: Left -> Right -> Left
            const newPivot = existingDoor.pivot === CONFIG.GAME.DOOR_PIVOT.LEFT
                ? CONFIG.GAME.DOOR_PIVOT.RIGHT
                : CONFIG.GAME.DOOR_PIVOT.LEFT;

            // Toggle Swing? Optional. User just said "cycle pivot".
            // Let's update the door data
            existingDoor.pivot = newPivot;
            world.setDoor(x, y, z, direction, existingDoor);
            // Record modification? or assume tweak?
            // Ideally record a MODIFY_DOOR action. For now, simple update.
            console.log(`🚪 Door Pivot Cycled to ${newPivot}`);

            if (renderer) renderer.markDirty();
            return;
        }

        // 1. Remove existing wall
        const existingWall = world.getWall(x, y, z, direction);
        if (existingWall) {
            console.log(`🚪 Removing existing wall at ${x},${y},${z},${direction} to place door.`);
            world.removeWall(x, y, z, direction);
        } else {
            console.log(`🚪 No existing wall found at ${x},${y},${z},${direction}`);
        }

        // 2. Determine Pivot (Smart Hinge)
        // ... (Smart hinge logic remains same for NEW doors)
        let pivot = CONFIG.GAME.DOOR_PIVOT.LEFT; // Default

        if (direction === CONFIG.GAME.EDGE_DIRECTIONS.NORTH || direction === CONFIG.GAME.EDGE_DIRECTIONS.SOUTH) {
            // Wall runs along X. Check X-1 and X+1.
            const leftNeighbor = !!world.getWall(x - 1, y, z, direction);
            const rightNeighbor = !!world.getWall(x + 1, y, z, direction);
            if (leftNeighbor && !rightNeighbor) pivot = CONFIG.GAME.DOOR_PIVOT.LEFT;
            else if (!leftNeighbor && rightNeighbor) pivot = CONFIG.GAME.DOOR_PIVOT.RIGHT;
        } else {
            // Wall runs along Z. Check Z-1 and Z+1.
            const leftNeighbor = !!world.getWall(x, y, z - 1, direction);
            const rightNeighbor = !!world.getWall(x, y, z + 1, direction);
            if (leftNeighbor && !rightNeighbor) pivot = CONFIG.GAME.DOOR_PIVOT.LEFT;
            else if (!leftNeighbor && rightNeighbor) pivot = CONFIG.GAME.DOOR_PIVOT.RIGHT;
        }

        // 3. Place Door
        const doorData = {
            isOpen: false,
            pivot,
            swing: 'out', // Default swing
            color: activeColor || 0x8b6f47
        };

        // Batch the wall removal and door placement
        const actions = [];
        if (existingWall) {
            actions.push(history.createWallRemoveAction(x, y, z, direction, existingWall));
        }

        world.setDoor(x, y, z, direction, doorData);
        actions.push(history.createDoorAction(x, y, z, direction, doorData));

        history.recordBatch(actions, 'PLACE_DOOR_REPLACE_WALL');
        roomManager.addToRoom(roomManager.selectedRoomId, 'doors', world.getDoorKey(x, y, z, direction));

        console.log(`🚪 Door placed at (${x}, ${y}, ${z}) ${direction} with pivot ${pivot}`);
    }

    getWallDirection(start, end) {
        const dx = end.x - start.x;
        const dz = end.z - start.z;

        if (Math.abs(dx) > Math.abs(dz)) {
            return dx > 0 ? CONFIG.GAME.EDGE_DIRECTIONS.EAST : CONFIG.GAME.EDGE_DIRECTIONS.WEST;
        } else {
            return dz > 0 ? CONFIG.GAME.EDGE_DIRECTIONS.SOUTH : CONFIG.GAME.EDGE_DIRECTIONS.NORTH;
        }
    }
}
