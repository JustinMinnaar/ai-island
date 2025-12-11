// In-memory storage with JSON export/import
import { world } from './world.js';

class Storage {
    constructor() {
        this.autosaveEnabled = false;
        this.autosaveInterval = null;
    }

    /**
     * Save world to JSON file (browser download)
     */
    saveToFile(filename = 'dungeon.json') {
        const data = world.exportToJSON();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
        console.log('✅ World saved to', filename);
    }

    /**
     * Load world from JSON file
     */
    async loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    world.importFromJSON(data);
                    console.log('✅ World loaded from file');
                    resolve(data);
                } catch (error) {
                    console.error('❌ Failed to load world:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Save to browser localStorage
     */
    saveToLocalStorage(key = 'ai-island-world') {
        const data = world.exportToJSON();
        const json = JSON.stringify(data);
        localStorage.setItem(key, json);
        localStorage.setItem(`${key}-timestamp`, Date.now().toString());
        console.log('✅ World saved to localStorage');
    }

    /**
     * Load from browser localStorage
     */
    loadFromLocalStorage(key = 'ai-island-world') {
        const json = localStorage.getItem(key);
        if (!json) {
            console.warn('⚠️ No saved world found in localStorage');
            return false;
        }

        try {
            const data = JSON.parse(json);
            world.importFromJSON(data);
            console.log('✅ World loaded from localStorage');
            return true;
        } catch (error) {
            console.error('❌ Failed to load from localStorage:', error);
            return false;
        }
    }

    /**
     * Check if autosave exists
     */
    hasAutosave(key = 'ai-island-world') {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Get autosave timestamp
     */
    getAutosaveTime(key = 'ai-island-world') {
        const timestamp = localStorage.getItem(`${key}-timestamp`);
        return timestamp ? new Date(parseInt(timestamp)) : null;
    }

    /**
     * Enable autosave
     */
    enableAutosave(intervalMs = 30000) {
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
        }

        this.autosaveEnabled = true;
        this.autosaveInterval = setInterval(() => {
            this.saveToLocalStorage('ai-island-autosave');
        }, intervalMs);

        console.log(`✅ Autosave enabled (every ${intervalMs / 1000}s)`);
    }

    /**
     * Disable autosave
     */
    disableAutosave() {
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
            this.autosaveInterval = null;
        }
        this.autosaveEnabled = false;
        console.log('⏸️ Autosave disabled');
    }

    /**
     * Clear all saved data
     */
    clearAll() {
        localStorage.removeItem('ai-island-world');
        localStorage.removeItem('ai-island-world-timestamp');
        localStorage.removeItem('ai-island-autosave');
        localStorage.removeItem('ai-island-autosave-timestamp');
        console.log('🗑️ All saved data cleared');
    }
}

export const storage = new Storage();
