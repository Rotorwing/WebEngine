class TransformNode {
    constructor(name) {
        this._name = name;
        this._position = glMatrix.vec3.create();
        this._rotation = glMatrix.quat.create();
        this._scale = glMatrix.vec3.fromValues(1, 1, 1);
        this._parent = null;
        this._dirtyTransform = true;

        this._worldMatrix = glMatrix.mat4.create();
        this._localMatrix = glMatrix.mat4.create();
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    set position(value) {
        this._dirtyTransform = true;
        this._position = value;
    }

    set rotation(value) {
        this._dirtyTransform = true;
        this._rotation = value;
    }

    set scale(value) {
        this._dirtyTransform = true;
        this._scale = value;
    }

    get position() {
        return this._position;
    }

    get rotation() {
        return this._rotation;
    }

    get scale() {
        return this._scale;
    }

    get parent() {
        return this._parent;
    }

    set parent(value) {
        this._parent = value;
    }

    dirtyTransform() {
        this._dirtyTransform = true;
    }

    getWorldMatrix() {
        glMatrix.mat4.identity(this._worldMatrix);

        if (this._parent) {
            glMatrix.mat4.copy(this._worldMatrix, this._parent.getWorldMatrix());
        }

        let localMatrix = this.getLocalMatrix();

        glMatrix.mat4.multiply(this._worldMatrix, this._worldMatrix, localMatrix);
        return this._worldMatrix;
    }

    getLocalMatrix() {
        if(!this._dirtyTransform){
            return this._localMatrix;
        }
        this._dirtyTransform = false;

        glMatrix.mat4.identity(this._localMatrix);
        glMatrix.mat4.fromRotationTranslationScale(this._localMatrix, this._rotation, this._position, this._scale);
        return this._localMatrix;
    }
}