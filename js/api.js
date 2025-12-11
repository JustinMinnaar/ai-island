// API Service for server communication
import { CONFIG } from './config.js';

class APIService {
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.lastUpdateTime = Date.now();
        this.pollingInterval = null;
    }

    /**
     * Generic fetch wrapper with error handling
     */
    async fetch(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * Get world state for a specific region
     * @param {number} x1 - Min X coordinate
     * @param {number} z1 - Min Z coordinate
     * @param {number} x2 - Max X coordinate
     * @param {number} z2 - Max Z coordinate
     * @param {number} y - Y level (default 0)
     */
    async getWorldState(x1, z1, x2, z2, y = 0) {
        const params = new URLSearchParams({ x1, z1, x2, z2, y });
        return await this.fetch(`${CONFIG.API.ENDPOINTS.WORLD_STATE}?${params}`);
    }

    /**
     * Get all entities in the world
     */
    async getEntities() {
        return await this.fetch(CONFIG.API.ENDPOINTS.ENTITIES);
    }

    /**
     * Send a player action to the server
     * @param {string} action - Action type (move, interact, attack, etc.)
     * @param {object} data - Action data
     */
    async sendAction(action, data) {
        return await this.fetch(CONFIG.API.ENDPOINTS.ACTION, {
            method: 'POST',
            body: JSON.stringify({ action, data, timestamp: Date.now() })
        });
    }

    /**
     * Poll for updates since last check
     */
    async getUpdates() {
        const params = new URLSearchParams({ since: this.lastUpdateTime });
        const updates = await this.fetch(`${CONFIG.API.ENDPOINTS.UPDATES}?${params}`);
        this.lastUpdateTime = Date.now();
        return updates;
    }

    /**
     * Start polling for updates
     * @param {function} callback - Called with updates
     */
    startPolling(callback) {
        if (this.pollingInterval) {
            this.stopPolling();
        }

        this.pollingInterval = setInterval(async () => {
            try {
                const updates = await this.getUpdates();
                if (updates && updates.length > 0) {
                    callback(updates);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, CONFIG.API.POLL_INTERVAL);
    }

    /**
     * Stop polling for updates
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * Move a character/entity
     */
    async moveEntity(entityId, x, y, z) {
        return await this.sendAction('move', { entityId, x, y, z });
    }

    /**
     * Interact with an object or entity
     */
    async interact(entityId, targetId) {
        return await this.sendAction('interact', { entityId, targetId });
    }

    /**
     * Toggle door state
     */
    async toggleDoor(x, y, z) {
        return await this.sendAction('toggleDoor', { x, y, z });
    }
}

export const api = new APIService();
