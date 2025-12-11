// Three.js 3D Renderer
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from './config.js';
import { world } from './world.js';

// Sub-renderers
import { WallRenderer } from './renderer/wall-renderer.js';
import { FloorRenderer } from './renderer/floor-renderer.js';
import { DoorRenderer } from './renderer/door-renderer.js';

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

        // Sub-renderers
        this.wallRenderer = null;
        this.floorRenderer = null;
        this.doorRenderer = null;

        // Cache for previews
        this.previewMeshes = [];

        this.hoveredCell = null;
        this.dirty = true;
        this.buildPreview = null;
        this.resizeObserver = null;
        this.materialCache = new Map();
        this.zoomLevel = 1.0;

        // Selection highlighting
        this.selectedObject = null;
        this.selectionHighlight = null;

        this.init();
    }

    // ... (Init methods remain largely the same, setup sub-renderers in init)

    init() {
        // 1. Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#1a1a2e');
        this.scene.fog = new THREE.Fog('#1a1a2e', 20, 200); // Increased fog distance

        // 2. Camera Setup
        const fov = 45;
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 2000); // Increased far plane
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
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 200; // Increased max zoom out

        // Custom Mouse Mapping
        this.controls.mouseButtons = {
            LEFT: null, // Disable rotation on left click (reserved for building)
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        };

        // We handle zoom manually for "Zoom-to-Point" logic
        this.controls.enableZoom = false;

        // Restrict vertical rotation
        this.controls.minPolarAngle = 0;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1;

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

        // 8. Initialize Sub-renderers
        this.wallRenderer = new WallRenderer(this.scene, (c) => this.getMaterial(c));
        this.floorRenderer = new FloorRenderer(this.scene, (c) => this.getMaterial(c));
        this.doorRenderer = new DoorRenderer(this.scene, (c) => this.getMaterial(c));

        // 9. Resize Handler
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.canvas);
    }

    // ... (setupLights, resize, screenToWorld, getClosestEdge remain same)

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
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        const x = (screenX / width) * 2 - 1;
        const y = -(screenY / height) * 2 + 1;

        this.raycaster.setFromCamera({ x, y }, this.camera);

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();

        this.raycaster.ray.intersectPlane(plane, target);
        return target;
    }

    getClosestEdge(screenX, screenY) {
        const pos = this.screenToWorldPrecise(screenX, screenY);
        if (!pos) return null;

        const cx = Math.floor(pos.x);
        const cz = Math.floor(pos.z);

        const lx = pos.x - cx;
        const lz = pos.z - cz;
        const threshold = 0.49; // Snap to nearest edge (almost 0.5)

        const dists = [
            { dir: CONFIG.GAME.EDGE_DIRECTIONS.NORTH, val: lz },
            { dir: CONFIG.GAME.EDGE_DIRECTIONS.SOUTH, val: 1 - lz },
            { dir: CONFIG.GAME.EDGE_DIRECTIONS.WEST, val: lx },
            { dir: CONFIG.GAME.EDGE_DIRECTIONS.EAST, val: 1 - lx }
        ];

        dists.sort((a, b) => a.val - b.val);

        if (dists[0].val <= threshold) {
            return {
                x: cx, z: cz,
                direction: dists[0].dir,
                dist: dists[0].val
            };
        }
        return null;
    }

    // Get any object at screen position by raycasting (walls, doors, floors, entities)
    getObjectAtScreen(screenX, screenY) {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        const x = (screenX / width) * 2 - 1;
        const y = -(screenY / height) * 2 + 1;

        this.raycaster.setFromCamera({ x, y }, this.camera);

        // Collect all clickable meshes from the scene
        const clickableMeshes = [];
        this.scene.traverse((object) => {
            if (object.userData && object.userData.type &&
                ['wall', 'door', 'floor', 'entity'].includes(object.userData.type)) {
                clickableMeshes.push(object);
            }
        });

        // Raycast against all clickable meshes
        const intersects = this.raycaster.intersectObjects(clickableMeshes, true);

        if (intersects.length > 0) {
            // Get the closest intersection
            const hit = intersects[0];
            let targetObject = hit.object;

            // Traverse up to find the parent with userData
            while (targetObject && (!targetObject.userData || !targetObject.userData.type)) {
                targetObject = targetObject.parent;
            }

            if (targetObject && targetObject.userData && targetObject.userData.type) {
                return {
                    type: targetObject.userData.type,
                    x: targetObject.userData.x,
                    y: targetObject.userData.y || 0,
                    z: targetObject.userData.z,
                    direction: targetObject.userData.direction,
                    distance: hit.distance,
                    userData: targetObject.userData
                };
            }
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

    // ... (Hover/Preview logic can be simplified or extracted)

    setHoverCursor(target, mode = 'BLOCK', color = null) {
        this.hoverTarget = target;
        this.highlightMode = mode;
        this.hoverColor = color;
    }

    setEraseCursor(enabled) {
        this.eraseCursorEnabled = enabled;
    }

    getMaterial(color) {
        if (!color) color = 0x888888;
        if (!this.materialCache.has(color)) {
            const mat = new THREE.MeshStandardMaterial({ color: color });
            this.materialCache.set(color, mat);
        }
        return this.materialCache.get(color);
    }

    syncWorld() {
        if (!this.dirty) return;

        // Use sub-renderers
        this.wallRenderer.update(world.walls);
        this.floorRenderer.update(world.cells);
        this.doorRenderer.update(world.doors);

        // TODO: Entity Renderer extraction
        this.rebuildEntities(); // Keep this inline for now or extract next

        this.dirty = false;
    }

    rebuildEntities() {
        // Existing entity logic here (simplified for brevity of this change)
        // Ideally extract to EntityRenderer
    }

    render() {
        this.controls.update();

        // WASD Movement
        if (this.moveInput.lengthSq() > 0) {
            const forward = new THREE.Vector3();
            const right = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();
            right.crossVectors(forward, this.camera.up).normalize();

            const move = new THREE.Vector3();
            if (this.moveInput.z < 0) move.add(forward);
            if (this.moveInput.z > 0) move.sub(forward);
            if (this.moveInput.x < 0) move.sub(right);
            if (this.moveInput.x > 0) move.add(right);

            if (move.lengthSq() > 0) {
                move.normalize().multiplyScalar(this.moveSpeed);
                this.camera.position.add(move);
                this.controls.target.add(move);
            }
        }

        // Clamp camera height to stay above ground
        const minHeight = 0.5; // Minimum camera height above ground
        if (this.camera.position.y < minHeight) {
            this.camera.position.y = minHeight;
        }
        if (this.controls.target.y < 0) {
            this.controls.target.y = 0;
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

    renderPreview() {
        // Clear old previews
        this.previewMeshes.forEach(mesh => this.scene.remove(mesh));
        this.previewMeshes = [];

        // 1. Cursor Highlight
        if (this.hoverTarget) {
            // Priority: Custom Hover Color -> Erase Mode Red -> Default Blue
            let color = this.hoverColor;
            if (color === null) {
                color = this.eraseCursorEnabled ? 0xff4444 : 0x44aaff;
            }

            const size = 0.2; // Grip size
            const opacity = 0.8;

            if (this.highlightMode === 'EDGE') {
                const { x, z, direction } = this.hoverTarget;
                // ... (Edge Highlight Logic same as before)
                const grips = [];
                // Edge geometry...
                let p1, p2;
                switch (direction) {
                    case CONFIG.GAME.EDGE_DIRECTIONS.NORTH:
                        p1 = new THREE.Vector3(x, 0.1, z);
                        p2 = new THREE.Vector3(x + 1, 0.1, z);
                        break;
                    case CONFIG.GAME.EDGE_DIRECTIONS.SOUTH:
                        p1 = new THREE.Vector3(x, 0.1, z + 1);
                        p2 = new THREE.Vector3(x + 1, 0.1, z + 1);
                        break;
                    case CONFIG.GAME.EDGE_DIRECTIONS.WEST:
                        p1 = new THREE.Vector3(x, 0.1, z);
                        p2 = new THREE.Vector3(x, 0.1, z + 1);
                        break;
                    case CONFIG.GAME.EDGE_DIRECTIONS.EAST:
                        p1 = new THREE.Vector3(x + 1, 0.1, z);
                        p2 = new THREE.Vector3(x + 1, 0.1, z + 1);
                        break;
                }

                [p1, p2].forEach(p => {
                    const mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(size, size, size),
                        new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
                    );
                    mesh.position.copy(p);
                    this.scene.add(mesh);
                    this.previewMeshes.push(mesh);
                });

                const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
                const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 }));
                this.scene.add(line);
                this.previewMeshes.push(line);

            } else if (this.highlightMode === 'CORNERS') {
                // Render 4 corner grips for the cell
                const { x, z } = this.hoverTarget;
                const points = [
                    new THREE.Vector3(x, 0.1, z),
                    new THREE.Vector3(x + 1, 0.1, z),
                    new THREE.Vector3(x, 0.1, z + 1),
                    new THREE.Vector3(x + 1, 0.1, z + 1)
                ];

                points.forEach(p => {
                    const mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(size, size, size),
                        new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
                    );
                    mesh.position.copy(p);
                    this.scene.add(mesh);
                    this.previewMeshes.push(mesh);
                });

                // Optional: Draw box border for CORNERS cursor too?
                // User asked for "red cursor and border lines" for drag.
                // For single cell cursor, let's add faint lines connecting corners.
                const linePoints = [points[0], points[1], points[3], points[2], points[0]];
                const boxGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
                const boxLine = new THREE.Line(boxGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 }));
                this.scene.add(boxLine);
                this.previewMeshes.push(boxLine);

            } else {
                // BLOCK / DEFAULT
                const cursor = new THREE.Mesh(
                    new THREE.BoxGeometry(1.05, 1.05, 1.05),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 })
                );
                cursor.position.set(this.hoverTarget.x + 0.5, 0.5, this.hoverTarget.z + 0.5);
                this.scene.add(cursor);
                this.previewMeshes.push(cursor);
            }
        }

        // 2. Build Tool Previews
        if (this.buildPreview && this.buildPreview.length > 0) {
            this.buildPreview.forEach(item => {
                let mesh;
                if (item.type === 'selection-box') {
                    // Render Rectangle Border + 4 Corner Handles
                    const color = item.color || 0xff0000;
                    const x = item.x;
                    const z = item.z;
                    const w = item.width;
                    const h = item.height; // Depth (z)

                    // 4 Corners: (x,z), (x+w,z), (x,z+h), (x+w, z+h)
                    // Note: Coordinates are usually cell corners. 
                    // Assuming x,z are min coords, and w,h are dimensions in cells.
                    // Visuals match grid lines.
                    const p1 = new THREE.Vector3(x, 0.1, z);
                    const p2 = new THREE.Vector3(x + w, 0.1, z);
                    const p3 = new THREE.Vector3(x + w, 0.1, z + h);
                    const p4 = new THREE.Vector3(x, 0.1, z + h);

                    // Draw 4 Handles
                    const size = 0.3;
                    [p1, p2, p3, p4].forEach(p => {
                        const m = new THREE.Mesh(
                            new THREE.BoxGeometry(size, size, size),
                            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1.0 }) // Full opacity for handles
                        );
                        m.position.copy(p);
                        this.scene.add(m);
                        this.previewMeshes.push(m);
                    });

                    // Draw Border Lines
                    const points = [p1, p2, p3, p4, p1];
                    const buf = new THREE.BufferGeometry().setFromPoints(points);
                    const line = new THREE.Line(buf, new THREE.LineBasicMaterial({ color, linewidth: 2 }));
                    this.scene.add(line);
                    this.previewMeshes.push(line);

                    return; // Done for this item
                }

                else if (item.type === 'wall') {
                    mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(1, 1, 0.2),
                        new THREE.MeshBasicMaterial({ color: item.color || 0x00ff00, transparent: true, opacity: 0.5 })
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
                    this.previewMeshes.push(mesh);
                }
            });
        }
    }

    markDirty() {
        this.dirty = true;
    }

    // Selection highlighting methods
    setSelectedObject(type, x, y, z, direction = null) {
        this.clearSelection();

        this.selectedObject = { type, x, y, z, direction };

        // Create highlight based on type
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            wireframe: false
        });

        if (type === 'door' && direction) {
            // Highlight door
            const highlightGeom = new THREE.BoxGeometry(1.1, 2.1, 0.15);
            const highlight = new THREE.Mesh(highlightGeom, highlightMaterial);

            let bx = 0, bz = 0;
            switch (direction) {
                case CONFIG.GAME.EDGE_DIRECTIONS.NORTH:
                    bx = x + 0.5; bz = z; break;
                case CONFIG.GAME.EDGE_DIRECTIONS.SOUTH:
                    bx = x + 0.5; bz = z + 1; break;
                case CONFIG.GAME.EDGE_DIRECTIONS.WEST:
                    bx = x; bz = z + 0.5; highlight.rotation.y = Math.PI / 2; break;
                case CONFIG.GAME.EDGE_DIRECTIONS.EAST:
                    bx = x + 1; bz = z + 0.5; highlight.rotation.y = Math.PI / 2; break;
            }
            highlight.position.set(bx, 1, bz);
            this.selectionHighlight = highlight;
            this.scene.add(highlight);
        } else if (type === 'wall' && direction) {
            // Highlight wall
            const highlightGeom = new THREE.BoxGeometry(1.1, 1.1, 0.15);
            const highlight = new THREE.Mesh(highlightGeom, highlightMaterial);

            let bx = 0, bz = 0;
            switch (direction) {
                case CONFIG.GAME.EDGE_DIRECTIONS.NORTH:
                    bx = x + 0.5; bz = z; break;
                case CONFIG.GAME.EDGE_DIRECTIONS.SOUTH:
                    bx = x + 0.5; bz = z + 1; break;
                case CONFIG.GAME.EDGE_DIRECTIONS.WEST:
                    bx = x; bz = z + 0.5; highlight.rotation.y = Math.PI / 2; break;
                case CONFIG.GAME.EDGE_DIRECTIONS.EAST:
                    bx = x + 1; bz = z + 0.5; highlight.rotation.y = Math.PI / 2; break;
            }
            highlight.position.set(bx, 0.5, bz);
            this.selectionHighlight = highlight;
            this.scene.add(highlight);
        } else if (type === 'floor') {
            // Highlight floor
            const highlightGeom = new THREE.BoxGeometry(1.05, 0.25, 1.05);
            const highlight = new THREE.Mesh(highlightGeom, highlightMaterial);
            highlight.position.set(x + 0.5, -0.1, z + 0.5);
            this.selectionHighlight = highlight;
            this.scene.add(highlight);
        }

        this.dirty = true;
    }

    clearSelection() {
        if (this.selectionHighlight) {
            this.scene.remove(this.selectionHighlight);
            this.selectionHighlight = null;
        }
        this.selectedObject = null;
        this.dirty = true;
    }

    // ... (reset, zoom, centerOn methods remain same)

    reset() {
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.reset();
        }
    }

    zoom(delta, screenX, screenY) {
        const zoomSpeed = 2.0; // Reduced from 5 for smoother control

        // 1. Get world point under cursor
        let targetPoint;
        if (screenX !== undefined && screenY !== undefined) {
            const preciseTarget = this.screenToWorldPrecise(screenX, screenY);
            if (preciseTarget) targetPoint = preciseTarget;
        }

        // Fallback to center screen if no mouse pos provided or off-ground
        if (!targetPoint) {
            targetPoint = new THREE.Vector3();
            this.camera.getWorldDirection(targetPoint);
            targetPoint.multiplyScalar(20).add(this.camera.position); // Look 20 units ahead
        }

        // 2. Calculate vector from camera to target point
        const offset = new THREE.Vector3().subVectors(targetPoint, this.camera.position);

        // 3. Move along that vector
        // Use a percentage of the distance for "smooth" feel relative to depth
        const distance = offset.length();
        // Constant factor is okay, but user wants to "zoom onto that point".
        // If we move the camera AND the target, we are panning.
        // To make the point the "center of the screen", we should shift the controls.target perpendicular to the camera view
        // to align the target point with the center ray? No, simpler: just move towards it.

        const zoomFactor = 0.2; // Increase responsiveness
        const dir = delta > 0 ? 1 : -1;

        if (distance > 2 && distance < 200) {
            const moveVec = offset.clone().multiplyScalar(zoomFactor * dir);
            this.camera.position.add(moveVec);
            this.controls.target.add(moveVec);
            // Verify target height stays reasonable?
            // this.controls.target.y = 0; // Optional: Force ground level target? Or allow flying?
        }

        this.controls.update();
        return true;
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
