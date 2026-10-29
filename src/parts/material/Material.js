class Material {
    constructor(name, engine, shader){
        this._engine = engine;
        this._shader = shader;
        this._name = name;

        // this._bindGroupLayout = null;
        this._bindGroup = null;

        this._uniforms = {};
        this._textures = {};

        this._buildUniforms();
        this._buildTextures();

    }

    setTexture(name, texture){
        if(!this._textures[name]){
            throw new Error(`Texture ${name} not found in material.`);
        }
        this._textures[name].texture = texture;
        // this._buildBindGroup();
    }
    setUniform(name, data){
        if(!this._uniforms[name]){
            throw new Error(`Uniform ${name} not found in material.`);
        }
        this._uniforms[name].data = data;
        this._engine.device && this._uniforms[name].writeBuffer(this._engine.device);
    }

    getUniform(name){
        return this._uniforms[name];
    }

    getTexture(name){
        return this._textures[name] ? this._textures[name].texture : null;
    }

    build(){
        this._buildBindGroup();
    }

    _buildUniforms(){
        const requiredUniforms = this._shader.uniformRequirements;
        for (const uniformName in requiredUniforms) {
            const uniform = requiredUniforms[uniformName];
            // console.log(uniform);
            this.addUniform(uniformName, uniform.binding, uniform.length, new uniform.Type(uniform.length) );
        }
    }

    _buildTextures(){
        const requiredTextures = this._shader.textureRequirements;
        for (const textureName in requiredTextures) {
            const texture = requiredTextures[textureName];
            this.addTexture(textureName, texture.binding, null, texture.noSampler);
        }
    }

    _buildBindGroup(){
        // let ents = this._getBindGroupEntries();
        // for(let n in ents){
        //     console.log(ents[n]);
        // }
        // console.log(this._shader.localBindGroupLayout);
        if(this._shader.localBindGroupLayout){
            this._bindGroup = this._engine.device.createBindGroup({
                layout: this._shader.localBindGroupLayout,
                entries: this._getBindGroupEntries()
            });
        }else{
            console.warn(`${this._name}:Shader ${this._shader.name} does not have a local bind group layout. Bind group not created.`);
        }
    }


    addUniform(name, binding, length, data){
        const uniform = new Uniform(name, binding, this._engine.device, data, length);
        this._uniforms[name] = uniform;
        return uniform;
    }

    addTexture(name, binding, texture, noSampler=false){
        this._textures[name] = { binding, texture, noSampler };
    }

    _getBindGroupEntries(){
        const entries = [];
        for (const uniformName in this._uniforms) {
            const uniform = this._uniforms[uniformName];
            entries.push({
                binding: uniform.binding,
                resource: { buffer: uniform.buffer }
            });
        }
        for (const textureName in this._textures) {
            const textureInfo = this._textures[textureName];
            if(!textureInfo.noSampler){
                entries.push({
                    binding: textureInfo.binding,
                    resource: textureInfo.texture.sampler
                });
            }
            entries.push({
                binding: textureInfo.binding + (textureInfo.noSampler ? 0 : 1),
                resource: textureInfo.texture.texture
            });
        }
        return entries;
    }

    updateUniforms(){
        for (const uniformName in this._uniforms) {
            const uniform = this._uniforms[uniformName];
            uniform.writeBuffer(this._engine.device);
        }
    }

    get shader(){
        return this._shader;
    }

    get bindGroup(){
        return this._bindGroup;
    }

    get pipeline(){
        return this._shader.pipeline;
    }
}

class Uniform{
    constructor(name, binding, device, data, size){
        this.name = name;
        this.binding = binding;
        this.size = size;
        this.data = data;

        this.buffer = device.createBuffer({
            label: `Uniform Buffer: ${name}`,
            size: Math.max(128, this.size),
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }

    writeBuffer(device){
        device.queue.writeBuffer(this.buffer, 0, this.data);
    }
}