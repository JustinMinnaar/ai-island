// Turn Manager - Handles phases and turn order
import { CONFIG } from './config.js';
import { world } from './world.js';
import { ui } from './ui.js';

export const PHASES = {
    FREE_ROAM: 'FREE_ROAM',
    COMBAT: 'COMBAT'
};

class TurnManager {
    constructor() {
        this.phase = PHASES.FREE_ROAM;
        this.round = 0;
        this.turnIndex = 0;
        this.turnOrder = []; // Array of entity IDs
        this.activeEntityId = null;
        this.timeSinceLastTurn = 0;
        this.turnDuration = 2000; // ms (for AI turns mostly)
    }

    // --- Phase Control ---

    startCombat(participants = []) {
        if (this.phase === PHASES.COMBAT) return;

        console.log('⚔️ Starting Combat!');
        this.phase = PHASES.COMBAT;
        this.round = 1;

        // 1. Determine participants (if not provided, get all loaded entities?)
        // For now, let's grab all creatures/characters
        if (!participants || participants.length === 0) {
            participants = world.getAllEntities().filter(e =>
                e.type === 'creature' || e.type === 'character' || e.type === 'hero'
            );
        }

        // 2. Roll Initiative
        this.rollInitiative(participants);

        // 3. Start first turn
        this.turnIndex = 0;
        this.startTurn();

        ui.showNotification('Combat Started!', 'warning');
        this.updateUI();
    }

    endCombat() {
        console.log('☮️ Ending Combat');
        this.phase = PHASES.FREE_ROAM;
        this.turnOrder = [];
        this.activeEntityId = null;

        ui.showNotification('Combat Ended', 'success');
        this.updateUI();
    }

    // --- Turn Logic ---

    rollInitiative(entities) {
        this.turnOrder = entities.map(entity => {
            // D20 + Dex
            const d20 = Math.floor(Math.random() * 20) + 1;
            const dex = entity.stats?.dex || 10;
            const mod = Math.floor((dex - 10) / 2);
            const total = d20 + mod;

            // If entity class has rollInitiative, use it? 
            // For now, simple logic here.
            return {
                id: entity.id,
                name: entity.name,
                initiative: total,
                isPlayer: entity.type === 'character' || entity.type === 'hero'
            };
        });

        // Sort descending
        this.turnOrder.sort((a, b) => b.initiative - a.initiative);

        console.log('🎲 Initiative Order:', this.turnOrder);
    }

    startTurn() {
        if (this.turnOrder.length === 0) return;

        const current = this.turnOrder[this.turnIndex];
        this.activeEntityId = current.id;

        console.log(`👉 Turn: ${current.name} (${current.initiative})`);

        // select the entity to highlight it
        world.selectEntity(current.id);

        // Sync UI
        this.updateUI();

        // If AI, schedule action
        if (!current.isPlayer) {
            setTimeout(() => {
                this.performAITurn(current.id);
            }, 1000);
        }
    }

    nextTurn() {
        this.turnIndex++;
        if (this.turnIndex >= this.turnOrder.length) {
            this.turnIndex = 0;
            this.round++;
            console.log(`🔄 Round ${this.round} Start`);
        }
        this.startTurn();
    }

    endTurn() {
        this.nextTurn();
    }

    performAITurn(entityId) {
        console.log(`🤖 AI playing for ${entityId}...`);
        // Placeholder AI: Just wait and pass
        ui.showNotification(`AI ${entityId} passes.`, 'info');

        setTimeout(() => {
            this.nextTurn();
        }, 1000);
    }

    // --- Update Loop ---

    update(deltaTime) {
        // Used for timers if needed
        if (this.phase === PHASES.COMBAT) {
            // e.g. animation timers
        }
    }

    // --- UI Helpers ---

    updateUI() {
        // We can dispatch an event for the UI to pick up
        window.dispatchEvent(new CustomEvent('turnUpdate', {
            detail: {
                phase: this.phase,
                round: this.round,
                activeEntityId: this.activeEntityId,
                turnOrder: this.turnOrder,
                currentTurnIndex: this.turnIndex
            }
        }));
    }
}

export const turnManager = new TurnManager();
