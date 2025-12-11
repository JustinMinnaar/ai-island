// World state management with edge-based walls/doors
import { CONFIG } from './config.js';

class World {
    constructor() {
        this.cells = new Map(); // Map of "x,y,z" -> cell data (floors)
        this.walls = new Map(); // Map of "x,y,z,direction" -> wall data
        this.doors = new Map(); // Map of "x,y,z,direction" -> door data
        this.entities = new Map(); // Map of entityId -> entity data
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

    // ===== Cell Methods =====

    getCellKey(x, y, z) {
        return `${x},${y},${z}`;
    }

    setCell(x, y, z, data) {
        const key = this.getCellKey(x, y, z);
        this.cells.set(key, {
            x, y, z,
            type: data.type || CONFIG.GAME.CELL_TYPES.FLOOR,
            roomNumber: data.roomNumber !== undefined ? data.roomNumber : 0, // Default to room 0 (Default Room)
            ...data
        });
    }

    getCell(x, y, z) {
        const key = this.getCellKey(x, y, z);
        return this.cells.get(key) || null;
    }

    removeCell(x, y, z) {
        const key = this.getCellKey(x, y, z);
        this.cells.delete(key);
    }

    // ===== Wall Methods (Edge-Based) =====

    getWallKey(x, y, z, direction) {
        return `${x},${y},${z},${direction}`;
    }

    setWall(x, y, z, direction, data = {}) {
        const key = this.getWallKey(x, y, z, direction);
        this.walls.set(key, {
            x, y, z, direction,
            type: CONFIG.GAME.CELL_TYPES.WALL,
            ...data
        });
    }

    getWall(x, y, z, direction) {
        const key = this.getWallKey(x, y, z, direction);
        return this.walls.get(key) || null;
    }

    removeWall(x, y, z, direction) {
        const key = this.getWallKey(x, y, z, direction);
        this.walls.delete(key);
    }

    getAllWalls() {
        return Array.from(this.walls.values());
    }

    getWallsAt(x, y, z) {
        const walls = [];
        const directions = [CONFIG.GAME.EDGE_DIRECTIONS.NORTH, CONFIG.GAME.EDGE_DIRECTIONS.SOUTH, CONFIG.GAME.EDGE_DIRECTIONS.EAST, CONFIG.GAME.EDGE_DIRECTIONS.WEST];

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
        this.doors.set(key, {
            x, y, z, direction,
            type: CONFIG.GAME.CELL_TYPES.DOOR,
            isOpen: data.isOpen !== undefined ? data.isOpen : false,
            pivot: data.pivot || CONFIG.GAME.DOOR_PIVOT.LEFT,
            ...data
        });
    }

    getDoor(x, y, z, direction) {
        const key = this.getDoorKey(x, y, z, direction);
        return this.doors.get(key) || null;
    }

    removeDoor(x, y, z, direction) {
        const key = this.getDoorKey(x, y, z, direction);
        this.doors.delete(key);
    }

    getAllDoors() {
        return Array.from(this.doors.values());
    }

    toggleDoor(x, y, z, direction) {
        const door = this.getDoor(x, y, z, direction);
        if (door) {
            door.isOpen = !door.isOpen;
            return door.isOpen;
        }
        return null;
    }

    // ===== Entity Methods =====

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
        if (this.entities.has(entityData.id)) {
            const existing = this.entities.get(entityData.id);
            this.entities.set(entityData.id, { ...existing, ...entityData });
        } else {
            this.entities.set(entityData.id, entityData);
        }
    }

    removeEntity(id) {
        this.entities.delete(id);
    }

    getEntity(id) {
        return this.entities.get(id) || null;
    }

    getAllEntities() {
        return Array.from(this.entities.values());
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
                    if (this.entities.has(update.entityId)) {
                        const entity = this.entities.get(update.entityId);
                        entity.x = update.x;
                        entity.y = update.y;
                        entity.z = update.z;
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
        return {
            cells: Array.from(this.cells.values()),
            walls: Array.from(this.walls.values()),
            doors: Array.from(this.doors.values()),
            entities: Array.from(this.entities.values()),
            bounds: this.bounds
        };
    }

    importFromJSON(data) {
        this.cells.clear();
        this.walls.clear();
        this.doors.clear();
        this.entities.clear();

        if (data.cells) {
            data.cells.forEach(cell => this.setCell(cell.x, cell.y, cell.z, cell));
        }
        if (data.walls) {
            data.walls.forEach(wall => this.setWall(wall.x, wall.y, wall.z, wall.direction, wall));
        }
        if (data.doors) {
            data.doors.forEach(door => this.setDoor(door.x, door.y, door.z, door.direction, door));
        }
        if (data.entities) {
            data.entities.forEach(entity => this.updateEntity(entity));
        }
        if (data.bounds) {
            this.bounds = data.bounds;
        }
    }

    clear() {
        this.cells.clear();
        this.walls.clear();
        this.doors.clear();
        this.entities.clear();
        this.clearSelection();
    }
}

export const world = new World();
