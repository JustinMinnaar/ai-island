// Item Renderer - Render items in 3D world as sprite billboards
import * as THREE from 'three';
import { typeRegistry } from '../type-registry.js';
import { assetManager } from '../managers/asset-manager.js';

export class ItemRenderer {
    constructor(scene, getMaterialCallback) {
        this.scene = scene;
        this.getMaterial = getMaterialCallback;
        this.meshes = new Map(); // instanceId -> mesh
        this.textureLoader = new THREE.TextureLoader();
        this.bobTime = 0;
    }

    update(itemInstances) {
        // Remove old meshes
        this.meshes.forEach((mesh, id) => {
            if (!itemInstances.has(id)) {
                this.scene.remove(mesh);
                this.meshes.delete(id);
            }
        });

        // Add/update meshes
        itemInstances.forEach((instance, id) => {
            if (!this.meshes.has(id)) {
                this.createItemMesh(instance);
            } else {
                this.updateItemMesh(instance);
            }
        });
    }

    createItemMesh(instance) {
        const itemType = typeRegistry.getType(instance.typeId);
        if (!itemType) return;

        const group = new THREE.Group();

        // Create sprite billboard
        let mesh;
        if (itemType.imageURL) {
            // Load texture and create plane
            const geometry = new THREE.PlaneGeometry(0.5, 0.5);
            const material = new THREE.MeshBasicMaterial({
                transparent: true,
                side: THREE.DoubleSide
            });

            this.textureLoader.load(
                itemType.imageURL,
                (texture) => {
                    material.map = texture;
                    material.needsUpdate = true;
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load texture for ${itemType.name}:`, error);
                    // Fallback to colored plane
                    material.color.setHex(0xffaa00);
                }
            );

            mesh = new THREE.Mesh(geometry, material);
        } else {
            // Fallback: colored cube
            const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffaa00
            });
            mesh = new THREE.Mesh(geometry, material);
        }

        // Add userData for raycasting
        mesh.userData = {
            type: 'item',
            instanceId: instance.instanceId,
            typeId: instance.typeId,
            x: instance.position.x,
            y: instance.position.y,
            z: instance.position.z
        };

        group.add(mesh);
        group.position.set(
            instance.position.x + 0.5,
            instance.position.y + 0.3,
            instance.position.z + 0.5
        );

        // Store reference to mesh for billboard rotation
        group.userData.billboardMesh = mesh;
        group.userData.baseY = instance.position.y + 0.3;

        this.scene.add(group);
        this.meshes.set(instance.instanceId, group);
    }

    updateItemMesh(instance) {
        const group = this.meshes.get(instance.instanceId);
        if (!group) return;

        group.position.set(
            instance.position.x + 0.5,
            instance.position.y + 0.3,
            instance.position.z + 0.5
        );
    }

    // Call this in render loop to make billboards face camera and bob
    updateBillboards(camera) {
        this.bobTime += 0.02;

        this.meshes.forEach(group => {
            const mesh = group.userData.billboardMesh;
            if (mesh && mesh.geometry.type === 'PlaneGeometry') {
                // Billboard rotation - face camera
                mesh.lookAt(camera.position);
            }

            // Gentle bobbing animation
            const bobOffset = Math.sin(this.bobTime) * 0.05;
            group.position.y = group.userData.baseY + bobOffset;
        });
    }

    clear() {
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes.clear();
    }
}
