# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Island is a 3D isometric world simulation and dungeon builder for AI-driven gameplay and D&D adventures. It's a client-side web application with an optional Express mock server. The project combines world building tools, entity management, and turn-based combat systems.

## Commands

### Development Server

```bash
# Start the backend mock server (runs on http://localhost:3000)
cd server
npm install
npm start
```

### Running the Client

The client is a static web application. Open `index.html` in a browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server -p 8000
```

### Testing

Tests are run in-browser via the test UI:
- Click the test button (🧪) in the top bar
- Tests are located in `js/testing/` and `tests/` directories
- The test runner (`js/testing/test-runner.js`) executes test suites
- Phase 1 tests: `tests/phase1-tests.js`

## Architecture

### Core Systems

**World State Management (`js/world.js`)**
- Central state manager using Maps for cells, walls, doors, entities, items, and characters
- Coordinate system: X, Y (elevation), Z grid-based positioning
- Edge-based walls/doors: Each wall/door is placed on a cell edge (north/south/east/west)
- Separation of concerns:
  - `cells`: Floor tiles (Map: "x,y,z" → cell data)
  - `walls`: Edge-based walls (Map: "x,y,z,direction" → wall data)
  - `doors`: Edge-based doors (Map: "x,y,z,direction" → door data)
  - `entities`: Generic entities (legacy, Map: id → entity)
  - `itemInstances`: Item instances on ground (Map: instanceId → item data)
  - `characters`: Character entities (Map: id → Character instance)

**Renderer (`js/renderer-3d.js`)**
- Three.js-based 3D isometric rendering
- OrbitControls for camera manipulation
- Separate render passes for floors, walls, doors, and entities
- Depth sorting for proper visual hierarchy
- Hover/selection highlighting

**Game Loop (`js/game.js`)**
- Main update/render loop using requestAnimationFrame
- Integrates turnManager for combat phases
- Loads demo data on initialization
- FPS tracking and UI updates

**Type System (`js/type-registry.js`)**
- Manages type definitions for items, creatures, and characters
- ID ranges defined in CONFIG:
  - Items: 101-999
  - Creatures: 1001-1999
  - Characters: 2001-2999
- Types define properties like gridWidth/gridHeight for items, stats for creatures/characters
- Import/export to JSON for persistence
- Starter types loaded from `js/data/starter-types.js`

**Turn Manager (`js/turn-manager.js`)**
- Manages combat phases: FREE_ROAM and COMBAT
- Initiative rolling (d20 + dex modifier)
- Turn order tracking
- AI turn automation
- Integration with UI for turn display

**Build Mode (`js/build-mode.js`)**
- Tool-based building system with separate tool classes:
  - `js/tools/floor-tool.js`
  - `js/tools/wall-tool.js`
  - `js/tools/door-tool.js`
  - `js/tools/room-tool.js`
  - Eraser tools for each type
- Color palette system for materials
- Tool prototypes for "new object" state
- History integration for undo/redo

### Entity Models

**Character (`js/character.js`)**
- Player-controlled entities with race, class, stats, and inventory
- Inventory system with grid-based storage
- Combat stats (AC, initiative, saves)
- toJSON/fromJSON for serialization

**Creature (`js/models/Creature.js`)**
- AI-controlled entities with health, stats, and behavior
- Similar to characters but NPC-focused

**Item (`js/models/Item.js`)**
- Collectible objects with grid dimensions (gridWidth, gridHeight)
- Stack size limits (maxStack)
- Can be placed in world or inventories

### UI System

**Panels**
- **Scene Panel** (`js/scene-panel-ui.js`): Hierarchical view of world objects, organized by rooms
- **Properties Panel** (`js/properties-panel-ui.js`): Detailed property editing for selected objects (walls, doors, floors, items)
- **Types Panel** (`js/ui/types-panel-ui.js`): GM interface for managing item/creature/character types
- **Characters Panel** (`js/ui/character-panel-ui.js`): View and manage characters
- **Inventory Panel** (`js/ui/inventory-panel-ui.js`): Grid-based inventory UI for characters

**Panel Controller (`js/panel-controller.js`)**
- Manages panel visibility and state
- Toggle functionality for collapsible panels

### Storage & Persistence

**Storage System (`js/storage.js`)**
- localStorage autosave (configurable interval, default 30s)
- JSON file export/import
- World state serialization via `world.exportToJSON()`
- Character data serialization

**History System (`js/history.js`)**
- Undo/redo stack for build operations
- Batch operations for complex changes
- Integration with build tools

### Input & Interaction

**Input Handler (`js/input.js`)**
- Mouse controls: click, drag, scroll wheel
- Keyboard shortcuts (WASD, +/-, R, Esc, Ctrl+Z/Y)
- Cell selection via raycasting
- Build tool interaction
- Touch support for mobile

## Configuration

All configuration is centralized in `js/config.js`:

- **API**: Server endpoints and polling intervals
- **RENDER**: Tile dimensions, wall heights, colors
- **GAME**:
  - Modes (OBSERVER, PLAYER)
  - Build tools enumeration
  - Type ID ranges
  - Entity types (CHARACTER, CREATURE, ITEM, NPC)
  - Cell types (EMPTY, FLOOR, WALL, DOOR)
  - Edge directions (NORTH, SOUTH, EAST, WEST)
- **WORLD**: Coordinate bounds

## Key Patterns

### Edge-Based Walls and Doors

Walls and doors are not placed in cells but on cell edges. Each edge is identified by:
- Position: (x, y, z) - the cell coordinate
- Direction: north/south/east/west - which edge of the cell

This allows walls to be shared between adjacent cells and supports proper door placement.

### Entity Type vs Instance

- **Type**: Definition stored in `typeRegistry` (e.g., "Blue Key" is type 101)
- **Instance**: An actual object in the world (e.g., `itemInstance-1234` of type 101)

Doors can require specific item types for unlocking via `requiredItemId` property.

### Coordinate System

- **X**: Left-right axis
- **Y**: Vertical elevation (different floors/levels)
- **Z**: Forward-backward axis
- Isometric rendering projects 3D coordinates to 2D canvas

### Demo Data Loading

On startup, `game.js` calls `loadDemoData()` which:
1. Creates floor tiles in a grid
2. Builds edge-based walls for structures
3. Places doors at specific edges
4. Spawns demo entities (hero, goblin, chest, etc.)

## File Organization

```
js/
├── config.js              # Central configuration
├── main.js                # Application entry point
├── game.js                # Game loop and initialization
├── world.js               # World state management
├── renderer-3d.js         # Three.js renderer
├── input.js               # Mouse/keyboard handling
├── ui.js                  # General UI utilities
├── build-mode.js          # Build tool orchestration
├── type-registry.js       # Type definitions
├── turn-manager.js        # Combat turn system
├── character.js           # Character class
├── combat-system.js       # Combat mechanics
├── storage.js             # Save/load system
├── history.js             # Undo/redo
├── room-manager.js        # Room organization
├── panel-controller.js    # Panel state management
├── scene-panel-ui.js      # Scene hierarchy UI
├── properties-panel-ui.js # Property editor UI
├── models/                # Entity classes
│   ├── Character.js       # (may be duplicate of character.js)
│   ├── Creature.js
│   └── Item.js
├── ui/                    # UI panels
│   ├── types-panel-ui.js
│   ├── character-panel-ui.js
│   └── inventory-panel-ui.js
├── tools/                 # Build mode tools
│   ├── floor-tool.js
│   ├── wall-tool.js
│   ├── door-tool.js
│   ├── room-tool.js
│   └── *-eraser-tool.js
├── managers/              # Utility managers
│   └── asset-manager.js
├── data/                  # Static data
│   └── starter-types.js   # Default type definitions
├── testing/               # Test infrastructure
│   ├── test-runner.js
│   ├── test-suite.js
│   └── test-ui.js
└── tests/                 # (May be duplicate of testing/)
```

## Common Tasks

### Adding a New Entity Type

1. Use `typeRegistry.createType(category, properties)` where category is 'item', 'creature', or 'character'
2. For items, include `gridWidth`, `gridHeight`, `maxStack`
3. Type ID is auto-assigned within the category's range
4. Types persist via world save/load

### Placing Objects in the World

**Floor:**
```javascript
world.setCell(x, y, z, { type: CONFIG.GAME.CELL_TYPES.FLOOR });
```

**Wall:**
```javascript
world.setWall(x, y, z, CONFIG.GAME.EDGE_DIRECTIONS.NORTH);
```

**Door:**
```javascript
world.setDoor(x, y, z, CONFIG.GAME.EDGE_DIRECTIONS.EAST, {
  isOpen: false,
  pivot: CONFIG.GAME.DOOR_PIVOT.LEFT,
  requiredItemId: 101  // Optional: type ID of key needed
});
```

**Entity:**
```javascript
const item = new Item({
  id: 'unique-id',
  name: 'Treasure Chest',
  typeId: 101,
  position: { x: 5, y: 0, z: 5 }
});
world.updateEntity(item);
```

### Modifying Renderer Appearance

- Colors are defined in `CONFIG.RENDER.COLORS`
- Tile dimensions in `CONFIG.RENDER` (TILE_WIDTH, TILE_HEIGHT, WALL_HEIGHT)
- Rendering logic in `js/renderer-3d.js`
- Three.js materials and geometries created dynamically

### Saving/Loading Worlds

**Save:**
```javascript
storage.saveToFile('dungeon.json');
```

**Load:**
```javascript
await storage.loadFromFile(fileObject);
```

**Autosave:**
```javascript
storage.enableAutosave(30000); // Every 30 seconds
```

### Working with Combat

**Start Combat:**
```javascript
turnManager.startCombat(participants); // Auto-rolls initiative
```

**End Turn:**
```javascript
turnManager.endTurn(); // Advances to next entity in turn order
```

**End Combat:**
```javascript
turnManager.endCombat(); // Returns to FREE_ROAM phase
```

## Testing Approach

- Tests use a custom test runner (`js/testing/test-runner.js`)
- Test UI accessible via button in top bar
- Tests should verify:
  - Entity creation and serialization
  - Type registry operations
  - Inventory grid placement
  - World state mutations
  - Character sheet functionality

## Important Notes

- **ES Modules**: All JS files use ES6 module syntax (`import`/`export`)
- **No Build Step**: Client runs directly in browser, no bundler required
- **State Isolation**: `world.js` is the single source of truth for game state
- **Renderer Dirtying**: Call `renderer.markDirty()` after world changes to trigger re-render
- **Edge Directions**: Walls/doors use cardinal directions (north/south/east/west) relative to cell edges
- **Character vs Entity**: Characters are a specialized entity type with extended properties
- **Type System**: All game objects (items, creatures, characters) reference type definitions by ID

## Future Development

See `next_tasks.md` for planned features including:
- GM/Player/Build mode separation
- First-person player view
- Item drag-and-drop
- Enhanced character sheets
- Key/lock system
- Toolbar reorganization
