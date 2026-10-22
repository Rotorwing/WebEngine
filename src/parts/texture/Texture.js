class Texture extends TextureBase {
    constructor(name, size, format, engine, filterMode = 'linear', wrapMode = 'repeat', mipmaps = false) {
        
        super(engine, {
            label: name,
            size: [size.width, size.height],
            format: format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        }, mipmaps);

        console.log("filterMode", filterMode, "wrapMode", wrapMode, "mipmaps", mipmaps);
        this.sampler = engine.device.createSampler({
            magFilter: filterMode,
            minFilter: filterMode,
            mipmapFilter: mipmaps ? filterMode : 'nearest',
            maxAnisotropy: mipmaps ? (filterMode === 'linear' ? 8 : 1) : 1,
            addressModeU: wrapMode,
            addressModeV: wrapMode,
        });

        this.build();
    }
}