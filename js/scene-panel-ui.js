// Scene Panel UI Controller
import { world } from './world.js';
import { roomManager } from './room-manager.js';
import { renderer } from './renderer-3d.js';

class ScenePanelUI {
    constructor() {
        this.treeContainer = document.getElementById('scene-tree');
        this.selectedId = null;
        this.init();
    }

    init() {
        this.render();
        // Update tree when world changes
        setInterval(() => this.render(), 1000); // Update every second
    }

    render() {
        if (!this.treeContainer) return;

        let html = '';

        // Root Scene Node
        const isSceneSelected = this.selectedId === 'scene-root';
        html += `<div class="tree-node ${isSceneSelected ? 'selected' : ''}" data-type="scene" data-id="scene-root">
            <span class="expand-icon" style="opacity:0">▼</span>
            <span class="node-icon">🌍</span>
            <span class="node-label">My Scene</span>
        </div>`;

        // Rooms Folder (child of Scene)
        html += '<div class="tree-children" style="padding-left: 20px;">';

        const isRoomsSelected = this.selectedId === 'rooms-folder';
        html += `<div class="tree-node expandable" data-type="folder" data-id="rooms-folder">
            <span class="expand-icon">▼</span>
            <span class="node-icon">📁</span>
            <span class="node-label">Rooms</span>
        </div>`;

        html += '<div class="tree-children">';
        const rooms = roomManager.getAllRooms();
        for (const room of rooms) {
            const counts = roomManager.getRoomCounts(room.id);
            const isSelected = roomManager.selectedRoomId === room.id;

            html += `<div class="tree-node room-node ${isSelected ? 'selected' : ''}" data-type="room" data-id="${room.id}">
                <span class="node-icon">🏠</span>
                <span class="node-label">${room.name} (#${room.number})</span>
                <span class="node-count">(${counts.total})</span>
            </div>`;
        }
        html += '</div>'; // End Rooms children

        // Containers section (Items, etc.)
        html += this.renderContainersSection();

        html += '</div>'; // End Scene children

        this.treeContainer.innerHTML = html;
        this.attachEventListeners();
    }

    renderContainersSection() {
        const entities = world.getAllEntities();
        const items = entities.filter(e => e.type === 'item');
        const creatures = entities.filter(e => e.type === 'creature');
        const characters = entities.filter(e => e.type === 'character');
        const heroes = entities.filter(e => e.type === 'hero');

        let html = '';

        html += this.renderContainer('Items', '📦', items.length);
        html += this.renderContainer('Creatures', '🐉', creatures.length);
        html += this.renderContainer('Characters', '🧙', characters.length);
        html += this.renderContainer('Heroes', '⚔️', heroes.length);

        return html;
    }

    renderContainer(label, icon, count) {
        return `
            <div class="tree-node" data-type="container" data-id="${label.toLowerCase()}">
                <span class="node-icon">${icon}</span>
                <span class="node-label">${label}</span>
                <span class="node-count">(${count})</span>
            </div>
        `;
    }

    attachEventListeners() {
        // Generic node click handler
        this.treeContainer.querySelectorAll('.tree-node').forEach(node => {
            node.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent bubbling

                const type = node.dataset.type;
                const id = node.dataset.id;

                if (node.classList.contains('expandable')) {
                    this.toggleNode(node);
                }

                this.handleSelection(type, id);
            });
        });
    }

    toggleNode(node) {
        node.classList.toggle('collapsed');
        // Find immediate sibling children container
        let next = node.nextElementSibling;
        if (next && next.classList.contains('tree-children')) {
            next.classList.toggle('collapsed');
        }
    }

    handleSelection(type, id) {
        this.selectedId = id;

        // Handle specific logic
        if (type === 'room') {
            roomManager.selectRoom(id);
        } else if (type === 'scene') {
            roomManager.selectedRoomId = null; // Deselect room
        } else if (type === 'folder' && id === 'rooms-folder') {
            roomManager.selectedRoomId = null;
        }

        this.render(); // Update visual selection

        // Update properties panel
        if (window.propertiesPanelUI) {
            if (type === 'room') {
                window.propertiesPanelUI.showRoomProperties(id);
            } else if (type === 'scene') {
                window.propertiesPanelUI.showSceneProperties();
            } else if (type === 'folder' && id === 'rooms-folder') {
                window.propertiesPanelUI.showRoomsFolderProperties();
            }
        }
    }
}

export const scenePanelUI = new ScenePanelUI();
