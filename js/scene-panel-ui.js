// Scene Panel UI Controller
import { world } from './world.js';
import { roomManager } from './room-manager.js';
import { renderer } from './renderer-3d.js';

class ScenePanelUI {
    constructor() {
        this.treeContainer = document.getElementById('scene-tree');
        this.selectedId = null;
        this.expandedNodes = new Set(['rooms-folder', 'items', 'creatures', 'characters']); // Default expanded
        this.init();
    }

    init() {
        this.render();
        // Update tree when world changes
        setInterval(() => this.render(), 1000); // Update every second
    }

    render() {
        if (!this.treeContainer) return;

        // Save scroll position
        const scrollTop = this.treeContainer.scrollTop;

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

        const isRoomsExpanded = this.expandedNodes.has('rooms-folder');
        const isRoomsSelected = this.selectedId === 'rooms-folder';

        html += `<div class="tree-node expandable ${isRoomsExpanded ? '' : 'collapsed'} ${isRoomsSelected ? 'selected' : ''}" data-type="folder" data-id="rooms-folder">
            <span class="expand-icon">▼</span>
            <span class="node-icon">📁</span>
            <span class="node-label">Rooms</span>
        </div>`;

        if (isRoomsExpanded) {
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
        }

        // Containers section (Items, etc.)
        html += this.renderContainersSection();

        html += '</div>'; // End Scene children

        this.treeContainer.innerHTML = html;
        this.treeContainer.scrollTop = scrollTop; // Restore scroll
        this.attachEventListeners();
    }

    renderContainersSection() {
        const entities = world.getAllEntities();
        // Assuming entities has all types, filter them
        const items = entities.filter(e => e.type === 'item');
        const creatures = entities.filter(e => e.type === 'creature');
        const characters = entities.filter(e => e.type === 'character' || e.type === 'hero'); // hero fallback

        let html = '';

        html += this.renderContainer('Items', '📦', items, 'items');
        html += this.renderContainer('Creatures', '🐉', creatures, 'creatures');
        html += this.renderContainer('Characters', '🧙', characters, 'characters');

        return html;
    }

    renderContainer(label, icon, entityList, containerId) {
        const count = entityList.length;
        const isExpanded = this.expandedNodes.has(containerId);
        const isSelected = this.selectedId === containerId;

        let html = `
            <div class="tree-node expandable ${isExpanded ? '' : 'collapsed'} ${isSelected ? 'selected' : ''}" data-type="container" data-id="${containerId}">
                <span class="expand-icon">▼</span>
                <span class="node-icon">${icon}</span>
                <span class="node-label">${label}</span>
                <span class="node-count">(${count})</span>
            </div>
        `;

        if (isExpanded && count > 0) {
            html += '<div class="tree-children">';
            entityList.forEach(entity => {
                const isEntitySelected = world.selectedEntity === entity.id;
                html += `
                    <div class="tree-node entity-node ${isEntitySelected ? 'selected' : ''}" data-type="entity" data-id="${entity.id}" style="padding-left: 40px;">
                        <span class="node-icon">🔹</span>
                        <span class="node-label">${entity.name}</span>
                        <span class="node-id">(${entity.id})</span>
                    </div>
                `;
            });
            html += '</div>';
        }
        return html;
    }

    attachEventListeners() {
        // Generic node click handler
        this.treeContainer.querySelectorAll('.tree-node').forEach(node => {
            node.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent bubbling

                const type = node.dataset.type;
                const id = node.dataset.id;
                const isExpandable = node.classList.contains('expandable');
                const isExpandIcon = e.target.classList.contains('expand-icon');

                // If clicking arrow OR double clicking (simulation), toggle.
                // For now, toggle if expandable and not leaf selection, or always toggle if arrow clicked.
                if (isExpandable) {
                    // Toggle expand state
                    if (this.expandedNodes.has(id)) {
                        this.expandedNodes.delete(id);
                    } else {
                        this.expandedNodes.add(id);
                    }
                    this.render(); // Re-render to update children views
                }

                // Selection Logic
                if (!isExpandIcon) {
                    this.handleSelection(type, id);
                }
            });
        });
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
        } else if (type === 'entity') {
            world.selectEntity(id);
            // Ensure properties panel updates
            if (window.propertiesPanelUI) window.propertiesPanelUI.render();
        }

        this.render(); // Update visual selection

        // Update properties panel (Room/Scene context)
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
