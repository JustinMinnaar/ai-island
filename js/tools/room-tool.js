import { CONFIG } from '../config.js';
import { world } from '../world.js';
import { history } from '../history.js';
import { roomManager } from '../room-manager.js';
import { ToolBase } from './tool-base.js';
import { buildMode } from '../build-mode.js';

export class RoomTool extends ToolBase {
    update(endPos, activeColor) {
        this.previewItems = [];
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        const wallColor = buildMode.toolPrototypes[CONFIG.GAME.BUILD_TOOLS.WALL]?.color || 0x888888;
        const floorColor = buildMode.toolPrototypes[CONFIG.GAME.BUILD_TOOLS.FLOOR]?.color || 0x3a4a5a;

        this.previewItems.push({
            type: 'selection-box',
            x: x1,
            z: z1,
            width: x2 - x1 + 1,
            height: z2 - z1 + 1,
            color: 0x00ff00
        });

        // Floor Previews
        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                this.previewItems.push({
                    type: 'floor',
                    x, z,
                    color: floorColor, // Use Floor Tool Color
                    isGhost: true
                });
            }
        }

        // Wall Previews (Rim)
        for (let x = x1; x <= x2; x++) {
            this.previewItems.push({ type: 'wall', x, y: 0, z: z1, direction: CONFIG.GAME.EDGE_DIRECTIONS.NORTH, color: wallColor, isGhost: true });
            this.previewItems.push({ type: 'wall', x, y: 0, z: z2, direction: CONFIG.GAME.EDGE_DIRECTIONS.SOUTH, color: wallColor, isGhost: true });
        }
        for (let z = z1; z <= z2; z++) {
            this.previewItems.push({ type: 'wall', x: x1, y: 0, z, direction: CONFIG.GAME.EDGE_DIRECTIONS.WEST, color: wallColor, isGhost: true });
            this.previewItems.push({ type: 'wall', x: x2, y: 0, z, direction: CONFIG.GAME.EDGE_DIRECTIONS.EAST, color: wallColor, isGhost: true });
        }
    }

    finish(endPos, activeColor) {
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        const actions = [];
        const roomId = roomManager.createRoom();

        const wallColor = buildMode.toolPrototypes[CONFIG.GAME.BUILD_TOOLS.WALL]?.color || 0x888888;
        const floorColor = buildMode.toolPrototypes[CONFIG.GAME.BUILD_TOOLS.FLOOR]?.color || 0x3a4a5a;

        // 1. Floors
        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                const cellKey = world.getCellKey(x, 0, z);
                roomManager.addToRoom(roomId, 'cells', cellKey);

                const oldData = world.getCell(x, 0, z);
                const newData = { type: CONFIG.GAME.CELL_TYPES.FLOOR, roomNumber: 0, color: floorColor }; // Use Floor Tool Color

                world.setCell(x, 0, z, newData);
                actions.push(history.createFloorAction(x, 0, z, newData));
            }
        }

        // 2. Walls (Rim)
        const addWall = (x, z, dir) => {
            const wallKey = world.getWallKey(x, 0, z, dir);
            roomManager.addToRoom(roomId, 'walls', wallKey);

            const oldWall = world.getWall(x, 0, z, dir);
            const newWall = { type: CONFIG.GAME.CELL_TYPES.WALL, color: wallColor }; // Use Wall Tool Color

            if (!oldWall) { // Only place if not existing? Or overwrite? Usually overwrite or skip.
                world.setWall(x, 0, z, dir, newWall);
                actions.push(history.createWallAction(x, 0, z, dir, newWall));
            }
        };

        for (let x = x1; x <= x2; x++) {
            addWall(x, z1, CONFIG.GAME.EDGE_DIRECTIONS.NORTH);
            addWall(x, z2, CONFIG.GAME.EDGE_DIRECTIONS.SOUTH);
        }
        for (let z = z1; z <= z2; z++) {
            addWall(x1, z, CONFIG.GAME.EDGE_DIRECTIONS.WEST);
            addWall(x2, z, CONFIG.GAME.EDGE_DIRECTIONS.EAST);
        }

        history.recordBatch(actions, 'CREATE_ROOM');
        console.log(`🏠 Room created with Wall Color ${wallColor.toString(16)} and Floor Color ${floorColor.toString(16)}`);
    }
}

