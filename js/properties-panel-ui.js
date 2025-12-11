// Properties Panel UI Controller
import { world } from './world.js';
import { roomManager } from './room-manager.js';
import { renderer } from './renderer-3d.js';

class PropertiesPanelUI {
    constructor() {
        this.container = document.getElementById('properties-content');
        this.currentSelection = null;
        this.init();
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
