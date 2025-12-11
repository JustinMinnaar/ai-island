// Item Sheet - Renders basic Item properties
export function renderItemSheet(container, item, onChange) {
    let html = '<div class="sheet-section item-section">';
    html += '<div class="property-group-title">📦 Item Details</div>';

    // Name
    html += renderInput('Name', item.name, 'text', 'item-name', false);

    // Description
    html += renderInput('Description', item.description, 'text', 'item-desc', false);

    // Position (Read-only for now in sheet, typically handled by drag)
    html += renderRow('Position', `${item.position.x}, ${item.position.y}, ${item.position.z}`);

    // Image URL
    html += renderInput('Image URL', item.imageURL || '', 'text', 'item-image', false);

    html += '</div>';

    // Determine insertion point or just return HTML if we were building a string
    // Here we append to container if provided, or return HTML string?
    // The previous pattern returned HTML. Let's stick to returning HTML string for composition.
    return html;
}

export function bindItemEvents(item, onChange) {
    bindInput('item-name', (val) => { item.name = val; onChange(); });
    bindInput('item-desc', (val) => { item.description = val; onChange(); });
    bindInput('item-image', (val) => { item.imageURL = val; onChange(); });
}

// Helpers
function renderRow(label, value) {
    return `<div class="property-row"><span class="property-label">${label}</span><span class="property-value">${value}</span></div>`;
}

function renderInput(label, value, type, id, readonly) {
    return `<div class="property-row">
        <span class="property-label">${label}</span>
        <input type="${type}" id="${id}" class="property-input" value="${value}" ${readonly ? 'readonly' : ''}>
    </div>`;
}

function bindInput(id, callback) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', (e) => callback(e.target.value));
    }
}
