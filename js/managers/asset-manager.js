// Asset Manager - Manages instances created from types
import { typeRegistry } from '../type-registry.js';

class AssetManager {
    constructor() {
        this.instances = new Map(); // instanceId -> instance data
        this.instanceCounter = 0;
    }

    /**
     * Generate unique instance ID
     */
    generateInstanceId() {
        return `inst_${Date.now()}_${this.instanceCounter++}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create instance from type
     */
    createInstance(typeId, properties = {}) {
        const type = typeRegistry.getType(typeId);
        if (!type) {
            throw new Error(`Type ${typeId} not found`);
        }

        const instanceId = this.generateInstanceId();
        const instance = {
            instanceId,
            typeId,
            position: properties.position || { x: 0, y: 0, z: 0 },
            count: properties.count || 1,
            customProperties: properties.customProperties || {}
        };

        this.instances.set(instanceId, instance);
        console.log(`✨ Created instance of "${type.name}" (ID: ${instanceId})`);
        return instance;
    }

    /**
     * Get instance by ID
     */
    getInstance(instanceId) {
        return this.instances.get(instanceId);
    }

    /**
     * Get all instances of a type
     */
    getInstancesByType(typeId) {
        return Array.from(this.instances.values()).filter(inst => inst.typeId === typeId);
    }

    /**
     * Get instances at position
     */
    getInstancesAt(x, y, z) {
        return Array.from(this.instances.values()).filter(inst =>
            inst.position.x === x && inst.position.y === y && inst.position.z === z
        );
    }

    /**
     * Update instance
     */
    updateInstance(instanceId, properties) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            throw new Error(`Instance ${instanceId} not found`);
        }

        Object.assign(instance, properties);
    }

    /**
     * Delete instance
     */
    deleteInstance(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            return false;
        }

        this.instances.delete(instanceId);
        const type = typeRegistry.getType(instance.typeId);
        console.log(`🗑️ Deleted instance of "${type?.name || 'Unknown'}"`);
        return true;
    }

    /**
     * Move instance to position
     */
    moveInstance(instanceId, x, y, z) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            throw new Error(`Instance ${instanceId} not found`);
        }

        instance.position = { x, y, z };
    }

    /**
     * Clear all instances
     */
    clear() {
        this.instances.clear();
        this.instanceCounter = 0;
    }

    /**
     * Export to JSON
     */
    toJSON() {
        return {
            instances: Array.from(this.instances.values()),
            instanceCounter: this.instanceCounter
        };
    }

    /**
     * Import from JSON
     */
    fromJSON(data) {
        this.clear();
        data.instances.forEach(inst => {
            this.instances.set(inst.instanceId, inst);
        });
        this.instanceCounter = data.instanceCounter || 0;
    }
}

export const assetManager = new AssetManager();
