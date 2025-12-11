// Types Panel UI - GM tool for managing item, creature, and character types
import { typeRegistry } from '../type-registry.js';
import { assetManager } from '../managers/asset-manager.js';
import { world } from '../world.js';
import { renderer } from '../renderer-3d.js';
import { ui } from '../ui.js';

class TypesPanelUI {
    constructor() {
        this.container = null;
        this.currentTab = 'items'; // 'items', 'creatures', 'characters'
        this.selectedType = null;
        this.isVisible = false;
    }

    init() {
        // Create panel container
        this.container = document.createElement('div');
        this.container.id = 'types-panel';
        this.container.className = 'side-panel left-panel collapsed';
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
        html += '<h3>📦 Asset Types</h3>';
        html += '<button class="panel-close" onclick="typesPanelUI.toggle()">×</button>';
        html += '</div>';

        // Tabs
        html += '<div class="panel-tabs">';
        html += `<button class="tab-btn ${this.currentTab === 'items' ? 'active' : ''}" onclick="typesPanelUI.switchTab('items')">Items</button>`;
        html += `<button class="tab-btn ${this.currentTab === 'creatures' ? 'active' : ''}" onclick="typesPanelUI.switchTab('creatures')">Creatures</button>`;
        html += `<button class="tab-btn ${this.currentTab === 'characters' ? 'active' : ''}" onclick="typesPanelUI.switchTab('characters')">Characters</button>`;
        html += '</div>';

        // Type list
        html += '<div class="panel-content">';
        html += this.renderTypeList();
        html += '</div>';

        // Actions
        html += '<div class="panel-actions">';
        html += '<button class="action-btn" onclick="typesPanelUI.createNewType()">+ New Type</button>';
        html += '<button class="action-btn" onclick="typesPanelUI.exportTypes()">Export</button>';
        html += '<button class="action-btn" onclick="typesPanelUI.importTypes()">Import</button>';
        html += '</div>';

        this.container.innerHTML = html;
    }

    renderTypeList() {
        const types = typeRegistry.getTypesByCategory(this.currentTab === 'items' ? 'item' :
            this.currentTab === 'creatures' ? 'creature' : 'character');

        if (types.length === 0) {
            return '<div class="empty-state">No types yet. Create one!</div>';
        }

        let html = '<div class="type-list">';
        types.forEach(type => {
            html += `<div class="type-item" draggable="true" ondragstart="typesPanelUI.onDragStart(event, ${type.id})">`;
            html += `<div class="type-header">`;
            html += `<strong>${type.name}</strong> <span class="type-id">(${type.id})</span>`;
            html += `</div>`;
            html += `<div class="type-details">`;

            if (type.category === 'item') {
                html += `${type.gridWidth}x${type.gridHeight}, Stack: ${type.maxStack}`;
            } else if (type.category === 'creature') {
                html += `HP: ${type.defaultHP || 10}`;
            } else {
                html += `${type.race} ${type.class}`;
            }

            html += `</div>`;
            html += `<div class="type-actions">`;
            html += `<button class="small-btn primary" title="Add to World" onclick="typesPanelUI.instantiateType(${type.id})">+ Instance</button>`;
            html += `<button class="small-btn" onclick="typesPanelUI.editType(${type.id})">Edit</button>`;
            html += `<button class="small-btn danger" onclick="typesPanelUI.deleteType(${type.id})">Delete</button>`;
            html += `</div>`;
            html += `</div>`;
        });
        html += '</div>';

        return html;
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.render();
    }

    // ... (createNewType, editType, showTypeEditor, saveType remain the same) ...
    createNewType() {
        this.showTypeEditor(null);
    }

    editType(typeId) {
        const type = typeRegistry.getType(typeId);
        if (type) {
            this.showTypeEditor(type);
        }
    }

    // ... (rest of editor methods) ...
    // Note: To avoid overly large replace blocks, I am assuming the editor methods are unchanged
    // and focusing on adding instantiateType. 
    // Wait, I need to keep the file valid. I'll replace from renderTypeList end to the end of file for safety
    // if I can match the content context.

