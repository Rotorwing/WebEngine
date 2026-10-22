class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(v) {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    subtract(v) {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    multiply(scalar) {
        return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    divide(scalar) {
        return new Vector3(this.x / scalar, this.y / scalar, this.z / scalar);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v) {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vector3(0, 0, 0);
        return this.divide(len);
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    setFromArray(arr) {
        this.x = arr[0];
        this.y = arr[1];
        this.z = arr[2];
    }

    copyFrom(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
    
    toString() {
        return `Vector3(${this.x}, ${this.y}, ${this.z})`;
    }

    static fromArray(arr) {
        return new Vector3(arr[0], arr[1], arr[2]);
    }

    toArray() {
        return [this.x, this.y, this.z];
    }

    static Zero() {
        return new Vector3(0, 0, 0);
    }

    static One() {
        return new Vector3(1, 1, 1);
    }
}