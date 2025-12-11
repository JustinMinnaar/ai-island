// Properties Panel UI Controller
import { world } from './world.js';
import { roomManager } from './room-manager.js';
import { renderer } from './renderer-3d.js';
import { renderDoorProperties, bindDoorEvents } from './ui/panels/door-properties.js';
import { renderWallProperties, bindWallEvents } from './ui/panels/wall-properties.js';
import { renderFloorProperties, bindFloorEvents } from './ui/panels/floor-properties.js';

class PropertiesPanelUI {
    constructor() {
        this.container = document.getElementById('properties-content');
        this.currentSelection = null;
        this.quickPalette = [0x888888, 0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0x00FFFF, 0xFF00FF, 0xFFFFFF, 0x000000]; // Default palette
        this.init();
    }

    // ... (init and clear remain same)

    // Updated renderPaletteHTML to take a palette array
    renderPaletteHTML(palette) {
        if (!palette || palette.length === 0) return '<div class="palette-empty" style="padding:5px; font-size:10px; color:#666;">No history</div>';

        // Debugging styles: border to see container
        let html = '<div class="palette-row" style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 10px; padding: 5px; border-top: 1px solid #333; min-height: 30px;">';

        palette.forEach(color => {
            const hex = '#' + color.toString(16).padStart(6, '0');
            html += `<div class="palette-swatch" 
                          title="Color: ${hex}"
                          style="width: 24px; height: 24px; background-color: ${hex}; border: 1px solid #888; cursor: pointer; box-shadow: 0 0 2px rgba(0,0,0,0.5);"
                          onclick="window.propertiesPanelUI.selectPaletteColor(${color})"></div>`;
        });
        html += '</div>';
        return html;
    }

    addToPalette(color) {
        if (window.buildMode) {
            const proto = window.buildMode.getActivePrototype();
            if (proto) {
                if (!proto.palette) proto.palette = [];
                // standard LRU
                if (!proto.palette.includes(color)) {
                    proto.palette.unshift(color);
                    if (proto.palette.length > 10) proto.palette.pop();

                    // Refresh UI if needed
                    if (this.currentSelection && this.currentSelection.type === 'tool') {
                        this.showToolProperties(this.currentSelection.id);
                    }
                }
            }
        }
    }

    selectPaletteColor(color) {
        if (window.buildMode) {
            const proto = window.buildMode.getActivePrototype();
            if (proto) {
                proto.color = color;
                const input = document.getElementById('tool-active-color');
                if (input) input.value = '#' + color.toString(16).padStart(6, '0');
            }
        }
    }

    showToolProperties(toolId) {
        if (!this.container) return;

        // Map Tool ID to Title
        const names = {
            'wall': 'New Wall',
            'floor': 'New Floor',
            'door': 'New Door',
            'room': 'New Room',
            'item': 'New Item',
            'select': 'Select Mode',
            'eraser': 'Eraser'
        };
        const title = names[toolId] || 'Tool Properties';

        let html = '<div class="property-group">';
        html += `<div class="property-group-title">${title}</div>`;

        if (toolId === 'select' || toolId === 'eraser') {
            html += `<p class="text-muted">Use mouse to ${toolId === 'eraser' ? 'erase objects' : 'select objects'}.</p>`;
        } else {
            // Get Prototype
            let colorVal = 0x888888;
            let palette = [];

            if (window.buildMode && window.buildMode.toolPrototypes[toolId]) {
                const proto = window.buildMode.toolPrototypes[toolId];
                colorVal = proto.color;
                palette = proto.palette || [];
            }

            const hexColor = '#' + colorVal.toString(16).padStart(6, '0');

            // Active Color Picker
            html += `<div class="property-row">
                <span class="property-label">Color</span>
                <div style="flex: 1;">
                    <input type="color" id="tool-active-color" class="property-input" value="${hexColor}" style="width: 100%;">
                    <div id="palette-container" style="margin-top: 8px; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 4px; min-height: 40px; border: 1px solid #444;">
                        ${this.renderPaletteHTML(palette)}
                    </div>
                </div>
            </div>`;

            // Tool Specifics
            if (toolId === 'wall' || toolId === 'room') {
                html += `<div class="info-box">Click and drag to place ${toolId}s.</div>`;
            } else if (toolId === 'door') {
                html += `<div class="info-box">Click existing wall to place door. Click door to cycle pivot.</div>`;
                // Add Door Orientation toggle? (For future)
            }
        }

        html += '</div>';
        this.container.innerHTML = html;
        this.currentSelection = { type: 'tool', id: toolId };

        // Bind Color Picker
        paletteContainer.innerHTML = html;

        // Bind Color Picker for this specific tool
        const colorInput = paletteContainer.querySelector(`#tool-active-color-${targetToolId}`);
        if (colorInput) {
            colorInput.addEventListener('change', (e) => {
                const color = parseInt(e.target.value.replace('#', ''), 16);
                if (window.buildMode) {
                    const proto = window.buildMode.toolPrototypes[targetToolId];
                    if (proto) {
                        proto.color = color;
                        this.addToPalette(color, targetToolId); // Pass targetToolId
                    }
                }
            });
        }
        return paletteContainer;
    }

