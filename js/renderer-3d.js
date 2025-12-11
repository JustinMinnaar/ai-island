// Three.js 3D Renderer
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from './config.js';
import { world } from './world.js';

class Renderer3D {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = null;
        this.animationId = null;

        // Cache for meshes to avoid recreation
        this.meshes = {
            floors: new Map(),
            walls: new Map(),
            doors: new Map(),
            entities: new Map(),
            preview: []
        };

        this.hoveredCell = null;
        this.dirty = true;
        this.buildPreview = null;
        this.resizeObserver = null;

        this.init();
    }

    init() {
        // 1. Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#1a1a2e');
        this.scene.fog = new THREE.Fog('#1a1a2e', 20, 100);

        // 2. Camera Setup
        const fov = 45;
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);

        // 3. Renderer Setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 4. Controls
        // 4. Controls
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 100;

        // Custom Mouse Mapping
        this.controls.mouseButtons = {
            LEFT: null, // Disable rotation on left click (reserved for building)
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        };

        // Restrict vertical rotation to prevent looking from below
        this.controls.minPolarAngle = 0; // Top-down view
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Just above horizontal (prevent flipping)

        // Movement State
        this.moveInput = new THREE.Vector3(0, 0, 0);
        this.moveSpeed = 0.5;

        // 5. Lighting
        this.setupLights();

        // 6. Grid
        const gridHelper = new THREE.GridHelper(100, 100, '#444444', '#222222');
        this.scene.add(gridHelper);

        // 7. Input
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // 8. Resize Handler
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.canvas);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(10, 20, 10);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 100;
        sunLight.shadow.camera.left = -50;
        sunLight.shadow.camera.right = 50;
        sunLight.shadow.camera.top = 50;
        sunLight.shadow.camera.bottom = -50;
        this.scene.add(sunLight);
    }

    resize() {
        if (!this.camera || !this.renderer) return;
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    screenToWorld(screenX, screenY) {
        const target = this.screenToWorldPrecise(screenX, screenY);
        if (target) {
            return {
                x: Math.floor(target.x),
                y: 0,
                z: Math.floor(target.z)
            };
        }
        return null;
    }

    screenToWorldPrecise(screenX, screenY) {
        // Input is already canvas-relative (offsetX, offsetY) from input.js
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        // Normalize to -1 to +1
        const x = (screenX / width) * 2 - 1;
        const y = -(screenY / height) * 2 + 1;

        this.raycaster.setFromCamera({ x, y }, this.camera);

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();

        this.raycaster.ray.intersectPlane(plane, target);
        return target; // Returns Vector3 or null
    }

    getClosestEdge(screenX, screenY) {
        const pos = this.screenToWorldPrecise(screenX, screenY);
        if (!pos) return null;

        const cx = Math.floor(pos.x);
        const cz = Math.floor(pos.z);

        // Local coordinates within cell [0, 1]
        const lx = pos.x - cx;
        const lz = pos.z - cz;

        const threshold = 0.25; // Click must be within 25% of edge

        // Distances to edges
        const dists = [
            { dir: CONFIG.GAME.EDGE_DIRECTIONS.NORTH, val: lz },           // Top (z=0)
            { dir: CONFIG.GAME.EDGE_DIRECTIONS.SOUTH, val: 1 - lz },       // Bottom (z=1)
            { dir: CONFIG.GAME.EDGE_DIRECTIONS.WEST, val: lx },           // Left (x=0)
            { dir: CONFIG.GAME.EDGE_DIRECTIONS.EAST, val: 1 - lx }        // Right (x=1)
        ];

        // Find min distance
        dists.sort((a, b) => a.val - b.val);

        if (dists[0].val <= threshold) {
            return {
                x: cx,
                z: cz,
                direction: dists[0].dir,
                dist: dists[0].val
            };
        }
        return null;
    }

    worldToScreen(x, y, z) {
        const pos = new THREE.Vector3(x, y, z);
        pos.project(this.camera);
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        return {
            x: (pos.x * 0.5 + 0.5) * width,
            y: (-(pos.y * 0.5) + 0.5) * height
        };
    }

    setHoverCursor(target, mode = 'BLOCK') {
        this.hoverTarget = target;
        this.highlightMode = mode;
    }

    setEraseCursor(enabled) {
        this.eraseCursorEnabled = enabled;
        // Visual feedback handled in renderPreview
    }

    render() {
        this.controls.update();

        // Handle WASD Movement
        if (this.moveInput.lengthSq() > 0) {
            const forward = new THREE.Vector3();
            const right = new THREE.Vector3();

            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            right.crossVectors(forward, this.camera.up).normalize();

            const move = new THREE.Vector3();
            if (this.moveInput.z < 0) move.add(forward); // W
            if (this.moveInput.z > 0) move.sub(forward); // S
            if (this.moveInput.x < 0) move.sub(right);   // A
            if (this.moveInput.x > 0) move.add(right);   // D

            if (move.lengthSq() > 0) {
                move.normalize().multiplyScalar(this.moveSpeed);
                this.camera.position.add(move);
                this.controls.target.add(move);
            }
        }

        if (this.canvas.width !== this.canvas.clientWidth || this.canvas.height !== this.canvas.clientHeight) {
            this.resize();
        }

        this.syncWorld();
        this.renderPreview();

        this.renderer.render(this.scene, this.camera);
    }

    setMoveInput(x, z) {
        this.moveInput.x = x;
        this.moveInput.z = z;
    }

    syncWorld() {
        if (!this.dirty) return;
        this.rebuildScene();
        this.dirty = false;
    }

    getMaterial(color) {
        if (!this.materialCache) this.materialCache = new Map();

        // Default colors
        if (!color) color = 0x888888; // Default wall/floor color

        if (!this.materialCache.has(color)) {
            const mat = new THREE.MeshStandardMaterial({ color: color });
            this.materialCache.set(color, mat);
        }
        return this.materialCache.get(color);
    }

    rebuildScene() {
        // Clear old meshes
        this.meshes.floors.forEach(mesh => this.scene.remove(mesh));
        this.meshes.walls.forEach(mesh => this.scene.remove(mesh));
        this.meshes.doors.forEach(mesh => this.scene.remove(mesh));
        this.meshes.entities.forEach(mesh => this.scene.remove(mesh));

        this.meshes.floors.clear();
        this.meshes.walls.clear();
        this.meshes.doors.clear();
        this.meshes.entities.clear();

        // Floors - Thick slabs (0.2 height), positioned below y=0
        const floorGeo = new THREE.BoxGeometry(1, 0.2, 1);

        world.cells.forEach((cell, key) => {
            // Use cell color or default
            const material = this.getMaterial(cell.color || 0x3a4a5a); // Default floor color
            const mesh = new THREE.Mesh(floorGeo, material);
            // Height 0.2, Top at 0 => Center at -0.1
            mesh.position.set(cell.x + 0.5, -0.1, cell.z + 0.5);
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.meshes.floors.set(key, mesh);
        });

        // Walls
        const wallGeo = new THREE.BoxGeometry(1, 1, 0.2); // 1 unit high, 0.2 unit thick

        world.walls.forEach((wall, key) => {
            const material = this.getMaterial(wall.color || 0x888888);
            const mesh = new THREE.Mesh(wallGeo, material);
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
            this.meshes.walls.set(key, mesh);
        });

        // Doors
        world.doors.forEach((door, key) => {
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

            // Pivot Group to handle Hinge rotation
            const pivotGroup = new THREE.Group();
            // If Hinge Right: pivot at +0.5. If Left: -0.5.
            const pivotX = door.pivot === 'right' ? 0.5 : -0.5;
            pivotGroup.position.set(pivotX, 0, 0);

            // Door Mesh (relative to pivot)
            // If Hinge Right (+0.5), Door needs to extend Left (-0.5 from pivot center).
            // If Hinge Left (-0.5), Door needs to extend Right (+0.5 from pivot center).
            const doorGeo = new THREE.BoxGeometry(1, 2, 0.1);
            const doorMat = this.getMaterial(door.color || 0x8b4513);
            const doorMesh = new THREE.Mesh(doorGeo, doorMat);

            const meshOffsetX = door.pivot === 'right' ? -0.5 : 0.5;
            doorMesh.position.set(meshOffsetX, 1, 0); // Center y=1 (height 2)

            // Swing Arc Indicator (curved line showing door path)
            // Arc shows where the door edge will swing (quarter circle from hinge)
            const arcRadius = 0.7; // Distance from hinge to arc
            const arcSegments = 16;

            // Calculate arc angles based on hinge and swing
            // EllipseCurve draws from startAngle to endAngle
            // Use clockwise flag to control direction
            let startAngle, endAngle, clockwise;

            if (door.pivot === 'left') {
                // Left hinge at -0.5, door extends to +0.5 (pointing right/+X when closed)
                if (door.swing === 'out') {
                    // Swings counterclockwise from 0° to -90° (out/-Z)
                    startAngle = 0;
                    endAngle = -Math.PI / 2;
                    clockwise = true; // Draw the short arc
                } else {
                    // Swings clockwise from 0° to +90° (in/+Z)
                    startAngle = 0;
                    endAngle = Math.PI / 2;
                    clockwise = false;
                }
            } else {
                // Right hinge at +0.5, door extends to -0.5 (pointing left/-X when closed)
                if (door.swing === 'out') {
                    // Swings clockwise from 180° to 90° (out/+Z)
                    startAngle = Math.PI;
                    endAngle = Math.PI / 2;
                    clockwise = true; // Draw the short arc
                } else {
                    // Swings counterclockwise from 180° to 270° (in/-Z)
                    startAngle = Math.PI;
                    endAngle = -Math.PI / 2;
                    clockwise = false;
                }
            }

            const arcCurve = new THREE.EllipseCurve(
                0, 0,           // center x, y (relative to pivot)
                arcRadius, arcRadius,
                startAngle, endAngle,
                clockwise,
                0               // rotation
            );

            const arcPoints = arcCurve.getPoints(arcSegments);
            const arcGeometry = new THREE.BufferGeometry().setFromPoints(
                arcPoints.map(p => new THREE.Vector3(p.x, 0.1, p.y))
            );
            const arcMaterial = new THREE.LineBasicMaterial({
                color: 0xffff00,
                linewidth: 2
            });
            const arcLine = new THREE.Line(arcGeometry, arcMaterial);

            // Add meshes to pivot group
            pivotGroup.add(doorMesh);
            pivotGroup.add(arcLine);

            // Open/Close Animation State
            if (door.isOpen) {
                // Swing Angle
                let angle = Math.PI / 2; // 90 deg
                if (door.swing === 'in') angle = -angle; // Inward = negative Z? No, In = -Z direction.
                // Standard coord: +X Right, -X Left, +Z Back (Out?), -Z Fwd (In?).
                // Group Rot 0 = Facing North (+Z is South).
                // Let's assume +Z is "Out" and -Z is "In" relative to the edge frame.

                // If Hinge Left (-0.5). "Out" (+Z) rotation is -90 (Clockwise viewed from top? No).
                // Rot Y: positive is counter-clockwise.
                // 0 -> 0,0,1. 
                // If Left Hinge, we want tip to move from +0.5,0 to 0,1 (+Z).
                // That is a -90 deg rotation around -0.5.
                // Wait. 
                // Let's trial and error or visualize:
                // Pivot at -0.5. Arm goes to +0.5 (Length 1).
                // Rot +90 CCW: Arm goes to -0.5 + (0, -1) = In (-Z).
                // Rot -90 CW: Arm goes to -0.5 + (0, 1) = Out (+Z).

                // If Left Hinge: Out(-90), In(+90).
                // If Right Hinge (+0.5). Arm goes to -0.5.
                // Rot +90 CCW: Arm goes to +0.5 + (0, 1) = Out (+Z).
                // Rot -90 CW: Arm goes to +0.5 + (0, -1) = In (-Z).

                if (door.pivot === 'left') {
                    angle = door.swing === 'out' ? -Math.PI / 2 : Math.PI / 2;
                } else {
                    // Right
                    angle = door.swing === 'out' ? Math.PI / 2 : -Math.PI / 2;
                }
                pivotGroup.rotation.y = angle;
            }

            doorGroup.add(pivotGroup);
            this.scene.add(doorGroup);
            this.meshes.doors.set(key, doorGroup);
        });
    }

    renderPreview() {
        this.meshes.preview.forEach(mesh => this.scene.remove(mesh));
        this.meshes.preview = [];

        // Cursor Highlight
        if (this.hoverTarget) {
            const color = this.eraseCursorEnabled ? 0xff4444 : 0x44aaff; // Red for erase, Blue for normal
            const opacity = 0.5;

            if (this.highlightMode === 'EDGE') {
                // Target contains { x, z, direction }
                const { x, z, direction } = this.hoverTarget;
                // Ghost Edge (Thin Box)
                const mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.8, 0.2),
                    new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
                );

                // Position/Rotate based on direction
                switch (direction) {
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
                this.meshes.preview.push(mesh);

            } else if (this.highlightMode === 'CORNERS') {
                // Target is cell { x, z }
                // Draw 4 corner pieces
                const { x, z } = this.hoverTarget;
                const size = 0.2;
                const geo = new THREE.BoxGeometry(size, 0.1, size);
                const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });

                const offsets = [
                    { dx: 0, dz: 0 },
                    { dx: 1 - size, dz: 0 },
                    { dx: 0, dz: 1 - size },
                    { dx: 1 - size, dz: 1 - size }
                ];

                offsets.forEach(off => {
                    const corner = new THREE.Mesh(geo, mat);
                    corner.position.set(x + off.dx + size / 2, 0.05, z + off.dz + size / 2);
                    this.scene.add(corner);
                    this.meshes.preview.push(corner);
                });

            } else {
                // Default BLOCK (Cell selection)
                const cursor = new THREE.Mesh(
                    new THREE.BoxGeometry(1.05, 1.05, 1.05),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 })
                );
                cursor.position.set(this.hoverTarget.x + 0.5, 0.5, this.hoverTarget.z + 0.5);
                this.scene.add(cursor);
                this.meshes.preview.push(cursor);
            }
        }

        if (!this.buildPreview || this.buildPreview.length === 0) return;

        this.buildPreview.forEach(item => {
            let mesh;
            if (item.type === 'wall') {
                mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 0.2),
                    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 })
                );
                let x = item.x, z = item.z;
                switch (item.direction) {
                    case CONFIG.GAME.EDGE_DIRECTIONS.NORTH: mesh.position.set(x + 0.5, 0.5, z); break;
                    case CONFIG.GAME.EDGE_DIRECTIONS.SOUTH: mesh.position.set(x + 0.5, 0.5, z + 1); break;
                    case CONFIG.GAME.EDGE_DIRECTIONS.WEST: mesh.position.set(x, 0.5, z + 0.5); mesh.rotation.y = Math.PI / 2; break;
                    case CONFIG.GAME.EDGE_DIRECTIONS.EAST: mesh.position.set(x + 1, 0.5, z + 0.5); mesh.rotation.y = Math.PI / 2; break;
                }
            } else if (item.type === 'floor') {
                mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 0.1, 1),
                    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 })
                );
                mesh.position.set(item.x + 0.5, 0, item.z + 0.5);
            } else if (item.type === 'door') {
                mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 0.8, 0.1),
                    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 })
                );
                let x = item.x, z = item.z;
                switch (item.direction) {
                    case CONFIG.GAME.EDGE_DIRECTIONS.NORTH: mesh.position.set(x + 0.5, 0.4, z); break;
                    case CONFIG.GAME.EDGE_DIRECTIONS.SOUTH: mesh.position.set(x + 0.5, 0.4, z + 1); break;
                    case CONFIG.GAME.EDGE_DIRECTIONS.WEST: mesh.position.set(x, 0.4, z + 0.5); mesh.rotation.y = Math.PI / 2; break;
                    case CONFIG.GAME.EDGE_DIRECTIONS.EAST: mesh.position.set(x + 1, 0.4, z + 0.5); mesh.rotation.y = Math.PI / 2; break;
                }
            }

            if (mesh) {
                this.scene.add(mesh);
                this.meshes.preview.push(mesh);
            }
        });
    }

    markDirty() {
        this.dirty = true;
    }

    reset() {
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.reset();
        }
    }

    zoom(delta) {
        // Simple zoom by moving camera along view vector
        // delta > 0 means zoom in (closer)
        const zoomSpeed = 5;
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        if (delta > 0) {
            this.camera.position.addScaledVector(direction, zoomSpeed);
        } else {
            this.camera.position.addScaledVector(direction, -zoomSpeed);
        }
        this.controls.update();
    }

    centerOn(x, z) {
        if (this.controls) {
            this.controls.target.set(x, 0, z);
            this.controls.update();
        }
    }
}

export let renderer = null;

export function initRenderer(canvas) {
    renderer = new Renderer3D(canvas);
    return renderer;
}
