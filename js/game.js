// Game loop and coordination
import { CONFIG } from './config.js';
import { world } from './world.js';
import { renderer } from './renderer-3d.js';
import { ui } from './ui.js';

class Game {
    constructor() {
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.mode = CONFIG.GAME.MODES.OBSERVER;
    }

    async init() {
        console.log('🎮 Initializing AI Island...');

        // Load demo data for testing
        this.loadDemoData();

        console.log('✅ AI Island initialized successfully');
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

        // Gates (doors on edges)
        world.setDoor(0, 0, -8, CONFIG.GAME.EDGE_DIRECTIONS.NORTH, { isOpen: false });
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
        world.setDoor(0, 0, -3, CONFIG.GAME.EDGE_DIRECTIONS.NORTH, { isOpen: false });

        // Add some demo entities
        world.updateEntity({
            id: 'player1',
            name: 'Hero',
            type: CONFIG.GAME.ENTITY_TYPES.CHARACTER,
            x: 0,
            y: 0,
            z: 0,
            health: 100,
            maxHealth: 100
        });

        world.updateEntity({
            id: 'dragon1',
            name: 'Ancient Dragon',
            type: CONFIG.GAME.ENTITY_TYPES.CREATURE,
            x: 10,
            y: 0,
            z: 10,
            health: 500,
            maxHealth: 500
        });

        world.updateEntity({
            id: 'merchant1',
            name: 'Merchant',
            type: CONFIG.GAME.ENTITY_TYPES.NPC,
            x: -10,
            y: 0,
            z: -10,
            health: 50,
            maxHealth: 50
        });

        world.updateEntity({
            id: 'treasure1',
            name: 'Treasure Chest',
            type: CONFIG.GAME.ENTITY_TYPES.ITEM,
            x: 5,
            y: 0,
            z: 5
        });

        ui.updateEntityCount();
        ui.updateEntityList();

        console.log('✅ Demo data loaded');
        console.log(`   ${world.cells.size} floor tiles`);
        console.log(`   ${world.walls.size} walls`);
        console.log(`   ${world.doors.size} doors`);
        console.log(`   ${world.entities.size} entities`);
    }

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

    setMode(mode) {
        this.mode = mode;
        console.log(`🎮 Mode changed to: ${mode}`);
    }

    async toggleDoor(x, y, z, direction) {
        const isOpen = world.toggleDoor(x, y, z, direction);
        if (isOpen !== null) {
            ui.showNotification(`Door ${isOpen ? 'opened' : 'closed'}`, 'success');
        }
    }
}

export const game = new Game();

// Expose toggle door to window for HTML onclick
window.toggleDoor = (x, y, z, direction) => game.toggleDoor(x, y, z, direction);
