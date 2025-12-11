// Starter type definitions - loaded on first run
export const STARTER_TYPES = {
    items: [
        {
            name: 'Blue Key',
            description: 'A small blue key that opens blue locks',
            gridWidth: 1,
            gridHeight: 1,
            maxStack: 1
        },
        {
            name: 'Red Key',
            description: 'A small red key that opens red locks',
            gridWidth: 1,
            gridHeight: 1,
            maxStack: 1
        },
        {
            name: 'Gold Coin',
            description: 'A shiny gold coin',
            gridWidth: 1,
            gridHeight: 1,
            maxStack: 100
        },
        {
            name: 'Iron Sword',
            description: 'A sturdy iron longsword',
            gridWidth: 5,
            gridHeight: 1,
            maxStack: 1
        },
        {
            name: 'Steel Dagger',
            description: 'A sharp steel dagger',
            gridWidth: 2,
            gridHeight: 1,
            maxStack: 1
        },
        {
            name: 'Leather Helm',
            description: 'A protective leather helmet',
            gridWidth: 2,
            gridHeight: 2,
            maxStack: 1
        }
    ],

    creatures: [
        {
            name: 'Goblin',
            description: 'A small green goblin with sharp teeth',
            skills: [
                { name: 'Combat', value: 2 },
                { name: 'Sneak', value: 3 }
            ],
            defaultHP: 10,
            defaultMana: 0
        },
        {
            name: 'Rat',
            description: 'A large sewer rat',
            skills: [
                { name: 'Sneak', value: 3 },
                { name: 'Bite', value: 1 }
            ],
            defaultHP: 5,
            defaultMana: 0
        }
    ],

    characters: [
        {
            name: 'Human Warrior',
            description: 'A strong human fighter',
            race: 'Human',
            class: 'Warrior',
            skills: [
                { name: 'Swordsmanship', value: 5 },
                { name: 'Defense', value: 4 }
            ]
        },
        {
            name: 'Elf Ranger',
            description: 'An agile elven archer',
            race: 'Elf',
            class: 'Ranger',
            skills: [
                { name: 'Archery', value: 5 },
                { name: 'Tracking', value: 4 }
            ]
        }
    ],

    races: ['Human', 'Elf', 'Dwarf', 'Halfling', 'Orc'],
    classes: ['Warrior', 'Ranger', 'Mage', 'Rogue', 'Cleric']
};

/**
 * Load starter types into type registry
 */
export function loadStarterTypes(typeRegistry) {
    console.log('📦 Loading starter content...');

    // Load items (IDs 101-106)
    STARTER_TYPES.items.forEach(item => {
        typeRegistry.createType('item', item);
    });

    // Load creatures (IDs 1001-1002)
    STARTER_TYPES.creatures.forEach(creature => {
        typeRegistry.createType('creature', creature);
    });

    // Load character templates (IDs 2001-2002)
    STARTER_TYPES.characters.forEach(char => {
        typeRegistry.createType('character', char);
    });

    console.log('✅ Starter content loaded successfully');
    console.log(`  - ${STARTER_TYPES.items.length} item types`);
    console.log(`  - ${STARTER_TYPES.creatures.length} creature types`);
    console.log(`  - ${STARTER_TYPES.characters.length} character templates`);
}
