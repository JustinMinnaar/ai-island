// UI Management
import { world } from './world.js';
import { renderer } from './renderer-3d.js';
import { CONFIG } from './config.js';
import { buildMode } from './build-mode.js';

class UI {
  constructor() {
    this.currentMode = CONFIG.GAME.MODES.OBSERVER;
    this.elements = this.cacheElements();
    this.setupEventListeners();
    this.initPalette();
    this.setupAccordion();
  }

  cacheElements() {
    return {
      // Header
      modeBtns: document.querySelectorAll('.mode-btn'),
      connectionStatus: document.getElementById('connection-status'),
      statusDot: document.querySelector('.status-dot'),

      // Left panel
      cameraCoords: document.getElementById('camera-coords'),
      cameraZoom: document.getElementById('camera-zoom'),
      entityCount: document.getElementById('entity-count'),
      worldTime: document.getElementById('world-time'),
      cellInfo: document.getElementById('cell-info'),

      // Palette
      colorPalette: document.getElementById('color-palette'),
      currentColorSwatch: document.getElementById('current-color-swatch'),

      // Right panel
      entityList: document.getElementById('entity-list'),
      actionMenu: document.getElementById('action-menu'),
      entityDetails: document.getElementById('entity-details'),
      entityStats: document.getElementById('entity-stats'),

      // Footer
      fpsCounter: document.getElementById('fps-counter'),
      lastUpdate: document.getElementById('last-update'),

      // Controls
      btnResetCamera: document.getElementById('btn-reset-camera'),
      btnZoomIn: document.getElementById('btn-zoom-in'),
      btnZoomOut: document.getElementById('btn-zoom-out'),
      btnCenterOrigin: document.getElementById('btn-center-origin')
    };
  }

