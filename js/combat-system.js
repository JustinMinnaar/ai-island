import { world } from './world.js';
import { turnManager } from './turn-manager.js';
import { ui } from './ui.js';
import { CONFIG } from './config.js';

class CombatSystem {
    constructor() {
        this.damageMultipliers = {
            CRITICAL: 2.0,
            RESISTANT: 0.5,
            VULNERABLE: 2.0
        };
    }

    /**
     * Perform an attack action
     * @param {string} attackerId 
     * @param {string} targetId 
     * @param {string} skillName - Optional skill/weapon used
     */
    async attack(attackerId, targetId, skillName = 'Basic Attack') {
        const attacker = world.getEntity(attackerId);
        const target = world.getEntity(targetId);

        if (!attacker || !target) {
            console.error("Combat: Invalid attacker or target");
            return;
        }

        // 1. Roll to Hit (d20 + modifiers)
        // Simplification: Modifiers = Level or Strength/Dex logic (placeholder: +2)
        const d20 = Math.floor(Math.random() * 20) + 1;
        const hitMod = 2; // Should come from attacker stats
        const attackRoll = d20 + hitMod;

        // 2. Determine AC (Armor Class)
        // Placeholder: Default AC 10 + Dex (0)
        const targetAC = target.stats?.dex ? 10 + Math.floor((target.stats.dex - 10) / 2) : 10;

        console.log(`⚔️ ${attacker.name} attacks ${target.name} with ${skillName}`);
        console.log(`🎲 Roll: ${d20} + ${hitMod} = ${attackRoll} vs AC ${targetAC}`);

        // 3. Check Hit
        if (d20 === 20 || attackRoll >= targetAC) {
            const isCrit = d20 === 20;
            this.applyDamage(attacker, target, isCrit);
        } else {
            console.log("❌ Miss!");
            ui.showNotification(`Miss! (${attackRoll})`, 'info');
        }

        // 4. Use Action Point (End Turn for now)
        turnManager.endTurn();
    }

    applyDamage(attacker, target, isCrit) {
        // Roll Damage (e.g., 1d6 + Str)
        const dmgDie = Math.floor(Math.random() * 6) + 1;
        const dmgMod = 0; // Str mod placeholder
        let damage = dmgDie + dmgMod;

        if (isCrit) {
            damage *= this.damageMultipliers.CRITICAL;
            console.log("💥 CRITICAL HIT!");
            ui.showNotification("CRITICAL HIT!", 'danger');
        }

        // Apply to Target
        if (target.health) {
            target.health.current -= damage;
            console.log(`🩸 ${target.name} takes ${damage} damage. HP: ${target.health.current}/${target.health.max}`);

            ui.showNotification(`${target.name} takes ${damage} damage!`, 'warning');

            // Death Check
            if (target.health.current <= 0) {
                this.handleDeath(target);
            }
        }

        // Update UI
        if (window.propertiesPanelUI && world.selectedEntity === target.id) {
            window.propertiesPanelUI.render(); // Refresh HP bar
        }
    }

    handleDeath(target) {
        console.log(`💀 ${target.name} has died!`);
        ui.showNotification(`${target.name} died!`, 'danger');

        // Remove from turn order if active
        turnManager.removeEntity(target.id);

        // Visuals: Maybe turn into a corpse item?
        // simple removal for now
        world.removeEntity(target.id);

        if (renderer) renderer.markDirty();
        if (window.scenePanelUI) window.scenePanelUI.render();
    }
}

export const combatSystem = new CombatSystem();
