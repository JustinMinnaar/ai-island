
import { CONFIG } from '../config.js';
import { world } from '../world.js';
import { history } from '../history.js';
import { roomManager } from '../room-manager.js';
import { ToolBase } from './tool-base.js';

export class WallTool extends ToolBase {
    update(endPos, activeColor, isEraser = false) {
        this.previewItems = [];
        if (!this.startCell) return;

        // Check if we're dragging
        const dx = Math.abs(endPos.x - this.startCell.x);
        const dz = Math.abs(endPos.z - this.startCell.z);
        const isDragging = dx > 0 || dz > 0;

        // Determine Direction Logic
        // ... (reuse existing direction logic or refactor helper)
        let direction = null;
        let x1 = Math.min(this.startCell.x, endPos.x);
        let x2 = Math.max(this.startCell.x, endPos.x);
        let z1 = Math.min(this.startCell.z, endPos.z);
        let z2 = Math.max(this.startCell.z, endPos.z);

        if (this.startCell.edge && !isDragging) {
            // Single edge preview
            this.previewItems.push({
                type: 'wall',
                x: this.startCell.x,
                y: this.startCell.y,
                z: this.startCell.z,
                direction: this.startCell.edge,
                color: isEraser ? 0xFF0000 : activeColor, // Red for eraser
                isGhost: true // Maybe custom flag for eraser style
            });
            return;
        }

        if (!this.lockedDirection && isDragging) {
            this.lockedDirection = dx > dz ? 'horizontal' : 'vertical';
        }

        let isHorizontal = this.lockedDirection === 'horizontal';
        // Fallback if not locked (shouldn't happen often if we lock early)
        if (!this.lockedDirection) isHorizontal = dx > dz;

        if (isHorizontal) {
            const dir = this.lockedEdge || (endPos.z > this.startCell.z ? CONFIG.GAME.EDGE_DIRECTIONS.SOUTH : CONFIG.GAME.EDGE_DIRECTIONS.NORTH);
            for (let x = x1; x <= x2; x++) {
                this.previewItems.push({
                    type: 'wall',
                    x, y: this.startCell.y, z: this.startCell.z,
                    direction: dir,
                    color: isEraser ? 0xFF0000 : activeColor
                });
            }
        } else {
            const dir = this.lockedEdge || (endPos.x > this.startCell.x ? CONFIG.GAME.EDGE_DIRECTIONS.EAST : CONFIG.GAME.EDGE_DIRECTIONS.WEST);
            for (let z = z1; z <= z2; z++) {
                this.previewItems.push({
                    type: 'wall',
                    x: this.startCell.x, y: this.startCell.y, z,
                    direction: dir,
                    color: isEraser ? 0xFF0000 : activeColor
                });
            }
        }
    }

    finish(endPos, activeColor, isEraser = false) {
        if (!this.startCell) return;

        // Same geometry logic as update
        let x1 = Math.min(this.startCell.x, endPos.x);
        let x2 = Math.max(this.startCell.x, endPos.x);
        let z1 = Math.min(this.startCell.z, endPos.z);
        let z2 = Math.max(this.startCell.z, endPos.z);

        const dx = Math.abs(x2 - x1);
        const dz = Math.abs(z2 - z1);

        let isHorizontal = this.lockedDirection ? this.lockedDirection === 'horizontal' : dx > dz;
        const actions = [];
        const wallData = { color: activeColor };

        // Determine specific edge direction based on drag or lock
        let direction;
        if (isHorizontal) {
            direction = this.lockedEdge || (endPos.z > this.startCell.z ? CONFIG.GAME.EDGE_DIRECTIONS.SOUTH : CONFIG.GAME.EDGE_DIRECTIONS.NORTH);
        } else {
            direction = this.lockedEdge || (endPos.x > this.startCell.x ? CONFIG.GAME.EDGE_DIRECTIONS.EAST : CONFIG.GAME.EDGE_DIRECTIONS.WEST);
        }

        // Loop and Apply
        if (isHorizontal) {
            for (let x = x1; x <= x2; x++) {
                if (isEraser) {
                    if (world.getWall(x, this.startCell.y, this.startCell.z, direction)) {
                        world.removeWall(x, this.startCell.y, this.startCell.z, direction);
                        actions.push(history.createWallRemoveAction(x, this.startCell.y, this.startCell.z, direction, {}));
                    }
                } else {
                    world.setWall(x, this.startCell.y, this.startCell.z, direction, wallData);
                    actions.push(history.createWallAction(x, this.startCell.y, this.startCell.z, direction, wallData));
                    roomManager.addToRoom(roomManager.selectedRoomId, 'walls', world.getWallKey(x, this.startCell.y, this.startCell.z, direction));
                }
            }
        } else {
            for (let z = z1; z <= z2; z++) {
                if (isEraser) {
                    if (world.getWall(this.startCell.x, this.startCell.y, z, direction)) {
                        world.removeWall(this.startCell.x, this.startCell.y, z, direction);
                        actions.push(history.createWallRemoveAction(this.startCell.x, this.startCell.y, z, direction, {}));
                    }
                } else {
                    world.setWall(this.startCell.x, this.startCell.y, z, direction, wallData);
                    actions.push(history.createWallAction(this.startCell.x, this.startCell.y, z, direction, wallData));
                    roomManager.addToRoom(roomManager.selectedRoomId, 'walls', world.getWallKey(this.startCell.x, this.startCell.y, z, direction));
                }
            }
        }

        if (actions.length > 0) {
            const actionName = isEraser ? `REMOVE_${actions.length}_WALLS` : `PLACE_${actions.length}_WALLS`;
            history.recordBatch(actions, actionName);
            console.log(`🧱 ${actions.length} wall segments ${isEraser ? 'removed' : 'placed'}`);
        }
    }

