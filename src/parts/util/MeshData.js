class MeshData {
    static _idCounter = 0;
    constructor(name) {
        this.id = MeshData._idCounter++;
        this.name = name || `MeshData_${this.id}`;
        this._positions = null;
        this._normals = null;
        this._uvs = null;
        this._indices = null;

        this.indexes = {
            positions: 0,
            normals: 0,
            uvs: 0,
            indices: 0
        };

    }

    get indexCount() {
        return this._indices ? this._indices.length : 0;
    }
}