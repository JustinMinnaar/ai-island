// Door Properties Renderer
import { world } from '../../world.js';
import { renderer } from '../../renderer-3d.js';

export function renderDoorProperties(container, data, renderProperty) {
    if (!container) return null;

    const { x, y, z, direction, data: doorData } = data;
    const isOpen = doorData?.isOpen || false;
    const isLocked = doorData?.isLocked || false;
    const pivot = doorData?.pivot || 'left';
    const swing = doorData?.swing || 'out';
    const color = doorData?.color || 0x8b6f47;
    const hexColor = '#' + color.toString(16).padStart(6, '0');

    let html = '<div class="property-group">';
    html += '<div class="property-group-title">🚪 Door Properties</div>';

    html += renderProperty('Position', `${x}, ${y}, ${z}`);
    html += renderProperty('Direction', direction);
    html += renderProperty('Pivot', pivot);
    html += renderProperty('Swing', swing);
    html += renderProperty('Color', hexColor);

    html += '</div>';

    // State Controls
    html += '<div class="property-group">';
    html += '<div class="property-group-title">State</div>';

    // Open/Closed Switch
    html += `<div class="property-row">
        <span class="property-label">Open</span>
        <label class="switch">
            <input type="checkbox" id="door-open-switch" ${isOpen ? 'checked' : ''} ${isLocked ? 'disabled' : ''}>
            <span class="slider"></span>
        </label>
    </div>`;

    // Locked/Unlocked Switch
    html += `<div class="property-row">
        <span class="property-label">Locked</span>
        <label class="switch">
            <input type="checkbox" id="door-locked-switch" ${isLocked ? 'checked' : ''}>
            <span class="slider"></span>
        </label>
    </div>`;

    html += '</div>';

    // Swing and Pivot Controls
    html += '<div class="property-group">';
    html += '<div class="property-group-title">Door Configuration</div>';

    // Swing direction (In/Out switch)
    html += `<div class="property-row">
        <span class="property-label">Swing Direction</span>
        <div class="switch-options">
            <span class="switch-label ${swing === 'in' ? 'active' : ''}">In</span>
            <label class="switch">
                <input type="checkbox" id="door-swing-switch" ${swing === 'out' ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
            <span class="switch-label ${swing === 'out' ? 'active' : ''}">Out</span>
        </div>
    </div>`;

    // Hinge side (Left/Right switch)
    html += `<div class="property-row">
        <span class="property-label">Hinge Side</span>
        <div class="switch-options">
            <span class="switch-label ${pivot === 'left' ? 'active' : ''}">Left</span>
            <label class="switch">
                <input type="checkbox" id="door-pivot-switch" ${pivot === 'right' ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
            <span class="switch-label ${pivot === 'right' ? 'active' : ''}">Right</span>
        </div>
    </div>`;

    html += '</div>';

    // Actions
    html += '<div class="property-group">';
    html += '<div class="property-group-title">Actions</div>';
    html += `<button class="action-btn full-width" onclick="window.deleteSelectedDoor(${x}, ${y}, ${z}, '${direction}')">
        <span class="action-icon">🗑️</span> Delete Door
    </button>`;
    html += '</div>';

    container.innerHTML = html;

    return { type: 'door', x, y, z, direction };
}

export function bindDoorEvents(data, refreshCallback) {
    const { x, y, z, direction } = data;

    // Bind switch events
    const openSwitch = document.getElementById('door-open-switch');
    const lockedSwitch = document.getElementById('door-locked-switch');

    if (openSwitch) {
        openSwitch.addEventListener('change', (e) => {
            const newOpenState = e.target.checked;
            const currentDoor = world.getDoor(x, y, z, direction);
            if (currentDoor && !currentDoor.isLocked) {
                world.setDoor(x, y, z, direction, { ...currentDoor, isOpen: newOpenState });
                if (renderer) renderer.markDirty();
                console.log(`🚪 Door ${newOpenState ? 'opened' : 'closed'}`);
            }
        });
    }

    if (lockedSwitch) {
        lockedSwitch.addEventListener('change', (e) => {
            const newLockedState = e.target.checked;
            const currentDoor = world.getDoor(x, y, z, direction);
            if (currentDoor) {
                const newState = {
                    ...currentDoor,
                    isLocked: newLockedState,
                    isOpen: newLockedState ? false : currentDoor.isOpen
                };
                world.setDoor(x, y, z, direction, newState);
                if (renderer) renderer.markDirty();
                refreshCallback({ x, y, z, direction, data: newState });
            }
        });
    }

    // Bind swing direction switch
    const swingSwitch = document.getElementById('door-swing-switch');
    if (swingSwitch) {
        swingSwitch.addEventListener('change', (e) => {
            const currentDoor = world.getDoor(x, y, z, direction);
            if (currentDoor) {
                const newSwing = e.target.checked ? 'out' : 'in';
                world.setDoor(x, y, z, direction, { ...currentDoor, swing: newSwing });
                if (renderer) renderer.markDirty();
                refreshCallback({ x, y, z, direction, data: world.getDoor(x, y, z, direction) });
            }
        });
    }

    // Bind hinge side switch
    const pivotSwitch = document.getElementById('door-pivot-switch');
    if (pivotSwitch) {
        pivotSwitch.addEventListener('change', (e) => {
            const currentDoor = world.getDoor(x, y, z, direction);
            if (currentDoor) {
                const newPivot = e.target.checked ? 'right' : 'left';
                world.setDoor(x, y, z, direction, { ...currentDoor, pivot: newPivot });
                if (renderer) renderer.markDirty();
                refreshCallback({ x, y, z, direction, data: world.getDoor(x, y, z, direction) });
            }
        });
    }

    // Expose delete function
    window.deleteSelectedDoor = (dx, dy, dz, ddir) => {
        world.removeDoor(dx, dy, dz, ddir);
        if (renderer) renderer.markDirty();
        // Clear will be called by the main controller
        if (window.propertiesPanelUI) {
            window.propertiesPanelUI.clear();
        }
    };
}
