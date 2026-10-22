class LightPostprocess extends Postprocess {
    constructor(name, engine, shader) {
        super(name, engine, shader);

        this.deferredRenderTargets = [
            {texture:null,
            sampler:null},

            {texture:null,
            sampler:null},

            {texture:null,
            sampler:null},

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
        
        this.deferredRenderTargets[0].texture = this._engine.deferredRenderTargets[0].view
        this.deferredRenderTargets[0].sampler = device.createSampler({magFilter: 'linear', minFilter: 'linear'});

        this.deferredRenderTargets[1].texture = this._engine.deferredRenderTargets[1].view
        this.deferredRenderTargets[1].sampler = device.createSampler({magFilter: 'linear', minFilter: 'linear'});

        this.deferredRenderTargets[2].texture = this._engine.deferredRenderTargets[2].view
        this.deferredRenderTargets[2].sampler = device.createSampler({magFilter: 'linear', minFilter: 'linear'});

        this.deferredRenderTargets[3].texture = this._engine.deferredRenderTargets[3].view
        // no sampler for depth texture

        // this.renderDescriptor.colorAttachments[0].view = this._engine.deferredRenderTargets[4].view

        // this.renderDescriptor.colorAttachments[0].view = this.deferredRenderTargets[0].texture.view;
        // this.renderDescriptor.colorAttachments[1].view = this.deferredRenderTargets[1].texture.view;
        // this.renderDescriptor.colorAttachments[2].view = this.deferredRenderTargets[2].texture.view;

        this.setTexture("deferredTarget0", this.deferredRenderTargets[0]);
        this.setTexture("deferredTarget1", this.deferredRenderTargets[1]);
        this.setTexture("deferredTarget2", this.deferredRenderTargets[2]);
        this.setTexture("deferredTargetD", this.deferredRenderTargets[3]);

        console.log('deferredRenderTargets', this.deferredRenderTargets);
        console.log('renderDescriptor', this.renderDescriptor);

        this.build();
    }

    onRender(engine){
        super.onRender(engine);

        // const colorTexture = engine._context.getCurrentTexture();
        // this.renderDescriptor.colorAttachments[0].view = colorTexture.createView();

        // this.setTexture("deferredTarget0", 0, this.deferredRenderTargets[0]);
        // this.setTexture("deferredTarget1", 1, this.deferredRenderTargets[1]);
        // this.setTexture("deferredTarget2", 2, this.deferredRenderTargets[2]);
        // this.setTexture("deferredTargetD", 3, this.deferredRenderTargets[3]);
    }

    onResize(engine){
        this.deferredRenderTargets[0].texture = this._engine.deferredRenderTargets[0].view
        this.deferredRenderTargets[1].texture = this._engine.deferredRenderTargets[1].view
        this.deferredRenderTargets[2].texture = this._engine.deferredRenderTargets[2].view
        this.deferredRenderTargets[3].texture = this._engine.deferredRenderTargets[3].view


        this.build();
    }
}
