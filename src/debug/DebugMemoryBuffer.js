class DebugMemoryBuffer extends DebugItem {
    constructor(label, size) {
        super(label);
        this.size = size;

        this.allocations = [];

        this.allocationCounter = 0;
        this.deallocateCounter = 0;

        this.allocationCountElement = null;
        this.deallocationCountElement = null;

        this.barContainer = document.createElement('div');
        this.barContainer.className = 'debug-item-memory-bar-container';

        this.updateFrequency = 1; // updates per second

        this._buildInternal();

        this.zoomed = false;
    }

    allocate(name, start, end) {
        const color = `hsl(${Math.random() * 360}, ${Math.random() * 40+60}%, ${Math.random() * 30+30}%)`;

        const html = this._makeBar(name, start, end, color);
        this.barContainer.appendChild(html);

        this.allocations.push({ name, start, end, color, html });
        this.allocationCounter++;
        this.update();
        if(this.allocationCountElement) {
            this.allocationCountElement.textContent = this.allocationCounter;
        }
    }

    free(name) {
        const allocation = this.getByName(name);
        if (allocation) {
            this._removeAllocation(allocation);
        }
    }
    freeByIndex(index) {
        const allocation = this.getByIndex(index);
        if (allocation) {
            this._removeAllocation(allocation);
        }
    }

    _getClipFrame(){
        let minStart = Infinity;
        let maxEnd = -Infinity;

        this.allocations.forEach(allocation => {
            if (allocation.start < minStart) {
                minStart = allocation.start;
            }
            if (allocation.end > maxEnd) {
                maxEnd = allocation.end;
            }
        });

        return {start: minStart, end: maxEnd};
    }

    zoom(){
        const clipFrame = this._getClipFrame();
        if (clipFrame.start !== Infinity && clipFrame.end !== -Infinity) {
            const startFraction = clipFrame.start / this.size;
            const endFraction = (clipFrame.end / this.size);
            const lengthFraction = endFraction - startFraction;
            const paddingFraction = lengthFraction*0.05;
            // this.barContainer.style.position = 'absolute';
            const left = Math.min((-startFraction + paddingFraction) * 100, 0);
            const width = Math.max((1/(endFraction - startFraction + 2 * paddingFraction) * 100), 100);
            this.barContainer.style.left = `${left}%`;
            this.barContainer.style.width = `${width}%`;
            this.zoomed = true;
        }
    }
    unzoom(){
        this.barContainer.style.position = 'relative';
        this.barContainer.style.left = '0';
        this.barContainer.style.width = '100%';
        this.zoomed = false;
    }

    _removeAllocation(allocation) {
        this._removeBar(allocation.html);
        this.allocations = this.allocations.filter(a => a !== allocation);
        this.deallocateCounter++;
        if(this.deallocationCountElement) {
            this.deallocationCountElement.textContent = this.deallocateCounter;
        }
    }
    
    update() {
        if(this.allocationCountElement) {
            this.allocationCountElement.textContent = this.allocationCounter;
        }
        if(this.deallocationCountElement) {
            this.deallocationCountElement.textContent = this.deallocateCounter;
        }
    }
    getByIndex(index) {
        return this.allocations.find(allocation => allocation.start === index);
    }

    getByName(name) {
        return this.allocations.find(allocation => allocation.name === name);
    }

    getAllocationCount() {
        return this.allocations.length;
    }

    getDeallocationCount() {
        return this.deallocateCounter;
    }

    _makeBar(name, start, end, color) {
        const bar = document.createElement('div');
        bar.style.position = 'absolute';
        bar.style.left = `${(start / this.size) * 100}%`;
        bar.style.width = `${((end - start) / this.size) * 100}%`;
        bar.style.height = '100%';
        bar.style.backgroundColor = color;
        bar.title = `${name}: ${start} - ${end}`;
        return bar;
    }

    _removeBar(bar) {
        this.barContainer.removeChild(bar);
    }

    _buildKeyValueElement(key){
        const keyValueElement = document.createElement('div');
        keyValueElement.style.alignContent = 'center';

        const keyElement = document.createElement('span');
        keyElement.className = 'debug-item-label';
        keyElement.textContent = key;

        const valueElement = document.createElement('span');
        valueElement.className = 'debug-item-value';
        valueElement.textContent = '0';

        keyValueElement.appendChild(keyElement);
        keyValueElement.appendChild(valueElement);

        return {keyValueElement, valueElement};
    }

    build() {
        const container = super.build();
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.border = '1px solid #ccc';
        container.style.display = 'block';
        container.style.overflow = 'hidden';

        const titleElement = document.createElement('div');
        titleElement.className = 'debug-item-title';
        titleElement.textContent = this.label;
        titleElement.style.margin = '0';
        titleElement.style.width = '100%';
        titleElement.style.textAlign = 'center';

        container.appendChild(titleElement);


        const allocationElementData = this._buildKeyValueElement('Allocations');
        const deallocationElementData = this._buildKeyValueElement('Deallocations');

        const allocationCountElement = allocationElementData.keyValueElement;
        const deallocationCountElement = deallocationElementData.keyValueElement;

        this.allocationCountElement = allocationElementData.valueElement;
        this.deallocationCountElement = deallocationElementData.valueElement;

        console.log('allocationCountElement:', allocationCountElement);
        console.log('deallocationCountElement:', deallocationCountElement);

        const informationBox = document.createElement('div');
        informationBox.style.display = 'flex';
        informationBox.style.justifyContent = 'space-between';
        informationBox.style.marginBottom = '5px';

        const zoomButton = document.createElement('button');
        zoomButton.textContent = 'Zoom';
        zoomButton.addEventListener('click', () => {
            if(this.zoomed) {
                this.unzoom();
                zoomButton.textContent = 'Zoom';
            } else {
                this.zoom();
                zoomButton.textContent = 'Unzoom';
            }
        });

        informationBox.appendChild(zoomButton);

        informationBox.appendChild(allocationCountElement);
        informationBox.appendChild(deallocationCountElement);

        container.appendChild(informationBox);
        container.appendChild(this.barContainer);

        return container;
    }
}