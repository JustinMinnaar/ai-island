
import { CONFIG } from '../config.js';
import { world } from '../world.js';
import { history } from '../history.js';
import { roomManager } from '../room-manager.js';
import { ToolBase } from './tool-base.js';

export class FloorTool extends ToolBase {
    update(endPos, activeColor, isEraser = false) {
        this.previewItems = [];
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                this.previewItems.push({
                    type: 'floor',
                    x, y: this.startCell.y, z,
                    color: isEraser ? 0xFF0000 : activeColor // Red for eraser
                });
            }
        }
    }

    finish(endPos, activeColor, isEraser = false) {
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        const currentRoom = roomManager.getSelectedRoom();
        const roomNumber = currentRoom ? currentRoom.number : 0;

        const floorData = {
            type: CONFIG.GAME.CELL_TYPES.FLOOR,
            color: activeColor || 0x2a4858, // Default Floor Color
            roomNumber: roomNumber
        };
        const actions = [];

        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                if (isEraser) {
                    const cell = world.getCell(x, this.startCell.y, z);
                    if (cell && cell.type === CONFIG.GAME.CELL_TYPES.FLOOR) {
                        const oldData = { ...cell };
                        world.removeCell(x, this.startCell.y, z);
                        actions.push(history.createFloorRemoveAction(x, this.startCell.y, z, oldData));
                    }
                } else {
                    world.setCell(x, this.startCell.y, z, floorData);
                    actions.push(history.createFloorAction(x, this.startCell.y, z, floorData));

                    if (currentRoom) {
                        const cellKey = `${x},${this.startCell.y},${z}`;
                        roomManager.addToRoom(currentRoom.id, 'floors', cellKey);
                    }
                }
            }
        }

        if (actions.length > 0) {
            const actionName = isEraser ? `REMOVE_${actions.length}_FLOORS` : `PLACE_${actions.length}_FLOORS`;
            history.recordBatch(actions, actionName);
            console.log(`⬛ ${actions.length} floor tiles ${isEraser ? 'removed' : 'placed'}`);
            if (!isEraser && window.propertiesPanelUI) window.propertiesPanelUI.addToPalette(activeColor);
        }
    }
}
