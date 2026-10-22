class LightBase extends TransformNode {
    constructor(name, engine, lightData){
        super(name);
        this._engine = engine;
        this.lightData = lightData;
        this.lightData.intensity = this.lightData.intensity ?? 1.0;
        this.lightData.color = this.lightData.color ?? [1.0, 1.0, 1.0];

        this.renderPriority = 0;

        this.uniformIndex = null;
        this.uniformLength = 4 * 2; // position + intensity + color


        this.postprocess = null;
    }

    getUniformBuffer(){
        return [
            this.position[0], this.position[1], this.position[2], 1.0,
            this.lightData.color[0], this.lightData.color[1], this.lightData.color[2], this.lightData.intensity
        ];
    }

    setup(){
        this.postprocess.setup();
    }

    render(commandEncoder, engine, globalBindGroup){
        this.postprocess.render(commandEncoder, engine, globalBindGroup, this.uniformIndex/4);
    }

    renderWithPass(passEncoder, engine, globalBindGroup){
        this.postprocess.renderWithPass(passEncoder, engine, globalBindGroup, this.uniformIndex/4);
    }

    onResize(engine){
        this.postprocess.onResize(engine);
    }
}