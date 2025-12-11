// Main entry point
import { initRenderer } from './renderer-3d.js';
import { initInput } from './input.js';
import { game } from './game.js';
import { ui } from './ui.js';
import { buildMode } from './build-mode.js';
import { storage } from './storage.js';
import { CONFIG } from './config.js';
import { roomManager } from './room-manager.js';
import { scenePanelUI } from './scene-panel-ui.js';
import { propertiesPanelUI } from './properties-panel-ui.js';
import { panelController } from './panel-controller.js';
import { typeRegistry } from './type-registry.js';
import { assetManager } from './managers/asset-manager.js';
import { loadStarterTypes } from './data/starter-types.js';
import { typesPanelUI } from './ui/types-panel-ui.js';
import { characterPanelUI } from './ui/character-panel-ui.js';
import { inventoryPanelUI } from './ui/inventory-panel-ui.js';

// Initialize application
async function init() {
    console.log('🚀 Starting AI Island...');

    // Get canvas
    const canvas = document.getElementById('world-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Initialize renderer
    const renderer = initRenderer(canvas);
    console.log('✅ Renderer initialized');

    // Initialize input handler
    const input = initInput(canvas);
    console.log('✅ Input handler initialized');

    // Handle window resize
    window.addEventListener('resize', () => {
        renderer.resize();
    });

    // Listen for mode changes (legacy - may not be needed)
    window.addEventListener('modeChange', (e) => {
        game.setMode(e.detail.mode);
    });

    // Setup save/load buttons
    setupSaveLoad();

    // Panel system is initialized via imports
    console.log('✅ Panel system initialized');

    // Check for autosave
    if (storage.hasAutosave('ai-island-autosave')) {
        const time = storage.getAutosaveTime('ai-island-autosave');
        console.log(`💾 Autosave found from ${time.toLocaleString()}`);
        // Could prompt user to load autosave here
    }

    // Enable autosave
    storage.enableAutosave(30000); // Every 30 seconds

    // Initialize type system with starter content
    loadStarterTypes(typeRegistry);
    console.log('✅ Type system initialized');

    // Initialize UI Panels
    typesPanelUI.init();
    characterPanelUI.init();
    inventoryPanelUI.init();
    console.log('✅ UI Panels initialized');

    // Initialize and start game
    await game.init();
    game.start();

    // Setup RPG panel toggle buttons
    setupPanelButtons();

    console.log('🎉 AI Island is ready!');
}

function setupPanelButtons() {
    const typesBtn = document.getElementById('types-btn');
    const charactersBtn = document.getElementById('characters-btn');
    const inventoryBtn = document.getElementById('inventory-btn');

    if (typesBtn) {
        typesBtn.addEventListener('click', () => {
            typesPanelUI.toggle();
            typesBtn.classList.toggle('active');
        });
    }

    if (charactersBtn) {
        charactersBtn.addEventListener('click', () => {
            characterPanelUI.toggle();
            charactersBtn.classList.toggle('active');
        });
    }

    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', () => {
            // Show inventory for selected character
            const selectedChar = characterPanelUI.selectedCharacter;
            if (selectedChar) {
                inventoryPanelUI.show(selectedChar);
                inventoryBtn.classList.toggle('active');
            } else {
                alert('Please select a character first');
            }
        });
    }
}

function setupSaveLoad() {
    // Create save/load buttons in header
    const topBar = document.querySelector('.top-bar');
    if (!topBar) {
        console.warn('Top bar not found, skipping save/load buttons');
        return;
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '0.5rem';
    buttonContainer.style.marginRight = '1rem';

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'mode-btn icon-btn';
    saveBtn.innerHTML = '💾';
    saveBtn.title = 'Save World';
    saveBtn.style.fontSize = '1.2rem';
    saveBtn.addEventListener('click', () => {
        const filename = prompt('Enter filename:', 'dungeon.json');
        if (filename) {
            storage.saveToFile(filename);
            ui.showNotification('World saved!', 'success');
        }
    });

    // Load button
    const loadBtn = document.createElement('button');
    loadBtn.className = 'mode-btn icon-btn';
    loadBtn.innerHTML = '📂';
    loadBtn.title = 'Load World';
    loadBtn.style.fontSize = '1.2rem';
    loadBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await storage.loadFromFile(file);
                    ui.showNotification('World loaded!', 'success');
                } catch (error) {
                    ui.showNotification('Failed to load world', 'error');
                }
            }
        };
        input.click();
    });

    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(loadBtn);

    // Insert before properties toggle button (right side)
    const toggleProperties = topBar.querySelector('#toggle-properties');
    if (toggleProperties) {
        topBar.insertBefore(buttonContainer, toggleProperties);
    } else {
        topBar.appendChild(buttonContainer);
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
