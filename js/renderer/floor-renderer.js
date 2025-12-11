
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class FloorRenderer {
    constructor(scene, getMaterialCallback) {
        this.scene = scene;
        this.getMaterial = getMaterialCallback;
        this.meshes = new Map();
        this.geometry = new THREE.BoxGeometry(1, 0.2, 1); // Thick slabs
    }

    update(cells) {
        // Clear old meshes
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes.clear();

        cells.forEach((cell, key) => {
            // Use cell color or default
            const material = this.getMaterial(cell.color || 0x3a4a5a); // Default floor color
            const mesh = new THREE.Mesh(this.geometry, material);
            // Height 0.2, Top at 0 => Center at -0.1
            mesh.position.set(cell.x + 0.5, -0.1, cell.z + 0.5);
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.meshes.set(key, mesh);
        });
    }

    clear() {
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes.clear();
    }
}
