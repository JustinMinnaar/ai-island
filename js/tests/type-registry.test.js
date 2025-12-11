// Tests for TypeRegistry
import { typeRegistry } from '../type-registry.js';
import { describe, it, expect } from '../testing/test-runner.js';

describe('Type Registry', () => {

    it('should have initial starter types loaded', () => {
        // We know starter types are loaded in main.js
        const types = typeRegistry.getTypesByCategory('item');
        expect(types.length).toBeGreaterThan(0);
    });

    it('should create and retrieve a new item type', () => {
        const typeData = {
            name: 'Test Sword',
            description: 'A sharp test blade',
            gridWidth: 1,
            gridHeight: 2,
            maxStack: 1
        };

        const id = typeRegistry.createType('item', typeData);

        const type = typeRegistry.getType(id);
        expect(type).toBeTruthy();
        expect(type.name).toBe('Test Sword');
        expect(type.maxStack).toBe(1);
        expect(type.category).toBe('item');
    });

    it('should validate required item properties', () => {
        // missing grid dimensions
        let capturedError = null;
        try {
            typeRegistry.createType('item', { name: 'Bad Item' });
        } catch (e) {
            capturedError = e;
        }

        expect(capturedError).toBeTruthy();
    });

    it('should update an existing type', () => {
        // Create first
        const id = typeRegistry.createType('creature', {
            name: 'Test Rat',
            defaultHP: 5
        });

        // Update
        typeRegistry.updateType(id, { defaultHP: 10 });

        const type = typeRegistry.getType(id);
        expect(type.defaultHP).toBe(10);
    });

    it('should delete a type', () => {
        const id = typeRegistry.createType('character', {
            name: 'Test Hero',
            race: 'Human',
            class: 'Tester'
        });

        expect(typeRegistry.getType(id)).toBeTruthy();

        typeRegistry.deleteType(id);

        expect(typeRegistry.getType(id)).toBeFalsy();
    });
});
