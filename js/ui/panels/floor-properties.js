// Floor Properties Renderer
import { world } from '../../world.js';
import { renderer } from '../../renderer-3d.js';
import { roomManager } from '../../room-manager.js';

export function renderFloorProperties(container, data, renderProperty) {
    if (!container) return null;

    const { x, y, z, data: floorData } = data;
    const color = floorData?.color || 0x3a4a5a;
    const hexColor = '#' + color.toString(16).padStart(6, '0');
    const roomNumber = floorData?.roomNumber || 0;
    const room = roomManager.getRoomByNumber(roomNumber);
    const roomName = room ? room.name : 'None';

    let html = '<div class="property-group">';
    html += '<div class="property-group-title">🟫 Floor Properties</div>';

    html += renderProperty('Position', `${x}, ${y}, ${z}`);
    html += renderProperty('Type', floorData?.type || 'floor');
    html += renderProperty('Room', `${roomName} (#${roomNumber})`);
    html += renderProperty('Color', hexColor);

    // Editable color
    html += `<div class="property-row">
        <span class="property-label">Edit Color</span>
        <input type="color" id="floor-edit-color" class="property-input" value="${hexColor}">
    </div>`;

    html += '</div>';

    // Actions
    html += '<div class="property-group">';
    html += '<div class="property-group-title">Actions</div>';
    html += `<button class="action-btn full-width" onclick="window.deleteSelectedFloor(${x}, ${y}, ${z})">
        <span class="action-icon">🗑️</span> Delete Floor
    </button>`;
    html += '</div>';

    container.innerHTML = html;

    return { type: 'floor', x, y, z };
}

export function bindFloorEvents(data) {
    const { x, y, z, data: floorData } = data;

    // Bind color change
    const colorInput = document.getElementById('floor-edit-color');
    if (colorInput) {
        colorInput.addEventListener('change', (e) => {
            const newColor = parseInt(e.target.value.replace('#', ''), 16);
            world.setCell(x, y, z, { ...floorData, color: newColor });
            if (renderer) renderer.markDirty();
        });
    }

    // Expose delete function
    window.deleteSelectedFloor = (fx, fy, fz) => {
        world.removeCell(fx, fy, fz);
        if (renderer) renderer.markDirty();
        if (window.propertiesPanelUI) {
            window.propertiesPanelUI.clear();
        }
    };
}
