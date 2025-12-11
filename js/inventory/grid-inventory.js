// Grid-based inventory system (Tetris-style)
import { typeRegistry } from '../type-registry.js';

export class GridInventory {
    constructor(width = 8, height = 4) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
        this.items = []; // Array of {typeId, count, x, y}
    }

    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.height; y++) {
            grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                grid[y][x] = null; // null = empty, number = item index in this.items
            }
        }
        return grid;
    }

    /**
     * Check if item can be placed at position
     */
    canPlaceItem(itemType, x, y) {
        // Check bounds
        if (x < 0 || y < 0 || x + itemType.gridWidth > this.width || y + itemType.gridHeight > this.height) {
            return false;
        }

        // Check if cells are empty (or check for stacking)
        for (let dy = 0; dy < itemType.gridHeight; dy++) {
            for (let dx = 0; dx < itemType.gridWidth; dx++) {
                const cellValue = this.grid[y + dy][x + dx];

                if (cellValue !== null) {
                    // Cell occupied - check if we can stack
                    const existingItem = this.items[cellValue];
                    if (existingItem && existingItem.typeId === itemType.id &&
                        existingItem.count < itemType.maxStack) {
                        // Can stack here
                        continue;
                    }
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Place item at position
     */
    placeItem(typeId, count, x, y) {
        const itemType = typeRegistry.getType(typeId);
        if (!itemType) {
            throw new Error(`Unknown item type ${typeId}`);
        }

        // Check for stacking with existing item
        const cellValue = this.grid[y][x];
        if (cellValue !== null) {
            const existingItem = this.items[cellValue];
            if (existingItem.typeId === typeId) {
                const newCount = existingItem.count + count;
                if (newCount <= itemType.maxStack) {
                    existingItem.count = newCount;
                    console.log(`📦 Stacked ${count} ${itemType.name} (total: ${newCount})`);
                    return cellValue;
                } else {
                    throw new Error(`Cannot stack ${count} items, max stack is ${itemType.maxStack}`);
                }
            }
        }

        if (!this.canPlaceItem(itemType, x, y)) {
            throw new Error(`Cannot place ${itemType.name} at (${x}, ${y})`);
        }

        // Create new item entry
        const itemIndex = this.items.length;
        this.items.push({ typeId, count, x, y });

        // Mark grid cells
        for (let dy = 0; dy < itemType.gridHeight; dy++) {
            for (let dx = 0; dx < itemType.gridWidth; dx++) {
                this.grid[y + dy][x + dx] = itemIndex;
            }
        }

        console.log(`✅ Placed ${count}x ${itemType.name} at (${x}, ${y})`);
        return itemIndex;
    }

    /**
     * Remove item at position
     */
    removeItem(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }

        const itemIndex = this.grid[y][x];
        if (itemIndex === null) {
            return null;
        }

        const item = this.items[itemIndex];
        const itemType = typeRegistry.getType(item.typeId);

        // Clear grid cells
        for (let dy = 0; dy < itemType.gridHeight; dy++) {
            for (let dx = 0; dx < itemType.gridWidth; dx++) {
                this.grid[item.y + dy][item.x + dx] = null;
            }
        }

        // Remove from items array
        this.items[itemIndex] = null;

        console.log(`🗑️ Removed ${item.count}x ${itemType.name}`);
        return item;
    }

    /**
     * Get item at position
     */
    getItemAt(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }

        const itemIndex = this.grid[y][x];
        return itemIndex !== null ? this.items[itemIndex] : null;
    }

    /**
     * Find available space for item
     */
    findSpaceFor(itemType) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.canPlaceItem(itemType, x, y)) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            width: this.width,
            height: this.height,
            items: this.items.filter(item => item !== null)
        };
    }

    /**
     * Deserialize from JSON
     */
    static fromJSON(data) {
        const inventory = new GridInventory(data.width, data.height);
        data.items.forEach(item => {
            inventory.placeItem(item.typeId, item.count, item.x, item.y);
        });
        return inventory;
    }
}