    init() {
        // Listen for selection changes from 3D world
        window.addEventListener('cellselect', (e) => {
            this.showCellProperties(e.detail);
        });

        window.addEventListener('entitySelect', (e) => {
            this.showEntityProperties(e.detail);
        });

        // Listen for object selection (walls, doors, floors)
        window.addEventListener('objectSelect', (e) => {
            const detail = e.detail;

            // Highlight the selected object
            if (renderer) {
                renderer.setSelectedObject(detail.type, detail.x, detail.y || 0, detail.z, detail.direction);
            }

            switch (detail.type) {
                case 'wall':
                    this.showWallProperties(detail);
                    break;
                case 'door':
                    this.showDoorProperties(detail);
                    break;
                case 'floor':
                    this.showFloorProperties(detail);
                    break;
                default:
                    this.showCellProperties(detail);
            }
        });

        // Expose global actions
        window.createRoom = () => {
            const name = prompt("Enter room name:", "New Room");
            if (name) {
                const room = roomManager.createRoom(name);
                // Refresh tree
                if (window.scenePanelUI) window.scenePanelUI.render();
            }
        };

        window.addSelectedTilesToRoom = (roomId) => {
            console.log('TODO: Implement adding global selection to room ' + roomId);
            alert('Select tiles in 3D view to add them (Feature coming soon)');
        };
    }

    // Show wall properties
    showWallProperties(data) {
        this.currentSelection = renderWallProperties(this.container, data, this.renderProperty.bind(this));
        bindWallEvents(data);
    }

    // Legacy method for compatibility
    _showWallPropertiesOld(data) {
        if (!this.container) return;

        const { x, y, z, direction, data: wallData } = data;
        const color = wallData?.color || 0x888888;
        const hexColor = '#' + color.toString(16).padStart(6, '0');

        let html = '<div class="property-group">';
        html += '<div class="property-group-title">🧱 Wall Properties</div>';

        html += this.renderProperty('Position', `${x}, ${y}, ${z}`);
        html += this.renderProperty('Direction', direction);
        html += this.renderProperty('Color', hexColor);

        // Editable color
        html += `<div class="property-row">
            <span class="property-label">Edit Color</span>
            <input type="color" id="wall-edit-color" class="property-input" value="${hexColor}">
        </div>`;

        html += '</div>';

        // Actions
        html += '<div class="property-group">';
        html += '<div class="property-group-title">Actions</div>';
        html += `<button class="action-btn full-width" onclick="window.deleteSelectedWall(${x}, ${y}, ${z}, '${direction}')">
            <span class="action-icon">🗑️</span> Delete Wall
        </button>`;
        html += '</div>';

        this.container.innerHTML = html;
        this.currentSelection = { type: 'wall', x, y, z, direction };

        // Bind color change
        const colorInput = document.getElementById('wall-edit-color');
        if (colorInput) {
            colorInput.addEventListener('change', (e) => {
                const newColor = parseInt(e.target.value.replace('#', ''), 16);
                world.setWall(x, y, z, direction, { ...wallData, color: newColor });
                if (renderer) renderer.markDirty();
            });
        }

        // Expose delete function
        window.deleteSelectedWall = (wx, wy, wz, wdir) => {
            world.removeWall(wx, wy, wz, wdir);
            if (renderer) renderer.markDirty();
            this.clear();
        };
    }

