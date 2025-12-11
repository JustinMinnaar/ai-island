
import { CONFIG } from '../config.js';
import { world } from '../world.js';
import { history } from '../history.js';
import { ToolBase } from './tool-base.js';

export class WallEraserTool extends ToolBase {
    update(endPos, activeColor) {
        this.previewItems = [];
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        // Check all potential wall slots in this box area
        // We check horizontal edges (North/South) and vertical (East/West) for each cell
        // To avoid duplicates, we can iterate cells and check specific edges, or iterate edges directly.

        // Strategy: Iterate all cells in box. For each cell, check its 4 walls.
        // Use a Set to avoid duplicate previews for shared walls.
        // Create Selection Box Preview
        this.previewItems.push({
            type: 'selection-box',
            x: x1,
            z: z1,
            width: x2 - x1 + 1,
            height: z2 - z1 + 1,
            color: 0xff0000
        });

        const processedWalls = new Set();

        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                // Check all 4 directions for this cell
                Object.values(CONFIG.GAME.EDGE_DIRECTIONS).forEach(dir => {
                    // Check if wall exists in world
                    if (world.getWall(x, this.startCell.y, z, dir)) {
                        const wallKey = world.getWallKey(x, this.startCell.y, z, dir);
                        if (!processedWalls.has(wallKey)) {
                            processedWalls.add(wallKey);
                            this.previewItems.push({
                                type: 'wall',
                                x, y: this.startCell.y, z,
                                direction: dir,
                                color: 0xFF0000, // Red for erase
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
        const processedWalls = new Set();

        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                Object.values(CONFIG.GAME.EDGE_DIRECTIONS).forEach(dir => {
                    const wallKey = world.getWallKey(x, this.startCell.y, z, dir);
                    // Check if wall exists
                    if (world.getWall(x, this.startCell.y, z, dir)) {
                        if (!processedWalls.has(wallKey)) {
                            processedWalls.add(wallKey);

                            world.removeWall(x, this.startCell.y, z, dir);
                            actions.push(history.createWallRemoveAction(x, this.startCell.y, z, dir, {}));
                        }
                    }
                });
            }
        }

        if (actions.length > 0) {
            history.recordBatch(actions, `REMOVE_${actions.length}_WALLS`);
            console.log(`❌ ${actions.length} walls removed`);
        }
    }
}
