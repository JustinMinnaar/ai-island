import { Fixed } from './Fixed.js';
import { CONFIG } from '../config.js';

/**
 * Door class - represents an edge-based door in the world
 */
export class Door extends Fixed {
    constructor(properties = {}) {
        super(properties);

        // Override object type
        this.objectType = 'Door';

        // Door-specific properties
        this.type = CONFIG.GAME.CELL_TYPES.DOOR;

        // Edge direction (north, south, east, west)
        this.direction = properties.direction || CONFIG.GAME.EDGE_DIRECTIONS.NORTH;

        // Door state
        this.isOpen = properties.isOpen !== undefined ? properties.isOpen : false;

        // Door pivot (left or right)
        this.pivot = properties.pivot || CONFIG.GAME.DOOR_PIVOT.LEFT;

        // Required item ID for unlocking (null = no key required)
        this.requiredItemId = properties.requiredItemId || null;

        // Lock state
        this.isLocked = properties.isLocked !== undefined ? properties.isLocked : false;
    }

    /**
     * Toggle the door open/closed
     * @returns {boolean} New open state
     */
    toggle() {
        if (!this.isLocked) {
            this.isOpen = !this.isOpen;
        }
        return this.isOpen;
    }

    /**
     * Lock the door
     */
    lock() {
        this.isLocked = true;
        this.isOpen = false; // Close when locking
    }

    /**
     * Unlock the door (requires correct key item ID)
     * @param {number|null} keyItemId - The ID of the key item being used
     * @returns {boolean} True if unlocked successfully
     */
    unlock(keyItemId = null) {
        if (!this.requiredItemId || keyItemId === this.requiredItemId) {
            this.isLocked = false;
            return true;
        }
        return false;
    }

    /**
     * Get the door key for storage
     * @returns {string} Door key in format "x,y,z,direction"
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
            direction: this.direction,
            isOpen: this.isOpen,
            pivot: this.pivot,
            requiredItemId: this.requiredItemId,
            isLocked: this.isLocked
        };
    }

    /**
     * Create a Door from JSON
     * @param {Object} data - JSON data
     * @returns {Door} New Door instance
     */
    static fromJSON(data) {
        return new Door(data);
    }
}
