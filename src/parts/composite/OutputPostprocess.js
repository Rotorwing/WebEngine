class OutputPostprocess extends Postprocess {
    constructor(name, engine, shader) {
        super(name, engine, shader);

        this.deferredRenderTargets = [
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
        
        this.deferredRenderTargets[0].texture = this._engine.deferredRenderTargets[4].view
        // no sampler for depth texture

        // this.renderDescriptor.colorAttachments[0].view = this.deferredRenderTargets[0].texture.view;
        // this.renderDescriptor.colorAttachments[1].view = this.deferredRenderTargets[1].texture.view;
        // this.renderDescriptor.colorAttachments[2].view = this.deferredRenderTargets[2].texture.view;

        this.setTexture("renderResult", this.deferredRenderTargets[0]);

        this.build();
    }

    renderWithPass(passEncoder, engine, globalBindGroup=null, vertexIndex=0, alterPass=null, callOnRender=true){
        super.renderWithPass(passEncoder, engine, null, vertexIndex, alterPass, callOnRender);
    }

    onRender(engine){
        super.onRender(engine);

        const colorTexture = engine._context.getCurrentTexture();
        this.renderDescriptor.colorAttachments[0].view = colorTexture.createView();

        // this.setTexture("deferredTarget0", 0, this.deferredRenderTargets[0]);
        // this.setTexture("deferredTarget1", 1, this.deferredRenderTargets[1]);
        // this.setTexture("deferredTarget2", 2, this.deferredRenderTargets[2]);
        // this.setTexture("deferredTargetD", 3, this.deferredRenderTargets[3]);
    }

    onResize(engine){
        this.deferredRenderTargets[0].texture = this._engine.deferredRenderTargets[4].view

        this.build();
    }
}
