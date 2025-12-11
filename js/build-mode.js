// Build mode for placing walls, floors, and doors
import { CONFIG } from './config.js';
import { world } from './world.js';
import { renderer } from './renderer-3d.js';
import { history } from './history.js';
import { roomManager } from './room-manager.js';

class BuildMode {
    constructor() {
        this.active = false;
        this.currentTool = CONFIG.GAME.BUILD_TOOLS.WALL;
        this.isDrawing = false;
        this.startCell = null;
        this.previewItems = [];
        this.activeColor = 0x888888; // Default Stone Grey
        this.eraseMode = false; // Hold Delete to erase
        this.lockedDirection = null; // Lock wall direction during drag
        this.toolbar = null;
        this.init();
    }

    init() {
        // Create build toolbar
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'build-toolbar hidden';

        const tools = [
            { tool: CONFIG.GAME.BUILD_TOOLS.WALL, icon: '🧱', label: 'Wall (W)' },
            { tool: CONFIG.GAME.BUILD_TOOLS.FLOOR, icon: '⬛', label: 'Floor (F)' },
            { tool: CONFIG.GAME.BUILD_TOOLS.DOOR, icon: '🚪', label: 'Door (D)' },
            { tool: CONFIG.GAME.BUILD_TOOLS.ROOM, icon: '🏠', label: 'Room (R)' },
            { tool: CONFIG.GAME.BUILD_TOOLS.ITEM, icon: '📦', label: 'Item (I)' },
            { tool: CONFIG.GAME.BUILD_TOOLS.ERASER, icon: '⌫', label: 'Eraser (X)' }
        ];

        tools.forEach(({ tool, icon, label }) => {
            const btn = document.createElement('button');
            btn.className = 'build-tool-btn';
            if (tool === this.currentTool) {
                btn.classList.add('active');
            }
            // Use title for tooltip, only icon in body
            btn.title = label;
            btn.innerHTML = `<span class="icon">${icon}</span>`;

            btn.dataset.tool = tool;
            btn.addEventListener('click', () => this.setTool(tool));
            this.toolbar.appendChild(btn);
        });

        const canvasContainer = document.querySelector('.canvas-container');
        canvasContainer.appendChild(this.toolbar);
    }

    activate() {
        this.active = true;
        this.toolbar.classList.remove('hidden');
        console.log('🏗️ Build mode activated');
    }

    deactivate() {
        this.active = false;
        this.toolbar.classList.add('hidden');
        this.cancelDrawing();
        console.log('🏗️ Build mode deactivated');
    }

