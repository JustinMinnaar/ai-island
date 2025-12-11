
import { CONFIG } from '../config.js';
import { world } from '../world.js';
import { ToolBase } from './tool-base.js';

export class RoomTool extends ToolBase {
    update(endPos, activeColor) {
        this.previewItems = [];
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        // Preview Floor tiles
        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                this.previewItems.push({ type: 'floor', x, y: this.startCell.y, z });
            }
        }

        // Preview Walls (Perimeter)
        for (let x = x1; x <= x2; x++) {
            this.previewItems.push({ type: 'wall', x, y: this.startCell.y, z: z1, direction: CONFIG.GAME.EDGE_DIRECTIONS.NORTH });
            this.previewItems.push({ type: 'wall', x, y: this.startCell.y, z: z2, direction: CONFIG.GAME.EDGE_DIRECTIONS.SOUTH });
        }
        for (let z = z1; z <= z2; z++) {
            this.previewItems.push({ type: 'wall', x: x1, y: this.startCell.y, z, direction: CONFIG.GAME.EDGE_DIRECTIONS.WEST });
            this.previewItems.push({ type: 'wall', x: x2, y: this.startCell.y, z, direction: CONFIG.GAME.EDGE_DIRECTIONS.EAST });
        }
    }

    finish(endPos, activeColor) {
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        // Place Floors
        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                world.setCell(x, this.startCell.y, z, { type: CONFIG.GAME.CELL_TYPES.FLOOR, color: activeColor });
            }
        }

        // Place Walls
        for (let x = x1; x <= x2; x++) {
            world.setWall(x, this.startCell.y, z1, CONFIG.GAME.EDGE_DIRECTIONS.NORTH);
            world.setWall(x, this.startCell.y, z2, CONFIG.GAME.EDGE_DIRECTIONS.SOUTH);
        }
        for (let z = z1; z <= z2; z++) {
            world.setWall(x1, this.startCell.y, z, CONFIG.GAME.EDGE_DIRECTIONS.WEST);
            world.setWall(x2, this.startCell.y, z, CONFIG.GAME.EDGE_DIRECTIONS.EAST);
        }

        console.log(`🏠 Room placed (${x2 - x1 + 1}x${z2 - z1 + 1})`);
    }
}