    // Actually, I'll insert instantiateType before onDragStart and update renderTypeList

    // ...

    async instantiateType(typeId, position = null) {
        const type = typeRegistry.getType(typeId);
        if (!type) {
            console.error('Type not found:', typeId);
            return;
        }

        console.log(`✨ Instantiating ${type.category}: ${type.name}`);

        // 1. Determine Position
        let pos = position;
        if (!pos) {
            // Raycast to center of screen
            const canvas = renderer.canvas;
            if (canvas) {
                const centerPos = renderer.screenToWorld(canvas.clientWidth / 2, canvas.clientHeight / 2);
                if (centerPos) {
                    pos = centerPos;
                } else {
                    ui.showNotification('Could not place instance. Center of view is not on ground.', 'warning');
                    return;
                }
            } else {
                pos = { x: 0, y: 0, z: 0 }; // Fallback if no canvas/renderer?
            }
        }

        // 2. Create Instance
        let instance;
        const props = {
            typeId: type.id,
            name: type.name,
            description: type.description,
            position: pos,
            owner: 'gm' // Default owner
        };

        if (type.category === 'item') {
            const { Item } = await import('../models/Item.js');
            instance = new Item(props);
            instance.imageURL = type.imageURL;
            world.addItemInstance(instance);
        }
        else if (type.category === 'creature') {
            const { Creature } = await import('../models/Creature.js');
            props.health = { current: type.defaultHP || 10, max: type.defaultHP || 10 };
            props.skills = type.skills ? JSON.parse(JSON.stringify(type.skills)) : []; // Deep copy
            instance = new Creature(props);
            // world.addCreature? No, world treats creatures as entities?
            // There is no addCreature. world.addCharacter exists.
            // But scene-panel lists "Creatures" from world.getAllEntities with type='creature'.
            // So we need to set type='creature' on the object? 
            // The Item class doesn't have a 'type' property (it has typeId).
            // But world.js checks `e.type`. 
            // We must ensure the instance has a `type` property corresponding to the category!
            instance.type = 'creature';
        }
        else if (type.category === 'character') {
            const { Character } = await import('../character.js');
            props.race = type.race;
            props.class = type.class;
            props.skills = type.skills ? JSON.parse(JSON.stringify(type.skills)) : [];
            instance = new Character(props);
            world.addCharacter(instance);
            instance.type = 'character';
        }

        // ensure generic item has type
        if (type.category === 'item' && !instance.type) instance.type = 'item';

        // 3. Add to World Entities (for selection/rendering/scene-panel)
        world.updateEntity(instance);

        console.log(`✅ Created instance at (${pos.x}, ${pos.y}, ${pos.z})`);

        // 4. Update UI
        if (renderer) renderer.markDirty();
        if (window.scenePanelUI) window.scenePanelUI.render();
    }

