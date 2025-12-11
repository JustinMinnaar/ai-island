
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class DoorRenderer {
    constructor(scene, getMaterialCallback) {
        this.scene = scene;
        this.getMaterial = getMaterialCallback;
        this.meshes = new Map();

        this.doorGeometry = new THREE.BoxGeometry(1, 2, 0.1);
    }

    update(doors) {
        // Clear old meshes
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes.clear();

        doors.forEach((door, key) => {
            const doorGroup = new THREE.Group();

            // Positioning logic based on direction (Center of the edge)
            let bx = 0, bz = 0, rotY = 0;
            switch (door.direction) {
                case CONFIG.GAME.EDGE_DIRECTIONS.NORTH:
                    bx = door.x + 0.5; bz = door.z; rotY = 0;
                    break;
                case CONFIG.GAME.EDGE_DIRECTIONS.SOUTH:
                    bx = door.x + 0.5; bz = door.z + 1; rotY = Math.PI; // Face Out
                    break;
                case CONFIG.GAME.EDGE_DIRECTIONS.WEST:
                    bx = door.x; bz = door.z + 0.5; rotY = Math.PI / 2;
                    break;
                case CONFIG.GAME.EDGE_DIRECTIONS.EAST:
                    bx = door.x + 1; bz = door.z + 0.5; rotY = -Math.PI / 2;
                    break;
            }
            doorGroup.position.set(bx, 0, bz);
            doorGroup.rotation.y = rotY;

            // Add userData for raycasting
            doorGroup.userData = {
                type: 'door',
                x: door.x,
                z: door.z,
                direction: door.direction
            };

            // Pivot Group to handle Hinge rotation
            const pivotGroup = new THREE.Group();
            // If Hinge Right: pivot at +0.5. If Left: -0.5.
            const pivotX = door.pivot === 'right' ? 0.5 : -0.5;
            pivotGroup.position.set(pivotX, 0, 0);

            // Door Mesh (relative to pivot)
            const doorMat = this.getMaterial(door.color || 0x8b4513);
            const doorMesh = new THREE.Mesh(this.doorGeometry, doorMat);

            // Position door mesh relative to pivot
            // For left hinge: door extends to the right (+0.5)
            // For right hinge: door extends to the left (-0.5)
            const meshOffsetX = door.pivot === 'right' ? -0.5 : 0.5;
            doorMesh.position.set(meshOffsetX, 1, 0); // Center y=1 (height 2)

            // Add door mesh to pivot group (rotates with door)
            pivotGroup.add(doorMesh);

            // Open/Close Animation State
            if (door.isOpen) {
                let angle = Math.PI / 2; // 90 deg
                if (door.pivot === 'left') {
                    angle = door.swing === 'out' ? -Math.PI / 2 : Math.PI / 2;
                } else {
                    // Right
                    angle = door.swing === 'out' ? Math.PI / 2 : -Math.PI / 2;
                }
                pivotGroup.rotation.y = angle;
            }

            // Swing Arc Indicator - positioned at pivot origin but NOT rotating with door
            // Add arc to doorGroup (not pivotGroup) so it stays stationary
            const arcLine = this.createSwingArc(door);
            arcLine.position.set(pivotX, 0, 0); // Position at same location as pivot

            doorGroup.add(pivotGroup);
            doorGroup.add(arcLine); // Arc added to doorGroup, not pivotGroup
            this.scene.add(doorGroup);
            this.meshes.set(key, doorGroup);
        });
    }

    createSwingArc(door) {
        const arcRadius = 0.7;
        const arcSegments = 16;
        let startAngle, endAngle, clockwise;

        if (door.pivot === 'left') {
            // Hinge on left side - door extends right, arc shows swing
            // The door rotates: swing 'out' = negative angle, swing 'in' = positive angle
            if (door.swing === 'out') {
                // Arc should show negative rotation (clockwise from 0 to -π/2)
                startAngle = 0;
                endAngle = Math.PI / 2; // Inverted: show where door goes
                clockwise = false;
            } else {
                // swing in - Arc should show positive rotation
                startAngle = 0;
                endAngle = -Math.PI / 2; // Inverted: show where door goes
                clockwise = true;
            }
        } else {
            // Hinge on right side - door extends left
            // The door rotates: swing 'out' = positive angle, swing 'in' = negative angle
            if (door.swing === 'out') {
                // Arc should show positive rotation from π
                startAngle = Math.PI;
                endAngle = Math.PI / 2; // Inverted: show where door goes
                clockwise = true;
            } else {
                // swing in - Arc should show negative rotation from π
                startAngle = Math.PI;
                endAngle = 3 * Math.PI / 2; // Inverted: show where door goes
                clockwise = false;
            }
        }

        const arcCurve = new THREE.EllipseCurve(
            0, 0,
            arcRadius, arcRadius,
            startAngle, endAngle,
            clockwise,
            0
        );

        const arcPoints = arcCurve.getPoints(arcSegments);
        const arcGeometry = new THREE.BufferGeometry().setFromPoints(
            arcPoints.map(p => new THREE.Vector3(p.x, 0.1, p.y))
        );
        const arcMaterial = new THREE.LineBasicMaterial({
            color: 0xffff00,
            linewidth: 2
        });
        return new THREE.Line(arcGeometry, arcMaterial);
    }

    clear() {
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes.clear();
    }
}