    setTool(tool) {
        this.currentTool = tool;
        this.toolbar.querySelectorAll('.build-tool-btn').forEach(btn => {
            if (btn.dataset.tool === tool) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        console.log('🔧 Tool changed to:', tool);
    }

    startDrawing(worldPos) {
        if (!this.active) return;

        this.isDrawing = true;
        this.startCell = { ...worldPos };
        this.previewItems = [];
    }

    updateDrawing(worldPos) {
        if (!this.active || !this.isDrawing) return;

        this.previewItems = [];

        switch (this.currentTool) {
            case CONFIG.GAME.BUILD_TOOLS.WALL:
                this.previewWall(worldPos);
                break;
            case CONFIG.GAME.BUILD_TOOLS.FLOOR:
                this.previewFloor(worldPos);
                break;
            case CONFIG.GAME.BUILD_TOOLS.DOOR:
                this.previewDoor(worldPos);
                break;
            case CONFIG.GAME.BUILD_TOOLS.ROOM:
                this.previewRoom(worldPos);
                break;
        }

        // Store preview for renderer
        renderer.buildPreview = this.previewItems;
    }

    finishDrawing(worldPos) {
        if (!this.active || !this.isDrawing) return;

        this.isDrawing = false;

        switch (this.currentTool) {
            case CONFIG.GAME.BUILD_TOOLS.WALL:
                this.placeWall(worldPos);
                break;
            case CONFIG.GAME.BUILD_TOOLS.FLOOR:
                this.placeFloor(worldPos);
                break;
            case CONFIG.GAME.BUILD_TOOLS.DOOR:
                this.placeDoor(worldPos);
                break;
            case CONFIG.GAME.BUILD_TOOLS.ROOM:
                this.placeRoom(worldPos);
                break;
        }

        if (renderer && renderer.markDirty) {
            renderer.markDirty();
        }

        this.startCell = null;
        this.lockedDirection = null; // Reset direction lock
        this.previewItems = [];
        renderer.buildPreview = null;
    }

    cancelDrawing() {
        this.isDrawing = false;
        this.startCell = null;
        this.previewItems = [];
        renderer.buildPreview = null;
    }

    // ===== Wall Placement =====

    previewWall(endPos) {
        if (!this.startCell) return;

        // Check if we're dragging (mouse moved from start position)
        const dx = Math.abs(endPos.x - this.startCell.x);
        const dz = Math.abs(endPos.z - this.startCell.z);
        const isDragging = dx > 0 || dz > 0;

        // If we have edge info and NOT dragging, show single wall preview
        if (this.startCell.edge && !isDragging) {
            this.previewItems.push({
                type: 'wall',
                x: this.startCell.x,
                y: this.startCell.y,
                z: this.startCell.z,
                direction: this.startCell.edge
            });
            return;
        }

        // If dragging, use continuous wall preview logic
        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        // Lock direction on first significant movement
        if (!this.lockedDirection && isDragging) {
            this.lockedDirection = dx > dz ? 'horizontal' : 'vertical';
        }

        // Don't show preview until direction is locked
        if (!this.lockedDirection) return;

        // Use locked direction
        const isHorizontal = this.lockedDirection === 'horizontal';

        if (isHorizontal) {
            // Horizontal drag -> preview walls on NORTH or SOUTH edges
            const direction = endPos.z > this.startCell.z ? CONFIG.GAME.EDGE_DIRECTIONS.SOUTH : CONFIG.GAME.EDGE_DIRECTIONS.NORTH;
            for (let x = x1; x <= x2; x++) {
                this.previewItems.push({
                    type: 'wall',
                    x,
                    y: this.startCell.y,
                    z: this.startCell.z,
                    direction
                });
            }
        } else {
            // Vertical drag -> preview walls on WEST or EAST edges
            const direction = endPos.x > this.startCell.x ? CONFIG.GAME.EDGE_DIRECTIONS.EAST : CONFIG.GAME.EDGE_DIRECTIONS.WEST;
            for (let z = z1; z <= z2; z++) {
                this.previewItems.push({
                    type: 'wall',
                    x: this.startCell.x,
                    y: this.startCell.y,
                    z,
                    direction
                });
            }
        }
    }

    placeWall(endPos) {
        if (!this.startCell) return;

        // If startCell has edge info, place single wall on that edge
        if (this.startCell.edge) {
            const wallData = { color: this.activeColor };
            world.setWall(this.startCell.x, this.startCell.y, this.startCell.z, this.startCell.edge, wallData);
            history.record(history.createWallAction(this.startCell.x, this.startCell.y, this.startCell.z, this.startCell.edge, wallData));

            // Add to current room
            const wallKey = `${this.startCell.x},${this.startCell.y},${this.startCell.z},${this.startCell.edge}`;
            roomManager.addToRoom(roomManager.selectedRoomId, 'walls', wallKey);

            console.log(`🧱 1 wall segment placed on edge ${this.startCell.edge}`);
            return;
        }

        // Place continuous walls along the path
        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        const dx = Math.abs(x2 - x1);
        const dz = Math.abs(z2 - z1);

        const wallData = { color: this.activeColor };
        const actions = []; // Batch actions for single undo

        // Use locked direction if set, otherwise determine from current drag
        const isHorizontal = this.lockedDirection ? this.lockedDirection === 'horizontal' : dx > dz;

        if (isHorizontal) {
            // Horizontal drag -> place walls on NORTH or SOUTH edges
            const direction = endPos.z > this.startCell.z ? CONFIG.GAME.EDGE_DIRECTIONS.SOUTH : CONFIG.GAME.EDGE_DIRECTIONS.NORTH;
            for (let x = x1; x <= x2; x++) {
                world.setWall(x, this.startCell.y, this.startCell.z, direction, wallData);
                actions.push(history.createWallAction(x, this.startCell.y, this.startCell.z, direction, wallData));

                // Add to current room
                const wallKey = `${x},${this.startCell.y},${this.startCell.z},${direction}`;
                roomManager.addToRoom(roomManager.selectedRoomId, 'walls', wallKey);
            }
        } else {
            // Vertical drag -> place walls on WEST or EAST edges
            const direction = endPos.x > this.startCell.x ? CONFIG.GAME.EDGE_DIRECTIONS.EAST : CONFIG.GAME.EDGE_DIRECTIONS.WEST;
            for (let z = z1; z <= z2; z++) {
                world.setWall(this.startCell.x, this.startCell.y, z, direction, wallData);
                actions.push(history.createWallAction(this.startCell.x, this.startCell.y, z, direction, wallData));

                // Add to current room
                const wallKey = `${this.startCell.x},${this.startCell.y},${z},${direction}`;
                roomManager.addToRoom(roomManager.selectedRoomId, 'walls', wallKey);
            }
        }

        // Record as single batch action
        if (actions.length > 0) {
            history.recordBatch(actions, `PLACE_${actions.length}_WALLS`);
        }

        console.log(`🧱 ${actions.length} wall segments placed`);
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

    // ===== Floor Placement =====

    previewFloor(endPos) {
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                this.previewItems.push({
                    type: 'floor',
                    x, y: this.startCell.y, z
                });
            }
        }
    }

    placeFloor(endPos) {
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        const currentRoom = roomManager.getSelectedRoom();
        const roomNumber = currentRoom ? currentRoom.number : 0;

        const floorData = {
            type: CONFIG.GAME.CELL_TYPES.FLOOR,
            color: this.activeColor,
            roomNumber: roomNumber
        };
        const actions = []; // Batch actions

        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                world.setCell(x, this.startCell.y, z, floorData);
                actions.push(history.createFloorAction(x, this.startCell.y, z, floorData));

                // Add to room tracking
                if (currentRoom) {
                    const cellKey = `${x},${this.startCell.y},${z}`;
                    roomManager.addToRoom(currentRoom.id, 'floors', cellKey);
                }
            }
        }

