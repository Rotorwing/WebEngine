class DebugNumber extends DebugItem {
    constructor(label, getValueCallback) {
        super(label);
        this.getValueCallback = getValueCallback;

        this.valueField = null;

        this.updateFrequency = 10; // updates per second

        this._buildInternal();
    }

    update() {
        if (this.valueField) {
            this.valueField.textContent = this.getValueCallback();
        }
    }

    build() {
        const container = super.build();

        const labelElement = document.createElement('span');
        labelElement.className = 'debug-item-label';
        labelElement.textContent = this.label;
        container.appendChild(labelElement);

        const valueElement = document.createElement('span');
        valueElement.className = 'debug-item-value';
        valueElement.textContent = this.getValueCallback();
        container.appendChild(valueElement);

        this.valueField = valueElement;

        return container;
    }
}