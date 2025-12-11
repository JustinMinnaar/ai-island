// Input handler for mouse, keyboard, and touch events
import { CONFIG } from './config.js';
import { world } from './world.js';
import { buildMode } from './build-mode.js';
import { renderer } from './renderer-3d.js';
import { history } from './history.js';

class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseWorldPos = { x: 0, y: 0, z: 0 };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Prevent context menu on right-click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // Mouse events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        this.canvas.addEventListener('click', this.onClick.bind(this));

        // Keyboard events
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    // ... (Mouse event handlers remain unchanged) ...
    onMouseDown(e) {
        // Left click
        if (e.button === 0) {
            if (buildMode.active) {
                const tool = buildMode.currentTool;

                // Door tool uses click-based placement only (no drag)
                // Wall tool allows drag-drawing but needs edge detection
                if (tool === CONFIG.GAME.BUILD_TOOLS.WALL) {
                    const rect = this.canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    const edge = renderer.getClosestEdge(mouseX, mouseY);
                    if (edge) {
                        // Store edge as start position for wall drawing
                        buildMode.startDrawing({ x: edge.x, y: 0, z: edge.z, edge: edge.direction });
                    }
                } else if (tool !== CONFIG.GAME.BUILD_TOOLS.DOOR) {
                    // Floor and other tools use cell position
                    const rect = this.canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
                    buildMode.startDrawing(worldPos);
                }
            } else {
                this.isDragging = true;
            }
        }
        // Right click for panning
        else if (e.button === 2) {
            this.isDragging = true;
        }

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Determine Hover State based on Tool
        if (buildMode.active) {
            const tool = buildMode.currentTool;

            if (tool === CONFIG.GAME.BUILD_TOOLS.WALL || tool === CONFIG.GAME.BUILD_TOOLS.DOOR) {
                // Edge Selection Mode
                const edge = renderer.getClosestEdge(mouseX, mouseY);
                if (edge) {
                    renderer.setHoverCursor(edge, 'EDGE');
                } else {
                    renderer.setHoverCursor(null);
                }
            } else if (tool === CONFIG.GAME.BUILD_TOOLS.FLOOR) {
                // Corner Grip Mode
                const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
                if (worldPos) {
                    renderer.setHoverCursor(worldPos, 'CORNERS');
                } else {
                    renderer.setHoverCursor(null);
                }
            } else {
                // Standard Block Selector (for Items/Select)
                const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
                renderer.setHoverCursor(worldPos, 'BLOCK');
            }

            // Drag-Drawing (Only for Floors/Rooms now? Walls are single-click)
            if (buildMode.isDrawing) {
                const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
                buildMode.updateDrawing(worldPos);
            }
        } else {
            // Select Mode -> Block Selector
            const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
            renderer.setHoverCursor(worldPos, 'BLOCK');
        }

        // Handle dragging (panning)
        if (this.isDragging && !buildMode.active) {
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }

        // Dispatch custom event for UI updates (using screenToWorld result, might be null if off grid)
        const mousePos = renderer.screenToWorld(mouseX, mouseY, 0);
        this.dispatchMouseMoveEvent(mousePos);
    }

    onMouseUp(e) {
        if (e.button === 0 && buildMode.active && buildMode.isDrawing) {
            // Only finish drawing if we started it (Mouse Down).
            // Walls/Doors don't start drawing on MouseDown anymore, they act on Click.
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
            buildMode.finishDrawing(worldPos);
        }

        this.isDragging = false;
    }

    onMouseLeave(e) {
        this.isDragging = false;
        renderer.setHoverCursor(null);
    }

    onWheel(e) {
        e.preventDefault();

        const delta = e.deltaY > 0 ? -CONFIG.RENDER.ZOOM_STEP : CONFIG.RENDER.ZOOM_STEP;
        const didZoom = renderer.zoom(delta);

        if (didZoom) {
            this.dispatchZoomEvent(renderer.camera.zoom);
        }
    }

    onClick(e) {
        if (this.isDragging) return; // Don't select if we were dragging

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 0. Handle Erase Mode (Delete key held)
        if (buildMode.eraseMode) {
            const edge = renderer.getClosestEdge(mouseX, mouseY);
            if (edge) {
                const { x, z, direction } = edge;
                const y = 0;

                // Check for door first
                const door = world.getDoor(x, y, z, direction);
                if (door) {
                    world.removeDoor(x, y, z, direction);
                    history.record(history.createDoorRemoveAction(x, y, z, direction, door));
                    renderer.dirty = true;
                    console.log('🗑️ Erased door');
                    return;
                }

                // Check for wall
                const wall = world.getWall(x, y, z, direction);
                if (wall) {
                    world.removeWall(x, y, z, direction);
                    history.record(history.createWallRemoveAction(x, y, z, direction, wall));
                    renderer.dirty = true;
                    console.log('🗑️ Erased wall');
                    return;
                }
            }

            // Check for floor
            const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
            if (worldPos) {
                const cell = world.getCell(worldPos.x, worldPos.y, worldPos.z);
                if (cell && cell.type === CONFIG.GAME.CELL_TYPES.FLOOR) {
                    world.removeCell(worldPos.x, worldPos.y, worldPos.z);
                    history.record(history.createFloorRemoveAction(worldPos.x, worldPos.y, worldPos.z, cell));
                    renderer.dirty = true;
                    console.log('🗑️ Erased floor');
                    return;
                }
            }
        }

        // 1. Handle Door Tool (Click Edge to place/cycle)
        if (buildMode.active && buildMode.currentTool === CONFIG.GAME.BUILD_TOOLS.DOOR) {
            const edge = renderer.getClosestEdge(mouseX, mouseY);
            if (edge) {
                buildMode.handleDoorClick(edge);
                return;
            }
        }

        const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
        if (!worldPos) return;

        // 2. Handle Interaction (Open/Close Door)
        // Check edge for door
        const edge = renderer.getClosestEdge(mouseX, mouseY);
        if (edge) {
            const door = world.getDoor(edge.x, 0, edge.z, edge.direction);
            if (door) {
                // If in select mode (not building), toggle door
                if (!buildMode.active || buildMode.currentTool === CONFIG.GAME.BUILD_TOOLS.SELECT) {
                    const isOpen = world.toggleDoor(edge.x, 0, edge.z, edge.direction);
                    renderer.dirty = true;
                    console.log(`🚪 Door ${isOpen ? 'Opened' : 'Closed'}`);
                    return;
                }
            }
        }

        // Also check if clicking on cell that door swings into
        if (!buildMode.active || buildMode.currentTool === CONFIG.GAME.BUILD_TOOLS.SELECT) {
            // Check all 4 edges of clicked cell for doors that swing into it
            const directions = [
                { dir: CONFIG.GAME.EDGE_DIRECTIONS.NORTH, dx: 0, dz: -1 },
                { dir: CONFIG.GAME.EDGE_DIRECTIONS.SOUTH, dx: 0, dz: 1 },
                { dir: CONFIG.GAME.EDGE_DIRECTIONS.WEST, dx: -1, dz: 0 },
                { dir: CONFIG.GAME.EDGE_DIRECTIONS.EAST, dx: 1, dz: 0 }
            ];

            for (const { dir, dx, dz } of directions) {
                // Check door on adjacent cell's edge
                const adjX = worldPos.x + dx;
                const adjZ = worldPos.z + dz;
                const door = world.getDoor(adjX, 0, adjZ, dir);

                if (door) {
                    // Check if door swings into the clicked cell
                    const swingsInto = (
                        (dir === CONFIG.GAME.EDGE_DIRECTIONS.NORTH && door.swing === 'in' && dx === 0 && dz === -1) ||
                        (dir === CONFIG.GAME.EDGE_DIRECTIONS.SOUTH && door.swing === 'in' && dx === 0 && dz === 1) ||
                        (dir === CONFIG.GAME.EDGE_DIRECTIONS.WEST && door.swing === 'in' && dx === -1 && dz === 0) ||
                        (dir === CONFIG.GAME.EDGE_DIRECTIONS.EAST && door.swing === 'in' && dx === 1 && dz === 0) ||
                        (dir === CONFIG.GAME.EDGE_DIRECTIONS.NORTH && door.swing === 'out' && dx === 0 && dz === 1) ||
                        (dir === CONFIG.GAME.EDGE_DIRECTIONS.SOUTH && door.swing === 'out' && dx === 0 && dz === -1) ||
                        (dir === CONFIG.GAME.EDGE_DIRECTIONS.WEST && door.swing === 'out' && dx === 1 && dz === 0) ||
                        (dir === CONFIG.GAME.EDGE_DIRECTIONS.EAST && door.swing === 'out' && dx === -1 && dz === 0)
                    );

                    if (swingsInto) {
                        const isOpen = world.toggleDoor(adjX, 0, adjZ, dir);
                        renderer.dirty = true;
                        console.log(`🚪 Door ${isOpen ? 'Opened' : 'Closed'} (clicked swing cell)`);
                        return;
                    }
                }
            }
        }

        // 3. Select Entity
        const entities = world.getEntitiesAt(worldPos.x, worldPos.y, worldPos.z);
        if (entities.length > 0) {
            world.selectEntity(entities[0].id);
            this.dispatchEntitySelectEvent(entities[0]);
        } else {
            // 4. Select Cell
            world.selectCell(worldPos.x, worldPos.y, worldPos.z);
            world.selectEntity(null);
            this.dispatchCellSelectEvent(worldPos);
        }
    }

    updateMovementInput() {
        // Collect current input state
        let x = 0;
        let z = 0;
        const keys = this.keys || {};

        if (keys['w'] || keys['W'] || keys['ArrowUp']) z -= 1;
        if (keys['s'] || keys['S'] || keys['ArrowDown']) z += 1;
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) x -= 1;
        if (keys['d'] || keys['D'] || keys['ArrowRight']) x += 1;

        if (renderer.setMoveInput) {
            renderer.setMoveInput(x, z);
        }
    }

    onKeyDown(e) {
        if (!this.keys) this.keys = {};
        this.keys[e.key] = true;
        this.updateMovementInput();

        // Undo/Redo
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' || e.key === 'Z') {
                if (e.shiftKey) {
                    history.redo();
                } else {
                    history.undo();
                }
                e.preventDefault();
                return;
            }
            if (e.key === 'y' || e.key === 'Y') {
                history.redo();
                e.preventDefault();
                return;
            }
        }

        // Hold Delete for erase mode
        if (e.key === 'Delete') {
            buildMode.eraseMode = true;
            renderer.setEraseCursor(true);
        }

        switch (e.key) {
            case 'Escape':
                world.clearSelection();
                this.dispatchSelectionClearEvent();
                break;

            case 'r':
            case 'R':
                renderer.reset();
                this.dispatchCameraResetEvent();
                break;

            case 'f':
            case 'F':
                // Focus on selection
                if (world.selectedEntity) {
                    const ent = world.getEntity(world.selectedEntity);
                    if (ent) renderer.centerOn(ent.x, ent.z);
                } else if (world.selectedCell) {
                    renderer.centerOn(world.selectedCell.x, world.selectedCell.z);
                }
                break;

            case '+':
            case '=':
                renderer.zoom(CONFIG.RENDER.ZOOM_STEP);
                this.dispatchZoomEvent(renderer.camera.zoom);
                break;

            case '-':
            case '_':
                renderer.zoom(-CONFIG.RENDER.ZOOM_STEP);
                this.dispatchZoomEvent(renderer.camera.zoom);
                break;
        }
    }

    onKeyUp(e) {
        if (!this.keys) this.keys = {};
        this.keys[e.key] = false;
        this.updateMovementInput();

        // Release Delete key - exit erase mode
        if (e.key === 'Delete') {
            buildMode.eraseMode = false;
            renderer.setEraseCursor(false);
        }
    }

    // Touch events for mobile support
    onTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.lastMouseX = touch.clientX;
            this.lastMouseY = touch.clientY;
            this.isDragging = true;
        }
    }

    onTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 1 && this.isDragging) {
            const touch = e.touches[0];
            const dx = touch.clientX - this.lastMouseX;
            const dy = touch.clientY - this.lastMouseY;

            renderer.pan(-dx, -dy);

            this.lastMouseX = touch.clientX;
            this.lastMouseY = touch.clientY;
        }
    }

    onTouchEnd(e) {
        this.isDragging = false;
    }

    // Custom event dispatchers
    dispatchMouseMoveEvent(worldPos) {
        window.dispatchEvent(new CustomEvent('worldMouseMove', {
            detail: worldPos
        }));
    }

    dispatchCellSelectEvent(worldPos) {
        window.dispatchEvent(new CustomEvent('cellSelect', {
            detail: worldPos
        }));
    }

    dispatchEntitySelectEvent(entity) {
        window.dispatchEvent(new CustomEvent('entitySelect', {
            detail: entity
        }));
    }

    dispatchSelectionClearEvent() {
        window.dispatchEvent(new CustomEvent('selectionClear'));
    }

    dispatchZoomEvent(zoom) {
        window.dispatchEvent(new CustomEvent('cameraZoom', {
            detail: { zoom }
        }));
    }

    dispatchCameraResetEvent() {
        window.dispatchEvent(new CustomEvent('cameraReset'));
    }
}

export let inputHandler = null;

export function initInput(canvas) {
    inputHandler = new InputHandler(canvas);
    return inputHandler;
}
