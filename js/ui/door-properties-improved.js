// Improved Door Properties Panel - Compact design with GM/Player mode awareness
// Replace the showDoorProperties method in properties-panel-ui.js with this code

showDoorProperties(data) {
    if (!this.container) return;

    const { x, y, z, direction, data: doorData } = data;
    const isOpen = doorData?.isOpen || false;
    const isLocked = doorData?.isLocked || false;
    const pivot = doorData?.pivot || 'left';
    const swing = doorData?.swing || 'out';
    const requiredItemId = doorData?.requiredItemId || 0;

    // TODO: Detect if GM mode or Player mode - for now assume GM mode
    const isGMMode = true;

    let html = '<div class="property-group">';
    html += '<div class="property-group-title">';
    html += '🚪 Door';
    if (isGMMode) {
        html += `<button class="title-icon-btn" onclick="window.deleteSelectedDoor(${x}, ${y}, ${z}, '${direction}')" title="Delete Door">🗑️</button>`;
    }
    html += '</div>';

    // Readonly properties (always shown)
    html += this.renderProperty('Position', `${x}, ${y}, ${z}`);
    html += this.renderProperty('Direction', direction);

    if (isGMMode) {
        // GM Mode: Editable controls

        // Swing Direction (inline buttons)
        html += `<div class="property-row">`;
        html += `<span class="property-label">Swing</span>`;
        html += `<div class="button-group compact">`;
        html += `<button class="property-btn small ${swing === 'in' ? 'active' : ''}" id="door-swing-in">In</button>`;
        html += `<button class="property-btn small ${swing === 'out' ? 'active' : ''}" id="door-swing-out">Out</button>`;
        html += `</div>`;
        html += `</div>`;

        // Hinge Side (inline buttons)
        html += `<div class="property-row">`;
        html += `<span class="property-label">Hinge</span>`;
        html += `<div class="button-group compact">`;
        html += `<button class="property-btn small ${pivot === 'left' ? 'active' : ''}" id="door-pivot-left">Left</button>`;
        html += `<button class="property-btn small ${pivot === 'right' ? 'active' : ''}" id="door-pivot-right">Right</button>`;
        html += `</div>`;
        html += `</div>`;

        // Unlock Item ID
        html += `<div class="property-row">`;
        html += `<span class="property-label">Unlock Item</span>`;
        html += `<input type="number" id="door-unlock-item-id" class="property-input compact" value="${requiredItemId}" min="0" placeholder="0">`;
        html += `</div>`;
    } else {
        // Player Mode: Readonly display
        html += this.renderProperty('Swing', swing);
        html += this.renderProperty('Hinge', pivot);
        if (requiredItemId > 0) {
            html += this.renderProperty('Requires', `Item #${requiredItemId}`);
        }
    }

    html += '</div>';

    // Action Buttons (conditional, side-by-side)
    const actions = [];

    if (isLocked) {
        actions.push({ label: 'Unlock', id: 'unlock' });
    } else {
        if (isOpen) {
            actions.push({ label: 'Close', id: 'close' });
        } else {
            actions.push({ label: 'Open', id: 'open' });
        }
        actions.push({ label: 'Lock', id: 'lock' });
    }

    if (actions.length > 0) {
        html += '<div class="door-actions">';
        actions.forEach(action => {
            html += `<button class="action-btn half-width" id="door-action-${action.id}">${action.label}</button>`;
        });
        html += '</div>';
    }

    this.container.innerHTML = html;
    this.currentSelection = { type: 'door', x, y, z, direction };

    // Bind GM mode controls
    if (isGMMode) {
        // Swing buttons
        const swingInBtn = document.getElementById('door-swing-in');
        const swingOutBtn = document.getElementById('door-swing-out');
        if (swingInBtn) {
            swingInBtn.addEventListener('click', () => {
                const currentDoor = world.getDoor(x, y, z, direction);
                if (currentDoor) {
                    world.setDoor(x, y, z, direction, { ...currentDoor, swing: 'in' });
                    if (renderer) renderer.markDirty();
                    swingInBtn.classList.add('active');
                    swingOutBtn.classList.remove('active');
                }
            });
        }
        if (swingOutBtn) {
            swingOutBtn.addEventListener('click', () => {
                const currentDoor = world.getDoor(x, y, z, direction);
                if (currentDoor) {
                    world.setDoor(x, y, z, direction, { ...currentDoor, swing: 'out' });
                    if (renderer) renderer.markDirty();
                    swingOutBtn.classList.add('active');
                    swingInBtn.classList.remove('active');
                }
            });
        }

        // Hinge buttons
        const pivotLeftBtn = document.getElementById('door-pivot-left');
        const pivotRightBtn = document.getElementById('door-pivot-right');
        if (pivotLeftBtn) {
            pivotLeftBtn.addEventListener('click', () => {
                const currentDoor = world.getDoor(x, y, z, direction);
                if (currentDoor) {
                    world.setDoor(x, y, z, direction, { ...currentDoor, pivot: 'left' });
                    if (renderer) renderer.markDirty();
                    pivotLeftBtn.classList.add('active');
                    pivotRightBtn.classList.remove('active');
                }
            });
        }
        if (pivotRightBtn) {
            pivotRightBtn.addEventListener('click', () => {
                const currentDoor = world.getDoor(x, y, z, direction);
                if (currentDoor) {
                    world.setDoor(x, y, z, direction, { ...currentDoor, pivot: 'right' });
                    if (renderer) renderer.markDirty();
                    pivotRightBtn.classList.add('active');
                    pivotLeftBtn.classList.remove('active');
                }
            });
        }

        // Unlock item ID
        const unlockItemInput = document.getElementById('door-unlock-item-id');
        if (unlockItemInput) {
            unlockItemInput.addEventListener('change', (e) => {
                const currentDoor = world.getDoor(x, y, z, direction);
                if (currentDoor) {
                    const itemId = parseInt(e.target.value) || 0;
                    world.setDoor(x, y, z, direction, { ...currentDoor, requiredItemId: itemId });
                    if (renderer) renderer.markDirty();
                }
            });
        }
    }

    // Bind action buttons
    const openBtn = document.getElementById('door-action-open');
    const closeBtn = document.getElementById('door-action-close');
    const lockBtn = document.getElementById('door-action-lock');
    const unlockBtn = document.getElementById('door-action-unlock');

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            const currentDoor = world.getDoor(x, y, z, direction);
            if (currentDoor && !currentDoor.isLocked) {
                world.setDoor(x, y, z, direction, { ...currentDoor, isOpen: true });
                if (renderer) renderer.markDirty();
                this.showDoorProperties({ x, y, z, direction, data: world.getDoor(x, y, z, direction) });
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const currentDoor = world.getDoor(x, y, z, direction);
            if (currentDoor) {
                world.setDoor(x, y, z, direction, { ...currentDoor, isOpen: false });
                if (renderer) renderer.markDirty();
                this.showDoorProperties({ x, y, z, direction, data: world.getDoor(x, y, z, direction) });
            }
        });
    }

    if (lockBtn) {
        lockBtn.addEventListener('click', () => {
            const currentDoor = world.getDoor(x, y, z, direction);
            if (currentDoor) {
                world.setDoor(x, y, z, direction, { ...currentDoor, isLocked: true, isOpen: false });
                if (renderer) renderer.markDirty();
                this.showDoorProperties({ x, y, z, direction, data: world.getDoor(x, y, z, direction) });
            }
        });
    }

    if (unlockBtn) {
        unlockBtn.addEventListener('click', () => {
            const currentDoor = world.getDoor(x, y, z, direction);
            if (currentDoor) {
                // TODO: Check if player has required item using door-utils.js
                world.setDoor(x, y, z, direction, { ...currentDoor, isLocked: false });
                if (renderer) renderer.markDirty();
                this.showDoorProperties({ x, y, z, direction, data: world.getDoor(x, y, z, direction) });
            }
        });
    }

    // Expose delete function
    window.deleteSelectedDoor = (dx, dy, dz, ddir) => {
        world.removeDoor(dx, dy, dz, ddir);
        if (renderer) renderer.markDirty();
        this.clear();
    };
}

// CSS additions needed:
/*
.property-group-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title-icon-btn {
    background: none;
    border: none;
    color: #ff6b6b;
    font-size: 16px;
    cursor: pointer;
    padding: 4px;
}

.title-icon-btn:hover {
    color: #ff5252;
}

.button-group.compact {
    display: flex;
    gap: 4px;
}

.property-btn.small {
    padding: 4px 12px;
    font-size: 11px;
}

.property-input.compact {
    padding: 4px 8px;
    font-size: 12px;
}

.door-actions {
    display: flex;
    gap: 8px;
    padding: 8px 0;
}

.action-btn.half-width {
    flex: 1;
}
*/
