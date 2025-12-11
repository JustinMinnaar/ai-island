// Properties Panel UI Controller
import { world } from './world.js';
import { roomManager } from './room-manager.js';
import { renderer } from './renderer-3d.js';

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

        window.addEventListener('entityselect', (e) => {
            this.showEntityProperties(e.detail);
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
