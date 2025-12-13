// World state management with object-based architecture
import { CONFIG } from './config.js';
import { GameObject } from './models/Object.js';
import { Floor } from './models/Floor.js';
import { Wall } from './models/Wall.js';
import { Door } from './models/Door.js';
import { Item } from './models/Item.js';
import { Creature } from './models/Creature.js';
import { Character } from './character.js';

class World {
    constructor() {
        // All objects stored by ID in a single registry (managed by GameObject)
        // We keep separate Maps for quick lookups by position/type
        this.cells = new Map(); // Map of "x,y,z" -> Floor object ID
        this.walls = new Map(); // Map of "x,y,z,direction" -> Wall object ID
        this.doors = new Map(); // Map of "x,y,z,direction" -> Door object ID
        this.entities = new Map(); // Map of entityId -> entity object (legacy, for compatibility)
        this.itemInstances = new Map(); // Map of item ID -> Item object
        this.characters = new Map(); // Map of character ID -> Character object
        this.creatures = new Map(); // Map of creature ID -> Creature object

        this.selectedCell = null;
        this.selectedEntity = null;
        this.selectedEntities = []; // Multiple selection support
        this.bounds = {
            minX: CONFIG.WORLD.MIN_X,
            maxX: CONFIG.WORLD.MAX_X,
            minZ: CONFIG.WORLD.MIN_Z,
            maxZ: CONFIG.WORLD.MAX_Z,
            minY: CONFIG.WORLD.MIN_Y,
            maxY: CONFIG.WORLD.MAX_Y
        };
    }

    // ===== Object Management =====

    /**
     * Get any object by its ID
     * @param {number} id - Object ID
     * @returns {GameObject|null}
     */
    getObjectById(id) {
        return GameObject.getObjectById(id);
    }

    // ===== Cell Methods =====

    getCellKey(x, y, z) {
        return `${x},${y},${z}`;
    }

    setCell(x, y, z, data) {
        const key = this.getCellKey(x, y, z);

        // Create a Floor object instead of plain data
        const floor = new Floor({
            x, y, z,
            name: data.name || `Floor at ${x},${y},${z}`,
            color: data.color,
            material: data.material,
            roomNumber: data.roomNumber !== undefined ? data.roomNumber : 0,
            ...data
        });

        // Store the Floor object's ID in the cells map
        this.cells.set(key, floor.id);
    }

    getCell(x, y, z) {
        const key = this.getCellKey(x, y, z);
        const floorId = this.cells.get(key);
        if (!floorId) return null;

        return this.getObjectById(floorId);
    }

    removeCell(x, y, z) {
        const key = this.getCellKey(x, y, z);
        const floorId = this.cells.get(key);
        if (floorId) {
            const floor = this.getObjectById(floorId);
            if (floor) floor.destroy();
        }
        this.cells.delete(key);
    }

    // ===== Wall Methods (Edge-Based) =====

    getWallKey(x, y, z, direction) {
        return `${x},${y},${z},${direction}`;
    }

    setWall(x, y, z, direction, data = {}) {
        const key = this.getWallKey(x, y, z, direction);

        // Create a Wall object instead of plain data
        const wall = new Wall({
            x, y, z, direction,
            name: data.name || `Wall at ${x},${y},${z} ${direction}`,
            color: data.color,
            material: data.material,
            roomNumber: data.roomNumber,
            ...data
        });

        // Store the Wall object's ID in the walls map
        this.walls.set(key, wall.id);
    }

    getWall(x, y, z, direction) {
        const key = this.getWallKey(x, y, z, direction);
        const wallId = this.walls.get(key);
        if (!wallId) return null;

        return this.getObjectById(wallId);
    }

    removeWall(x, y, z, direction) {
        const key = this.getWallKey(x, y, z, direction);
        const wallId = this.walls.get(key);
        if (wallId) {
            const wall = this.getObjectById(wallId);
            if (wall) wall.destroy();
        }
        this.walls.delete(key);
    }

    getAllWalls() {
        const wallIds = Array.from(this.walls.values());
        return wallIds.map(id => this.getObjectById(id)).filter(w => w !== null);
    }

    getWallsAt(x, y, z) {
        const walls = [];
        const directions = [
            CONFIG.GAME.EDGE_DIRECTIONS.NORTH,
            CONFIG.GAME.EDGE_DIRECTIONS.SOUTH,
            CONFIG.GAME.EDGE_DIRECTIONS.EAST,
            CONFIG.GAME.EDGE_DIRECTIONS.WEST
        ];

        for (const dir of directions) {
            const wall = this.getWall(x, y, z, dir);
            if (wall) walls.push(wall);
        }
        return walls;
    }

