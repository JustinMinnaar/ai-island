import { Fixed } from './Fixed.js';
import { CONFIG } from '../config.js';

/**
 * Floor class - represents a floor tile in the world
 */
export class Floor extends Fixed {
    constructor(properties = {}) {
        super(properties);

        // Override object type
        this.objectType = 'Floor';

        // Floor-specific properties
        this.type = CONFIG.GAME.CELL_TYPES.FLOOR;
    }

    /**
     * Serialize to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            ...super.toJSON(),
            type: this.type
        };
    }

    /**
     * Create a Floor from JSON
     * @param {Object} data - JSON data
     * @returns {Floor} New Floor instance
     */
    static fromJSON(data) {
        return new Floor(data);
    }
}
