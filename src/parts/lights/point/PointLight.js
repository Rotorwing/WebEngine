class PointLight extends LightBase {
    constructor(name, engine, lightData) {
        super(name, engine, lightData);
        // this.lightData.range = this.lightData.range ?? 10.0;

    }

    setup(){
        this.postprocess = new LightPostprocess(this._name + "_postprocess", this._engine, ShaderStore.getShader("pointLightShader"));
        super.setup();
    }
}