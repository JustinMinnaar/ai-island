# AI Island - Feature Overview

A comprehensive 3D isometric world simulation and dungeon builder for AI-driven gameplay and D&D adventures.

## Core Features

### 🎮 3D Isometric Rendering
- Full 3D rendering powered by **Three.js**
- Isometric camera perspective with smooth orbit controls
- Lighting system with ambient and directional lights
- Separate renderers for floors, walls, and doors
- Support for hover cursors and preview rendering

### 🏗️ World Building Tools

#### Build Mode
Complete toolset for constructing dungeons and environments:

| Tool | Description |
|------|-------------|
| **Floor Tool** | Place floor tiles on the grid |
| **Wall Tool** | Draw walls along cell edges (N/S/E/W directions) |
| **Door Tool** | Add doors with configurable pivot points (left/right) |
| **Room Tool** | Create enclosed rooms with floors and walls |
| **Erasers** | Dedicated erasers for floors, walls, and doors |

#### Color Palette
- Material color selection for walls and floors
- Visual customization of building elements

### 🧭 Camera & Navigation

- **Rotate**: hold right-mouse-button and drag to orbit
- **Pan**: hold shift + right-mouse-button and drag to pan, 
- **fly**: W/S move camera forward/backward, A/D strafe left/right
- **Zoom**: Scroll wheel (on point) or +/- keys (on center)
- **Focus**: F to focus viewpoint on selected item in project tree
- **Reset**: R key to reset camera position
- **Center**: Focus camera on specific coordinates

### 👥 Entity System

Supports multiple entity types:
- **Characters**: Player-controlled heroes and adventurers
- **Creatures**: AI-driven monsters and wildlife
- **NPCs**: Non-player characters for quests and interaction
- **Items**: Collectible objects and treasures

### 📦 Room Management

- Logical grouping of floors, walls, doors, and items into rooms
- Scene hierarchy with rooms as organizational containers
- Default room for unassigned objects
- Room selection and navigation

### 🌍 World State Management

- Grid-based coordinate system (X, Y, Z)
- Edge-based wall and door placement
- Cell-level floor management
- Entity tracking and positioning
- Selection system (single and multi-select)
- Interactive doors (open/close toggle)

### 💾 Storage & Persistence

- **Export/Import**: Save worlds as JSON files
- **localStorage**: Browser-based autosave
- **Autosave**: Configurable automatic saving (default: 30 seconds)

### ↩️ History System

- **Undo/Redo**: Full support for build operations
- Batched actions for complex operations
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo)

### 🤖 AI Integration

#### Gemini API
- AI-powered content generation for dungeons
- Configurable prompts for procedural generation
- Mock generation mode for testing without API key
- Generates walls, floors, doors, and entities from descriptions

### 🎨 User Interface

#### Panel System
- **Scene Panel** (left): Hierarchical scene tree view
- **Properties Panel** (right): Detailed property editing for selected items
- Collapsible panels with toggle buttons
- Accordion sections for organized property groups

#### Status Bar
- Connection status indicator
- FPS counter
- Last sync timestamp

#### Build Toolbar
- Tool selection buttons
- Color palette integration
- Mode switching (Select/Build/Generate)

### 🖱️ Input System

#### Mouse Controls
- Left-click: Select cells or entities
- Click + drag: Pan camera / Draw in build mode
- Scroll wheel: Zoom
- Hover: Cell highlighting

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| WASD / Arrows | Pan camera |
| +/- | Zoom in/out |
| R | Reset camera |
| Escape | Clear selection |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |

#### Touch Support
- Touch events for mobile compatibility

### 🔌 Server Integration

REST API endpoints for multiplayer/server mode:
- `GET /api/world/state` - Fetch world region
- `GET /api/entities` - List all entities
- `POST /api/action` - Send player actions
- `GET /api/updates` - Poll for changes

### ⚙️ Configuration

Customizable settings in `config.js`:
- Server API endpoints
- Rendering tile dimensions
- Color schemes
- Camera zoom limits
- Game mode settings
- World bounds

---

## Technology Stack

- **Rendering**: Three.js with OrbitControls
- **UI**: Vanilla HTML/CSS with glassmorphism design
- **Storage**: localStorage + JSON file export
- **AI**: Google Gemini API integration
- **Server**: Express.js mock server (optional)
