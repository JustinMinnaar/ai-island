import { turnManager, PHASES } from './turn-manager.js';
import { CONFIG } from './config.js';
import { world } from './world.js';
import { renderer } from './renderer-3d.js';
import { ui } from './ui.js';
import { Item } from './models/Item.js';
import { Creature } from './models/Creature.js';
import { Character } from './character.js'; // Note path divergence

class Game {
    constructor() {
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.mode = CONFIG.GAME.MODES.OBSERVER;
        this.turnManager = turnManager; // Expose
    }

    async init() {
        console.log('🎮 Initializing AI Island...');

        // Load demo data for testing
        this.loadDemoData();

        console.log('✅ AI Island initialized successfully');
    }

    // ... (loadDemoData remains same) ...

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.lastFPSUpdate = performance.now();
        this.gameLoop();

        console.log('▶️ Game loop started');
    }

    stop() {
        this.isRunning = false;
        console.log('⏸️ Game loop stopped');
    }

    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;

        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Update Turn Manager
        this.turnManager.update(deltaTime);

        // Update FPS counter
        this.frameCount++;
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            ui.updateFPS(this.fps);
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }

        // Update camera info
        ui.updateCameraInfo();

        // Render
        renderer.render();

        // Continue loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    loadDemoData() {
        console.log('📦 Loading demo data...');

        // Create a simple demo world with edge-based walls

        // Floor tiles for a large area
        for (let x = -15; x <= 15; x++) {
            for (let z = -15; z <= 15; z++) {
                world.setCell(x, 0, z, { type: CONFIG.GAME.CELL_TYPES.FLOOR });
            }
        }

        // Build a castle with edge-based walls
        // Outer walls (using edge directions)
        for (let x = -8; x <= 8; x++) {
            world.setWall(x, 0, -8, CONFIG.GAME.EDGE_DIRECTIONS.NORTH);
            world.setWall(x, 0, 8, CONFIG.GAME.EDGE_DIRECTIONS.SOUTH);
        }
        for (let z = -8; z <= 8; z++) {
            world.setWall(-8, 0, z, CONFIG.GAME.EDGE_DIRECTIONS.WEST);
            world.setWall(8, 0, z, CONFIG.GAME.EDGE_DIRECTIONS.EAST);
        }

        // Gates (doors on edges) - remove walls first, then place doors
        world.removeWall(0, 0, -8, CONFIG.GAME.EDGE_DIRECTIONS.NORTH);
        world.setDoor(0, 0, -8, CONFIG.GAME.EDGE_DIRECTIONS.NORTH, { isOpen: false });
        world.removeWall(8, 0, 0, CONFIG.GAME.EDGE_DIRECTIONS.EAST);
        world.setDoor(8, 0, 0, CONFIG.GAME.EDGE_DIRECTIONS.EAST, { isOpen: true });

        // Inner building
        for (let x = -3; x <= 3; x++) {
            world.setWall(x, 0, -3, CONFIG.GAME.EDGE_DIRECTIONS.NORTH);
            world.setWall(x, 0, 3, CONFIG.GAME.EDGE_DIRECTIONS.SOUTH);
        }
        for (let z = -3; z <= 3; z++) {
            world.setWall(-3, 0, z, CONFIG.GAME.EDGE_DIRECTIONS.WEST);
            world.setWall(3, 0, z, CONFIG.GAME.EDGE_DIRECTIONS.EAST);
        }
        world.removeWall(0, 0, -3, CONFIG.GAME.EDGE_DIRECTIONS.NORTH);
        world.setDoor(0, 0, -3, CONFIG.GAME.EDGE_DIRECTIONS.NORTH, { isOpen: false });

        // Create demo entities using new object classes

        // Character (Hero)
        const hero = new Character({
            name: 'Sir Codealot',
            typeId: 'char-hero',
            description: 'A noble warrior of the keyboard.',
            x: 4,
            y: 0,
            z: 4,
            race: 'Human',
            class: 'Paladin',
            health: { current: 30, max: 30 },
            owner: 'player'
        });
        world.addCharacter(hero);

        // Creature (Goblin)
        const goblin = new Creature({
            name: 'Scout Goblin',
            typeId: 'creature-goblin',
            description: 'A sneaky goblin scout.',
            x: 2,
            y: 0,
            z: 2,
            health: { current: 15, max: 20 },
            owner: 'gm'
        });
        world.addCreature(goblin);

        // Creature (Dragon)
        const dragon = new Creature({
            name: 'Ancient Dragon',
            typeId: 'creature-dragon',
            description: 'A fearsome ancient dragon.',
            x: 10,
            y: 0,
            z: 10,
            health: { current: 500, max: 500 },
            stats: { str: 20, dex: 12, int: 16 },
            owner: 'gm'
        });
        world.addCreature(dragon);

        // Item (Treasure Chest)
        const chest = new Item({
            name: 'Treasure Chest',
            typeId: 'item-chest',
            description: 'Contains loot!',
            x: 5,
            y: 0,
            z: 5,
            owner: 'gm'
        });
        world.addItemInstance(chest);

        // Item (Merchant)
        const merchant = new Creature({
            name: 'Merchant',
            typeId: 'npc-merchant',
            description: 'A traveling merchant.',
            x: -10,
            y: 0,
            z: -10,
            health: { current: 50, max: 50 },
            owner: 'gm'
        });
        world.addCreature(merchant);

        ui.updateEntityCount();
        ui.updateEntityList();

        console.log('✅ Demo data loaded');
        console.log(`   Floors: ${world.cells.size}`);
        console.log(`   Walls: ${world.walls.size}`);
        console.log(`   Doors: ${world.doors.size}`);
        console.log(`   Characters: ${world.characters.size}`);
        console.log(`   Creatures: ${world.creatures.size}`);
        console.log(`   Items: ${world.itemInstances.size}`);

        if (renderer) renderer.markDirty();
    }

    setMode(mode) {
        this.mode = mode;
        console.log(`🎮 Mode changed to: ${mode} `);
    }

    async toggleDoor(x, y, z, direction) {
        const isOpen = world.toggleDoor(x, y, z, direction);
        if (isOpen !== null) {
            ui.showNotification(`Door ${isOpen ? 'opened' : 'closed'} `, 'success');
        }
    }
}

export const game = new Game();

// Expose toggle door to window for HTML onclick
window.toggleDoor = (x, y, z, direction) => game.toggleDoor(x, y, z, direction);
