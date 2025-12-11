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

        // Drag and Drop events (for instantiating types)
        this.canvas.addEventListener('dragover', this.onDragOver.bind(this));
        this.canvas.addEventListener('drop', this.onDrop.bind(this));
    }

    onDragOver(e) {
        e.preventDefault(); // Allow drop
        e.dataTransfer.dropEffect = 'copy';

        // Optional: Show visual feedback at cursor
        // const rect = this.canvas.getBoundingClientRect();
        // const worldPos = renderer.screenToWorld(e.clientX - rect.left, e.clientY - rect.top, 0);
        // if (worldPos) renderer.setHoverCursor(worldPos, 'BLOCK', 0x00ff00);
    }

    onDrop(e) {
        e.preventDefault();
        const typeId = e.dataTransfer.getData('typeId');

        if (typeId) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);

            if (worldPos) {
                // Instantiate at this position!
                // We need to import typesPanelUI or dispatch an event.
                // Since modules are circular, maybe dispatching an event or using global is safer?
                // typesPanelUI is on window.typesPanelUI
                if (window.typesPanelUI) {
                    window.typesPanelUI.instantiateType(parseInt(typeId), worldPos);
                }
            }
        }
    }

    // ... (Mouse event handlers remain unchanged) ...
    onMouseDown(e) {
        // Left click
        if (e.button === 0) {
            if (buildMode.active) {
                const tool = buildMode.currentToolId;

                if (buildMode.eraseMode) return; // Prevent drawing if erase mode is active

                // Calculate mouse position once for the tool logic
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // For Door tool, we rely on onClick for precise edge selection
                if (tool === CONFIG.GAME.BUILD_TOOLS.DOOR) {
                    return;
                }
                // Wall Tool with edge detection
                else if (tool === CONFIG.GAME.BUILD_TOOLS.WALL) {
                    const edge = renderer.getClosestEdge(mouseX, mouseY);
                    if (edge) {
                        buildMode.startDrawing({ x: edge.x, y: 0, z: edge.z, edge: edge.direction });
                    }
                }
                // Area Tools (Floor, Room, Delete Tools)
                else {
                    const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
                    if (worldPos) {
                        buildMode.startDrawing(worldPos);
                    }
                }
                // For tools that start drawing immediately on mousedown (like Floor, Room, Delete Area)
                // or if no specific tool logic was triggered, we set isDragging to true.
                // Wall and Door tools handle their startDrawing internally based on edge detection.
                if (tool === CONFIG.GAME.BUILD_TOOLS.FLOOR ||
                    tool === CONFIG.GAME.BUILD_TOOLS.ROOM ||
                    tool === CONFIG.GAME.BUILD_TOOLS.DELETE_WALL ||
                    tool === CONFIG.GAME.BUILD_TOOLS.DELETE_FLOOR ||
                    tool === CONFIG.GAME.BUILD_TOOLS.DELETE_DOOR) {
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
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Determine Hover State based on Tool
        if (buildMode.active) {
            const tool = buildMode.currentToolId;

            // SELECT mode - no visual cursor, only CSS crosshair
            if (tool === CONFIG.GAME.BUILD_TOOLS.SELECT) {
                renderer.setHoverCursor(null);
            }
            else if (tool === CONFIG.GAME.BUILD_TOOLS.WALL || tool === CONFIG.GAME.BUILD_TOOLS.DOOR) {
                // Edge Selection Mode
                const edge = renderer.getClosestEdge(mouseX, mouseY);
                if (edge) {
                    renderer.setHoverCursor(edge, 'EDGE');
                } else {
                    renderer.setHoverCursor(null);
                }
            } else if (tool === CONFIG.GAME.BUILD_TOOLS.FLOOR ||
                tool === CONFIG.GAME.BUILD_TOOLS.DELETE_WALL ||
                tool === CONFIG.GAME.BUILD_TOOLS.DELETE_FLOOR ||
                tool === CONFIG.GAME.BUILD_TOOLS.DELETE_DOOR) {
                // Corner Grip Mode for Floors and Area Deletes
                const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
                if (worldPos) {
                    const isDelete = (tool === CONFIG.GAME.BUILD_TOOLS.DELETE_WALL ||
                        tool === CONFIG.GAME.BUILD_TOOLS.DELETE_FLOOR ||
                        tool === CONFIG.GAME.BUILD_TOOLS.DELETE_DOOR);
                    const color = isDelete ? 0xff0000 : null; // Red for delete, null (default/blue) for floor
                    renderer.setHoverCursor(worldPos, 'CORNERS', color);
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
                this.isDragging = true; // Mark as dragging so onClick doesn't fire
                const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
                buildMode.updateDrawing(worldPos);
            }
            // Drag-Erasing
            else if (buildMode.eraseMode && (this.isDragging || e.buttons === 1)) { // Check buttons or flag
                // ... (Existing generic erase logic can stay, but won't trigger if DELETE_WALL is active unless eraseMode is set?)
                // DELETE_WALL uses isDrawing flow, not eraseMode flow.
                // So this block is skipped for DELETE_WALL tool.
                const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
                if (worldPos) {
                    this.performEraseAt(mouseX, mouseY);
                }
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
            // Wait, WallTool DOES start drawing on MouseDown now (we restored it).
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
            buildMode.finishDrawing(worldPos);
        }

        // Delay resetting isDragging slightly to ensure onClick sees it? 
        // No, onClick happens AFTER onMouseUp usually. 
        // If I set it false here, onClick will execute.
        // We want onClick to recognize "It WAS dragging".
        // But InputHandler usually resets it here.
        // Standard solution: Set a "wasDragging" flag or handle Click logic here?

        // Actually, if we consumed the event in finishDrawing, we don't want click.
        // Let's keep isDragging false, but maybe onClick needs to check if we 'just' finished.

        // Simple Fix: Move `this.isDragging = false` to the very end or use a timeout?
        // Or in onClick, check a flag `blockNextClick`.

        setTimeout(() => {
            this.isDragging = false;
        }, 50);
    }

    onMouseLeave(e) {
        this.isDragging = false;
        renderer.setHoverCursor(null);
    }

    onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const delta = e.deltaY > 0 ? -1 : 1; // Normalize delta direction
        // Pass mouse position to zoom for "zoom to cursor"
        renderer.zoom(delta, mouseX, mouseY);

        this.dispatchZoomEvent(renderer.camera.zoom);
    }

    onClick(e) {
        if (this.isDragging) return; // Don't select if we were dragging

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 0. Handle Erase Mode (Delete key held)
        if (buildMode.eraseMode) {
            this.performEraseAt(mouseX, mouseY);
        }

        // 1. Handle Door Tool (Click Edge to place/cycle)
        if (buildMode.active && !buildMode.eraseMode && buildMode.currentToolId === CONFIG.GAME.BUILD_TOOLS.DOOR) {
            const edge = renderer.getClosestEdge(mouseX, mouseY);
            if (edge) {
                buildMode.handleDoorClick(edge);
                return;
            }
        }

        const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
        if (!worldPos) return;

        // 2. SELECT MODE - Check for clickable objects via mesh raycasting
        if (buildMode.active && buildMode.currentToolId === CONFIG.GAME.BUILD_TOOLS.SELECT) {
            console.log('🔍 SELECT mode click detected');

            // Priority  1: Raycast against visual objects (walls, doors, floors, entities)
            const objectHit = renderer.getObjectAtScreen(mouseX, mouseY);
            console.log('Raycast result:', objectHit);
            if (objectHit) {
                const { type, x, y, z, direction } = objectHit;

                // Get the actual object data from world
                if (type === 'door') {
                    const door = world.getDoor(x, y, z, direction);
                    if (door) {
                        window.dispatchEvent(new CustomEvent('objectSelect', {
                            detail: { type: 'door', x, y, z, direction, data: door }
                        }));
                        console.log(`🎯 Selected door via mesh at (${x}, ${y}, ${z}) ${direction}`);
                        return;
                    }
                } else if (type === 'wall') {
                    const wall = world.getWall(x, y, z, direction);
                    if (wall) {
                        window.dispatchEvent(new CustomEvent('objectSelect', {
                            detail: { type: 'wall', x, y, z, direction, data: wall }
                        }));
                        console.log(`🎯 Selected wall via mesh at (${x}, ${y}, ${z}) ${direction}`);
                        return;
                    }
                } else if (type === 'floor') {
                    const cell = world.getCell(x, y, z);
                    if (cell) {
                        window.dispatchEvent(new CustomEvent('objectSelect', {
                            detail: { type: 'floor', x, y, z, data: cell }
                        }));
                        console.log(`🎯 Selected floor via mesh at (${x}, ${y}, ${z})`);
                        return;
                    }
                } else if (type === 'entity') {
                    const entities = world.getEntitiesAt(x, y, z);
                    if (entities.length > 0) {
                        world.selectEntity(entities[0].id);
                        this.dispatchEntitySelectEvent(entities[0]);
                        console.log(`🎯 Selected entity via mesh: ${entities[0].name || entities[0].id}`);
                        return;
                    }
                }
            }

            // Priority 2: Fallback to edge detection for walls/doors
            const edge = renderer.getClosestEdge(mouseX, mouseY);
            if (edge && edge.dist < 0.3) {
                const door = world.getDoor(edge.x, 0, edge.z, edge.direction);
                const wall = world.getWall(edge.x, 0, edge.z, edge.direction);

                if (door) {
                    window.dispatchEvent(new CustomEvent('objectSelect', {
                        detail: { type: 'door', x: edge.x, y: 0, z: edge.z, direction: edge.direction, data: door }
                    }));
                    console.log(`🎯 Selected door via edge at (${edge.x}, 0, ${edge.z}) ${edge.direction}`);
                    return;
                } else if (wall) {
                    window.dispatchEvent(new CustomEvent('objectSelect', {
                        detail: { type: 'wall', x: edge.x, y: 0, z: edge.z, direction: edge.direction, data: wall }
                    }));
                    console.log(`🎯 Selected wall via edge at (${edge.x}, 0, ${edge.z}) ${edge.direction}`);
                    return;
                }
            }

            // Priority 3: Check entities at world position
            const entities = world.getEntitiesAt(worldPos.x, worldPos.y, worldPos.z);
            if (entities.length > 0) {
                world.selectEntity(entities[0].id);
                this.dispatchEntitySelectEvent(entities[0]);
                console.log(`🎯 Selected entity: ${entities[0].name || entities[0].id}`);
                return;
            }

            // Priority 4: Check floor at world position
            const cell = world.getCell(worldPos.x, worldPos.y, worldPos.z);
            if (cell) {
                window.dispatchEvent(new CustomEvent('objectSelect', {
                    detail: { type: 'floor', x: worldPos.x, y: worldPos.y, z: worldPos.z, data: cell }
                }));
                console.log(`🎯 Selected floor at (${worldPos.x}, ${worldPos.y}, ${worldPos.z})`);
                return;
            }

            // Empty cell click
            world.selectCell(worldPos.x, worldPos.y, worldPos.z);
            world.selectEntity(null);
            this.dispatchCellSelectEvent(worldPos);
            return;
        }

        // 3. Non-SELECT mode: Interaction logic (open/close doors, etc)
        const edge = renderer.getClosestEdge(mouseX, mouseY);
        if (edge) {
            const door = world.getDoor(edge.x, 0, edge.z, edge.direction);
            const wall = world.getWall(edge.x, 0, edge.z, edge.direction);

            if (buildMode.active && buildMode.currentToolId === CONFIG.GAME.BUILD_TOOLS.SELECT) {
                // SELECT Mode - Select the edge object (Door or Wall)
                if (door) {
                    window.dispatchEvent(new CustomEvent('cellselect', { detail: { ...edge, type: 'door' } }));
                    // Don't toggle if selecting? Or toggle on double click?
                    // User said "Once placed, I can then select it with the select mode, to edit it."
                    // So purely select.
                    return;
                } else if (wall) {
                    window.dispatchEvent(new CustomEvent('cellselect', { detail: { ...edge, type: 'wall' } }));
                    return;
                }
            }

            // Toggle Logic (if not explicitly selecting for edit)
            if (door) {
                if (!buildMode.active || buildMode.currentToolId === CONFIG.GAME.BUILD_TOOLS.SELECT) {
                    // If in select mode, maybe we want to select AND toggle? Or just select?
                    // User "Select mode... to edit it". implies selection priority.
                    // But "click doors to open" is also standard.
                    // Let's toggle if no properties panel open? Or maybe just toggle only if not clicking edit fields.
                    // Current compromise: If Select Tool, SELECT. (User can edit properties like "Open" in panel).
                    // If Hand/None Tool, TOGGLE.

                    if (!buildMode.active) {
                        const isOpen = world.toggleDoor(edge.x, 0, edge.z, edge.direction);
                        renderer.dirty = true;
                        console.log(`🚪 Door ${isOpen ? 'Opened' : 'Closed'}`);
                        return;
                    }
                }
            }
        }

        // Also check if clicking on cell that door swings into
        if (!buildMode.active || buildMode.currentToolId === CONFIG.GAME.BUILD_TOOLS.SELECT) {
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
            // ... (existing undo logic)
            if (e.key === 'z' || e.key === 'Z') {
                if (e.shiftKey) { history.redo(); } else { history.undo(); }
                e.preventDefault(); return;
            }
            if (e.key === 'y' || e.key === 'Y') {
                history.redo(); e.preventDefault(); return;
            }
        }

        // Hold Delete for erase mode OR Contextual Tool Switch
        if (e.key === 'Delete') {
            if (buildMode.active) {
                // If in WALL mode -> Switch to DELETE_WALL
                if (buildMode.currentToolId === CONFIG.GAME.BUILD_TOOLS.WALL) {
                    this.previousToolId = buildMode.currentToolId;
                    buildMode.setTool(CONFIG.GAME.BUILD_TOOLS.DELETE_WALL);
                }
                // Else -> Standard Erase Mode flag (for other tools)
                else {
                    buildMode.eraseMode = true;
                    renderer.setEraseCursor(true);
                }
            }
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

            // ...
            case 'f': case 'F':
                // ... (focus logic)
                if (world.selectedEntity) {
                    const ent = world.getEntity(world.selectedEntity);
                    if (ent) renderer.centerOn(ent.x, ent.z);
                } else if (world.selectedCell) {
                    renderer.centerOn(world.selectedCell.x, world.selectedCell.z);
                }
                break;

            case '+': case '=':
                renderer.zoom(CONFIG.RENDER.ZOOM_STEP);
                this.dispatchZoomEvent(renderer.camera.zoom);
                break;

            case '-': case '_':
                renderer.zoom(-CONFIG.RENDER.ZOOM_STEP);
                this.dispatchZoomEvent(renderer.camera.zoom);
                break;
        }
    }

    onKeyUp(e) {
        if (!this.keys) this.keys = {};
        this.keys[e.key] = false;
        this.updateMovementInput();

        // Release Delete key
        if (e.key === 'Delete') {
            if (buildMode.active) {
                // If we switched tool contextually, switch back
                if (this.previousToolId && buildMode.currentToolId === CONFIG.GAME.BUILD_TOOLS.DELETE_WALL) {
                    // If we were dragging, cancel the action!
                    if (buildMode.isDrawing) {
                        buildMode.cancelDrawing();
                        this.isDragging = false; // Reset generic flag too
                    }

                    buildMode.setTool(this.previousToolId);
                    this.previousToolId = null;
                } else {
                    buildMode.eraseMode = false;
                    renderer.setEraseCursor(false);
                }
            }
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

    performEraseAt(mouseX, mouseY) {
        if (!buildMode.active) return;
        const tool = buildMode.currentToolId;
        const isEraser = tool === CONFIG.GAME.BUILD_TOOLS.ERASER;
        const isRoom = tool === CONFIG.GAME.BUILD_TOOLS.ROOM;
        const isWall = tool === CONFIG.GAME.BUILD_TOOLS.WALL;
        const isDoor = tool === CONFIG.GAME.BUILD_TOOLS.DOOR;
        const isFloor = tool === CONFIG.GAME.BUILD_TOOLS.FLOOR;

        // 1. Check for Walls/Doors (Edges) - Allow in Wall, Door, Eraser, Room modes
        if (isWall || isDoor || isEraser || isRoom) {
            const edge = renderer.getClosestEdge(mouseX, mouseY);
            if (edge) {
                const { x, z, direction } = edge;

                // Priority: Check Doors first (as they sit on walls)
                if (isDoor || isEraser || isRoom || isWall) { // Wall mode implies deleting contained door akin to real delete?
                    if (world.getDoor(x, 0, z, direction)) {
                        world.removeDoor(x, 0, z, direction);
                        history.record(history.createDoorRemoveAction(x, 0, z, direction, {}));
                        if (renderer) renderer.markDirty();
                        // If we are strictly in Door mode, stop here.
                        if (isDoor) return;
                    }
                }

                // Check Wall - Only if Wall, Eraser, or Room mode (Door mode shouldn't delete walls)
                if (isWall || isEraser || isRoom) {
                    if (world.getWall(x, 0, z, direction)) {
                        world.removeWall(x, 0, z, direction);
                        history.record(history.createWallRemoveAction(x, 0, z, direction, {}));
                        if (renderer) renderer.markDirty();
                        return; // Successfully deleted edge
                    }
                }
            }
        }

        // 2. Check for Floors/Entities (Cells) - STRICTLY for Floor, Eraser, Room modes
        if (isFloor || isEraser || isRoom) {
            const worldPos = renderer.screenToWorld(mouseX, mouseY, 0);
            if (worldPos) {
                const { x, y, z } = worldPos;

                // Check Entities (Eraser only?)
                if (renderer) {
                    const entities = world.getEntitiesAt(x, y, z);
                    // Standard tools usually don't delete entities unless Eraser
                    if (isEraser && entities.length > 0) {
                        entities.forEach(ent => world.removeEntity(ent.id));
                        renderer.markDirty();
                        return;
                    }
                }

                // Check Floor
                const cell = world.getCell(x, y, z);
                if (cell && cell.type === CONFIG.GAME.CELL_TYPES.FLOOR) {
                    const oldData = { ...cell };
                    world.removeCell(x, y, z);
                    history.record(history.createFloorRemoveAction(x, y, z, oldData));
                    if (renderer) renderer.markDirty();
                }
            }
        }
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
