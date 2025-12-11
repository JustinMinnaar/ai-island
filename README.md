# 🏝️ AI Island - Interactive World Simulation

A client-side 3D isometric world viewer for AI-driven simulation and D&D gameplay. Watch AI creatures interact, build, and explore, or take control of characters for tabletop RPG adventures.

## ✨ Features

### 🎮 Dual Mode System
- **Observer Mode**: Watch AI creatures and characters autonomously interact with the world
- **Player Mode**: Take control of characters for D&D-style gameplay

### 🌍 3D Isometric World
- Beautiful isometric 3D rendering using HTML5 Canvas
- Smooth camera controls (pan, zoom)
- Dynamic entity rendering with shadows and labels
- Layered depth sorting for proper visual hierarchy

### 🏗️ World Building
- Grid-based coordinate system (X, Y, Z)
- Multiple cell types: floors, walls, doors
- Interactive doors (open/close)
- Expandable for custom structures

### 👥 Entity System
- **Characters**: Player-controlled heroes and adventurers
- **Creatures**: AI-driven monsters and wildlife
- **NPCs**: Non-player characters for interaction
- **Items**: Collectible objects and treasures

### 🎨 Modern UI Design
- Dark theme with glassmorphism effects
- Vibrant accent colors and smooth animations
- Responsive layout for different screen sizes
- Real-time stats and entity information

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. **Start the Mock Server**
   ```bash
   cd server
   npm install
   npm start
   ```
   Server will run on `http://localhost:3000`

2. **Open the Client**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js http-server
     npx http-server -p 8000
     ```
   - Navigate to `http://localhost:8000`

## 🎯 Controls

### Mouse Controls
- **Left Click**: Select cell or entity
- **Click + Drag**: Pan camera
- **Scroll Wheel**: Zoom in/out
- **Hover**: Highlight cells

### Keyboard Shortcuts
- **WASD / Arrow Keys**: Pan camera
- **+/-**: Zoom in/out
- **R**: Reset camera
- **Esc**: Clear selection

## 📡 API Documentation

The client communicates with the server via REST API:

### Endpoints

#### Get World State
```http
GET /api/world/state?x1=-20&z1=-20&x2=20&z2=20&y=0
```
Returns cells in the specified region.

#### Get Entities
```http
GET /api/entities
```
Returns all entities in the world.

#### Send Action
```http
POST /api/action
Content-Type: application/json

{
  "action": "move",
  "data": {
    "entityId": "hero1",
    "x": 5,
    "y": 0,
    "z": 5
  }
}
```

#### Get Updates
```http
GET /api/updates?since=1234567890
```
Poll for changes since timestamp.

## 🏗️ Architecture

### Client-Side Structure
```
ai-island/
├── index.html          # Main HTML structure
├── styles.css          # Design system and styles
└── js/
    ├── main.js         # Application entry point
    ├── config.js       # Configuration constants
    ├── api.js          # Server communication
    ├── renderer.js     # Isometric 3D renderer
    ├── world.js        # World state management
    ├── input.js        # Input handling
    ├── ui.js           # UI management
    └── game.js         # Game loop and coordination
```

### Server Structure
```
server/
├── package.json        # Dependencies
└── mock-server.js      # Express server with mock data
```

## 🎨 Customization

### Adding New Entity Types
Edit `js/config.js`:
```javascript
ENTITY_TYPES: {
  CHARACTER: 'character',
  CREATURE: 'creature',
  ITEM: 'item',
  NPC: 'npc',
  YOUR_TYPE: 'your_type'  // Add here
}
```

### Changing Colors
Edit CSS variables in `styles.css`:
```css
:root {
  --color-accent-primary: #00d4ff;
  --color-accent-secondary: #7c3aed;
  /* Customize colors here */
}
```

### Adjusting Rendering
Edit `js/config.js`:
```javascript
RENDER: {
  TILE_WIDTH: 64,
  TILE_HEIGHT: 32,
  WALL_HEIGHT: 48,
  /* Adjust dimensions */
}
```

## 🔮 Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Multiple Y-level rendering (multi-floor buildings)
- [ ] Pathfinding visualization
- [ ] Combat system with animations
- [ ] Inventory management
- [ ] Chat/dialogue system
- [ ] Save/load world states
- [ ] Minimap
- [ ] Day/night cycle
- [ ] Weather effects
- [ ] Sound effects and music

## 🤝 Integration with Your Server

To integrate with your actual server:

1. Update `js/config.js` with your server URL:
   ```javascript
   API: {
     BASE_URL: 'https://your-server.com/api',
     // ...
   }
   ```

2. Ensure your server implements the API endpoints documented above

3. Consider adding WebSocket support for real-time updates:
   ```javascript
   const ws = new WebSocket('ws://your-server.com');
   ws.onmessage = (event) => {
     const updates = JSON.parse(event.data);
     world.processUpdates(updates);
   };
   ```

## 📝 License

MIT License - feel free to use this project for your AI training and D&D adventures!

## 🎮 Demo Data

The application includes demo data with:
- A castle with walls and gates
- An inner building
- A small house
- Various entities (knights, dragons, wizards, goblins, merchants, items)

This allows you to test the system without a server connection.

---

**Enjoy your AI Island adventure!** 🏝️✨
