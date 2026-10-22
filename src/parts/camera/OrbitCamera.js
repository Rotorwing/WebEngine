class OrbitCamera extends Camera {
    constructor(name, target, distance, engine) {
        super(name);
        this.target = target;
        this.distance = distance;
        this.engine = engine;

        this._rotationX = 0;
        this._rotationY = 0;

        this._updatePosition();
    }

    _updatePosition() {
        const x = this.target[0] + this.distance * Math.sin(this._rotationY) * Math.cos(this._rotationX);
        const y = this.target[1] + this.distance * Math.sin(this._rotationX);
        const z = this.target[2] + this.distance * Math.cos(this._rotationY) * Math.cos(this._rotationX);

        this.position = glMatrix.vec3.fromValues(x, y, z);
        this.lookAt(this.target);
    }

    rotate(deltaX, deltaY) {
        const sensitivity = 0.005;
        this._rotationY += deltaX * sensitivity;
        this._rotationX += deltaY * sensitivity;

        // Clamp the vertical rotation to avoid flipping
        const maxRotationX = Math.PI / 2 - 0.01; // Just below 90 degrees
        const minRotationX = -Math.PI / 2 + 0.01; // Just above -90 degrees
        this._rotationX = Math.max(minRotationX, Math.min(maxRotationX, this._rotationX));

        this._updatePosition();
    }

    zoom(delta) {
        const zoomSensitivity = 0.1;
        this.distance += delta * zoomSensitivity;
        this.distance = Math.max(0.1, this.distance); // Prevent zooming too close
        this._updatePosition();
    }

    pan(deltaX, deltaY) {
        const panSensitivity = 0.01;
        const right = glMatrix.vec3.create();
        const up = glMatrix.vec3.fromValues(0, 1, 0);
        const forward = glMatrix.vec3.create();

        // Calculate the forward vector (from camera to target)
        glMatrix.vec3.subtract(forward, this.target, this.position);
        glMatrix.vec3.normalize(forward, forward);

        // Calculate the right vector
        glMatrix.vec3.cross(right, forward, up);
        glMatrix.vec3.normalize(right, right);

        // Calculate the actual up vector based on the right and forward vectors
        glMatrix.vec3.cross(up, right, forward);
        glMatrix.vec3.normalize(up, up);

        // Pan the target position
        const panRight = glMatrix.vec3.create();
        const panUp = glMatrix.vec3.create();
        glMatrix.vec3.scale(panRight, right, deltaX * panSensitivity);
        glMatrix.vec3.scale(panUp, up, deltaY * panSensitivity);

        glMatrix.vec3.add(this.target, this.target, panRight);
        glMatrix.vec3.add(this.target, this.target, panUp);

        this._updatePosition();
    }

    mouseDrag(deltaX, deltaY, button) {
        if (button === 1) { // Left button for rotation
            this.rotate(-deltaX, deltaY);
        } else if (button === 2) { // Middle button for panning
            this.pan(-deltaX, deltaY);
        }
    }

    mouseWheel(delta) {
        this.zoom(delta);
    }

    bindMouseEvents(canvas) {
        let isDragging = false;
        let lastX, lastY;

        canvas.addEventListener('mousedown', (event) => {
            event.preventDefault(); // Prevent default behavior like text selection

            isDragging = true;
            lastX = event.clientX;
            lastY = event.clientY;

        });

        canvas.addEventListener('mousemove', (event) => {
            if (isDragging) {
                const deltaX = event.clientX - lastX;
                const deltaY = event.clientY - lastY;
                // console.log(`Mouse drag detected. DeltaX: ${deltaX}, DeltaY: ${deltaY}, Buttons: ${event.buttons}`);
                this.mouseDrag(deltaX, deltaY, event.buttons);
                lastX = event.clientX;
                lastY = event.clientY;
            }
        });

        canvas.addEventListener('mouseup', () => {
            // console.log("Mouse up event detected. Stopping drag.");
            isDragging = false;
        });

        canvas.addEventListener('wheel', (event) => {
            this.mouseWheel(event.deltaY);
        });

        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            // console.log("Right-click context menu disabled for camera control.");

            isDragging = true;
            lastX = event.clientX;
            lastY = event.clientY;
        });
    }
}