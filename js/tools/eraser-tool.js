
import { CONFIG } from '../config.js';
import { world } from '../world.js';
import { history } from '../history.js';
import { ToolBase } from './tool-base.js';

export class EraserTool extends ToolBase {
    // Eraser usually works on click/drag to delete.
    // For now, let's assume it behaves like a "delete brush" or handled via click.
    // The original build-mode handled click deletes separate from drawing deletes.
    // We'll optionally implement drag-delete here if desired, or just leave it empty if click is handled elsewhere.

    // Original system used "Hold Delete" for erase mode, but we also had an Eraser Tool button.
    // For simplicity, let's allow drag-erasing of floors/walls?
    // Current implementation only did click-erase in `handleWallClick`/`onClick`.

    // We'll implement basic update/finish for potential area erase if we want, 
    // or just keep it simple.

    update(endPos) {
        // Highlighting red for area erase could go here
    }

    finish(endPos) {
        // Area erase logic could go here
    }
}