    onDragStart(event, typeId) {
        event.dataTransfer.setData('typeId', typeId);
        // Also set category if possible, or just look up typeId later
        event.dataTransfer.effectAllowed = 'copy';
    }
    showTypeEditor(type) {
        const isNew = !type;
        const category = isNew ? this.currentTab : type.category;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${isNew ? 'Create' : 'Edit'} ${category === 'item' ? 'Item' : category === 'creature' ? 'Creature' : 'Character'} Type</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" id="type-name" value="${type?.name || ''}" placeholder="Type name">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="type-description" placeholder="Description">${type?.description || ''}</textarea>
                    </div>
                    ${category === 'item' ? `
                        <div class="form-group">
                            <label>Grid Width</label>
                            <input type="number" id="type-grid-width" value="${type?.gridWidth || 1}" min="1" max="8">
                        </div>
                        <div class="form-group">
                            <label>Grid Height</label>
                            <input type="number" id="type-grid-height" value="${type?.gridHeight || 1}" min="1" max="4">
                        </div>
                        <div class="form-group">
                            <label>Max Stack</label>
                            <input type="number" id="type-max-stack" value="${type?.maxStack || 1}" min="1">
                        </div>
                        <div class="form-group">
                            <label>Image URL (optional)</label>
                            <input type="text" id="type-image-url" value="${type?.imageURL || ''}" placeholder="https://...">
                        </div>
                    ` : ''}
                    ${category === 'creature' ? `
                        <div class="form-group">
                            <label>Default HP</label>
                            <input type="number" id="type-default-hp" value="${type?.defaultHP || 10}" min="1">
                        </div>
                        <div class="form-group">
                            <label>Skills (name:value, one per line)</label>
                            <textarea id="type-skills" placeholder="Combat:2\nSneak:3">${type?.skills?.map(s => `${s.name}:${s.value}`).join('\n') || ''}</textarea>
                        </div>
                    ` : ''}
                    ${category === 'character' ? `
                        <div class="form-group">
                            <label>Race</label>
                            <input type="text" id="type-race" value="${type?.race || 'Human'}">
                        </div>
                        <div class="form-group">
                            <label>Class</label>
                            <input type="text" id="type-class" value="${type?.class || 'Warrior'}">
                        </div>
                        <div class="form-group">
                            <label>Skills (name:value, one per line)</label>
                            <textarea id="type-skills" placeholder="Swordsmanship:5\nDefense:4">${type?.skills?.map(s => `${s.name}:${s.value}`).join('\n') || ''}</textarea>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="action-btn" onclick="typesPanelUI.saveType(${type?.id || 'null'}, '${category}', this.closest('.modal-overlay'))">Save</button>
                    <button class="action-btn secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    saveType(typeId, category, modal) {
        try {
            console.log(`💾 Saving type: ID=${typeId}, Category=${category}`);

            const name = document.getElementById('type-name').value;
            const description = document.getElementById('type-description').value;

            if (!name) {
                alert('Name is required');
                return;
            }

            const properties = { name, description };

            if (category === 'item') {
                properties.gridWidth = parseInt(document.getElementById('type-grid-width').value) || 1;
                properties.gridHeight = parseInt(document.getElementById('type-grid-height').value) || 1;
                properties.maxStack = parseInt(document.getElementById('type-max-stack').value) || 1;
                properties.imageURL = document.getElementById('type-image-url').value || null;
            } else if (category === 'creature' || category === 'character') {
                const skillsText = document.getElementById('type-skills').value;
                properties.skills = skillsText.split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        const [name, value] = line.split(':');
                        return { name: name.trim(), value: parseInt(value) || 0 };
                    });

                if (category === 'creature') {
                    properties.defaultHP = parseInt(document.getElementById('type-default-hp').value) || 10;
                } else {
                    properties.race = document.getElementById('type-race').value;
                    properties.class = document.getElementById('type-class').value;
                }
            }

            if (typeId) {
                // Update existing
                console.log('🔄 Updating existing type...');
                typeRegistry.updateType(typeId, properties);
            } else {
                // Create new
                console.log('✨ Creating new type...');
                const newId = typeRegistry.createType(category, properties);
                console.log(`✅ Created type with ID: ${newId}`);
            }

            if (modal) modal.remove();
            this.render();
            console.log('🎨 Panel re-rendered');

        } catch (error) {
            console.error('❌ Error saving type:', error);
            alert('Error saving type: ' + error.message);
        }
    }

    deleteType(typeId) {
        if (confirm('Delete this type? This cannot be undone.')) {
            typeRegistry.deleteType(typeId);
            this.render();
        }
    }

    exportTypes() {
        const json = typeRegistry.exportToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'types-export.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importTypes() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        typeRegistry.importFromJSON(event.target.result);
                        this.render();
                        alert('Types imported successfully!');
                    } catch (error) {
                        alert('Error importing types: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    onDragStart(event, typeId) {
        event.dataTransfer.setData('typeId', typeId);
        event.dataTransfer.effectAllowed = 'copy';
    }
}

export const typesPanelUI = new TypesPanelUI();
window.typesPanelUI = typesPanelUI; // For onclick handlers
