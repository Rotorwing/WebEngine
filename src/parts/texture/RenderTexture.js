class RenderTexture extends TextureBase {
    constructor(name, size, format, engine){
        super(engine, {
            label: name,
            size: [size.width, size.height],
            format: format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });

        this.build();
    }
}