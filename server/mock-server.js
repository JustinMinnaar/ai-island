// Mock Server for AI Island
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock world data
const worldData = {
    cells: [],
    bounds: {
        minX: -20,
        maxX: 20,
        minZ: -20,
        maxZ: 20,
        minY: 0,
        maxY: 10
    }
};

// Mock entities
const entities = [
    {
        id: 'hero1',
        name: 'Brave Knight',
        type: 'character',
        x: 2,
        y: 0,
        z: 2,
        health: 100,
        maxHealth: 100,
        level: 5
    },
    {
        id: 'dragon1',
        name: 'Fire Dragon',
        type: 'creature',
        x: 15,
        y: 0,
        z: 15,
        health: 500,
        maxHealth: 500,
        level: 20
    },
    {
        id: 'wizard1',
        name: 'Wise Wizard',
        type: 'character',
        x: -5,
        y: 0,
        z: -5,
        health: 80,
        maxHealth: 80,
        level: 10
    },
    {
        id: 'goblin1',
        name: 'Sneaky Goblin',
        type: 'creature',
        x: 8,
        y: 0,
        z: -8,
        health: 30,
        maxHealth: 30,
        level: 3
    },
    {
        id: 'merchant1',
        name: 'Traveling Merchant',
        type: 'npc',
        x: -10,
        y: 0,
        z: 10,
        health: 50,
        maxHealth: 50
    },
    {
        id: 'sword1',
        name: 'Legendary Sword',
        type: 'item',
        x: 12,
        y: 0,
        z: 3
    },
    {
        id: 'potion1',
        name: 'Health Potion',
        type: 'item',
        x: -3,
        y: 0,
        z: 7
    }
];

// Initialize world with some structures
function initializeWorld() {
    // Create floor tiles
    for (let x = -20; x <= 20; x++) {
        for (let z = -20; z <= 20; z++) {
            worldData.cells.push({
                x, y: 0, z,
                type: 'floor'
            });
        }
    }

    // Build a castle
    // Outer walls
    for (let x = -8; x <= 8; x++) {
        worldData.cells.push({ x, y: 0, z: -8, type: 'wall' });
        worldData.cells.push({ x, y: 0, z: 8, type: 'wall' });
    }
    for (let z = -8; z <= 8; z++) {
        worldData.cells.push({ x: -8, y: 0, z, type: 'wall' });
        worldData.cells.push({ x: 8, y: 0, z, type: 'wall' });
    }

    // Gates (doors)
    worldData.cells.push({ x: 0, y: 0, z: 8, type: 'door', isOpen: false });
    worldData.cells.push({ x: 8, y: 0, z: 0, type: 'door', isOpen: true });

    // Inner building
    for (let x = -3; x <= 3; x++) {
        worldData.cells.push({ x, y: 0, z: -3, type: 'wall' });
        worldData.cells.push({ x, y: 0, z: 3, type: 'wall' });
    }
    for (let z = -3; z <= 3; z++) {
        worldData.cells.push({ x: -3, y: 0, z, type: 'wall' });
        worldData.cells.push({ x: 3, y: 0, z, type: 'wall' });
    }
    worldData.cells.push({ x: 0, y: 0, z: -3, type: 'door', isOpen: false });

    // Small house
    for (let x = 12; x <= 18; x++) {
        worldData.cells.push({ x, y: 0, z: 12, type: 'wall' });
        worldData.cells.push({ x, y: 0, z: 18, type: 'wall' });
    }
    for (let z = 12; z <= 18; z++) {
        worldData.cells.push({ x: 12, y: 0, z, type: 'wall' });
        worldData.cells.push({ x: 18, y: 0, z, type: 'wall' });
    }
    worldData.cells.push({ x: 15, y: 0, z: 12, type: 'door', isOpen: true });

    console.log(`✅ Initialized world with ${worldData.cells.length} cells`);
}

// API Routes

// Get world state
app.get('/api/world/state', (req, res) => {
    const { x1, z1, x2, z2, y = 0 } = req.query;

    // Filter cells in the requested region
    const filteredCells = worldData.cells.filter(cell => {
        return cell.x >= parseInt(x1) && cell.x <= parseInt(x2) &&
            cell.z >= parseInt(z1) && cell.z <= parseInt(z2) &&
            cell.y === parseInt(y);
    });

    res.json({
        cells: filteredCells,
        bounds: worldData.bounds
    });
});

// Get all entities
app.get('/api/entities', (req, res) => {
    res.json(entities);
});

// Send action
app.post('/api/action', (req, res) => {
    const { action, data } = req.body;

    console.log(`📨 Received action: ${action}`, data);

    switch (action) {
        case 'move':
            const entity = entities.find(e => e.id === data.entityId);
            if (entity) {
                entity.x = data.x;
                entity.y = data.y;
                entity.z = data.z;
                res.json({ success: true, entity });
            } else {
                res.status(404).json({ success: false, error: 'Entity not found' });
            }
            break;

        case 'toggleDoor':
            const doorCell = worldData.cells.find(
                c => c.x === data.x && c.y === data.y && c.z === data.z && c.type === 'door'
            );
            if (doorCell) {
                doorCell.isOpen = !doorCell.isOpen;
                res.json({ success: true, isOpen: doorCell.isOpen });
            } else {
                res.status(404).json({ success: false, error: 'Door not found' });
            }
            break;

        case 'interact':
            res.json({ success: true, message: 'Interaction successful' });
            break;

        default:
            res.json({ success: true, message: `Action ${action} received` });
    }
});

// Get updates since timestamp
app.get('/api/updates', (req, res) => {
    const { since } = req.query;

    // In a real implementation, this would return changes since the timestamp
    // For now, return empty array (no updates)
    res.json([]);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Initialize and start server
initializeWorld();

app.listen(PORT, () => {
    console.log(`🚀 AI Island Mock Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   GET  /api/world/state?x1=&z1=&x2=&z2=&y=`);
    console.log(`   GET  /api/entities`);
    console.log(`   POST /api/action`);
    console.log(`   GET  /api/updates?since=`);
    console.log(`   GET  /health`);
});

// Simulate entity movement every 5 seconds
setInterval(() => {
    entities.forEach(entity => {
        if (entity.type === 'creature' && Math.random() > 0.5) {
            // Random movement
            const dx = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            const dz = Math.floor(Math.random() * 3) - 1;
            entity.x = Math.max(-20, Math.min(20, entity.x + dx));
            entity.z = Math.max(-20, Math.min(20, entity.z + dz));
        }
    });
}, 5000);
