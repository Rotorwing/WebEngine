class Postprocess extends Material {
    /*
    static meshDataArrays = {
        positions: new Float32Array([
            0.0, 0.0, 0.0,
            2.0, 0.0, 0.0,
            0.0, 2.0, 0.0,
        ]),
        texCoords: new Float32Array([
            0.0, 0.0,
            2.0, 0.0,
            0.0, 2.0,
        ]),
        indices: new Uint32Array([
            0, 1, 2,
        ])
    }

    static meshDataBuffers = {
        positions: null,
        texCoords: null,
        indices: null
    }

    static buildBuffers(engine){
        if(!Postprocess.meshDataBuffers.positions){
            const device = engine.device;
            Postprocess.meshDataBuffers.positions = device.createBuffer({
                size: Postprocess.meshDataArrays.positions.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            });
            new Float32Array(Postprocess.meshDataBuffers.positions.getMappedRange()).set(Postprocess.meshDataArrays.positions);
            Postprocess.meshDataBuffers.positions.unmap();

            Postprocess.meshDataBuffers.texCoords = device.createBuffer({
                size: Postprocess.meshDataArrays.texCoords.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            });
            new Float32Array(Postprocess.meshDataBuffers.texCoords.getMappedRange()).set(Postprocess.meshDataArrays.texCoords);
            Postprocess.meshDataBuffers.texCoords.unmap();

            Postprocess.meshDataBuffers.indices = device.createBuffer({
                size: Postprocess.meshDataArrays.indices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            });
            new Uint32Array(Postprocess.meshDataBuffers.indices.getMappedRange()).set(Postprocess.meshDataArrays.indices);
            Postprocess.meshDataBuffers.indices.unmap();
        }
    }*/

    constructor(name, engine, shader) {
        super(name, engine, shader);
        // this._name = name;
        // this._engine = engine;
        // this._shader = shader;

        this._bindGroup = null;

        this.renderDescriptor = {
            colorAttachments: [
            { // renderView
                view: undefined,
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
                depthReadOnly: true,
            }
            ],
            // depthStencilAttachment: {
            //     view: undefined,
            //     depthClearValue: 1,
            //     depthLoadOp: 'clear',
            //     depthStoreOp: 'store',
            // },
        };
    }

    setup(){
    }

    render(commandEncoder, engine, globalBindGroup=null, vertexIndex=0, alterPass=null){
        this.onRender(engine);
        // if(this.name.includes("output") && !this.asbs){ console.log("descriptor", this.renderDescriptor); this.asbs = 1; }
        const passEncoder = commandEncoder.beginRenderPass(this.renderDescriptor);
        // passEncoder.setStencilReference(1);
        this.renderWithPass(passEncoder, engine, globalBindGroup, vertexIndex, alterPass, false);

        passEncoder.end();
    }

    renderWithPass(passEncoder, engine, globalBindGroup=null, vertexIndex=0, alterPass=null, callOnRender=true){
        if(callOnRender){
            this.onRender(engine);
        }

        passEncoder.setPipeline(this._shader.pipeline);
        if(globalBindGroup){
            passEncoder.setBindGroup(0, globalBindGroup);
            passEncoder.setBindGroup(1, this._bindGroup);
        }else{
            passEncoder.setBindGroup(0, this._bindGroup);
        }

        if(alterPass){
            alterPass(passEncoder);
        }
        if(vertexIndex > 0){
            passEncoder.draw(3, 1, 0, vertexIndex);
        }else{
            passEncoder.draw(3);
        }
    }

    onRender(engine){
        
    }

    onResize(engine){
    }

    get bindGroup(){
        return this._bindGroup;
    }

    get shader(){
        return this._shader;
    }

    get name(){
        return this._name;
    }

    // _buildBindGroup(){
    //     if(this._shader.localBindGroupLayout){
    //         this._bindGroup = this._engine.device.createBindGroup({
    //             layout: this._shader.localBindGroupLayout,
    //             entries: this._getBindGroupEntries()
    //         });
    //     }
    // }
}
