class OutputPostprocess extends Postprocess {
    constructor(name, engine, shader) {
        super(name, engine, shader);

        this.renderTargets = [
            {texture:null,
            sampler:null},
        ]

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
        const device = this._engine.device;
        
        this.renderTargets[0].texture = this._engine.deferredRenderTargets[4].view
        // no sampler for depth texture

        // this.renderDescriptor.colorAttachments[0].view = this.renderTargets[0].texture.view;
        // this.renderDescriptor.colorAttachments[1].view = this.renderTargets[1].texture.view;
        // this.renderDescriptor.colorAttachments[2].view = this.renderTargets[2].texture.view;

        this.setTexture("renderResult", this.renderTargets[0]);

        this.build();
    }

    renderWithPass(passEncoder, engine, globalBindGroup=null, vertexIndex=0, alterPass=null, callOnRender=true){
        super.renderWithPass(passEncoder, engine, null, vertexIndex, alterPass, callOnRender);
    }

    onRender(engine){
        super.onRender(engine);

        const colorTexture = engine._context.getCurrentTexture();
        this.renderDescriptor.colorAttachments[0].view = colorTexture.createView();

        // this.setTexture("deferredTarget0", 0, this.renderTargets[0]);
        // this.setTexture("deferredTarget1", 1, this.renderTargets[1]);
        // this.setTexture("deferredTarget2", 2, this.renderTargets[2]);
        // this.setTexture("deferredTargetD", 3, this.renderTargets[3]);
    }

    onResize(engine){
        this.renderTargets[0].texture = this._engine.deferredRenderTargets[4].view

        this.build();
    }
}


/*
Attachment state of [RenderPipeline "outputPostprocessShader_pipeline"] is not compatible with [RenderPassEncoder (unlabeled)].
[RenderPassEncoder (unlabeled)] expects an attachment state of                 { colorTargets: [0={format:TextureFormat::BGRA8Unorm}], sampleCount: 1 }.
[RenderPipeline "outputPostprocessShader_pipeline"] has an attachment state of { colorTargets: [0={format:TextureFormat::BGRA8Unorm}], depthStencilFormat: TextureFormat::Depth24PlusStencil8, sampleCount: 1 }.
 - While encoding [RenderPassEncoder (unlabeled)].SetPipeline([RenderPipeline "outputPostprocessShader_pipeline"]).
 - While finishing [CommandEncoder (unlabeled)].

 */