// Test script for Phase 1 - Type System
import { typeRegistry } from './type-registry.js';
import { GridInventory } from './inventory/grid-inventory.js';
import { Character } from './character.js';
import { assetManager } from './managers/asset-manager.js';
import { loadStarterTypes } from './data/starter-types.js';

console.log('🧪 Running Phase 1 Tests...\n');

// Test 1: Type Registry
console.log('Test 1: Type Registry');
loadStarterTypes(typeRegistry);

const blueKeyType = typeRegistry.getType(101);
console.log(`✅ Blue Key type loaded: ${blueKeyType.name}`);
console.assert(blueKeyType.gridWidth === 1, 'Blue key should be 1x1');
console.assert(blueKeyType.maxStack === 1, 'Blue key max stack should be 1');

const items = typeRegistry.getTypesByCategory('item');
console.log(`ℹ️ Found ${items.length} item types`);

// Test 2: Grid Inventory
console.log('\nTest 2: Grid Inventory');
const inventory = new GridInventory(8, 4);

// Place a sword (5x1)
const swordType = typeRegistry.getType(104); // Iron Sword
inventory.placeItem(104, 1, 0, 0);
console.log(`✅ Placed sword at (0, 0)`);

// Try to place overlapping item - should fail
try {
    inventory.placeItem(105, 1, 3, 0); // Dagger at position that overlaps sword
    console.error('❌ FAILED: Should not allow overlapping placement');
} catch (e) {
    console.log(`✅ Correctly prevented overlapping placement`);
}

// Place dagger in valid position
inventory.placeItem(105, 1, 6, 0);
console.log(`✅ Placed dagger at (6, 0)`);

// Stack gold coins
inventory.placeItem(103, 50, 0, 1); // 50 gold coins
inventory.placeItem(103, 30, 0, 1); // Add 30 more - should stack
const goldStack = inventory.getItemAt(0, 1);
console.assert(goldStack.count === 80, `Gold should stack to 80, got ${goldStack.count}`);
console.log(`✅ Gold coins stacked correctly: ${goldStack.count}`);

// Test 3: Character System
console.log('\nTest 3: Character System');
const character = new Character({
    name: 'Test Hero',
    race: 'Human',
    class: 'Warrior'
});

character.setSkill('Swordsmanship', 5);
character.setSkill('Defense', 4);
console.log(`✅ Created character with ${character.skills.length} skills`);

// Add item to character inventory
character.inventory.placeItem(101, 1, 0, 0); // Blue key
console.log(`✅ Added blue key to character inventory`);

// Test JSON serialization
const savedChar = character.saveToJSON();
const loadedChar = Character.loadFromJSON(savedChar);
console.assert(loadedChar.name === character.name, 'Character name should match after save/load');
console.log(`✅ Character save/load works`);

// Test 4: Asset Manager
console.log('\nTest 4: Asset Manager');
const itemInstance = assetManager.createInstance(101, {
    position: { x: 5, y: 0, z: 5 },
    count: 1
});
console.log(`✅ Created item instance: ${itemInstance.instanceId}`);

const instancesAt5 = assetManager.getInstancesAt(5, 0, 5);
console.assert(instancesAt5.length === 1, 'Should find 1 instance at (5,0,5)');
console.log(`✅ Instance query works`);

// Test 5: Type Export/Import
console.log('\nTest 5: Type Export/Import');
const exported = typeRegistry.exportToJSON();
console.log(`✅ Exported ${JSON.parse(exported).types.length} types`);

// Create a new registry and import
import { TypeRegistry } from './type-registry.js';
const newRegistry = new TypeRegistry();
newRegistry.importFromJSON(exported);
const importedBlueKey = newRegistry.getType(101);
console.assert(importedBlueKey.name === 'Blue Key', 'Imported type should match');
console.log(`✅ Type import/export works`);

console.log('\n✅ All Phase 1 tests passed!');
