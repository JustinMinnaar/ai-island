// Panel Controller - Handles panel toggle functionality
class PanelController {
    constructor() {
        this.mainContainer = document.querySelector('.main-container');
        this.toggleSceneBtn = document.getElementById('toggle-scene');
        this.togglePropertiesBtn = document.getElementById('toggle-properties');

        this.leftPanelVisible = true;
        this.rightPanelVisible = true;

        this.init();
    }

    init() {
        if (this.toggleSceneBtn) {
            this.toggleSceneBtn.addEventListener('click', () => this.toggleLeftPanel());
        }

        if (this.togglePropertiesBtn) {
            this.togglePropertiesBtn.addEventListener('click', () => this.toggleRightPanel());
        }
    }

    toggleLeftPanel() {
        this.leftPanelVisible = !this.leftPanelVisible;

        if (this.leftPanelVisible) {
            this.mainContainer.classList.remove('hide-left');
            this.toggleSceneBtn.classList.add('active');
        } else {
            this.mainContainer.classList.add('hide-left');
            this.toggleSceneBtn.classList.remove('active');
        }

        // Notify renderer to resize
        if (window.renderer) {
            setTimeout(() => window.renderer.onResize(), 300);
        }
    }

    toggleRightPanel() {
        this.rightPanelVisible = !this.rightPanelVisible;

        if (this.rightPanelVisible) {
            this.mainContainer.classList.remove('hide-right');
            this.togglePropertiesBtn.classList.add('active');
        } else {
            this.mainContainer.classList.add('hide-right');
            this.togglePropertiesBtn.classList.remove('active');
        }

        // Notify renderer to resize
        if (window.renderer) {
            setTimeout(() => window.renderer.onResize(), 300);
        }
    }
}

export const panelController = new PanelController();
