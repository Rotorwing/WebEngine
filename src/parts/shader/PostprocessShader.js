class PostprocessShader extends Shader {
    constructor(name, engine, shaderCode) {
        super(name, engine, shaderCode);

        this.pipelineSettings = {
            label: this._label + "_pipeline",
            layout: 'auto',
            vertex: {
                module: this._module,
                buffers: [],
            },
            fragment: {
                module: this._module,
                targets: [
                ],
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'none',
            },
            depthStencil: {
                depthWriteEnabled: false,
                depthCompare: 'always',
                format: 'depth24plus-stencil8',
            }
        }
    }
}