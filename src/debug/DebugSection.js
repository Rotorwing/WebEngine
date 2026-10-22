class DebugSection extends DebugDynamicElementList{
    constructor(title) {
        super();
        this.title = title;

        this.parentPanel = null;

    }

    addItem(item) {
        super.addElement(item);
        item.parentSection = this;
    }

    removeItem(item) {
        super.removeElement(item);
        item.parentSection = null;
    }

    build() {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'debug-section';
        

        const titleElement = document.createElement('h3');
        titleElement.textContent = this.title;
        sectionElement.appendChild(titleElement);

        sectionElement.appendChild(this.listContainer);

        return sectionElement;
    }

    get items() {
        return this.elements
    }
}