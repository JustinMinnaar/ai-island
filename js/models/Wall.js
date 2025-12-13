import { Fixed } from './Fixed.js';
import { CONFIG } from '../config.js';

/**
 * Wall class - represents an edge-based wall in the world
 */
export class Wall extends Fixed {
    constructor(properties = {}) {
        super(properties);

        // Override object type
        this.objectType = 'Wall';

        // Wall-specific properties
        this.type = CONFIG.GAME.CELL_TYPES.WALL;

        // Edge direction (north, south, east, west)
        this.direction = properties.direction || CONFIG.GAME.EDGE_DIRECTIONS.NORTH;
    }

    /**
     * Get the wall key for storage
     * @returns {string} Wall key in format "x,y,z,direction"
     */
    getKey() {
        return `${this.x},${this.y},${this.z},${this.direction}`;
    }

    /**
     * Serialize to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            ...super.toJSON(),
            type: this.type,
            direction: this.direction
        };
    }

    /**
     * Create a Wall from JSON
     * @param {Object} data - JSON data
     * @returns {Wall} New Wall instance
     */
    static fromJSON(data) {
        return new Wall(data);
    }
}
