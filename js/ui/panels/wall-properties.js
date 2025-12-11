// Wall Properties Renderer
import { world } from '../../world.js';
import { renderer } from '../../renderer-3d.js';

export function renderWallProperties(container, data, renderProperty) {
    if (!container) return null;

    const { x, y, z, direction, data: wallData } = data;
    const color = wallData?.color || 0x888888;
    const hexColor = '#' + color.toString(16).padStart(6, '0');

    let html = '<div class="property-group">';
    html += '<div class="property-group-title">🧱 Wall Properties</div>';

    html += renderProperty('Position', `${x}, ${y}, ${z}`);
    html += renderProperty('Direction', direction);
    html += renderProperty('Color', hexColor);

    // Editable color
    html += `<div class="property-row">
        <span class="property-label">Edit Color</span>
        <input type="color" id="wall-edit-color" class="property-input" value="${hexColor}">
    </div>`;

    html += '</div>';

    // Actions
    html += '<div class="property-group">';
    html += '<div class="property-group-title">Actions</div>';
    html += `<button class="action-btn full-width" onclick="window.deleteSelectedWall(${x}, ${y}, ${z}, '${direction}')">
        <span class="action-icon">🗑️</span> Delete Wall
    </button>`;
    html += '</div>';

    container.innerHTML = html;

    return { type: 'wall', x, y, z, direction };
}

export function bindWallEvents(data) {
    const { x, y, z, direction, data: wallData } = data;

    // Bind color change
    const colorInput = document.getElementById('wall-edit-color');
    if (colorInput) {
        colorInput.addEventListener('change', (e) => {
            const newColor = parseInt(e.target.value.replace('#', ''), 16);
            world.setWall(x, y, z, direction, { ...wallData, color: newColor });
            if (renderer) renderer.markDirty();
        });
    }

    // Expose delete function
    window.deleteSelectedWall = (wx, wy, wz, wdir) => {
        world.removeWall(wx, wy, wz, wdir);
        if (renderer) renderer.markDirty();
        if (window.propertiesPanelUI) {
            window.propertiesPanelUI.clear();
        }
    };
}
