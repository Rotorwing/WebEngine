class Mesh extends TransformNode {
    constructor(name, engine, meshData, material){
        super(name);
        this.meshData = meshData;
        this.material = material;
        this.renderPriority = 0;

        this.uniformIndex = null;
        this.uniformLength = 0;
    }
}