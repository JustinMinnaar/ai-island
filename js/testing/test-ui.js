// Test Runner UI
// Displays test results in an overlay

import { runTests } from './test-runner.js';

class TestRunnerUI {
    constructor() {
        this.container = null;
        this.isVisible = false;
    }

    init() {
        // Init happens on demand or via main.js
    }

    async show() {
        if (!this.container) {
            this.createUI();
        }

        this.container.classList.remove('hidden');
        this.isVisible = true;

        this.setLoading(true);
        const results = await runTests();
        this.renderResults(results);
    }

    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
        }
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'test-runner-ui';
        this.container.className = 'test-overlay hidden';

        // Add basic styles directly here to avoid another CSS file request
        const style = document.createElement('style');
        style.textContent = `
            .test-overlay {
                position: fixed;
                top: 60px;
                right: 20px;
                width: 400px;
                max-height: calc(100vh - 80px);
                background: rgba(18, 24, 41, 0.95);
                border: 1px solid #444;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                z-index: 2000;
                display: flex;
                flex-direction: column;
                font-family: monospace;
                overflow: hidden;
            }
            .test-overlay.hidden { display: none; }
            .test-header {
                padding: 15px;
                background: #1a2235;
                border-bottom: 1px solid #444;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .test-title { font-weight: bold; color: #fff; }
            .test-close { cursor: pointer; color: #aaa; background: none; border: none; font-size: 20px; }
            .test-body { padding: 15px; overflow-y: auto; color: #ddd; }
            .test-suite { margin-bottom: 15px; }
            .suite-title { font-weight: bold; margin-bottom: 5px; color: #a0aec0; }
            .test-result { display: flex; align-items: flex-start; margin-bottom: 4px; font-size: 12px; }
            .test-icon { margin-right: 8px; }
            .test-passed .test-icon { color: #48bb78; }
            .test-failed .test-icon { color: #f56565; }
            .test-failed .test-name { color: #f56565; }
            .test-error { margin-left: 20px; color: #fc8181; font-size: 11px; margin-top: 2px; }
            .test-summary { 
                padding: 10px 15px; 
                background: #1a2235; 
                border-top: 1px solid #444;
                font-weight: bold;
            }
            .summary-passed { color: #48bb78; }
            .summary-failed { color: #f56565; }
            .rerun-btn {
                background: #2b6cb0;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-left: 10px;
            }
            .rerun-btn:hover { background: #2c5282; }
        `;
        document.head.appendChild(style);

        this.container.innerHTML = `
            <div class="test-header">
                <div class="test-title">🧪 Test Runner</div>
                <button class="test-close" onclick="testRunnerUI.hide()">×</button>
            </div>
            <div class="test-body" id="test-results-body">
                <div style="text-align: center; padding: 20px;">Initializing...</div>
            </div>
            <div class="test-summary" id="test-summary-footer">
                Ready to run
            </div>
        `;

        document.body.appendChild(this.container);
    }

    setLoading(loading) {
        const body = document.getElementById('test-results-body');
        if (body) {
            body.innerHTML = loading ?
                '<div style="text-align: center; padding: 20px;">Running tests... ⏳</div>' : '';
        }
    }

    renderResults(results) {
        const body = document.getElementById('test-results-body');
        const footer = document.getElementById('test-summary-footer');

        let html = '';

        results.suites.forEach(suite => {
            html += `<div class="test-suite">`;
            html += `<div class="suite-title">${suite.name}</div>`;

            suite.tests.forEach(test => {
                const icon = test.passed ? '✅' : '❌';
                const statusClass = test.passed ? 'test-passed' : 'test-failed';

                html += `<div class="test-result ${statusClass}">`;
                html += `<span class="test-icon">${icon}</span>`;
                html += `<div class="test-details">`;
                html += `<div class="test-name">${test.name} <span style="color: #666">(${test.duration.toFixed(1)}ms)</span></div>`;

                if (!test.passed && test.error) {
                    html += `<div class="test-error">${test.error}</div>`;
                }

                html += `</div></div>`;
            });

            html += `</div>`;
        });

        body.innerHTML = html;

        const statusColor = results.failed === 0 ? 'summary-passed' : 'summary-failed';
        footer.innerHTML = `
            <span class="${statusColor}">
                ${results.failed === 0 ? 'PASS' : 'FAIL'} 
                (${results.passed}/${results.total})
            </span>
            <button class="rerun-btn" onclick="testRunnerUI.show()">Rerun</button>
        `;
    }
}

export const testRunnerUI = new TestRunnerUI();
window.testRunnerUI = testRunnerUI; // For nice onclick handlers