    // Show door properties
    showDoorProperties(data) {
        this.currentSelection = renderDoorProperties(this.container, data, this.renderProperty.bind(this));
        bindDoorEvents(data, this.showDoorProperties.bind(this));
    }

    // Legacy method for compatibility
    _showDoorPropertiesOld(data) {
        if (!this.container) return;

        const { x, y, z, direction, data: doorData } = data;
        const isOpen = doorData?.isOpen || false;
        const isLocked = doorData?.isLocked || false;
        const pivot = doorData?.pivot || 'left';
        const swing = doorData?.swing || 'out';
        const color = doorData?.color || 0x8b6f47;
        const hexColor = '#' + color.toString(16).padStart(6, '0');

        let html = '<div class="property-group">';
        html += '<div class="property-group-title">🚪 Door Properties</div>';

        html += this.renderProperty('Position', `${x}, ${y}, ${z}`);
        html += this.renderProperty('Direction', direction);
        html += this.renderProperty('Pivot', pivot);
        html += this.renderProperty('Swing', swing);
        html += this.renderProperty('Color', hexColor);

        html += '</div>';

        // State Controls
        html += '<div class="property-group">';
        html += '<div class="property-group-title">State</div>';

        // Open/Closed Switch
        html += `<div class="property-row">
            <span class="property-label">Open</span>
            <label class="switch">
                <input type="checkbox" id="door-open-switch" ${isOpen ? 'checked' : ''} ${isLocked ? 'disabled' : ''}>
                <span class="slider"></span>
            </label>
        </div>`;

        // Locked/Unlocked Switch
        html += `<div class="property-row">
            <span class="property-label">Locked</span>
            <label class="switch">
                <input type="checkbox" id="door-locked-switch" ${isLocked ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>`;

        html += '</div>';

        // Swing and Pivot Controls
        html += '<div class="property-group">';
        html += '<div class="property-group-title">Door Configuration</div>';

        // Swing direction (In/Out switch)
        html += `<div class="property-row">
            <span class="property-label">Swing Direction</span>
            <div class="switch-options">
                <span class="switch-label ${swing === 'in' ? 'active' : ''}">In</span>
                <label class="switch">
                    <input type="checkbox" id="door-swing-switch" ${swing === 'out' ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
                <span class="switch-label ${swing === 'out' ? 'active' : ''}">Out</span>
            </div>
        </div>`;

        // Hinge side (Left/Right switch)
        html += `<div class="property-row">
            <span class="property-label">Hinge Side</span>
            <div class="switch-options">
                <span class="switch-label ${pivot === 'left' ? 'active' : ''}">Left</span>
                <label class="switch">
                    <input type="checkbox" id="door-pivot-switch" ${pivot === 'right' ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
                <span class="switch-label ${pivot === 'right' ? 'active' : ''}">Right</span>
            </div>
        </div>`;

        html += '</div>';

        // Actions
        html += '<div class="property-group">';
        html += '<div class="property-group-title">Actions</div>';
        html += `<button class="action-btn full-width" onclick="window.deleteSelectedDoor(${x}, ${y}, ${z}, '${direction}')">
            <span class="action-icon">🗑️</span> Delete Door
        </button>`;
        html += '</div>';

        this.container.innerHTML = html;
        this.currentSelection = { type: 'door', x, y, z, direction };

        // Bind switch events
        const openSwitch = document.getElementById('door-open-switch');
        const lockedSwitch = document.getElementById('door-locked-switch');

        if (openSwitch) {
            openSwitch.addEventListener('change', (e) => {
                const newOpenState = e.target.checked;
                const currentDoor = world.getDoor(x, y, z, direction);
                if (currentDoor && !currentDoor.isLocked) {
                    world.setDoor(x, y, z, direction, { ...currentDoor, isOpen: newOpenState });
                    if (renderer) renderer.markDirty();
                    console.log(`🚪 Door ${newOpenState ? 'opened' : 'closed'}`);
                }
            });
        }

        if (lockedSwitch) {
            lockedSwitch.addEventListener('change', (e) => {
                const newLockedState = e.target.checked;
                const currentDoor = world.getDoor(x, y, z, direction);
                if (currentDoor) {
                    // If locking and door is open, close it first
                    const newState = {
                        ...currentDoor,
                        isLocked: newLockedState,
                        isOpen: newLockedState ? false : currentDoor.isOpen
                    };
                    world.setDoor(x, y, z, direction, newState);
                    if (renderer) renderer.markDirty();

                    // Refresh properties to update disabled state of open switch
                    this.showDoorProperties({ x, y, z, direction, data: newState });
                    console.log(`🔒 Door ${newLockedState ? 'locked' : 'unlocked'}`);
                }
            });
        }

        // Bind swing direction switch
        const swingSwitch = document.getElementById('door-swing-switch');
        if (swingSwitch) {
            swingSwitch.addEventListener('change', (e) => {
                const currentDoor = world.getDoor(x, y, z, direction);
                if (currentDoor) {
                    const newSwing = e.target.checked ? 'out' : 'in';
                    world.setDoor(x, y, z, direction, { ...currentDoor, swing: newSwing });
                    if (renderer) renderer.markDirty();
                    // Refresh UI to update active states
                    this.showDoorProperties({ x, y, z, direction, data: world.getDoor(x, y, z, direction) });
                }
            });
        }

        // Bind hinge side switch
        const pivotSwitch = document.getElementById('door-pivot-switch');
        if (pivotSwitch) {
            pivotSwitch.addEventListener('change', (e) => {
                const currentDoor = world.getDoor(x, y, z, direction);
                if (currentDoor) {
                    const newPivot = e.target.checked ? 'right' : 'left';
                    world.setDoor(x, y, z, direction, { ...currentDoor, pivot: newPivot });
                    if (renderer) renderer.markDirty();
                    // Refresh UI to update active states
                    this.showDoorProperties({ x, y, z, direction, data: world.getDoor(x, y, z, direction) });
                }
            });
        }

        // Expose delete function
        window.deleteSelectedDoor = (dx, dy, dz, ddir) => {
            world.removeDoor(dx, dy, dz, ddir);
            if (renderer) renderer.markDirty();
            this.clear();
        };
    }


