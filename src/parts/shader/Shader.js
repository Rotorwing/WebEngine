class Shader {
    constructor(label, code){
        this._label = label;
        this._code = code;
        this._pipeline = null;

        this.uniformRequirements = {};
        this.textureRequirements = {};

        this.dirty = true;

        this.pipelineSettings = {
            label: this._label + "_pipeline",
            layout: 'auto',
            vertex: {
                module: this._module,
                buffers: [
                    // position
                    {
                    arrayStride: 3 * 4, // 3 floats, 4 bytes each
                    attributes: [
                        {shaderLocation: 0, offset: 0, format: 'float32x3'},
                    ],
                    },
                    // normal
                    {
                    arrayStride: 3 * 4, // 3 floats, 4 bytes each
                    attributes: [
                        {shaderLocation: 1, offset: 0, format: 'float32x3'},
                    ],
                    },
                    // UV
                    {
                    arrayStride: 2 * 4, // 2 floats, 4 bytes each
                    attributes: [
                        {shaderLocation: 2, offset: 0, format: 'float32x2',},
                    ],
                    },
                ],
            },
            fragment: {
                module: this._module,
                targets: [
                ],
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            }
        }

        this.localBindGroupLayout = null;

        this.onBuildPipeline = (shader, engine)=>{};
    }

    addUniformRequirement(name, binding, Type, length){
        this.uniformRequirements[name] = new ShaderUniformRequirement(binding, Type, length);
    }

    addTextureRequirement(name, binding, noSampler = false){
        this.textureRequirements[name] = new ShaderTextureRequirement(binding, noSampler);
    }

    set code(code){
        this._code = code;
    }

    load(engine){
        this._module = engine.device.createShaderModule({label: this._label, code: this._code});

        this.pipelineSettings.module = this._module;
        this.pipelineSettings.fragment.module = this._module;
        this.pipelineSettings.vertex.module = this._module;
        
        if(this.pipelineSettings.fragment.targets.length === 0){
            this.pipelineSettings.fragment.targets.push({format: engine.presentationFormat});
        }

        this.onBuildPipeline(this, engine);

        console.log(this.pipelineSettings);

        this._pipeline = engine.device.createRenderPipeline(this.pipelineSettings);
        this.dirty = false;
    }

    get module(){
        return this._module;
    }

    get pipeline(){
        return this._pipeline;
    }

    markDirty(){
        this.dirty = true;
    }
}

class ShaderUniformRequirement {
    constructor(binding, Type, length){
        this.binding = binding;
        this.Type = Type;
        this.length = length;
    }
}

class ShaderTextureRequirement {
    constructor(binding, noSampler = false){
        this.binding = binding;
        this.noSampler = noSampler;
    }
}

class ShaderStore {

    static shaders = {};
    constructor(name, shader){
        ShaderStore.addShader(name, shader);
    }

    static addShader(name, shader){
        ShaderStore.shaders[name] = shader;
    }

    static getShader(name){
        return ShaderStore.shaders[name];
    }

    static loadAllShaders(engine){
        for(const name in ShaderStore.shaders){
            const shader = ShaderStore.shaders[name];
            if(shader.dirty){
                shader.load(engine);
            }
        }
    }
}