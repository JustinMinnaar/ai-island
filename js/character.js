// Character data model
import { GridInventory } from './inventory/grid-inventory.js';
import { CONFIG } from './config.js';

export class Character {
    constructor(properties = {}) {
        this.id = properties.id || this.generateId();
        this.typeId = properties.typeId || null; // Optional template reference
        this.name = properties.name || 'Unnamed Character';
        this.description = properties.description || '';
        this.race = properties.race || 'Human';
        this.class = properties.class || 'Warrior';
        this.skills = properties.skills || []; // [{name: string, value: number}]
        this.inventory = properties.inventory || new GridInventory(8, 4);
        this.notes = properties.notes || '';
        this.position = properties.position || { x: 0, y: 0, z: 0 };
        this.owner = properties.owner || 'gm'; // 'gm', 'player', 'ai'
    }

    generateId() {
        return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add or update skill
     */
    setSkill(name, value) {
        const existing = this.skills.find(s => s.name === name);
        if (existing) {
            existing.value = value;
        } else {
            this.skills.push({ name, value });
        }
    }

    /**
     * Get skill value
     */
    getSkill(name) {
        const skill = this.skills.find(s => s.name === name);
        return skill ? skill.value : 0;
    }

    /**
     * Remove skill
     */
    removeSkill(name) {
        this.skills = this.skills.filter(s => s.name !== name);
    }

    /**
     * Move character to position
     */
    moveTo(x, y, z) {
        this.position = { x, y, z };
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            typeId: this.typeId,
            name: this.name,
            description: this.description,
            race: this.race,
            class: this.class,
            skills: this.skills,
            inventory: this.inventory.toJSON(),
            notes: this.notes,
            position: this.position,
            owner: this.owner
        };
    }

    /**
     * Deserialize from JSON
     */
    static fromJSON(data) {
        const char = new Character(data);
        char.inventory = GridInventory.fromJSON(data.inventory);
        return char;
    }

    /**
     * Save character to JSON string
     */
    saveToJSON() {
        return JSON.stringify(this.toJSON(), null, 2);
    }

    /**
     * Load character from JSON string
     */
    static loadFromJSON(jsonString) {
        const data = JSON.parse(jsonString);
        return Character.fromJSON(data);
    }
}
