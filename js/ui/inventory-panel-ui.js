// Inventory Panel UI - Grid-based inventory management
import { world } from '../world.js';
import { typeRegistry } from '../type-registry.js';
import { assetManager } from '../managers/asset-manager.js';
import { renderer } from '../renderer-3d.js';

class InventoryPanelUI {
    constructor() {
        this.container = null;
        this.currentCharacter = null;
        this.selectedSlot = null;
        this.draggedItem = null;
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'inventory-panel';
        this.container.className = 'side-panel right-panel inventory-panel collapsed';
        document.body.appendChild(this.container);
    }

    show(character) {
        this.currentCharacter = character;
        this.container.classList.remove('collapsed');
        this.render();
    }

    hide() {
        this.container.classList.add('collapsed');
        this.currentCharacter = null;
    }

    render() {
        if (!this.container || !this.currentCharacter) return;

        let html = '<div class="panel-header">';
        html += `<h3>🎒 Inventory - ${this.currentCharacter.name}</h3>`;
        html += '<button class="panel-close" onclick="inventoryPanelUI.hide()">×</button>';
        html += '</div>';

        html += '<div class="panel-content">';
        html += this.renderGrid();
        html += '</div>';

        html += '<div class="panel-actions">';
        html += '<button class="action-btn" onclick="inventoryPanelUI.autoMerge()">Auto-Merge</button>';
        html += '</div>';

        this.container.innerHTML = html;
    }

    renderGrid() {
        const inventory = this.currentCharacter.inventory;
        let html = '<div class="inventory-grid">';

        for (let y = 0; y < inventory.height; y++) {
            for (let x = 0; x < inventory.width; x++) {
                const item = inventory.getItemAt(x, y);
                const cellClass = item ? 'inventory-cell occupied' : 'inventory-cell';

                html += `<div class="${cellClass}" data-x="${x}" data-y="${y}" `;
                html += `onclick="inventoryPanelUI.selectSlot(${x}, ${y})" `;
                html += `ondrop="inventoryPanelUI.onDrop(event, ${x}, ${y})" `;
                html += `ondragover="event.preventDefault()">`;

                if (item) {
                    const itemType = typeRegistry.getType(item.typeId);
                    if (itemType) {
                        // Only show if this is the top-left cell of the item
                        if (item.x === x && item.y === y) {
                            html += `<div class="inventory-item" draggable="true" `;
                            html += `ondragstart="inventoryPanelUI.onDragStart(event, ${x}, ${y})" `;
                            html += `style="width: ${itemType.gridWidth * 100}%; height: ${itemType.gridHeight * 100}%;">`;
                            html += `<div class="item-name">${itemType.name}</div>`;
                            if (item.count > 1) {
                                html += `<div class="item-count">${item.count}</div>`;
                            }
                            html += `</div>`;
                        }
                    }
                }

                html += '</div>';
            }
        }

        html += '</div>';
        return html;
    }

    selectSlot(x, y) {
        this.selectedSlot = { x, y };
        // Could highlight selected slot
    }

    onDragStart(event, x, y) {
        this.draggedItem = { x, y };
        event.dataTransfer.effectAllowed = 'move';
    }

    onDrop(event, targetX, targetY) {
        event.preventDefault();
        if (!this.draggedItem) return;

        const inventory = this.currentCharacter.inventory;
        const item = inventory.getItemAt(this.draggedItem.x, this.draggedItem.y);

        if (!item) return;

        const itemType = typeRegistry.getType(item.typeId);
        if (!itemType) return;

        // Remove from old position
        inventory.removeItem(this.draggedItem.x, this.draggedItem.y);

        // Try to place at new position
        try {
            inventory.placeItem(item.typeId, item.count, targetX, targetY);
        } catch (error) {
            // If placement fails, put it back
            inventory.placeItem(item.typeId, item.count, this.draggedItem.x, this.draggedItem.y);
            alert('Cannot place item there');
        }

        this.draggedItem = null;
        this.render();
    }

    autoMerge() {
        if (!this.currentCharacter) return;

        const inventory = this.currentCharacter.inventory;
        const itemsByType = new Map();

        // Collect all items by type
        inventory.items.forEach((item, idx) => {
            if (!item) return;
            if (!itemsByType.has(item.typeId)) {
                itemsByType.set(item.typeId, []);
            }
            itemsByType.get(item.typeId).push({ item, idx });
        });

        // Merge stacks
        itemsByType.forEach((items, typeId) => {
            if (items.length <= 1) return;

            const itemType = typeRegistry.getType(typeId);
            if (!itemType) return;

            // Sort by count descending
            items.sort((a, b) => b.item.count - a.item.count);

            // Try to merge into first stack
            for (let i = 1; i < items.length; i++) {
                const source = items[i].item;
                const target = items[0].item;

                const spaceLeft = itemType.maxStack - target.count;
                if (spaceLeft > 0) {
                    const toMove = Math.min(source.count, spaceLeft);
                    target.count += toMove;
                    source.count -= toMove;

                    if (source.count === 0) {
                        // Remove empty stack
                        inventory.removeItem(source.x, source.y);
                    }
                }
            }
        });

        this.render();
        alert('Items merged!');
    }
}

export const inventoryPanelUI = new InventoryPanelUI();
window.inventoryPanelUI = inventoryPanelUI;