    // ===== Door Methods (Edge-Based) =====

    getDoorKey(x, y, z, direction) {
        return `${x},${y},${z},${direction}`;
    }

    setDoor(x, y, z, direction, data = {}) {
        const key = this.getDoorKey(x, y, z, direction);

        // Create a Door object instead of plain data
        const door = new Door({
            x, y, z, direction,
            name: data.name || `Door at ${x},${y},${z} ${direction}`,
            isOpen: data.isOpen !== undefined ? data.isOpen : false,
            pivot: data.pivot || CONFIG.GAME.DOOR_PIVOT.LEFT,
            requiredItemId: data.requiredItemId || null,
            isLocked: data.isLocked !== undefined ? data.isLocked : false,
            color: data.color,
            material: data.material,
            roomNumber: data.roomNumber,
            ...data
        });

        // Store the Door object's ID in the doors map
        this.doors.set(key, door.id);
    }

    getDoor(x, y, z, direction) {
        const key = this.getDoorKey(x, y, z, direction);
        const doorId = this.doors.get(key);
        if (!doorId) return null;

        return this.getObjectById(doorId);
    }

    removeDoor(x, y, z, direction) {
        const key = this.getDoorKey(x, y, z, direction);
        const doorId = this.doors.get(key);
        if (doorId) {
            const door = this.getObjectById(doorId);
            if (door) door.destroy();
        }
        this.doors.delete(key);
    }

    getAllDoors() {
        const doorIds = Array.from(this.doors.values());
        return doorIds.map(id => this.getObjectById(id)).filter(d => d !== null);
    }

    toggleDoor(x, y, z, direction) {
        const door = this.getDoor(x, y, z, direction);
        if (door) {
            return door.toggle();
        }
        return null;
    }

    // ===== Entity Methods (Legacy compatibility) =====

    updateEntities(entitiesData) {
        if (!entitiesData) return;
        this.entities.clear();
        entitiesData.forEach(entity => {
            this.entities.set(entity.id, {
                ...entity,
                x: entity.x || 0,
                y: entity.y || 0,
                z: entity.z || 0
            });
        });
    }

    updateEntity(entityData) {
        // Handle both plain objects and class instances
        if (entityData instanceof Character) {
            this.characters.set(entityData.id, entityData);
            this.entities.set(entityData.id, entityData);
        } else if (entityData instanceof Creature) {
            this.creatures.set(entityData.id, entityData);
            this.entities.set(entityData.id, entityData);
        } else if (entityData instanceof Item) {
            this.itemInstances.set(entityData.id, entityData);
            this.entities.set(entityData.id, entityData);
        } else {
            // Legacy plain object support
            if (this.entities.has(entityData.id)) {
                const existing = this.entities.get(entityData.id);
                this.entities.set(entityData.id, { ...existing, ...entityData });
            } else {
                this.entities.set(entityData.id, entityData);
            }
        }
    }

    removeEntity(id) {
        const entity = this.getObjectById(id);
        if (entity) {
            entity.destroy();
        }
        this.entities.delete(id);
        this.characters.delete(id);
        this.creatures.delete(id);
        this.itemInstances.delete(id);
    }

    getEntity(id) {
        // Try to get from GameObject registry first
        const obj = this.getObjectById(id);
        if (obj) return obj;

        // Fallback to legacy entities map
        return this.entities.get(id) || null;
    }

    getAllEntities() {
        // Return all entities (items, creatures, characters)
        const items = Array.from(this.itemInstances.values());
        const creatures = Array.from(this.creatures.values());
        const characters = Array.from(this.characters.values());

        // Also include legacy entities that aren't in the new maps
        const legacyEntities = Array.from(this.entities.values()).filter(e =>
            !this.itemInstances.has(e.id) &&
            !this.creatures.has(e.id) &&
            !this.characters.has(e.id)
        );

        return [...items, ...creatures, ...characters, ...legacyEntities];
    }

    getEntitiesAt(x, y, z) {
        return this.getAllEntities().filter(e =>
            Math.floor(e.x) === x &&
            Math.floor(e.y) === y &&
            Math.floor(e.z) === z
        );
    }

