class DebugDynamicElementList {
    constructor() {
        this.listContainer = document.createElement('div');
        this.listContainer.className = 'debug-panel-list';
        this.elements = [];
    }

    addElement(element) {
        const htmlElement = element.build();
        this.elements.push({element, htmlElement});
        this.listContainer.appendChild(htmlElement);
        return element;
    }

    removeElement(element) {
        const index = this.elements.findIndex(s => s.element === element);

        if (index !== -1) {
            const elementInfo = this.elements[index];
            this.listContainer.removeChild(elementInfo.htmlElement);
            return this.elements.splice(index, 1);
        }
    }

    updateElement(element) {
        const index = this.elements.findIndex(s => s.element === element);

        if (index !== -1) {
            const elementInfo = this.elements[index];
            elementInfo.element.update();
        }
    }

    updateAllElements() {
        this.elements.forEach(elementInfo => {
            elementInfo.element.update();
        });
    }
}