    start(startCell) {
        // Strict locking: capture the initial edge and line
        this.startCell = startCell;
        this.lockedDirection = null;
        this.lockedLine = null; // The static coordinate (e.g. z=5)

        if (startCell.edge) {
            // If starting from an edge (clicked edge), lock immediately to that axis
            const edge = startCell.edge;
            if (edge === CONFIG.GAME.EDGE_DIRECTIONS.NORTH || edge === CONFIG.GAME.EDGE_DIRECTIONS.SOUTH) {
                this.lockedDirection = 'horizontal';
                this.lockedLine = startCell.z; // North edge of x,0,5 is at local z? 

                // Wait, precise "line" logic:
                // North edge of x,z is physically located at z line.
                // South edge of x,z is at z+1 line.
                // We want to draw a wall ALONG this line.
                // So if I click North Edge of (3,5), I want walls at (X, 5) NORTH side?
                // Or maybe the user means simply "horizontal axis".
                // User said: "Wall should extend along the same edge line".
                // So we lock the specific edge property.
                this.lockedEdge = edge;
            } else {
                this.lockedDirection = 'vertical';
                this.lockedEdge = edge;
            }
        }
    }

    update(endPos, activeColor) {
        this.previewItems = [];
        if (!this.startCell) return;

        // If strict locked, force endPos to align
        let x1 = Math.min(this.startCell.x, endPos.x);
        let x2 = Math.max(this.startCell.x, endPos.x);
        let z1 = Math.min(this.startCell.z, endPos.z);
        let z2 = Math.max(this.startCell.z, endPos.z);

        // Single Cell / No Drag check?
        const dx = Math.abs(endPos.x - this.startCell.x);
        const dz = Math.abs(endPos.z - this.startCell.z);

        if (this.lockedDirection === 'horizontal') {
            // Constraint: Z must be startCell.z (or aligned to edge line)
            // Actually, if I locked to NORTH edge of (3,5), and I drag to (10, 10),
            // I should effectively treat endPos as (10, 5).
            const direction = this.lockedEdge || (endPos.z > this.startCell.z ? CONFIG.GAME.EDGE_DIRECTIONS.SOUTH : CONFIG.GAME.EDGE_DIRECTIONS.NORTH);

            for (let x = x1; x <= x2; x++) {
                this.previewItems.push({
                    type: 'wall',
                    x, y: this.startCell.y, z: this.startCell.z,
                    direction,
                    color: activeColor
                });
            }
        } else if (this.lockedDirection === 'vertical') {
            const direction = this.lockedEdge || (endPos.x > this.startCell.x ? CONFIG.GAME.EDGE_DIRECTIONS.EAST : CONFIG.GAME.EDGE_DIRECTIONS.WEST);

            for (let z = z1; z <= z2; z++) {
                this.previewItems.push({
                    type: 'wall',
                    x: this.startCell.x, y: this.startCell.y, z,
                    direction,
                    color: activeColor
                });
            }
        } else {
            // Not locked yet (didn't touch edge?), infer from drag
            if (dx === 0 && dz === 0 && this.startCell.edge) {
                this.previewItems.push({
                    type: 'wall',
                    x: this.startCell.x,
                    y: this.startCell.y,
                    z: this.startCell.z,
                    direction: this.startCell.edge,
                    color: activeColor
                });
            } else {
                // Fallback to old behavior if no edge click (drag start center)
                // But user wants strict line. We should lock on first move.
                const isHorz = dx > dz;
                const direction = isHorz ? (endPos.z > this.startCell.z ? 'south' : 'north') : (endPos.x > this.startCell.x ? 'east' : 'west');

                // Show simple line
                if (isHorz) {
                    for (let x = x1; x <= x2; x++) {
                        this.previewItems.push({ type: 'wall', x, y: 0, z: this.startCell.z, direction, color: activeColor });
                    }
                } else {
                    for (let z = z1; z <= z2; z++) {
                        this.previewItems.push({ type: 'wall', x: this.startCell.x, y: 0, z, direction, color: activeColor });
                    }
                }
            }
        }
    }

