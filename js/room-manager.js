// Room Manager - Manages rooms and object assignments
import { CONFIG } from './config.js';

class RoomManager {
    constructor() {
        this.scene = {
            id: 'scene-root',
            name: 'My Scene',
            description: 'The main scene container',
            type: 'scene'
        };

        this.rooms = new Map();
        this.selectedRoomId = null;
        this.nextRoomNumber = 1;

        // Create Default Room (Room 0)
        this.createDefaultRoom();
    }

    createDefaultRoom() {
        const room = {
            id: 'default',
            name: 'Default Room',
            number: 0,
            description: 'The default room for all objects',
            floors: new Set(),
            walls: new Set(),
            doors: new Set(),
            fixedItems: new Set()
        };
        this.rooms.set(room.id, room);
        this.selectedRoomId = 'default';
        return room;
    }

    createRoom(name = 'New Room') {
        const room = {
            id: `room-${Date.now()}`,
            name,
            number: this.nextRoomNumber++,
            description: 'A logical area on the map',
            floors: new Set(),
            walls: new Set(),
            doors: new Set(),
            fixedItems: new Set()
        };
        this.rooms.set(room.id, room);
        console.log(`🏠 Created room: ${name} (#${room.number})`);
        return room;
    }

    deleteRoom(roomId) {
        if (roomId === 'default') {
            console.warn('Cannot delete default room');
            return false;
        }
        this.rooms.delete(roomId);
        if (this.selectedRoomId === roomId) {
            this.selectedRoomId = 'default';
        }
        return true;
    }

    selectRoom(roomId) {
        if (this.rooms.has(roomId)) {
            this.selectedRoomId = roomId;
            console.log(`🏠 Selected room: ${this.rooms.get(roomId).name}`);
            return true;
        }
        return false;
    }

    getSelectedRoom() {
        return this.rooms.get(this.selectedRoomId);
    }

    getRoomByNumber(number) {
        for (const room of this.rooms.values()) {
            if (room.number === number) return room;
        }
        return null;
    }

    addToRoom(roomId, type, key) {
        const room = this.rooms.get(roomId);
        if (room && room[type]) {
            room[type].add(key);
            return true;
        }
        return false;
    }

    removeFromRoom(roomId, type, key) {
        const room = this.rooms.get(roomId);
        if (room && room[type]) {
            room[type].delete(key);
            return true;
        }
        return false;
    }

    // Helper to get room for a generic object key (across all rooms)
    getRoomForObject(type, key) {
        for (const [roomId, room] of this.rooms) {
            if (room[type] && room[type].has(key)) {
                return roomId;
            }
        }
        return null;
    }

    getRoomCounts(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        return {
            floors: room.floors.size,
            walls: room.walls.size,
            doors: room.doors.size,
            fixedItems: room.fixedItems.size,
            total: room.floors.size + room.walls.size + room.doors.size + room.fixedItems.size
        };
    }

    getAllRooms() {
        return Array.from(this.rooms.values()).sort((a, b) => a.number - b.number);
    }
}

export const roomManager = new RoomManager();