        // Record as single batch action
        if (actions.length > 0) {
            history.recordBatch(actions, `PLACE_${actions.length}_FLOORS`);
        }

        console.log(`⬛ ${actions.length} floor tiles placed`);
    }

    // ===== Door Placement =====

    previewDoor(endPos) {
        if (!this.startCell) return;

        const direction = this.getWallDirection(this.startCell, endPos);
        this.previewItems.push({
            type: 'door',
            x: this.startCell.x,
            y: this.startCell.y,
            z: this.startCell.z,
            direction,
            isOpen: false
        });
    }

    placeDoor(endPos) {
        if (!this.startCell) return;

        const direction = this.getWallDirection(this.startCell, endPos);

        // Remove wall if exists
        world.removeWall(this.startCell.x, this.startCell.y, this.startCell.z, direction);

        // Place door
        world.setDoor(this.startCell.x, this.startCell.y, this.startCell.z, direction, {
            isOpen: false,
            pivot: CONFIG.GAME.DOOR_PIVOT.LEFT
        });

        console.log(`🚪 Door placed at (${this.startCell.x}, ${this.startCell.y}, ${this.startCell.z}) ${direction}`);
    }

    // ===== Room Placement =====

    previewRoom(endPos) {
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        // Floor tiles
        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                this.previewItems.push({
                    type: 'floor',
                    x, y: this.startCell.y, z
                });
            }
        }

        // Walls
        for (let x = x1; x <= x2; x++) {
            this.previewItems.push({
                type: 'wall',
                x, y: this.startCell.y, z: z1,
                direction: CONFIG.GAME.EDGE_DIRECTIONS.NORTH
            });
            this.previewItems.push({
                type: 'wall',
                x, y: this.startCell.y, z: z2,
                direction: CONFIG.GAME.EDGE_DIRECTIONS.SOUTH
            });
        }

        for (let z = z1; z <= z2; z++) {
            this.previewItems.push({
                type: 'wall',
                x: x1, y: this.startCell.y, z,
                direction: CONFIG.GAME.EDGE_DIRECTIONS.WEST
            });
            this.previewItems.push({
                type: 'wall',
                x: x2, y: this.startCell.y, z,
                direction: CONFIG.GAME.EDGE_DIRECTIONS.EAST
            });
        }
    }

    placeRoom(endPos) {
        if (!this.startCell) return;

        const x1 = Math.min(this.startCell.x, endPos.x);
        const x2 = Math.max(this.startCell.x, endPos.x);
        const z1 = Math.min(this.startCell.z, endPos.z);
        const z2 = Math.max(this.startCell.z, endPos.z);

        // Place floor
        for (let x = x1; x <= x2; x++) {
            for (let z = z1; z <= z2; z++) {
                world.setCell(x, this.startCell.y, z, { type: CONFIG.GAME.CELL_TYPES.FLOOR });
            }
        }

        // Place walls
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

    handleDoorClick(edge) {
        if (!edge) return;
        const { x, z, direction } = edge;
        const y = 0; // Ground level

        const existingDoor = world.getDoor(x, y, z, direction);

        if (existingDoor) {
            // Cycle properties
            // Cycle: Left/Out -> Right/Out -> Left/In -> Right/In
            // current: pivot=left, swing=out

            let newPivot = existingDoor.pivot;
            let newSwing = existingDoor.swing;

            if (existingDoor.pivot === 'left' && existingDoor.swing === 'out') {
                newPivot = 'right'; newSwing = 'out';
            } else if (existingDoor.pivot === 'right' && existingDoor.swing === 'out') {
                newPivot = 'left'; newSwing = 'in';
            } else if (existingDoor.pivot === 'left' && existingDoor.swing === 'in') {
                newPivot = 'right'; newSwing = 'in';
            } else {
                newPivot = 'left'; newSwing = 'out';
            }

            world.setDoor(x, y, z, direction, {
                pivot: newPivot,
                swing: newSwing,
                color: existingDoor.color,
                isOpen: existingDoor.isOpen
            });
            console.log(`🚪 Cycles Door: ${newPivot}/${newSwing}`);

        } else {
            // New Door
            // Check for wall
            const existingWall = world.getWall(x, y, z, direction);
            if (existingWall) {
                world.removeWall(x, y, z, direction);
                // Record wall removal in history
                history.record(history.createWallRemoveAction(x, y, z, direction, existingWall));
            }

            // Add Door (Default: Left, Out)
            const doorData = {
                pivot: 'left',
                swing: 'out',
                color: this.activeColor
            };
            world.setDoor(x, y, z, direction, doorData);
            history.record(history.createDoorAction(x, y, z, direction, doorData));
            console.log(`🚪 Placed New Door`);
        }

        renderer.dirty = true;
    }
    handleWallClick(edge) {
        if (!edge) return;
        const { x, z, direction } = edge;
        const y = 0;

        const existingWall = world.getWall(x, y, z, direction);
        if (existingWall) {
            // Remove Wall
            world.removeWall(x, y, z, direction);
            console.log(`🧱 Removed Wall`);
        } else {
            // Check if Door exists, replace it
            const existingDoor = world.getDoor(x, y, z, direction);
            if (existingDoor) {
                world.removeDoor(x, y, z, direction);
            }

            // Place Wall
            world.setWall(x, y, z, direction, {
                color: this.activeColor
            });
            console.log(`🧱 Placed Wall`);
        }

        renderer.dirty = true;
    }
}

export const buildMode = new BuildMode();
