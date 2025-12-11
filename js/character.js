// Character data model
import { Creature } from './models/Creature.js';

export class Character extends Creature {
    constructor(properties = {}) {
        super(properties);

        this.playerName = properties.playerName || ''; // Player controlling this character
        this.race = properties.race || 'Human';
        this.class = properties.class || 'Warrior';
        this.notes = properties.notes || '';

        // Override ID generation if needed, or stick with Item's default
        if (!properties.id) {
            this.id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    moveTo(x, y, z) {
        // Alias for setPosition from Item
        this.setPosition(x, y, z);
    }

    toJSON() {
        const json = super.toJSON();
        return {
            ...json,
            playerName: this.playerName,
            race: this.race,
            class: this.class,
            notes: this.notes
        };
    }

    static fromJSON(data) {
        return new Character(data);
    }

    // Helper static methods for saving/loading
    saveToJSON() {
        return JSON.stringify(this.toJSON(), null, 2);
    }

    static loadFromJSON(jsonString) {
        const data = JSON.parse(jsonString);
        return Character.fromJSON(data);
    }
}