    // Show floor properties
    showFloorProperties(data) {
        this.currentSelection = renderFloorProperties(this.container, data, this.renderProperty.bind(this));
        bindFloorEvents(data);
    }

    // Legacy method for compatibility
    _showFloorPropertiesOld(data) {
        if (!this.container) return;

        const { x, y, z, data: floorData } = data;
        const color = floorData?.color || 0x3a4a5a;
        const hexColor = '#' + color.toString(16).padStart(6, '0');
        const roomNumber = floorData?.roomNumber || 0;
        const room = roomManager.getRoomByNumber(roomNumber);
        const roomName = room ? room.name : 'None';

        let html = '<div class="property-group">';
        html += '<div class="property-group-title">🟫 Floor Properties</div>';

        html += this.renderProperty('Position', `${x}, ${y}, ${z}`);
        html += this.renderProperty('Type', floorData?.type || 'floor');
        html += this.renderProperty('Room', `${roomName} (#${roomNumber})`);
        html += this.renderProperty('Color', hexColor);

        // Editable color
        html += `<div class="property-row">
            <span class="property-label">Edit Color</span>
            <input type="color" id="floor-edit-color" class="property-input" value="${hexColor}">
        </div>`;

        html += '</div>';

        // Actions
        html += '<div class="property-group">';
        html += '<div class="property-group-title">Actions</div>';
        html += `<button class="action-btn full-width" onclick="window.deleteSelectedFloor(${x}, ${y}, ${z})">
            <span class="action-icon">🗑️</span> Delete Floor
        </button>`;
        html += '</div>';

        this.container.innerHTML = html;
        this.currentSelection = { type: 'floor', x, y, z };

        // Bind color change
        const colorInput = document.getElementById('floor-edit-color');
        if (colorInput) {
            colorInput.addEventListener('change', (e) => {
                const newColor = parseInt(e.target.value.replace('#', ''), 16);
                world.setCell(x, y, z, { ...floorData, color: newColor });
                if (renderer) renderer.markDirty();
            });
        }

        // Expose delete function
        window.deleteSelectedFloor = (fx, fy, fz) => {
            world.removeCell(fx, fy, fz);
            if (renderer) renderer.markDirty();
            this.clear();
        };
    }


