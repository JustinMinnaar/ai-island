// Creature Sheet - Renders Creature properties + Item properties
import { renderItemSheet, bindItemEvents } from './item-sheet.js';

export function renderCreatureSheet(container, creature, onChange) {
    let html = renderItemSheet(container, creature, onChange);

    html += '<div class="sheet-section creature-section">';
    html += '<div class="property-group-title">❤️ Creature Stats</div>';

    // Health
    html += `<div class="property-row">
        <span class="property-label">Health</span>
        <div style="display: flex; gap: 5px;">
            <input type="number" id="creature-hp-current" class="property-input" value="${creature.health.current}" style="width: 60px">
            <span>/</span>
            <input type="number" id="creature-hp-max" class="property-input" value="${creature.health.max}" style="width: 60px">
        </div>
    </div>`;

    // Stats
    html += `<div class="property-row"><span class="property-label">STR</span><input type="number" id="stat-str" class="property-input" value="${creature.stats.str}" style="width: 50px"></div>`;
    html += `<div class="property-row"><span class="property-label">DEX</span><input type="number" id="stat-dex" class="property-input" value="${creature.stats.dex}" style="width: 50px"></div>`;
    html += `<div class="property-row"><span class="property-label">INT</span><input type="number" id="stat-int" class="property-input" value="${creature.stats.int}" style="width: 50px"></div>`;

    // Skills List (Simplified view)
    html += '<div class="property-group-title" style="margin-top: 10px;">Skills</div>';
    html += '<div id="creature-skills-list">';
    if (creature.skills.length === 0) {
        html += '<div class="text-muted" style="font-size: 11px;">No skills</div>';
    } else {
        creature.skills.forEach(s => {
            html += `<div class="property-row" style="font-size: 11px;">
                <span>${s.name}</span>
                <span>${s.value}</span>
            </div>`;
        });
    }
    html += '</div>';

    html += '</div>';
    return html;
}

export function bindCreatureEvents(creature, onChange) {
    bindItemEvents(creature, onChange);

    // Bind Health
    document.getElementById('creature-hp-current')?.addEventListener('change', (e) => {
        creature.health.current = parseInt(e.target.value);
        onChange();
    });
    document.getElementById('creature-hp-max')?.addEventListener('change', (e) => {
        creature.health.max = parseInt(e.target.value);
        onChange();
    });

    // Bind Stats
    ['str', 'dex', 'int'].forEach(stat => {
        document.getElementById(`stat-${stat}`)?.addEventListener('change', (e) => {
            creature.stats[stat] = parseInt(e.target.value);
            onChange();
        });
    });
}
