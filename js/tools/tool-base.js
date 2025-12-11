
export class ToolBase {
    constructor() {
        this.previewItems = [];
        this.startCell = null;
        this.lockedDirection = null;
    }

    start(worldPos) {
        this.startCell = { ...worldPos };
        this.previewItems = [];
        this.lockedDirection = null;
    }

    update(worldPos, activeColor) {
        // Override me
    }

    finish(worldPos, activeColor) {
        // Override me
    }

    cancel() {
        this.startCell = null;
        this.previewItems = [];
        this.lockedDirection = null;
    }

    getPreviewItems() {
        return this.previewItems;
    }
}