  initPalette() {
    // Skip if color palette element doesn't exist
    if (!this.elements.colorPalette) {
      console.log('Color palette element not found, skipping initialization');
      return;
    }

    // Common colors
    const colors = [
      '#888888', // Stone Grey
      '#5a5a5a', // Dark Stone
      '#8b4513', // Wood Brown
      '#a0522d', // Sienna
      '#deb887', // Burlywood
      '#708090', // Slate Gray
      '#2f4f4f', // Dark Slate Gray
      '#cd5c5c', // Indian Red
      '#556b2f', // Dark Olive Green
      '#4682b4', // Steel Blue
      '#191970', // Midnight Blue
      '#4b0082', // Indigo
      '#800080', // Purple
      '#c0c0c0', // Silver
      '#000000'  // Black
    ];

    this.elements.colorPalette.innerHTML = '';
    colors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch';
      swatch.style.backgroundColor = color;
      swatch.dataset.color = color;
      swatch.onclick = () => this.selectColor(color);
      this.elements.colorPalette.appendChild(swatch);
    });

    // Set default
    buildMode.activeColor = parseInt(colors[0].replace('#', '0x'));
  }

  selectColor(colorHtml) {
    const colorHex = parseInt(colorHtml.replace('#', '0x'));
    buildMode.activeColor = colorHex;

    // Update UI
    this.elements.currentColorSwatch.style.backgroundColor = colorHtml;

    // Update selected entity/cell if any
    if (world.selectedCell) {
      // Logic to update existing cell color would go here
      // Currently world.js doesn't support updating color directly via method,
      // we might need to add `world.updateCell(x,y,z, {color})` or similar.
      // For now, let's assume we just set the property and mark dirty.

      // Note: We need to define WHAT component of the cell to color (Floor? Wall?)
      // A simple heuristic: If Wall exists, color wall. Else color floor.
      const { x, y, z } = world.selectedCell;
      const wallKey = world.getWallKey(x, y, z, CONFIG.GAME.EDGE_DIRECTIONS.NORTH); // Simplification: only checks North wall currently
      // Ideally we'd color the specific selected wall.

      // To properly support "Color Selected Item", we need to know WHICH item is selected (Wall vs Floor).
      // Current selection is just "Cell". 
      // We'll update both for now or check existence.

      // Actually, let's just trigger a re-render with new color logic if we modify data.
      // We'll implement `world.setColor(x,y,z, color)` later.
    }
  }

  setupAccordion() {
    const headers = document.querySelectorAll('.panel-header');
    if (headers.length === 0) {
      console.log('No panel headers found, skipping accordion setup');
      return;
    }

    headers.forEach(header => {
      header.addEventListener('click', () => {
        const section = header.parentElement;
        section.classList.toggle('collapsed');
      });
    });
  }

  setupEventListeners() {
    // Mode toggle
    if (this.elements.modeBtns) {
      this.elements.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.mode;
          this.setMode(mode);
        });
      });
    }

    // Camera controls (only if elements exist)
    if (this.elements.btnResetCamera) {
      this.elements.btnResetCamera.addEventListener('click', () => {
        renderer.reset();
        this.updateCameraInfo();
      });
    }

    if (this.elements.btnZoomIn) {
      this.elements.btnZoomIn.addEventListener('click', () => {
        renderer.zoom(CONFIG.RENDER.ZOOM_STEP);
        this.updateCameraInfo();
      });
    }

    if (this.elements.btnZoomOut) {
      this.elements.btnZoomOut.addEventListener('click', () => {
        renderer.zoom(-CONFIG.RENDER.ZOOM_STEP);
        this.updateCameraInfo();
      });
    }

    if (this.elements.btnCenterOrigin) {
      this.elements.btnCenterOrigin.addEventListener('click', () => {
        renderer.centerOn(0, 0);
        this.updateCameraInfo();
      });
    }

    // Custom events from input handler
    window.addEventListener('cellSelect', (e) => this.onCellSelect(e.detail));
    window.addEventListener('entitySelect', (e) => this.onEntitySelect(e.detail));
    window.addEventListener('selectionClear', () => this.onSelectionClear());
    window.addEventListener('cameraZoom', (e) => this.updateCameraInfo());

    // Turn System Events
    window.addEventListener('turnUpdate', (e) => this.onTurnUpdate(e.detail));

    // Combat Button
    const combatBtn = document.getElementById('combat-btn');
    if (combatBtn) {
      combatBtn.addEventListener('click', () => {
        // Need to import turnManager or access via game? 
        // Since modules are messy, let's use the global game instance or window if available,
        // or just assume turnManager is globally available or dispatch an event.
        // game.js exposes turnManager on the game instance. 
        // And game.js exports 'game'. 
        // We can import 'game' in this file (already imported? No, only world/renderer/config).
        // Let's rely on window dispatch for cleaner decoupling if possible, or dynamic import.
        // Actually, we can just import { turnManager } from './turn-manager.js';
        // But circular dependency risk? UI <-> Game <-> TurnManager
        // Let's use dynamic import or dispatch.

        // Dispatch request
        // Or simpler: access via game if exposed.
        // Let's check imports.
        import('./turn-manager.js').then(({ turnManager }) => {
          if (turnManager.phase === 'COMBAT') {
            turnManager.endCombat();
          } else {
            turnManager.startCombat();
          }
        });
      });
    }
  }

  onTurnUpdate(data) {
    const indicator = document.getElementById('turn-indicator');
    const nameSpan = document.getElementById('active-entity-name');
    const btn = document.getElementById('combat-btn');

    if (data.phase === 'COMBAT') {
      indicator.classList.remove('hidden');

      // Update Active Entity Name
      const activeEntity = data.turnOrder[data.currentTurnIndex];
      if (activeEntity) {
        nameSpan.textContent = activeEntity.name;
      }

      // Update Button State
      if (btn) {
        btn.classList.add('active'); // Pulse or highlight
        btn.innerHTML = '🛑'; // Stop icon
        btn.title = "End Combat";
      }
    } else {
      indicator.classList.add('hidden');
      if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = '⚔️';
        btn.title = "Start Combat";
      }
    }
  }

  setMode(mode) {
    this.currentMode = mode;

    // Update button states
    this.elements.modeBtns.forEach(btn => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Dispatch mode change event
    window.dispatchEvent(new CustomEvent('modeChange', {
      detail: { mode }
    }));
  }

  updateCameraInfo() {
    if (!renderer || !renderer.camera) return;
    if (!this.elements.cameraCoords || !this.elements.cameraZoom) return;

    const x = Math.round(renderer.camera.position.x);
    const z = Math.round(renderer.camera.position.z);

    // Display implied zoom level based on distance or leave as is (requires renderer.zoom support)
    // For now, let's just display "100%" or fix it to show something useful if needed.
    // Actually renderer.camera.zoom is typically 1 for PerspectiveCamera unless modified directly.
    const zoom = Math.round(renderer.camera.zoom * 100);

    this.elements.cameraCoords.textContent = `${x}, ${z}`;
    this.elements.cameraZoom.textContent = `${zoom}%`;
  }

  updateEntityCount() {
    if (!this.elements.entityCount) return;
    const count = world.getAllEntities().length;
    this.elements.entityCount.textContent = count;
  }

  updateEntityList() {
    if (!this.elements.entityList) return;

    const entities = world.getAllEntities();

    if (entities.length === 0) {
      this.elements.entityList.innerHTML = `
        <div class="loading">
          <p style="color: var(--color-text-muted);">No entities in world</p>
        </div>
      `;
      return;
    }

    this.elements.entityList.innerHTML = entities.map(entity => `
      <div class="entity-item ${world.selectedEntity === entity.id ? 'selected' : ''}" 
           data-entity-id="${entity.id}">
        <div class="entity-icon">${this.getEntityIcon(entity.type)}</div>
        <div class="entity-info">
          <div class="entity-name">${entity.name || 'Unknown'}</div>
          <div class="entity-type">${entity.type}</div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    this.elements.entityList.querySelectorAll('.entity-item').forEach(item => {
      item.addEventListener('click', () => {
        const entityId = item.dataset.entityId;
        const entity = world.getEntity(entityId);
        if (entity) {
          world.selectEntity(entityId);
          this.onEntitySelect(entity);

          // Center camera on entity
          renderer.centerOn(entity.x, entity.z);
        }
      });
    });
  }

  getEntityIcon(type) {
    switch (type) {
      case CONFIG.GAME.ENTITY_TYPES.CHARACTER:
        return '🧙';
      case CONFIG.GAME.ENTITY_TYPES.CREATURE:
        return '🐉';
      case CONFIG.GAME.ENTITY_TYPES.ITEM:
        return '📦';
      case CONFIG.GAME.ENTITY_TYPES.NPC:
        return '👤';
      default:
        return '❓';
    }
  }

  onCellSelect(worldPos) {
    // If using new properties panel, skip old UI update
    if (window.propertiesPanelUI) return;

    // Check if element exists for old UI
    if (!this.elements.cellInfo) return;

    const cell = world.getCell(worldPos.x, worldPos.y, worldPos.z);
    const entities = world.getEntitiesAt(worldPos.x, worldPos.y, worldPos.z);

    let html = `
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-label">Position</div>
          <div class="stat-value">${worldPos.x}, ${worldPos.y}, ${worldPos.z}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Type</div>
          <div class="stat-value">${cell ? cell.type : 'empty'}</div>
        </div>
      </div>
    `;

    if (cell && cell.type === CONFIG.GAME.CELL_TYPES.DOOR) {
      html += `
        <button class="action-btn" onclick="window.toggleDoor(${worldPos.x}, ${worldPos.y}, ${worldPos.z})">
          <span class="action-icon">🚪</span>
          <span>${cell.isOpen ? 'Close' : 'Open'} Door</span>
        </button>
      `;
    }

    if (entities.length > 0) {
      html += `<h3 style="margin-top: var(--spacing-md);">Entities Here:</h3>`;
      entities.forEach(e => {
        html += `<p>${this.getEntityIcon(e.type)} ${e.name}</p>`;
      });
    }

    this.elements.cellInfo.innerHTML = html;
    this.updateEntityList();
  }

  onEntitySelect(entity) {
    // Update entity list selection
    this.updateEntityList();

    // Show entity details
    this.elements.entityDetails.style.display = 'block';

    let statsHtml = `
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-label">Name</div>
          <div class="stat-value">${entity.name || 'Unknown'}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Type</div>
          <div class="stat-value">${entity.type}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Position</div>
          <div class="stat-value">${Math.round(entity.x)}, ${Math.round(entity.y)}, ${Math.round(entity.z)}</div>
        </div>
    `;

    if (entity.health !== undefined) {
      statsHtml += `
        <div class="stat-item">
          <div class="stat-label">Health</div>
          <div class="stat-value">${entity.health}/${entity.maxHealth || 100}</div>
        </div>
      `;
    }

    statsHtml += `</div>`;
    this.elements.entityStats.innerHTML = statsHtml;

    // Update action menu
    this.updateActionMenu(entity);
  }

  updateActionMenu(entity) {
    let actionsHtml = '';

    if (this.currentMode === CONFIG.GAME.MODES.PLAYER) {
      actionsHtml = `
        <button class="action-btn">
          <span class="action-icon">👁️</span>
          <span>Inspect</span>
        </button>
        <button class="action-btn">
          <span class="action-icon">💬</span>
          <span>Interact</span>
        </button>
      `;

      if (entity.type === CONFIG.GAME.ENTITY_TYPES.CREATURE) {
        actionsHtml += `
          <button class="action-btn" onclick="window.ui.onAttackClick('${entity.id}')">
            <span class="action-icon">⚔️</span>
            <span>Attack</span>
          </button>
        `;
      }

      if (entity.type === CONFIG.GAME.ENTITY_TYPES.ITEM) {
        actionsHtml += `
          <button class="action-btn">
            <span class="action-icon">📦</span>
            <span>Pick Up</span>
          </button>
        `;
      }
    } else {
      actionsHtml = `
        <p class="text-center" style="color: var(--color-text-muted); padding: var(--spacing-lg);">
          Switch to Player Mode to interact
        </p>
      `;
    }

    this.elements.actionMenu.innerHTML = actionsHtml;
  }

  onSelectionClear() {
    this.elements.cellInfo.innerHTML = `
      <p class="text-center" style="color: var(--color-text-muted); padding: var(--spacing-lg);">
        Click on a cell to view details
      </p>
    `;
    this.elements.entityDetails.style.display = 'none';
    this.elements.actionMenu.innerHTML = `
      <p class="text-center" style="color: var(--color-text-muted); padding: var(--spacing-lg);">
        Select an entity to view available actions
      </p>
    `;
    this.updateEntityList();
  }

  setConnectionStatus(connected) {
    if (connected) {
      this.elements.connectionStatus.textContent = 'Connected';
      this.elements.statusDot.classList.remove('disconnected');
    } else {
      this.elements.connectionStatus.textContent = 'Disconnected';
      this.elements.statusDot.classList.add('disconnected');
    }
  }

  updateFPS(fps) {
    if (this.elements.fpsCounter) {
      this.elements.fpsCounter.textContent = `FPS: ${Math.round(fps)}`;
    }
  }

  updateLastUpdate() {
    this.elements.lastUpdate.textContent = 'Last update: Just now';
  }

  async onAttackClick(targetId) {
    const { turnManager } = await import('./turn-manager.js');
    const { combatSystem } = await import('./combat-system.js');

    if (turnManager.phase !== 'COMBAT') {
      this.showNotification('Start combat (⚔️) to attack!', 'warning');
      return;
    }

    const attackerId = turnManager.activeEntityId;
    if (!attackerId) {
      this.showNotification('No active turn!', 'error');
      return;
    }

    // Check if attacker is player-controlled (optional)
    // const attacker = world.getEntity(attackerId);
    // if (attacker.owner !== 'player') ...

    combatSystem.attack(attackerId, targetId);
  }

  showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: var(--spacing-md) var(--spacing-lg);
      background: var(--color-surface);
      border: 1px solid var(--color-accent-primary);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-xl);
      z-index: var(--z-modal);
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

export const ui = new UI();
window.ui = ui; // Expose for onClick handlers
