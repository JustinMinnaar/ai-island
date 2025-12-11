// Quickbar UI component for mode switching
import { CONFIG } from './config.js';

class Quickbar {
    constructor() {
        this.currentMode = CONFIG.GAME.QUICKBAR_MODES.SELECT;
        this.element = null;
        this.init();
    }

    init() {
        // Wait for DOM if not ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }

        // Create quickbar element
        this.element = document.createElement('div');
        this.element.className = 'quickbar';

        // Add mode buttons
        const modes = [
            { mode: CONFIG.GAME.QUICKBAR_MODES.SELECT, icon: '🎯', label: 'Select Mode' },
            { mode: CONFIG.GAME.QUICKBAR_MODES.BUILD, icon: '🏗️', label: 'Build Mode' },
            { mode: CONFIG.GAME.QUICKBAR_MODES.GENERATE, icon: '✨', label: 'Generate Mode' }
        ];

        modes.forEach(({ mode, icon, label }) => {
            const btn = document.createElement('button');
            btn.className = 'quickbar-btn';
            if (mode === this.currentMode) {
                btn.classList.add('active');
            }
            btn.innerHTML = `
        ${icon}
        <span class="tooltip-text">${label}</span>
      `;
            btn.dataset.mode = mode;
            btn.addEventListener('click', () => this.setMode(mode));
            this.element.appendChild(btn);
        });

        // Add to canvas container
        const canvasContainer = document.querySelector('.canvas-container');
        canvasContainer.appendChild(this.element);
    }

    setMode(mode) {
        if (this.currentMode === mode) return;

        this.currentMode = mode;

        // Update button states
        this.element.querySelectorAll('.quickbar-btn').forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Dispatch mode change event
        window.dispatchEvent(new CustomEvent('quickbarModeChange', {
            detail: { mode }
        }));
    }

    getMode() {
        return this.currentMode;
    }
}

export const quickbar = new Quickbar();
