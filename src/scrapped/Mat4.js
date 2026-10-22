class Mat4 {
    constructor() {
        this.elements = new Float32Array(16);
        this.identity();
    }

    identity() {
        const e = this.elements;
        e[0] = 1; e[4] = 0; e[8] = 0; e[12] = 0;
        e[1] = 0; e[5] = 1; e[9] = 0; e[13] = 0;
        e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
    }

    static Identity() {
        const result = new Mat4();
        result.identity();
        return result;
    }
    

    static multiplyMat(matA, matB) {
        const a = matA.elements;
        const b = matB.elements;
        const result = new Mat4();
        const r = result.elements;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                r[i * 4 + j] = a[i * 4 + 0] * b[0 * 4 + j] +
                               a[i * 4 + 1] * b[1 * 4 + j] +
                               a[i * 4 + 2] * b[2 * 4 + j] +
                               a[i * 4 + 3] * b[3 * 4 + j];
            }
        }

        return result;
    }

    static multiplyVec4(mat, vec) {
        const e = mat.elements;
        const x = vec.x, y = vec.y, z = vec.z, w = vec.w;
        return {
            x: e[0] * x + e[4] * y + e[8] * z + e[12] * w,
            y: e[1] * x + e[5] * y + e[9] * z + e[13] * w,
            z: e[2] * x + e[6] * y + e[10] * z + e[14] * w,
            w: e[3] * x + e[7] * y + e[11] * z + e[15] * w
        };
    }
    static multiplyVec3(mat, vec) {
        const v = {x: vec.x, y: vec.y, z: vec.z, w: 1};
        const result = Mat4.multiplyVec4(mat, v);
        return {x: result.x, y: result.y, z: result.z};
    }

    static translate(x, y, z) {
        const translationMatrix = new Mat4();
        translationMatrix.elements[12] = x;
        translationMatrix.elements[13] = y;
        translationMatrix.elements[14] = z;
        return Mat4.multiplyMat(translationMatrix);
    }

    static scale(x, y, z) {
        const scaleMatrix = new Mat4();
        scaleMatrix.elements[0] = x;
        scaleMatrix.elements[5] = y;
        scaleMatrix.elements[10] = z;
        return Mat4.multiplyMat(scaleMatrix);
    }

    static rotationX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const rotationMatrix = new Mat4();
        rotationMatrix.elements[5] = c;
        rotationMatrix.elements[6] = s;
        rotationMatrix.elements[9] = -s;
        rotationMatrix.elements[10] = c;
        return Mat4.multiplyMat(rotationMatrix);
    }

    static rotationY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const rotationMatrix = new Mat4();
        rotationMatrix.elements[0] = c;
        rotationMatrix.elements[2] = -s;
        rotationMatrix.elements[8] = s;
        rotationMatrix.elements[10] = c;
        return Mat4.multiplyMat(rotationMatrix);
    }

    static rotationZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const rotationMatrix = new Mat4();
        rotationMatrix.elements[0] = c;
        rotationMatrix.elements[1] = s;
        rotationMatrix.elements[4] = -s;
        rotationMatrix.elements[5] = c;
        return Mat4.multiplyMat(rotationMatrix);
    }

    static perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov * 0.5);
        const rangeInv = 1.0 / (near - far);

        const result = new Mat4();
        const e = result.elements;

        e[0] = f / aspect;
        e[1] = 0;
        e[2] = 0;
        e[3] = 0;

        e[4] = 0;
        e[5] = f;
        e[6] = 0;
        e[7] = 0;

        e[8] = 0;
        e[9] = 0;
        e[10] = (near + far) * rangeInv;
        e[11] = -1;

        e[12] = 0;
        e[13] = 0;
        e[14] = near * far * rangeInv * 2;
        e[15] = 0;

        return result;
    }

    static lookAt(eye, target, up) {
        const zAxis = new Vector3(eye.x - target.x, eye.y - target.y, eye.z - target.z).normalize();
        const xAxis = new Vector3(up.y * zAxis.z - up.z * zAxis.y, up.z * zAxis.x - up.x * zAxis.z, up.x * zAxis.y - up.y * zAxis.x).normalize();
        const yAxis = new Vector3(zAxis.y * xAxis.z - zAxis.z * xAxis.y, zAxis.z * xAxis.x - zAxis.x * xAxis.z, zAxis.x * xAxis.y - zAxis.y * xAxis.x);

        const result = new Mat4();
        const e = result.elements;

        e[0] = xAxis.x;
        e[1] = yAxis.x;
        e[2] = zAxis.x;
        e[3] = 0;

        e[4] = xAxis.y;
        e[5] = yAxis.y;
        e[6] = zAxis.y;
        e[7] = 0;

        e[8] = xAxis.z;
        e[9] = yAxis.z;
        e[10] = zAxis.z;
        e[11] = 0;

        e[12] = -xAxis.dot(eye);
        e[13] = -yAxis.dot(eye);
        e[14] = -zAxis.dot(eye);
        e[15] = 1;

        return result;
    }
}