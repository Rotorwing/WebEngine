class Camera extends TransformNode {
    constructor(name) {
        super(name);
        this._fov = 45;
        this._near = 0.1;
        this._far = 1000;
        this._aspect = 1.0;
    }

    get fov() {
        return this._fov;
    }

    set fov(value) {
        this._fov = value;
    }

    get near() {
        return this._near;
    }

    set near(value) {
        this._near = value;
    }

    get far() {
        return this._far;
    }

    set far(value) {
        this._far = value;
    }
    get aspect() {
        return this._aspect;
    }

    set aspect(value) {
        this._aspect = value;
    }

    updateAspectRatio(width, height) {
        let _width = width;
        let _height = height;
        if(!_height) {
            if(width.width){
                _height = width.height;
                _width = width.width;
            }else{
                _height = window.innerHeight;
                _width = window.innerWidth;
                alert("Warning: No height provided for camera aspect ratio update. Using window.innerHeight and window.innerWidth as fallback.");
            }
        }
        this._aspect = _width / _height;
    }

    getViewProjectionMatrix(){
        const view = this.getViewMatrix();
        const proj = this.getProjectionMatrix();
        const viewProj = glMatrix.mat4.create();
        glMatrix.mat4.multiply(viewProj, proj, view);
        return viewProj;
    }

    getInverseViewProjectionMatrix(){
        const viewProj = this.getViewProjectionMatrix();
        const invViewProj = glMatrix.mat4.create();
        glMatrix.mat4.invert(invViewProj, viewProj);
        return invViewProj;
    }

    getProjectionMatrix(){
        const out = glMatrix.mat4.create();
        glMatrix.mat4.perspectiveZO(out, glMatrix.glMatrix.toRadian(this._fov), this._aspect, this._near, this._far);
        return out;
    }

    getViewMatrix(){
        const out = glMatrix.mat4.create();
        glMatrix.mat4.invert(out, this.getWorldMatrix());
        if(out == null){
            return glMatrix.mat4.create();
        }
        return out;
    }

    lookAt(target, up = glMatrix.vec3.fromValues(0, 1, 0)) {

        const viewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.targetTo(viewMatrix, this.position, target, up);
        const rotation = glMatrix.quat.create();
        glMatrix.mat4.getRotation(rotation, viewMatrix);
        this.rotation = rotation;
    }


    get viewMatrix() {
        return this.getViewMatrix();
    }

    get viewProjectionMatrix() {
        return this.getViewProjectionMatrix();
    }

    get projectionMatrix() {
        return this.getProjectionMatrix();
    }
}