    finish(endPos, activeColor) {
        if (!this.startCell) return;

        let x1 = Math.min(this.startCell.x, endPos.x);
        let x2 = Math.max(this.startCell.x, endPos.x);
        let z1 = Math.min(this.startCell.z, endPos.z);
        let z2 = Math.max(this.startCell.z, endPos.z);

        const actions = [];
        const wallData = { color: activeColor }; // Apply Color!

        if (this.lockedDirection === 'horizontal') {
            const direction = this.lockedEdge || (endPos.z > this.startCell.z ? 'south' : 'north');
            for (let x = x1; x <= x2; x++) {
                world.setWall(x, this.startCell.y, this.startCell.z, direction, wallData);
                actions.push(history.createWallAction(x, this.startCell.y, this.startCell.z, direction, wallData));
                roomManager.addToRoom(roomManager.selectedRoomId, 'walls', world.getWallKey(x, this.startCell.y, this.startCell.z, direction));
            }
        } else if (this.lockedDirection === 'vertical') {
            const direction = this.lockedEdge || (endPos.x > this.startCell.x ? 'east' : 'west');
            for (let z = z1; z <= z2; z++) {
                world.setWall(this.startCell.x, this.startCell.y, z, direction, wallData);
                actions.push(history.createWallAction(this.startCell.x, this.startCell.y, z, direction, wallData));
                roomManager.addToRoom(roomManager.selectedRoomId, 'walls', world.getWallKey(this.startCell.x, this.startCell.y, z, direction));
            }
        } else {
            // Fallback for non-edge click drag
            const dx = Math.abs(endPos.x - this.startCell.x);
            const dz = Math.abs(endPos.z - this.startCell.z);
            const isHorz = dx > dz;
            const direction = isHorz ? (endPos.z > this.startCell.z ? 'south' : 'north') : (endPos.x > this.startCell.x ? 'east' : 'west');

            if (isHorz) {
                for (let x = x1; x <= x2; x++) {
                    world.setWall(x, 0, this.startCell.z, direction, wallData);
                    actions.push(history.createWallAction(x, 0, this.startCell.z, direction, wallData));
                }
            } else {
                for (let z = z1; z <= z2; z++) {
                    world.setWall(this.startCell.x, 0, z, direction, wallData);
                    actions.push(history.createWallAction(this.startCell.x, 0, z, direction, wallData));
                }
            }
        }

        if (actions.length > 0) {
            history.recordBatch(actions, `PLACE_${actions.length}_WALLS`);
            console.log(`🧱 ${actions.length} wall segments placed with color ${activeColor.toString(16)}`);
        }
    }
    placeOneWall(x, y, z, direction, activeColor) {
        const wallData = { color: activeColor };
        world.setWall(x, y, z, direction, wallData);

        const action = history.createWallAction(x, y, z, direction, wallData);
        history.record(action);

        roomManager.addToRoom(roomManager.selectedRoomId, 'walls', world.getWallKey(x, y, z, direction));

        console.log(`🧱 Wall placed at (${x}, ${y}, ${z}) ${direction} color: ${activeColor.toString(16)}`);

        if (renderer) renderer.markDirty();
    }
}
