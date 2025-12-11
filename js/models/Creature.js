import { Item } from './Item.js';
import { GridInventory } from '../inventory/grid-inventory.js';

export class Creature extends Item {
    constructor(properties = {}) {
        super(properties);

        // Stats
        this.health = properties.health || { current: 10, max: 10 };
        this.stats = properties.stats || { str: 10, dex: 10, int: 10 };

        // Skills (Array of objects for serialization compatibility)
        this.skills = properties.skills || [];

        // Inventory
        if (properties.inventory instanceof GridInventory) {
            this.inventory = properties.inventory;
        } else if (properties.inventory) {
            this.inventory = GridInventory.fromJSON(properties.inventory);
        } else {
            this.inventory = new GridInventory(8, 4);
        }
    }

    // Skill Methods
    setSkill(name, value) {
        const existing = this.skills.find(s => s.name === name);
        if (existing) {
            existing.value = value;
        } else {
            this.skills.push({ name, value });
        }
    }

    getSkill(name) {
        const skill = this.skills.find(s => s.name === name);
        return skill ? skill.value : 0;
    }

    removeSkill(name) {
        this.skills = this.skills.filter(s => s.name !== name);
    }

    toJSON() {
        const json = super.toJSON();
        return {
            ...json,
            health: this.health,
            stats: this.stats,
            skills: this.skills,
            inventory: this.inventory.toJSON()
        };
    }

    static fromJSON(data) {
        const creature = new Creature(data);
        // Inventory handling is in constructor
        return creature;
    }
}
