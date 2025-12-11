// Character Sheet - Renders Character properties + Creature properties
import { renderCreatureSheet, bindCreatureEvents } from './creature-sheet.js';

export function renderCharacterSheet(container, character, onChange) {
    // Start with Creature (which includes Item)
    let html = renderCreatureSheet(container, character, onChange);

    html += '<div class="sheet-section character-section">';
    html += '<div class="property-group-title">👤 Character Info</div>';

    // Player Name
    html += `<div class="property-row">
        <span class="property-label">Player Name</span>
        <input type="text" id="char-player" class="property-input" value="${character.playerName}">
    </div>`;

    // Class & Race
    html += `<div class="property-row">
        <span class="property-label">Race</span>
        <input type="text" id="char-race" class="property-input" value="${character.race}">
    </div>`;

    html += `<div class="property-row">
        <span class="property-label">Class</span>
        <input type="text" id="char-class" class="property-input" value="${character.class}">
    </div>`;

    // Notes
    html += `<div class="property-group-title" style="margin-top: 10px;">Notes</div>`;
    html += `<textarea id="char-notes" class="property-input" style="height: 60px;">${character.notes}</textarea>`;

    html += '</div>'; // End section

    // Actions
    html += '<div class="property-group" style="margin-top: 15px;">';
    html += `<button class="action-btn full-width" onclick="window.characterPanelUI.openInventory('${character.id}')">
        📦 Open Inventory
    </button>`;
    html += '</div>';

    return html;
}

export function bindCharacterEvents(character, onChange) {
    // Bind parents
    bindCreatureEvents(character, onChange);

    // Bind Character specific
    document.getElementById('char-player')?.addEventListener('change', (e) => {
        character.playerName = e.target.value;
        onChange();
    });

    document.getElementById('char-race')?.addEventListener('change', (e) => {
        character.race = e.target.value;
        onChange();
    });

    document.getElementById('char-class')?.addEventListener('change', (e) => {
        character.class = e.target.value;
        onChange();
    });

    document.getElementById('char-notes')?.addEventListener('change', (e) => {
        character.notes = e.target.value;
        onChange();
    });
}
