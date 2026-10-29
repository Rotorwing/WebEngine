class Icosphere extends Mesh {
    constructor(name, engine, radius, resolution, material){
        const meshData = new IcosphereData(name, radius, resolution);
        super(name, engine, meshData, material);
    }
}
class IcosphereData extends MeshData{
    constructor(name, radius, resolution){
        super(name);
        this.radius = radius;
        this.resolution = resolution;

        this._positionTmp = [];
        this._normalsTmp = [];
        this._indicesTmp = [];

        this._generateIcosahedron();
        this._subdivide();
        this._scaleVertices();
        this._buildArrays();

    }

    _generateIcosahedron(){
        const a = 0.525731112119134;
        const c = 0.85065080835157;
        const vertices = [
            -a, 0.0, c,  a, 0.0, c,  -a, 0.0, -c,  a, 0.0, -c,
            0.0, c, a,  0.0, c, -a,  0.0, -c, a,  0.0, -c, -a,
            c, a, 0.0,  -c, a, 0.0,  c, -a, 0.0,  -c, -a, 0.0
        ];

        const indices = [
            //testing
            // 0,1,3,
            // 0,3,2,

            // 4,5,7,
            // 4,7,6,

            // 8,9,11,
            // 8,11,10,

            // actual
            1,4,0,
            4,5,9,
            4,9,0,
            11,0,9,
            11,9,2,
            5,2,9,
            3,2,5,
            3,7,2,
            11,2,7,
            10,7,3,
            6,7,10,
            11,7,6,
            11,6,0,
            1,0,6,
            1,6,10,
            1,10,8,
            3,8,10,
            3,5,8,
            4,8,5,
            4,1,8
        ];

        this._positionsTmp = vertices;
        this._normalsTmp = vertices;
        this._indicesTmp = indices;
    }

    _getVertex(index){
        const x = this._positionsTmp[index * 3];
        const y = this._positionsTmp[index * 3 + 1];
        const z = this._positionsTmp[index * 3 + 2];
        return [x, y, z];
    }

    _normalizeAndAddVertex(v0, v1){
        const x = (v0[0] + v1[0]) * 0.5;
        const y = (v0[1] + v1[1]) * 0.5;
        const z = (v0[2] + v1[2]) * 0.5;
        const length = Math.sqrt(x * x + y * y + z * z);
        const nx = x / length;
        const ny = y / length;
        const nz = z / length;
        this._positionsTmp.push(nx, ny, nz);
        this._normalsTmp.push(nx, ny, nz);
        return this._positionsTmp.length / 3 - 1;
    }

    _subdivideStep(){
        const indicesTmp = [...this._indicesTmp];
        for(let i = 0; i < this._indicesTmp.length; i += 3){
            console.log("subdividing triangle", i / 3, "of", this._indicesTmp.length / 3);
            const i0 = indicesTmp[i];
            const i1 = indicesTmp[i + 1];
            const i2 = indicesTmp[i + 2];

            const v0 = this._getVertex(i0);
            const v1 = this._getVertex(i1);
            const v2 = this._getVertex(i2);

            const v01 = this._normalizeAndAddVertex(v0, v1);
            const v12 = this._normalizeAndAddVertex(v1, v2);
            const v20 = this._normalizeAndAddVertex(v2, v0);

            indicesTmp[i] = i0;
            indicesTmp[i + 1] = v01;
            indicesTmp[i + 2] = v20;

            indicesTmp.push(v01, i1, v12);
            indicesTmp.push(v20, v12, i2);
            indicesTmp.push(v01, v12, v20);
        }
        this._indicesTmp = indicesTmp;
    }

    _subdivide(){
        for(let i = 0; i < this.resolution; i++){
            this._subdivideStep();
        }
    }

    _scaleVertices(){
        for(let i = 0; i < this._positionsTmp.length; i += 3){
            this._positionsTmp[i] *= this.radius;
            this._positionsTmp[i + 1] *= this.radius;
            this._positionsTmp[i + 2] *= this.radius;
        }
    }

    _buildArrays(){
        this._positions = new Float32Array(this._positionsTmp);
        this._normals = new Float32Array(this._normalsTmp);
        this._indices = new Uint16Array(this._indicesTmp);
        this._uvs = new Float32Array(this._positionsTmp.length / 3 * 2);
    }
}