class DepthTexture extends TextureBase {
    constructor(name, size, engine){
        super(engine, {
            label: name,
            size: [size.width, size.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.viewDescriptor.aspect = 'depth-only';

        this.build();
    }
}