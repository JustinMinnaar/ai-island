
import { CONFIG } from '../config.js';
import { world } from '../world.js';
import { history } from '../history.js';
import { ToolBase } from './tool-base.js';

export class DoorEraserTool extends ToolBase {
    update(endPos, activeColor) {
        this.previewItems = [];
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        // Selection Box
        this.previewItems.push({
            type: 'selection-box',
            x: x1,
            z: z1,
            width: x2 - x1 + 1,
            height: z2 - z1 + 1,
            color: 0xff0000
        });

        // Highlight doors to be deleted
        const processedDoors = new Set();
        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                Object.values(CONFIG.GAME.EDGE_DIRECTIONS).forEach(dir => {
                    const door = world.getDoor(x, this.startCell.y, z, dir);
                    if (door) {
                        const key = world.getWallKey(x, this.startCell.y, z, dir);
                        if (!processedDoors.has(key)) {
                            processedDoors.add(key);
                            this.previewItems.push({
                                type: 'door',
                                x, z,
                                direction: dir,
                                color: 0xff0000,
                                isGhost: true
                            });
                        }
                    }
                });
            }
        }
    }

    finish(endPos, activeColor) {
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        const actions = [];
        const processedDoors = new Set();

        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                Object.values(CONFIG.GAME.EDGE_DIRECTIONS).forEach(dir => {
                    const door = world.getDoor(x, this.startCell.y, z, dir);
                    if (door) {
                        const key = world.getWallKey(x, this.startCell.y, z, dir);
                        if (!processedDoors.has(key)) {
                            processedDoors.add(key);

                            // Capture data for undo
                            const oldData = { ...door };

                            world.removeDoor(x, this.startCell.y, z, dir);
                            actions.push(history.createDoorRemoveAction(x, this.startCell.y, z, dir, oldData));
                        }
                    }
                });
            }
        }

        if (actions.length > 0) {
            history.recordBatch(actions, `REMOVE_${actions.length}_DOORS`);
            console.log(`❌ ${actions.length} doors removed`);
        }
    }
}
