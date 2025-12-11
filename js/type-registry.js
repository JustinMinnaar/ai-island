// Type Registry - Manages item, creature, and character type definitions
import { CONFIG } from './config.js';

class TypeRegistry {
    constructor() {
        this.types = new Map(); // typeId -> type definition
        this.nextIds = {
            item: 101,
            creature: 1001,
            character: 2001
        };
    }

    /**
     * Create a new type
     * @param {string} category - 'item', 'creature', or 'character'
     * @param {object} properties - Type properties
     * @returns {number} Generated type ID
     */
    createType(category, properties) {
        const id = this.nextIds[category]++;

        const type = {
            id,
            category,
            ...properties
        };

        // Validate based on category
        if (category === 'item') {
            if (!type.gridWidth || !type.gridHeight || type.maxStack === undefined) {
                throw new Error('Item types require gridWidth, gridHeight, and maxStack');
            }
        }

        this.types.set(id, type);
        console.log(`✅ Created ${category} type "${type.name}" with ID ${id}`);
        return id;
    }

    /**
     * Get type by ID
     */
    getType(typeId) {
        return this.types.get(typeId);
    }

    /**
     * Get all types of a category
     */
    getTypesByCategory(category) {
        return Array.from(this.types.values()).filter(t => t.category === category);
    }

    /**
     * Update existing type
     */
    updateType(typeId, properties) {
        const type = this.types.get(typeId);
        if (!type) {
            throw new Error(`Type ${typeId} not found`);
        }

        Object.assign(type, properties);
        console.log(`📝 Updated type ${typeId}`);
    }

    /**
     * Delete type
     */
    deleteType(typeId) {
        const type = this.types.get(typeId);
        if (!type) {
            throw new Error(`Type ${typeId} not found`);
        }

        this.types.delete(typeId);
        console.log(`🗑️ Deleted type ${typeId}`);
    }

    /**
     * Export all types to JSON
     */
    exportToJSON() {
        const data = {
            types: Array.from(this.types.values()),
            nextIds: this.nextIds
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import types from JSON
     */
    importFromJSON(json) {
        const data = typeof json === 'string' ? JSON.parse(json) : json;

        this.types.clear();
        data.types.forEach(type => {
            this.types.set(type.id, type);
        });

        if (data.nextIds) {
            this.nextIds = data.nextIds;
        }

        console.log(`📥 Imported ${data.types.length} types`);
    }

    /**
     * Load starter types on first run
     */
    loadStarterTypes() {
        if (this.types.size > 0) {
            console.log('⏭️ Starter types already loaded, skipping');
            return;
        }

        // Will import from starter-types.js
        console.log('📦 Loading starter types...');
    }
}

export const typeRegistry = new TypeRegistry();
