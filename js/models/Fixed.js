import { GameObject } from './Object.js';

/**
 * Base class for fixed objects (walls, floors, doors, pillars, ramps, stairs)
 * Fixed objects cannot be moved and are part of the world structure
 */
export class Fixed extends GameObject {
    constructor(properties = {}) {
        super(properties);

        // Override object type
        this.objectType = properties.objectType || 'Fixed';

        // Visual properties
        this.color = properties.color || '#808080';
        this.material = properties.material || 'stone';

        // Room assignment
        this.roomNumber = properties.roomNumber !== undefined ? properties.roomNumber : 0;
    }

    /**
     * Serialize to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            ...super.toJSON(),
            color: this.color,
            material: this.material,
            roomNumber: this.roomNumber
        };
    }

    /**
     * Create a Fixed object from JSON
     * @param {Object} data - JSON data
     * @returns {Fixed} New Fixed instance
     */
    static fromJSON(data) {
        return new Fixed(data);
    }
}
