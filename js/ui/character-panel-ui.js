// Character Panel UI - Manage characters in the world
import { world } from '../world.js';
import { Character } from '../character.js';
import { typeRegistry } from '../type-registry.js';
import { renderer } from '../renderer-3d.js';

class CharacterPanelUI {
    constructor() {
        this.container = null;
        this.selectedCharacter = null;
        this.isVisible = false;
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'character-panel';
        this.container.className = 'side-panel right-panel collapsed';
        document.body.appendChild(this.container);

        this.render();
    }

    toggle() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.container.classList.remove('collapsed');
            this.render();
        } else {
            this.container.classList.add('collapsed');
        }
    }

    render() {
        if (!this.container) return;

        let html = '<div class="panel-header">';
        html += '<h3>👥 Characters</h3>';
        html += '<button class="panel-close" onclick="characterPanelUI.toggle()">×</button>';
        html += '</div>';

        html += '<div class="panel-content">';

        if (this.selectedCharacter) {
            html += this.renderCharacterEditor();
        } else {
            html += this.renderCharacterList();
        }

        html += '</div>';

        this.container.innerHTML = html;
    }

    renderCharacterList() {
        const characters = world.getAllCharacters();

        let html = '<button class="action-btn full-width" onclick="characterPanelUI.createNewCharacter()">+ New Character</button>';

        if (characters.length === 0) {
            html += '<div class="empty-state">No characters yet</div>';
            return html;
        }

        html += '<div class="character-list">';
        characters.forEach(char => {
            html += `<div class="character-item" onclick="characterPanelUI.selectCharacter('${char.id}')">`;
            html += `<div class="character-header"><strong>${char.name}</strong></div>`;
            html += `<div class="character-details">`;
            html += `Player: ${char.playerName || 'None'}<br>`;
            html += `${char.race} ${char.class}`;
            html += `</div>`;
            html += `</div>`;
        });
        html += '</div>';

        return html;
    }

    renderCharacterEditor() {
        const char = this.selectedCharacter;

        let html = '<button class="action-btn secondary" onclick="characterPanelUI.deselectCharacter()">← Back</button>';
        html += '<div class="character-editor">';
        html += `<div class="form-group">`;
        html += `<label>Name</label>`;
        html += `<input type="text" id="char-name" value="${char.name}">`;
        html += `</div>`;
        html += `<div class="form-group">`;
        html += `<label>Player Name</label>`;
        html += `<input type="text" id="char-player-name" value="${char.playerName || ''}">`;
        html += `</div>`;
        html += `<div class="form-group">`;
        html += `<label>Race</label>`;
        html += `<input type="text" id="char-race" value="${char.race}">`;
        html += `</div>`;
        html += `<div class="form-group">`;
        html += `<label>Class</label>`;
        html += `<input type="text" id="char-class" value="${char.class}">`;
        html += `</div>`;
        html += `<div class="form-group">`;
        html += `<label>Skills</label>`;
        html += `<div id="char-skills">`;
        char.skills.forEach((skill, idx) => {
            html += `<div class="skill-row">`;
            html += `<input type="text" value="${skill.name}" id="skill-name-${idx}" placeholder="Skill name">`;
            html += `<input type="number" value="${skill.value}" id="skill-value-${idx}" placeholder="Value">`;
            html += `<button class="small-btn danger" onclick="characterPanelUI.removeSkill(${idx})">×</button>`;
            html += `</div>`;
        });
        html += `</div>`;
        html += `<button class="action-btn secondary" onclick="characterPanelUI.addSkill()">+ Add Skill</button>`;
        html += `</div>`;
        html += `<div class="form-group">`;
        html += `<label>Notes</label>`;
        html += `<textarea id="char-notes">${char.notes}</textarea>`;
        html += `</div>`;
        html += `<div class="form-actions">`;
        html += `<button class="action-btn" onclick="characterPanelUI.saveCharacter()">Save</button>`;
        html += `<button class="action-btn danger" onclick="characterPanelUI.deleteCharacter()">Delete</button>`;
        html += `</div>`;
        html += '</div>';

        return html;
    }

    createNewCharacter() {
        const char = new Character({
            name: 'New Character',
            position: { x: 0, y: 0, z: 0 }
        });
        world.addCharacter(char);
        this.selectCharacter(char.id);
    }

    selectCharacter(id) {
        this.selectedCharacter = world.getCharacter(id);
        this.render();
    }

    deselectCharacter() {
        this.selectedCharacter = null;
        this.render();
    }

    openInventory(charId) {
        const char = world.getCharacter(charId);
        if (char) {
            import('./inventory-panel-ui.js').then(module => {
                module.inventoryPanelUI.show(char);
            });
        }
    }

    addSkill() {
        if (!this.selectedCharacter) return;
        this.selectedCharacter.setSkill('New Skill', 0);
        this.render();
    }

    removeSkill(idx) {
        if (!this.selectedCharacter) return;
        this.selectedCharacter.skills.splice(idx, 1);
        this.render();
    }

    saveCharacter() {
        if (!this.selectedCharacter) return;

        const char = this.selectedCharacter;
        char.name = document.getElementById('char-name').value;
        char.playerName = document.getElementById('char-player-name').value;
        char.race = document.getElementById('char-race').value;
        char.class = document.getElementById('char-class').value;
        char.notes = document.getElementById('char-notes').value;

        // Update skills
        char.skills = [];
        let idx = 0;
        while (document.getElementById(`skill-name-${idx}`)) {
            const name = document.getElementById(`skill-name-${idx}`).value;
            const value = parseInt(document.getElementById(`skill-value-${idx}`).value) || 0;
            if (name) {
                char.skills.push({ name, value });
            }
            idx++;
        }

        if (renderer) renderer.markDirty();
        alert('Character saved!');
        this.deselectCharacter();
    }

    deleteCharacter() {
        if (!this.selectedCharacter) return;
        if (confirm('Delete this character?')) {
            world.removeCharacter(this.selectedCharacter.id);
            this.deselectCharacter();
            if (renderer) renderer.markDirty();
        }
    }
}

export const characterPanelUI = new CharacterPanelUI();
window.characterPanelUI = characterPanelUI;
