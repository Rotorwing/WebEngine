class PointLight extends LightBase {
    constructor(name, engine, lightData) {
        super(name, engine, lightData);
        this.lightData.range = this.lightData.range ?? ((this.lightData.intensity ?? 1.0) * 2.0);
        this.lightData.volumeResolution = this.lightData.volumeResolution ?? Math.floor(Math.sqrt(this.lightData.range));
        this._volumeMeshData = new IcosphereData(name+"volume", this.lightData.range, this.lightData.volumeResolution); // Create a unit sphere mesh for the light volume
        

    }

    setup(){
        this.postprocess = new LightPostprocess(this._name + "_postprocess", this._engine, ShaderStore.getShader("pointLightShader"));
        super.setup();
    }

    get meshData(){
        return this._volumeMeshData;
    }

    set meshData(meshData){
        this._volumeMeshData = meshData;
    }
}