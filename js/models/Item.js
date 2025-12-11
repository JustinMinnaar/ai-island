export class Item {
    constructor(properties = {}) {
        this.id = properties.id || this.generateId();
        this.typeId = properties.typeId || null; // Template reference
        this.name = properties.name || 'Unnamed Item';
        this.description = properties.description || '';

        // Flatten position for compatibility with World/Renderer
        const pos = properties.position || {};
        this.x = pos.x !== undefined ? pos.x : (properties.x || 0);
        this.y = pos.y !== undefined ? pos.y : (properties.y || 0);
        this.z = pos.z !== undefined ? pos.z : (properties.z || 0);

        this.imageURL = properties.imageURL || null;
        this.owner = properties.owner || 'gm';
    }

    generateId() {
        return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    get position() {
        return { x: this.x, y: this.y, z: this.z };
    }

    toJSON() {
        return {
            id: this.id,
            typeId: this.typeId,
            name: this.name,
            description: this.description,
            position: { x: this.x, y: this.y, z: this.z }, // Keep JSON structure for compatibility
            imageURL: this.imageURL,
            owner: this.owner
        };
    }

    static fromJSON(data) {
        return new Item(data);
    }
}
