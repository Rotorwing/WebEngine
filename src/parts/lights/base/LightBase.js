class LightBase extends Mesh {
    constructor(name, engine, lightData){
        super(name, engine, null, null);
        this._engine = engine;
        this.lightData = lightData;
        this.lightData.intensity = this.lightData.intensity ?? 1.0;
        this.lightData.color = this.lightData.color ?? [1.0, 1.0, 1.0];

        this.uniformLength = 16 + (3+1) + (1+3); // matrix + ( color + intensity) + (range + padding)


        this.postprocess = null;

        this._volumeMeshData = null;
        this._volumeBindGroup = null;
        this._volumeShader = ShaderStore.getShader("volumeMaskShader");
        this.volumeRenderDescriptor = {
            colorAttachments: [],
            depthStencilAttachment: {
                view: undefined,
                // depthClearValue: 1,
                // depthLoadOp: 'load',
                // depthStoreOp: 'store',
                depthReadOnly: true,

                stencilClearValue: 0,
                stencilLoadOp: "clear",
                stencilStoreOp: "store",
            },
        };
    }

    _buildVolumeBindGroup(){
        /*
        const device = this._engine.device;
        this._volumeBindGroup = device.createBindGroup({
            layout: WebEngine.globalBindGroupLayout, // 'auto' ,//this._volumeShader.localBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer
                    }
                }
            ]
        });
        */
    }

    getUniformBuffer(){
        const wMatrix = this.getWorldMatrix();
        return [
            // this.position[0], this.position[1], this.position[2], 1.0,
            ...wMatrix,
            this.lightData.color[0], this.lightData.color[1], this.lightData.color[2], this.lightData.intensity,
            this.lightData.range*0.95, 0.0, 0.0, 0.0
        ];
    }

    setup(){
        this.postprocess.setup();
        // this._buildVolumeBindGroup();
    }

    set targetView(view){
        this.postprocess.targetView = view;
    }

    set stencilView(view){
        this.volumeRenderDescriptor.depthStencilAttachment.view = view;
        this.postprocess.stencilView = view;
    }

    _renderVolume(commandEncoder, engine, GPUBuffers, globalBindGroup){
        const passEncoder = commandEncoder.beginRenderPass(this.volumeRenderDescriptor);
        passEncoder.setPipeline(this._volumeShader.pipeline);
        passEncoder.setBindGroup(0, globalBindGroup);

        passEncoder.setVertexBuffer(0, GPUBuffers.positions, this._volumeMeshData.indexes.positions * Float32Array.BYTES_PER_ELEMENT);
        passEncoder.setIndexBuffer(GPUBuffers.indices, 'uint16', this._volumeMeshData.indexes.indices * Uint16Array.BYTES_PER_ELEMENT);


        passEncoder.drawIndexed(this._volumeMeshData.indexCount, 1, 0, 0, this.uniformIndex/4);
        passEncoder.end();

    }

    render(commandEncoder, engine, GPUBuffers, globalBindGroup){
        if(this._volumeMeshData){
            this._renderVolume(commandEncoder, engine, GPUBuffers, globalBindGroup);
        }

        this.postprocess.render(commandEncoder, engine, globalBindGroup, this.uniformIndex/4);
    }

    renderWithPass(passEncoder, engine, globalBindGroup){
        this.postprocess.renderWithPass(passEncoder, engine, globalBindGroup, this.uniformIndex/4);
    }

    onResize(engine){
        this.postprocess.onResize(engine);
    }
}