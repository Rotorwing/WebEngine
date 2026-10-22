class DebugPanel extends DebugDynamicElementList {
    constructor(parentElement) {
        super();

        this.panelElement = document.createElement('div');
        this.panelElement.className = 'debug-panel';

        this.panelElement.appendChild(this.listContainer);

        parentElement.appendChild(this.panelElement);

        this.sides = {
            left: 1,
            right: 2,
            top: 4,
            bottom: 8
        };

        this.cursors = {
            [this.sides.left]: 'ew-resize',
            [this.sides.right]: 'ew-resize',
            [this.sides.top]: 'ns-resize',
            [this.sides.bottom]: 'ns-resize',
            [this.sides.left | this.sides.top]: 'nwse-resize',
            [this.sides.right | this.sides.top]: 'nesw-resize',
            [this.sides.left | this.sides.bottom]: 'nesw-resize',
            [this.sides.right | this.sides.bottom]: 'nwse-resize'
        };
        this.isDragging = false;

        this.draggingSide = 0;

        this.panelElement.addEventListener('mousedown', this.mouseDownHandler.bind(this));
        document.addEventListener('mousemove', this.mouseMoveHandler.bind(this));
        document.addEventListener('mouseup', this.mouseUpHandler.bind(this));
    }

    addSection(section) {
        section.parentPanel = this;
        return super.addElement(section);
    }

    removeSection(section) {
        return super.removeElement(section);
    }

    get sections() {
        return this.elements;
    }

    mouseDownHandler(event) {
        if (event.target === this.panelElement) {
            if(this.draggingSide) {
                this.isDragging = true;
                event.preventDefault();
            }
        }
    }

    mouseMoveHandler(event) {
        if(!this.isDragging) {
            // console.log(event.clientX, event.clientY, this.panelElement.offsetLeft, this.panelElement.offsetTop);
            const left = event.clientX >= this.panelElement.offsetLeft && event.clientX <= this.panelElement.offsetLeft + 5;
            const right = event.clientX <= this.panelElement.offsetLeft + this.panelElement.offsetWidth && event.clientX >= this.panelElement.offsetLeft + this.panelElement.offsetWidth - 5;
            const top = event.clientY >= this.panelElement.offsetTop && event.clientY <= this.panelElement.offsetTop + 5;
            const bottom = event.clientY <= this.panelElement.offsetTop + this.panelElement.offsetHeight && event.clientY >= this.panelElement.offsetTop + this.panelElement.offsetHeight - 5;

            this.draggingSide = this.sides.left * left | this.sides.right * right | this.sides.top * top | this.sides.bottom * bottom;

            document.body.style.cursor = this.cursors[this.draggingSide] || 'default';
        }

        if (this.draggingSide && this.isDragging) {
            if(this.draggingSide & this.sides.left) {
                // this.panelElement.style.left = event.clientX + 'px';
                this.panelElement.style.width = this.panelElement.parentNode.clientWidth - event.clientX + 'px';
            }
            if(this.draggingSide & this.sides.right) {
                this.panelElement.style.right = this.panelElement.parentNode.offsetWidth - event.clientX + 'px';
                // this.panelElement.style.width = event.clientX - this.panelElement.offsetLeft + 'px';
            }
            if(this.draggingSide & this.sides.top) {
                this.panelElement.style.top = event.clientY + 'px';
            }
            if(this.draggingSide & this.sides.bottom) {
                this.panelElement.style.height = event.clientY - this.panelElement.offsetTop + 'px';
            }
        }
    }

    mouseUpHandler() {
        this.draggingSide = 0;
        this.isDragging = false;
        document.body.style.cursor = 'default';
    }
}