    getEntitiesInRange(x, y, z, range) {
        return this.getAllEntities().filter(e => {
            const dx = e.x - x;
            const dy = e.y - y;
            const dz = e.z - z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz) <= range;
        });
    }

    // ===== Item Instance Methods =====

    addItemInstance(instance) {
        if (instance instanceof Item) {
            this.itemInstances.set(instance.id, instance);
        } else {
            // Convert plain object to Item instance
            const item = new Item(instance);
            this.itemInstances.set(item.id, item);
        }
    }

    removeItemInstance(instanceId) {
        const item = this.itemInstances.get(instanceId);
        if (item && item.destroy) {
            item.destroy();
        }
        this.itemInstances.delete(instanceId);
    }

    getItemInstance(instanceId) {
        return this.itemInstances.get(instanceId) || null;
    }

    getItemsAt(x, y, z) {
        return Array.from(this.itemInstances.values()).filter(item =>
            item.x === x && item.y === y && item.z === z
        );
    }

    getAllItemInstances() {
        return Array.from(this.itemInstances.values());
    }

    // ===== Character Methods =====

    addCharacter(character) {
        if (character instanceof Character) {
            this.characters.set(character.id, character);
            this.entities.set(character.id, character);
        } else {
            // Convert plain object to Character instance
            const char = new Character(character);
            this.characters.set(char.id, char);
            this.entities.set(char.id, char);
        }
    }

    removeCharacter(id) {
        const char = this.characters.get(id);
        if (char && char.destroy) {
            char.destroy();
        }
        this.characters.delete(id);
        this.entities.delete(id);
    }

    getCharacter(id) {
        return this.characters.get(id) || null;
    }

    getCharacterAt(x, y, z) {
        return Array.from(this.characters.values()).find(char =>
            char.x === x && char.y === y && char.z === z
        );
    }

    getAllCharacters() {
        return Array.from(this.characters.values());
    }

    // ===== Creature Methods =====

    addCreature(creature) {
        if (creature instanceof Creature) {
            this.creatures.set(creature.id, creature);
            this.entities.set(creature.id, creature);
        } else {
            // Convert plain object to Creature instance
            const cre = new Creature(creature);
            this.creatures.set(cre.id, cre);
            this.entities.set(cre.id, cre);
        }
    }

    removeCreature(id) {
        const creature = this.creatures.get(id);
        if (creature && creature.destroy) {
            creature.destroy();
        }
        this.creatures.delete(id);
        this.entities.delete(id);
    }

    getCreature(id) {
        return this.creatures.get(id) || null;
    }

    getAllCreatures() {
        return Array.from(this.creatures.values());
    }

    // ===== Selection Methods =====

    selectCell(x, y, z) {
        this.selectedCell = { x, y, z };
    }

    selectEntity(id) {
        this.selectedEntity = id;
        if (id && !this.selectedEntities.includes(id)) {
            this.selectedEntities = [id];
        }
    }

    addToSelection(id) {
        if (!this.selectedEntities.includes(id)) {
            this.selectedEntities.push(id);
        }
    }

    removeFromSelection(id) {
        this.selectedEntities = this.selectedEntities.filter(eid => eid !== id);
    }

    clearSelection() {
        this.selectedCell = null;
        this.selectedEntity = null;
        this.selectedEntities = [];
    }

    // ===== World State Methods =====

    updateWorldState(worldData) {
        if (worldData.cells) {
            worldData.cells.forEach(cell => {
                this.setCell(cell.x, cell.y, cell.z, cell);
            });
        }

        if (worldData.walls) {
            worldData.walls.forEach(wall => {
                this.setWall(wall.x, wall.y, wall.z, wall.direction, wall);
            });
        }

        if (worldData.doors) {
            worldData.doors.forEach(door => {
                this.setDoor(door.x, door.y, door.z, door.direction, door);
            });
        }

        if (worldData.bounds) {
            this.bounds = { ...this.bounds, ...worldData.bounds };
        }
    }

    processUpdates(updates) {
        updates.forEach(update => {
            switch (update.type) {
                case 'entity_move':
                    const entity = this.getEntity(update.entityId);
                    if (entity) {
                        entity.setPosition(update.x, update.y, update.z);
                    }
                    break;

                case 'entity_update':
                    this.updateEntity(update.entity);
                    break;

                case 'cell_update':
                    this.setCell(update.x, update.y, update.z, update.data);
                    break;

                case 'wall_add':
                    this.setWall(update.x, update.y, update.z, update.direction, update.data);
                    break;

                case 'wall_remove':
                    this.removeWall(update.x, update.y, update.z, update.direction);
                    break;

                case 'door_toggle':
                    this.toggleDoor(update.x, update.y, update.z, update.direction);
                    break;
            }
        });
    }

    // ===== Export/Import =====

    exportToJSON() {
        // Get all cells (Floor objects)
        const cells = [];
        for (const [key, floorId] of this.cells.entries()) {
            const floor = this.getObjectById(floorId);
            if (floor) {
                cells.push(floor.toJSON());
            }
        }

        // Get all walls (Wall objects)
        const walls = [];
        for (const [key, wallId] of this.walls.entries()) {
            const wall = this.getObjectById(wallId);
            if (wall) {
                walls.push(wall.toJSON());
            }
        }

        // Get all doors (Door objects)
        const doors = [];
        for (const [key, doorId] of this.doors.entries()) {
            const door = this.getObjectById(doorId);
            if (door) {
                doors.push(door.toJSON());
            }
        }

        return {
            cells,
            walls,
            doors,
            entities: Array.from(this.entities.values()).map(e =>
                e.toJSON ? e.toJSON() : e
            ),
            itemInstances: Array.from(this.itemInstances.values()).map(item => item.toJSON()),
            creatures: Array.from(this.creatures.values()).map(creature => creature.toJSON()),
            characters: Array.from(this.characters.values()).map(char => char.toJSON()),
            bounds: this.bounds,
            nextObjectId: GameObject.nextId // Save the next ID for loading
        };
    }

    async importFromJSON(data) {
        // Clear everything
        this.clear();

        // Reset GameObject ID counter if provided
        if (data.nextObjectId) {
            GameObject.resetIdCounter(data.nextObjectId);
        }

        // Import cells (create Floor objects)
        if (data.cells) {
            data.cells.forEach(cellData => {
                this.setCell(cellData.x, cellData.y, cellData.z, cellData);
            });
        }

        // Import walls (create Wall objects)
        if (data.walls) {
            data.walls.forEach(wallData => {
                this.setWall(wallData.x, wallData.y, wallData.z, wallData.direction, wallData);
            });
        }

        // Import doors (create Door objects)
        if (data.doors) {
            data.doors.forEach(doorData => {
                this.setDoor(doorData.x, doorData.y, doorData.z, doorData.direction, doorData);
            });
        }

        // Import items
        if (data.itemInstances) {
            data.itemInstances.forEach(itemData => {
                const item = Item.fromJSON(itemData);
                this.addItemInstance(item);
            });
        }

        // Import creatures
        if (data.creatures) {
            data.creatures.forEach(creatureData => {
                const creature = Creature.fromJSON(creatureData);
                this.addCreature(creature);
            });
        }

        // Import characters
        if (data.characters) {
            data.characters.forEach(charData => {
                const char = Character.fromJSON(charData);
                this.addCharacter(char);
            });
        }

        // Import legacy entities (for backward compatibility)
        if (data.entities) {
            data.entities.forEach(entity => {
                // Skip if already loaded as item/creature/character
                if (!this.entities.has(entity.id)) {
                    this.updateEntity(entity);
                }
            });
        }

        if (data.bounds) {
            this.bounds = data.bounds;
        }
    }

    clear() {
        // Destroy all objects
        for (const [key, id] of this.cells.entries()) {
            const obj = this.getObjectById(id);
            if (obj) obj.destroy();
        }
        for (const [key, id] of this.walls.entries()) {
            const obj = this.getObjectById(id);
            if (obj) obj.destroy();
        }
        for (const [key, id] of this.doors.entries()) {
            const obj = this.getObjectById(id);
            if (obj) obj.destroy();
        }
        for (const [id, obj] of this.itemInstances.entries()) {
            if (obj.destroy) obj.destroy();
        }
        for (const [id, obj] of this.creatures.entries()) {
            if (obj.destroy) obj.destroy();
        }
        for (const [id, obj] of this.characters.entries()) {
            if (obj.destroy) obj.destroy();
        }

        // Clear all maps
        this.cells.clear();
        this.walls.clear();
        this.doors.clear();
        this.entities.clear();
        this.itemInstances.clear();
        this.characters.clear();
        this.creatures.clear();
        this.clearSelection();

        // Clear GameObject registry
        GameObject.clearRegistry();
        GameObject.resetIdCounter(1);
    }
}

export const world = new World();