    clear() {
        if (!this.container) return;
        this.container.innerHTML = '<p class="text-muted">Select an item to view properties</p>';
    }

    // --- New Methods for Scene Hierarchy ---

    showSceneProperties() {
        if (!this.container) return;
        const scene = roomManager.scene;

        let html = '<div class="property-group">';
        html += '<div class="property-group-title">Scene Properties</div>';
        html += this.renderProperty('Name', scene.name, 'text', 'scene-name');
        html += this.renderProperty('Description', scene.description, 'text', 'scene-desc');
        html += '</div>';

        this.container.innerHTML = html;
        this.currentSelection = { type: 'scene', id: scene.id };
    }

    showRoomsFolderProperties() {
        if (!this.container) return;

        let html = '<div class="property-group">';
        html += '<div class="property-group-title">Rooms Management</div>';
        html += `<div class="info-box">
            <p>A <strong>Room</strong> is a logical area on the map.</p>
            <p>You can assign floor tiles, walls, and objects to specific rooms to organize your dungeon.</p>
        </div>`;

        html += `<button class="action-btn full-width" onclick="window.createRoom()">
            <span class="action-icon">➕</span> Add New Room
        </button>`;

        html += '</div>';
        this.container.innerHTML = html;
        this.currentSelection = { type: 'folder', id: 'rooms' };
    }

    showRoomProperties(roomId) {
        const room = roomManager.rooms.get(roomId);
        if (!room || !this.container) return;

        const counts = roomManager.getRoomCounts(roomId);

        let html = '<div class="property-group">';
        html += '<div class="property-group-title">Room Information</div>';

        html += this.renderProperty('Name', room.name, 'text', 'room-name');
        html += this.renderProperty('Number', room.number, 'number', 'room-number', true); // Read-only number
        html += this.renderProperty('Description', room.description || '', 'text', 'room-description');

        html += '</div>';

        html += '<div class="property-group">';
        html += '<div class="property-group-title">Actions</div>';

        html += `<button class="action-btn full-width" onclick="window.addSelectedTilesToRoom('${roomId}')">
            <span class="action-icon">🖌️</span> Add Selected Tiles
        </button>`;

        html += '</div>';

        html += '<div class="property-group">';
        html += '<div class="property-group-title">Contents</div>';
        html += this.renderProperty('Floors', counts.floors);
        html += this.renderProperty('Walls', counts.walls);
        html += this.renderProperty('Doors', counts.doors);
        html += this.renderProperty('Total', counts.total);
        html += '</div>';

        this.container.innerHTML = html;
        this.currentSelection = { type: 'room', id: roomId };

        // Add event listeners for inputs
        // TODO: Implement proper binding
    }

    showToolProperties(toolId) {
        if (!this.container) return;

        // Map Tool ID to Title
        const names = {
            'wall': 'New Wall',
            'floor': 'New Floor',
            'door': 'New Door',
            'room': 'New Room',
            'item': 'New Item',
            'select': 'Select Mode',
            'eraser': 'Eraser'
        };
        const title = names[toolId] || 'Tool Properties';

        let html = '<div class="property-group">';
        html += `<div class="property-group-title">${title}</div>`;

        if (toolId === 'select' || toolId === 'eraser') {
            html += `<p class="text-muted">Use mouse to ${toolId === 'eraser' ? 'erase objects' : 'select objects'}.</p>`;
        } else {
            // Active Color Picker
            html += `<div class="property-row">
                <span class="property-label">Color</span>
                <input type="color" id="tool-active-color" class="property-input" value="#888888">
            </div>`;

            // Tool Specifics
            if (toolId === 'wall' || toolId === 'room') {
                html += `<div class="info-box">Click and drag to place ${toolId}s.</div>`;
            } else if (toolId === 'door') {
                html += `<div class="info-box">Click existing wall to place door. Click door to cycle pivot.</div>`;
            }
        }

        html += '</div>';
        this.container.innerHTML = html;
        this.currentSelection = { type: 'tool', id: toolId };

        // Bind Color Picker
        const colorInput = document.getElementById('tool-active-color');
        if (colorInput) {
            // Load current color from buildMode if possible (cyclic dependency issue if we import buildMode here?)
            // Load current color from buildMode if possible
            if (window.buildMode) {
                const proto = window.buildMode.getActivePrototype();
                if (proto) {
                    colorInput.value = '#' + proto.color.toString(16).padStart(6, '0');
                }
            }

            colorInput.addEventListener('input', (e) => {
                const color = parseInt(e.target.value.replace('#', ''), 16);
                if (window.buildMode) {
                    const proto = window.buildMode.getActivePrototype();
                    if (proto) {
                        proto.color = color;
                    }
                }
            });
        }
    }

