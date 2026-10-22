class DebugItem {
    constructor(label) {
        this.label = label;

        this.parentSection = null;

        this.updateInterval = null;
        this.updateFrequency = 30; // updates per second
    }
    _buildInternal() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        if(this.updateFrequency === 0) {
            return;
        }

        this.updateInterval = setInterval(() => {
            this.update();
        }, 1000 / this.updateFrequency);
    }

    update() {

    }

    build() {
        const container = document.createElement('div');
        container.className = 'debug-item';

        // const labelElement = document.createElement('span');
        // labelElement.className = 'debug-panel-label';
        // labelElement.textContent = this.label;
        // container.appendChild(labelElement);

        // const valueElement = document.createElement('span');
        // valueElement.className = 'debug-panel-value';
        // valueElement.textContent = 'demo';
        // container.appendChild(valueElement);

        return container;
    }
}