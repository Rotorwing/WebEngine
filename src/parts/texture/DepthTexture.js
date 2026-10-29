class DepthTexture extends TextureBase {
    constructor(name, size, engine){
        super(engine, {
            label: name,
            size: [size.width, size.height],
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.viewDescriptor.aspect = 'all'; //'';

        this._depthView = null;

        this.build();
    }

    build(){
        super.build();
        let viewSettings = {
            label: this._config.label + "_depth_view",
            aspect: 'depth-only',
        };
        this._depthView = this._texture.createView({...this.viewDescriptor, ...viewSettings});
        // console.log("DepthTexture build", this._depthView, {...this.viewDescriptor, ...viewSettings});
    }

    get depthView(){
        return this._depthView;
    }
}