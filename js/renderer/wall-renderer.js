
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class WallRenderer {
    constructor(scene, getMaterialCallback) {
        this.scene = scene;
        this.getMaterial = getMaterialCallback;
        this.meshes = new Map();
        this.geometry = new THREE.BoxGeometry(1, 1, 0.2); // 1 unit high, 0.2 unit thick
    }

    update(walls) {
        // Clear old meshes
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes.clear();

        walls.forEach((wall, key) => {
            const material = this.getMaterial(wall.color || 0x888888);
            const mesh = new THREE.Mesh(this.geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            let x = wall.x, z = wall.z;
            switch (wall.direction) {
                case CONFIG.GAME.EDGE_DIRECTIONS.NORTH:
                    mesh.position.set(x + 0.5, 0.5, z);
                    break;
                case CONFIG.GAME.EDGE_DIRECTIONS.SOUTH:
                    mesh.position.set(x + 0.5, 0.5, z + 1);
                    break;
                case CONFIG.GAME.EDGE_DIRECTIONS.WEST:
                    mesh.position.set(x, 0.5, z + 0.5);
                    mesh.rotation.y = Math.PI / 2;
                    break;
                case CONFIG.GAME.EDGE_DIRECTIONS.EAST:
                    mesh.position.set(x + 1, 0.5, z + 0.5);
                    mesh.rotation.y = Math.PI / 2;
                    break;
            }
            this.scene.add(mesh);
            this.meshes.set(key, mesh);
        });
    }

    clear() {
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes.clear();
    }
}
