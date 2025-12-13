/**
 * Base class for all game objects
 * Provides centralized ID management and common properties
 */
export class GameObject {
    // Static counter for incremental IDs
    static nextId = 1;

    // Registry to track all objects by ID
    static objectRegistry = new Map();

    /**
     * Reset the ID counter (useful for testing or loading saved games)
     * @param {number} startId - The ID to start from
     */
    static resetIdCounter(startId = 1) {
        GameObject.nextId = startId;
    }

    /**
     * Get the next available ID and increment the counter
     * @returns {number} The next unique ID
     */
    static getNextId() {
        return GameObject.nextId++;
    }

    /**
     * Register an object in the global registry
     * @param {GameObject} obj - The object to register
     */
    static registerObject(obj) {
        GameObject.objectRegistry.set(obj.id, obj);
    }

    /**
     * Unregister an object from the global registry
     * @param {number} id - The ID of the object to unregister
     */
    static unregisterObject(id) {
        GameObject.objectRegistry.delete(id);
    }

    /**
     * Get an object by ID from the global registry
     * @param {number} id - The ID of the object
     * @returns {GameObject|null} The object or null if not found
     */
    static getObjectById(id) {
        return GameObject.objectRegistry.get(id) || null;
    }

    /**
     * Clear the object registry (useful for loading new worlds)
     */
    static clearRegistry() {
        GameObject.objectRegistry.clear();
    }

    constructor(properties = {}) {
        // Assign ID: use provided ID (for loading) or generate new one
        if (properties.id !== undefined && properties.id !== null) {
            this.id = properties.id;
            // Update nextId if loaded ID is higher
            if (this.id >= GameObject.nextId) {
                GameObject.nextId = this.id + 1;
            }
        } else {
            this.id = GameObject.getNextId();
        }

        // Register this object
        GameObject.registerObject(this);

        // Object type (to be set by subclasses)
        this.objectType = properties.objectType || 'GameObject';

        // Position in world
        this.x = properties.x !== undefined ? properties.x : 0;
        this.y = properties.y !== undefined ? properties.y : 0;
        this.z = properties.z !== undefined ? properties.z : 0;

        // Name and description
        this.name = properties.name || 'Unnamed Object';
        this.description = properties.description || '';
    }

    /**
     * Set the position of this object
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate (elevation)
     * @param {number} z - Z coordinate
     */
    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Get the position as an object
     * @returns {{x: number, y: number, z: number}}
     */
    get position() {
        return { x: this.x, y: this.y, z: this.z };
    }

    /**
     * Serialize this object to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            objectType: this.objectType,
            x: this.x,
            y: this.y,
            z: this.z,
            name: this.name,
            description: this.description
        };
    }

    /**
     * Create an object from JSON data
     * @param {Object} data - JSON data
     * @returns {GameObject} New object instance
     */
    static fromJSON(data) {
        return new GameObject(data);
    }

    /**
     * Destroy this object and unregister it
     */
    destroy() {
        GameObject.unregisterObject(this.id);
    }
}