    // --- Existing Methods ---

    showCellProperties(cellData) {
        if (!this.container) return;

        const { x, y, z } = cellData;
        const cell = world.getCell(x, y, z);
        const roomNumber = cell ? (cell.roomNumber || 0) : 0;
        const room = roomManager.getRoomByNumber(roomNumber);
        const roomName = room ? room.name : 'None';

        let html = '<div class="property-group">';
        html += '<div class="property-group-title">Cell Information</div>';

        html += this.renderProperty('Position', `${x}, ${y}, ${z}`);
        html += this.renderProperty('Type', cell ? cell.type : 'Empty');
        html += this.renderProperty('Room', `${roomName} (#${roomNumber})`);

        if (cell && cell.color !== undefined) {
            html += this.renderProperty('Color', `#${cell.color.toString(16).padStart(6, '0')}`);
        }

        // TODO: Add editable color field here for selected object if we want post-placement editing
        // For now, just display. User asked "select walls and change their color later".
        // Let's add an input for it.
        html += `<div class="property-row">
            <span class="property-label">Edit Color</span>
            <input type="color" id="cell-edit-color" class="property-input" value="${cell ? '#' + (cell.color || 0x888888).toString(16).padStart(6, '0') : '#888888'}">
        </div>`;

        html += '</div>';

        // Check for walls/doors on this cell
        const walls = this.getWallsAtCell(x, y, z);
        const doors = this.getDoorsAtCell(x, y, z);

        if (walls.length > 0 || doors.length > 0) {
            html += '<div class="property-group">';
            html += '<div class="property-group-title">Edges</div>';
            html += this.renderProperty('Walls', walls.length);
            html += this.renderProperty('Doors', doors.length);
            html += '</div>';
        }

        this.container.innerHTML = html;
        this.currentSelection = { type: 'cell', x, y, z };
    }

    showEntityProperties(entity) {
        if (!this.container || !entity) return;

        let html = '<div class="property-group">';
        html += '<div class="property-group-title">Entity Information</div>';

        html += this.renderProperty('ID', entity.id);
        html += this.renderProperty('Type', entity.type);
        html += this.renderProperty('Position', `${entity.x}, ${entity.y}, ${entity.z}`);

        if (entity.name) {
            html += this.renderProperty('Name', entity.name);
        }

        html += '</div>';

        this.container.innerHTML = html;
        this.currentSelection = { type: 'entity', id: entity.id };
    }

    renderProperty(label, value, inputType = null, inputId = null, readonly = false) {
        let valueHtml;

        if (inputType) {
            valueHtml = `<input type="${inputType}" class="property-input" id="${inputId}" value="${value}" ${readonly ? 'readonly' : ''}>`;
        } else {
            valueHtml = `<span class="property-value">${value}</span>`;
        }

        return `
            <div class="property-row">
                <span class="property-label">${label}</span>
                ${valueHtml}
            </div>
        `;
    }

    getWallsAtCell(x, y, z) {
        const walls = [];
        const directions = ['north', 'south', 'east', 'west'];

        for (const dir of directions) {
            if (world.getWall(x, y, z, dir)) {
                walls.push(dir);
            }
        }

        return walls;
    }

    getDoorsAtCell(x, y, z) {
        const doors = [];
        const directions = ['north', 'south', 'east', 'west'];

        for (const dir of directions) {
            if (world.getDoor(x, y, z, dir)) {
                doors.push(dir);
            }
        }

        return doors;
    }
}

export const propertiesPanelUI = new PropertiesPanelUI();
// Make it globally accessible
window.propertiesPanelUI = propertiesPanelUI;
