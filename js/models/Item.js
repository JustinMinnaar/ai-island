import { GameObject } from './Object.js';

export class Item extends GameObject {
    constructor(properties = {}) {
        super(properties);

        // Override object type
        this.objectType = 'Item';

        this.typeId = properties.typeId || null; // Template reference

        // Flatten position for compatibility with World/Renderer (already in GameObject)
        // Just ensure we handle the position object if provided
        if (properties.position) {
            const pos = properties.position;
            this.x = pos.x !== undefined ? pos.x : this.x;
            this.y = pos.y !== undefined ? pos.y : this.y;
            this.z = pos.z !== undefined ? pos.z : this.z;
        }

        this.imageURL = properties.imageURL || null;
        this.owner = properties.owner || 'gm';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            typeId: this.typeId,
            imageURL: this.imageURL,
            owner: this.owner
        };
    }

    static fromJSON(data) {
        return new Item(data);
    }
}
