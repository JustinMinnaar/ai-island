import { GameObject } from '../models/Object.js';
import { Fixed } from '../models/Fixed.js';
import { Floor } from '../models/Floor.js';
import { Wall } from '../models/Wall.js';
import { Door } from '../models/Door.js';
import { Item } from '../models/Item.js';
import { Creature } from '../models/Creature.js';
import { Character } from '../character.js';
import { CONFIG } from '../config.js';

/**
 * Test suite for object hierarchy and ID management
 */
export class ObjectHierarchyTests {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    /**
     * Run all tests
     */
    async runAll() {
        console.log('🧪 Running Object Hierarchy Tests...\n');

        // Reset GameObject state before tests
        GameObject.clearRegistry();
        GameObject.resetIdCounter(1);

        this.testGameObjectIDGeneration();
        this.testGameObjectRegistry();
        this.testFixedInheritance();
        this.testFloorCreation();
        this.testWallCreation();
        this.testDoorCreation();
        this.testItemInheritance();
        this.testCreatureInheritance();
        this.testCharacterInheritance();
        this.testJSONSerialization();
        this.testObjectDestruction();

        this.printResults();
        return this.results;
    }

    /**
     * Test GameObject ID generation
     */
    testGameObjectIDGeneration() {
        const testName = 'GameObject ID Generation';
        try {
            GameObject.resetIdCounter(1);
            GameObject.clearRegistry();

            const obj1 = new GameObject({ name: 'Object 1' });
            const obj2 = new GameObject({ name: 'Object 2' });
            const obj3 = new GameObject({ name: 'Object 3' });

            if (obj1.id !== 1) throw new Error(`Expected obj1.id to be 1, got ${obj1.id}`);
            if (obj2.id !== 2) throw new Error(`Expected obj2.id to be 2, got ${obj2.id}`);
            if (obj3.id !== 3) throw new Error(`Expected obj3.id to be 3, got ${obj3.id}`);

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    /**
     * Test GameObject registry
     */
    testGameObjectRegistry() {
        const testName = 'GameObject Registry';
        try {
            GameObject.clearRegistry();
            GameObject.resetIdCounter(1);

            const obj = new GameObject({ name: 'Test Object' });
            const retrieved = GameObject.getObjectById(obj.id);

            if (!retrieved) throw new Error('Object not found in registry');
            if (retrieved.id !== obj.id) throw new Error('Retrieved wrong object');
            if (retrieved.name !== 'Test Object') throw new Error('Object properties not preserved');

            obj.destroy();
            const afterDestroy = GameObject.getObjectById(obj.id);
            if (afterDestroy !== null) throw new Error('Object not removed from registry after destroy');

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    /**
     * Test Fixed inheritance
     */
    testFixedInheritance() {
        const testName = 'Fixed Inheritance';
        try {
            const fixed = new Fixed({
                x: 5,
                y: 0,
                z: 10,
                color: '#FF0000',
                material: 'stone',
                roomNumber: 1
            });

            if (!(fixed instanceof GameObject)) throw new Error('Fixed does not inherit from GameObject');
            if (fixed.objectType !== 'Fixed') throw new Error('objectType not set correctly');
            if (fixed.color !== '#FF0000') throw new Error('color not set');
            if (fixed.material !== 'stone') throw new Error('material not set');
            if (fixed.roomNumber !== 1) throw new Error('roomNumber not set');

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    /**
     * Test Floor creation
     */
    testFloorCreation() {
        const testName = 'Floor Creation';
        try {
            const floor = new Floor({
                x: 0,
                y: 0,
                z: 0,
                color: '#808080'
            });

            if (!(floor instanceof Fixed)) throw new Error('Floor does not inherit from Fixed');
            if (!(floor instanceof GameObject)) throw new Error('Floor does not inherit from GameObject');
            if (floor.objectType !== 'Floor') throw new Error('objectType not set correctly');
            if (floor.type !== CONFIG.GAME.CELL_TYPES.FLOOR) throw new Error('type not set correctly');

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    /**
     * Test Wall creation
     */
    testWallCreation() {
        const testName = 'Wall Creation';
        try {
            const wall = new Wall({
                x: 0,
                y: 0,
                z: 0,
                direction: CONFIG.GAME.EDGE_DIRECTIONS.NORTH
            });

            if (!(wall instanceof Fixed)) throw new Error('Wall does not inherit from Fixed');
            if (wall.objectType !== 'Wall') throw new Error('objectType not set correctly');
            if (wall.direction !== CONFIG.GAME.EDGE_DIRECTIONS.NORTH) throw new Error('direction not set');

            const key = wall.getKey();
            if (key !== '0,0,0,north') throw new Error(`Wall key incorrect: ${key}`);

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    /**
     * Test Door creation
     */
    testDoorCreation() {
        const testName = 'Door Creation';
        try {
            const door = new Door({
                x: 5,
                y: 0,
                z: 5,
                direction: CONFIG.GAME.EDGE_DIRECTIONS.EAST,
                isOpen: false,
                requiredItemId: 101
            });

            if (!(door instanceof Fixed)) throw new Error('Door does not inherit from Fixed');
            if (door.objectType !== 'Door') throw new Error('objectType not set correctly');
            if (door.isOpen !== false) throw new Error('isOpen not set');
            if (door.requiredItemId !== 101) throw new Error('requiredItemId not set');

            // Test toggle
            door.toggle();
            if (door.isOpen !== true) throw new Error('toggle did not work');

            // Test lock/unlock
            door.lock();
            if (!door.isLocked) throw new Error('lock did not work');
            if (door.isOpen !== false) throw new Error('door should close when locked');

            const unlocked = door.unlock(101);
            if (!unlocked) throw new Error('unlock with correct key failed');
            if (door.isLocked) throw new Error('door should be unlocked');

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    /**
     * Test Item inheritance
     */
    testItemInheritance() {
        const testName = 'Item Inheritance';
        try {
            const item = new Item({
                name: 'Test Item',
                typeId: 101,
                x: 3,
                y: 0,
                z: 3
            });

            if (!(item instanceof GameObject)) throw new Error('Item does not inherit from GameObject');
            if (item.objectType !== 'Item') throw new Error('objectType not set correctly');
            if (item.typeId !== 101) throw new Error('typeId not set');

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    /**
     * Test Creature inheritance
     */
    testCreatureInheritance() {
        const testName = 'Creature Inheritance';
        try {
            const creature = new Creature({
                name: 'Test Creature',
                x: 1,
                y: 0,
                z: 1,
                health: { current: 50, max: 100 },
                stats: { str: 15, dex: 12, int: 10 }
            });

            if (!(creature instanceof Item)) throw new Error('Creature does not inherit from Item');
            if (!(creature instanceof GameObject)) throw new Error('Creature does not inherit from GameObject');
            if (creature.objectType !== 'Creature') throw new Error('objectType not set correctly');
            if (creature.health.current !== 50) throw new Error('health not set');
            if (creature.stats.str !== 15) throw new Error('stats not set');

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    /**
     * Test Character inheritance
     */
    testCharacterInheritance() {
        const testName = 'Character Inheritance';
        try {
            const character = new Character({
                name: 'Test Hero',
                race: 'Elf',
                class: 'Ranger',
                x: 2,
                y: 0,
                z: 2
            });

            if (!(character instanceof Creature)) throw new Error('Character does not inherit from Creature');
            if (!(character instanceof Item)) throw new Error('Character does not inherit from Item');
            if (!(character instanceof GameObject)) throw new Error('Character does not inherit from GameObject');
            if (character.objectType !== 'Character') throw new Error('objectType not set correctly');
            if (character.race !== 'Elf') throw new Error('race not set');
            if (character.class !== 'Ranger') throw new Error('class not set');

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    /**
     * Test JSON serialization
     */
    testJSONSerialization() {
        const testName = 'JSON Serialization';
        try {
            // Test Floor
            const floor = new Floor({ x: 1, y: 0, z: 1, color: '#AAAAAA' });
            const floorJSON = floor.toJSON();
            const floorRestored = Floor.fromJSON(floorJSON);
            if (floorRestored.x !== 1 || floorRestored.color !== '#AAAAAA') {
                throw new Error('Floor serialization failed');
            }

            // Test Wall
            const wall = new Wall({ x: 2, y: 0, z: 2, direction: 'north' });
            const wallJSON = wall.toJSON();
            const wallRestored = Wall.fromJSON(wallJSON);
            if (wallRestored.x !== 2 || wallRestored.direction !== 'north') {
                throw new Error('Wall serialization failed');
            }

            // Test Door
            const door = new Door({ x: 3, y: 0, z: 3, direction: 'east', isOpen: true });
            const doorJSON = door.toJSON();
            const doorRestored = Door.fromJSON(doorJSON);
            if (doorRestored.x !== 3 || doorRestored.isOpen !== true) {
                throw new Error('Door serialization failed');
            }

            // Test Character
            const char = new Character({ name: 'Hero', race: 'Human', class: 'Warrior' });
            const charJSON = char.toJSON();
            const charRestored = Character.fromJSON(charJSON);
            if (charRestored.name !== 'Hero' || charRestored.race !== 'Human') {
                throw new Error('Character serialization failed');
            }

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    /**
     * Test object destruction
     */
    testObjectDestruction() {
        const testName = 'Object Destruction';
        try {
            const obj = new GameObject({ name: 'To Be Destroyed' });
            const id = obj.id;

            if (!GameObject.getObjectById(id)) throw new Error('Object not in registry');

            obj.destroy();

            if (GameObject.getObjectById(id) !== null) {
                throw new Error('Object still in registry after destroy');
            }

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    /**
     * Mark test as passed
     */
    pass(testName) {
        this.results.push({ name: testName, passed: true });
        console.log(`✅ ${testName}`);
    }

    /**
     * Mark test as failed
     */
    fail(testName, message) {
        this.results.push({ name: testName, passed: false, error: message });
        console.log(`❌ ${testName}: ${message}`);
    }

    /**
     * Print test results summary
     */
    printResults() {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;

        console.log(`\n${'='.repeat(50)}`);
        console.log(`Test Results: ${passed}/${total} passed`);
        if (failed > 0) {
            console.log(`Failed tests: ${failed}`);
        }
        console.log(`${'='.repeat(50)}\n`);
    }
}

// Export test runner function
export async function runObjectHierarchyTests() {
    const tests = new ObjectHierarchyTests();
    return await tests.runAll();
}
