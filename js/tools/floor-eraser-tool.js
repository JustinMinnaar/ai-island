
import { CONFIG } from '../config.js';
import { world } from '../world.js';
import { history } from '../history.js';
import { ToolBase } from './tool-base.js';

export class FloorEraserTool extends ToolBase {
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

        // Highlight floors to be deleted
        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                if (world.getCell(x, this.startCell.y, z)) {
                    this.previewItems.push({
                        type: 'floor',
                        x, z,
                        color: 0xff0000,
                        isGhost: true
                    });
                }
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
        let deletedCount = 0;

        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                const cell = world.getCell(x, this.startCell.y, z);
                if (cell && (cell.type === CONFIG.GAME.CELL_TYPES.FLOOR || !cell.type)) { // Handle legacy cells if needed, or strict floor
                    // Get existing data for undo
                    const oldData = { ...cell };

                    world.removeCell(x, this.startCell.y, z);
                    actions.push(history.createFloorRemoveAction(x, this.startCell.y, z, oldData));
                    deletedCount++;
                }
            }
        }

        if (actions.length > 0) {
            history.recordBatch(actions, `REMOVE_${deletedCount}_FLOORS`);
            console.log(`❌ ${deletedCount} floors removed`);
        }
    }
}
