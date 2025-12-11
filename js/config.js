// Configuration for AI Island World Viewer
export const CONFIG = {
  // Server API endpoints
  API: {
    BASE_URL: 'http://localhost:3000/api',
    ENDPOINTS: {
      WORLD_STATE: '/world/state',
      ENTITIES: '/entities',
      ACTION: '/action',
      UPDATES: '/updates'
    },
    POLL_INTERVAL: 1000 // ms between update polls
  },

  // Rendering settings
  RENDER: {
    TILE_WIDTH: 64,  // Width of isometric tile
    TILE_HEIGHT: 32, // Height of isometric tile
    WALL_HEIGHT: 48, // Height of walls in pixels
    ENTITY_SIZE: 40, // Size of entity sprites

    // Colors
    COLORS: {
      FLOOR: '#2a4858',
      FLOOR_ALT: '#1f3a47', // Checkerboard pattern
      WALL: '#4a6b7c',
      WALL_SIDE: '#2d4552',
      DOOR_CLOSED: '#8b6f47',
      DOOR_OPEN: '#a88b5f',
      GRID: 'rgba(255, 255, 255, 0.1)',
      SELECTED: 'rgba(100, 200, 255, 0.5)',
      HOVER: 'rgba(255, 255, 255, 0.2)'
    },

    // Camera
    ZOOM_MIN: 0.5,
    ZOOM_MAX: 2.0,
    ZOOM_STEP: 0.1,
    PAN_SPEED: 1.0
  },

  // Game settings
  GAME: {
    MODES: {
      OBSERVER: 'observer', // Watch AI simulation
      PLAYER: 'player'      // D&D player mode
    },

    // Quickbar modes
    QUICKBAR_MODES: {
      SELECT: 'select',
      BUILD: 'build',
      GENERATE: 'generate'
    },

    // Build tools
    BUILD_TOOLS: {
      ROOM: 'room',
      WALL: 'wall',
      FLOOR: 'floor',
      DOOR: 'door',
      ITEM: 'item'
    },

    // Cell scale
    CELL_SIZE: 5, // 5 feet per cell

    MOVEMENT_SPEED: 300, // ms per tile movement
    INTERACTION_RANGE: 1.5, // tiles

    // Entity types
    ENTITY_TYPES: {
      CHARACTER: 'character',
      CREATURE: 'creature',
      ITEM: 'item',
      NPC: 'npc'
    },

    // Cell content types
    CELL_TYPES: {
      EMPTY: 'empty',
      FLOOR: 'floor',
      WALL: 'wall',
      DOOR: 'door'
    },

    // Wall/Door edge directions
    EDGE_DIRECTIONS: {
      NORTH: 'north',  // Along X axis, top edge (z-)
      SOUTH: 'south',  // Along X axis, bottom edge (z+)
      EAST: 'east',    // Along Z axis, right edge (x+)
      WEST: 'west'     // Along Z axis, left edge (x-)
    },

    // Door pivot sides
    DOOR_PIVOT: {
      LEFT: 'left',
      RIGHT: 'right'
    }
  },

  // World bounds (can be updated from server)
  WORLD: {
    MIN_X: -50,
    MAX_X: 50,
    MIN_Z: -50,
    MAX_Z: 50,
    MIN_Y: 0,
    MAX_Y: 10
  }
};
