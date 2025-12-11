// Gemini API integration for AI-powered generation
// ⚠️ IMPORTANT: Replace YOUR_API_KEY_HERE with your actual Gemini API key

const GEMINI_API_KEY = 'YOUR_API_KEY_HERE'; // ⬅️ ADD YOUR API KEY HERE
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

class GeminiAPI {
    constructor() {
        this.apiKey = GEMINI_API_KEY;
    }

    /**
     * Generate content based on a prompt
     * @param {string} prompt - The generation prompt
     * @param {object} context - Additional context (area bounds, existing content, etc.)
     */
    async generate(prompt, context = {}) {
        if (this.apiKey === 'YOUR_API_KEY_HERE') {
            console.warn('⚠️ Gemini API key not configured. Using mock response.');
            return this.mockGenerate(prompt, context);
        }

        try {
            const fullPrompt = this.buildPrompt(prompt, context);

            const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const generatedText = data.candidates[0].content.parts[0].text;

            return this.parseResponse(generatedText);
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }

    /**
     * Build a detailed prompt with context
     */
    buildPrompt(userPrompt, context) {
        const { x1, z1, x2, z2 } = context.bounds || {};
        const width = x2 - x1 + 1;
        const height = z2 - z1 + 1;

        return `You are a D&D dungeon generator. Generate content for a ${width}x${height} grid area.

User Request: ${userPrompt}

Please respond with JSON in this exact format:
{
  "walls": [
    {"x": 0, "y": 0, "z": 0, "direction": "north"},
    {"x": 1, "y": 0, "z": 0, "direction": "east"}
  ],
  "floors": [
    {"x": 0, "y": 0, "z": 0},
    {"x": 1, "y": 0, "z": 0}
  ],
  "doors": [
    {"x": 2, "y": 0, "z": 0, "direction": "north", "isOpen": false, "pivot": "left"}
  ],
  "entities": [
    {"name": "Wooden Table", "type": "item", "x": 1, "y": 0, "z": 1},
    {"name": "Goblin Guard", "type": "creature", "x": 3, "y": 0, "z": 3, "health": 20, "maxHealth": 20}
  ]
}

Directions: "north", "south", "east", "west"
Entity types: "character", "creature", "item", "npc"
Coordinates are relative to the selected area starting at (${x1}, 0, ${z1}).

Generate interesting, thematic content that fits the request. Include walls, floors, doors, and entities as appropriate.`;
    }

    /**
     * Parse the API response into usable data
     */
    parseResponse(responseText) {
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                responseText.match(/```\n([\s\S]*?)\n```/);

            const jsonText = jsonMatch ? jsonMatch[1] : responseText;
            return JSON.parse(jsonText);
        } catch (error) {
            console.error('Failed to parse Gemini response:', error);
            console.log('Raw response:', responseText);
            throw new Error('Failed to parse generation response');
        }
    }

    /**
     * Mock generation for testing without API key
     */
    mockGenerate(prompt, context) {
        console.log('🎭 Using mock generation');

        const { x1 = 0, z1 = 0, x2 = 5, z2 = 5 } = context.bounds || {};

        // Generate a simple room
        const walls = [];
        const floors = [];
        const doors = [];
        const entities = [];

        // Create a rectangular room
        for (let x = x1; x <= x2; x++) {
            walls.push({ x, y: 0, z: z1, direction: 'north' });
            walls.push({ x, y: 0, z: z2, direction: 'south' });

            for (let z = z1; z <= z2; z++) {
                floors.push({ x, y: 0, z });
            }
        }

        for (let z = z1; z <= z2; z++) {
            walls.push({ x: x1, y: 0, z, direction: 'west' });
            walls.push({ x: x2, y: 0, z, direction: 'east' });
        }

        // Add a door
        const doorX = Math.floor((x1 + x2) / 2);
        doors.push({
            x: doorX,
            y: 0,
            z: z1,
            direction: 'north',
            isOpen: false,
            pivot: 'left'
        });

        // Add some entities
        entities.push({
            name: 'Treasure Chest',
            type: 'item',
            x: x1 + 1,
            y: 0,
            z: z1 + 1
        });

        entities.push({
            name: 'Guard',
            type: 'creature',
            x: x2 - 1,
            y: 0,
            z: z2 - 1,
            health: 30,
            maxHealth: 30
        });

        return Promise.resolve({
            walls,
            floors,
            doors,
            entities
        });
    }
}

export const geminiAPI = new GeminiAPI();
