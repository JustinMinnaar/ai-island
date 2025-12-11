// Door utilities - Key/lock system
import { typeRegistry } from '../type-registry.js';

/**
 * Check if character can unlock a door
 * @param {Character} character - The character attempting to unlock
 * @param {Object} door - The door object from world
 * @returns {boolean} - True if character can unlock the door
 */
export function canUnlockDoor(character, door) {
    // If no item required, door can be unlocked
    if (!door.requiredItemId || door.requiredItemId === 0) {
        return true;
    }

    // Check if character has the required item in inventory
    return hasItem(character, door.requiredItemId);
}

/**
 * Check if character has a specific item type in inventory
 * @param {Character} character - The character to check
 * @param {number} itemTypeId - The item type ID to look for
 * @returns {boolean} - True if character has the item
 */
export function hasItem(character, itemTypeId) {
    if (!character.inventory) return false;

    // Check all items in inventory
    for (const item of character.inventory.items) {
        if (item && item.typeId === itemTypeId && item.count > 0) {
            return true;
        }
    }

    return false;
}

/**
 * Attempt to unlock a door with a character
 * @param {Character} character - The character attempting to unlock
 * @param {Object} door - The door object from world
 * @returns {Object} - {success: boolean, message: string}
 */
export function unlockDoor(character, door) {
    if (door.isLocked === false) {
        return { success: true, message: 'Door is already unlocked' };
    }

    if (!canUnlockDoor(character, door)) {
        const itemType = typeRegistry.getType(door.requiredItemId);
        const itemName = itemType ? itemType.name : `Item #${door.requiredItemId}`;
        return {
            success: false,
            message: `You need ${itemName} to unlock this door`
        };
    }

    // Unlock the door
    door.isLocked = false;
    return {
        success: true,
        message: 'Door unlocked!'
    };
}
