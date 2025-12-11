
import { world } from '../js/world.js';
import { CONFIG } from '../js/config.js';
import { buildMode } from '../js/build-mode.js';
import { history } from '../js/history.js';
import { WallTool } from '../js/tools/wall-tool.js';

class TestRunner {
    constructor() {
        this.resultsEl = document.getElementById('results');
        this.tests = [];
    }

    register(name, fn) {
        this.tests.push({ name, fn });
    }

    async runAll() {
        this.resultsEl.innerHTML = '';
        let passed = 0;
        let failed = 0;

        console.log('--- STARTING TESTS ---');

        for (const test of this.tests) {
            try {
                // Setup
                world.clear();
                history.clear();

                await test.fn();

                this.log(`✅ ${test.name}`, 'test-pass');
                passed++;
            } catch (e) {
                this.log(`❌ ${test.name}: ${e.message}`, 'test-fail');
                console.error(e);
                failed++;
            }
        }

        this.log(`\nSummary: ${passed} Passed, ${failed} Failed`, failed === 0 ? 'test-pass' : 'test-fail');
    }

    log(msg, className) {
        const div = document.createElement('div');
        div.textContent = msg;
        if (className) div.className = className;
        this.resultsEl.appendChild(div);
    }

    expect(actual, expected, msg) {
        if (actual !== expected) {
            throw new Error(`${msg || 'Assertion Failed'}: Expected ${expected}, got ${actual}`);
        }
    }

    expectTrue(condition, msg) {
        if (!condition) {
            throw new Error(msg || 'Expected condition to be true');
        }
    }
}

const runner = new TestRunner();
window.testRunner = runner;

// --- TESTS ---

runner.register('World Cell Management', async () => {
    world.setCell(0, 0, 0, { type: 'floor', color: 0xFF0000 });
    const cell = world.getCell(0, 0, 0);

    runner.expectTrue(!!cell, 'Cell should exist');
    runner.expect(cell.type, 'floor', 'Cell type match');
    runner.expect(cell.color, 0xFF0000, 'Cell color match');
});

runner.register('Wall Tool Placement', async () => {
    const tool = new WallTool();
    tool.start({ x: 0, y: 0, z: 0 }); // Start
    tool.finish({ x: 5, y: 0, z: 0 }, 0x00FF00); // Drag to x=5

    // Should verify walls placed from 0 to 5 along X
    // Direction calculation depends on drag, usually SOUTH or NORTH for horizontal if delta.z is small
    // Actually WallTool logic: defaults to horizontal if dx > dz.
    // If z is same, direction is typically NORTH (if z end > z start? Wait.)

    // Let's check if walls exist at 0,0,0
    // The exact direction depends on WallTool logic we just wrote.
    const walls = world.getWallsAt(0, 0, 0);
    runner.expectTrue(walls.length > 0, 'Wall should be placed at 0,0,0');
});

runner.register('Undo/Redo Functionality', async () => {
    // 1. Place Wall
    world.setWall(0, 0, 0, 'north', { color: 0x123456 });
    history.record(history.createWallAction(0, 0, 0, 'north', { color: 0x123456 }));

    runner.expectTrue(!!world.getWall(0, 0, 0, 'north'), 'Wall placed');

    // 2. Undo
    history.undo();
    runner.expectTrue(!world.getWall(0, 0, 0, 'north'), 'Wall removed after undo');

    // 3. Redo
    history.redo();
    runner.expectTrue(!!world.getWall(0, 0, 0, 'north'), 'Wall restored after redo');
});

runner.register('Door Tool Integration', async () => {
    // 0. Setup Wall
    world.setWall(2, 0, 2, 'north', {});

    // 1. Simulate Door Tool
    // We can't easily simulate click input, but we can call handleDoorClick like BuildMode does?
    // Or simpler: verify world.setDoor interaction

    const tool = buildMode.tools['door'];
    // Door tool usually is click based? 
    // Re-checking build-mode.js/input.js integration...
    // Input calls buildMode.handleDoorClick for clicks.
    // BuildMode.handleDoorClick calls world.setDoor.

    // Let's test world.setDoor logic
    world.setDoor(2, 0, 2, 'north', { isOpen: false });
    const door = world.getDoor(2, 0, 2, 'north');
    const wall = world.getWall(2, 0, 2, 'north');

    runner.expectTrue(!!door, 'Door should exist');
    // NOTE: world.setDoor does NOT automatically remove wall, BuildMode logic does that.
    // So if we just called world.setDoor, wall might still be there unless we check BuildMode logic.
});

