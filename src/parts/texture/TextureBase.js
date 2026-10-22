class TextureBase {
    constructor(engine, _config, generateMipmaps = false) {
        this._engine = engine;
        this._config = _config;
        this._texture = null;

        this._view = null;

        this.viewDescriptor = {
            label: _config.label + "_view",
        };
        this._generateMipmaps = generateMipmaps;

        const mipCount = Math.floor(Math.log2(Math.max(_config.size[0], _config.size[1]))) + 1;
        this.mipCount = generateMipmaps ? mipCount : 1;

        if (this._generateMipmaps) {
            this._config.usage |= GPUTextureUsage.RENDER_ATTACHMENT;
            this._config.mipLevelCount = this.mipCount;
        }
    }

    build(){
        const device = this._engine.device;
        this._config.size[0] = Math.max(1, Math.min(device.limits.maxTextureDimension2D, this._config.size[0]));
        this._config.size[1] = Math.max(1, Math.min(device.limits.maxTextureDimension2D, this._config.size[1]));
        this._texture = device.createTexture(this._config);
        this._view = this._texture.createView(this.viewDescriptor);
    }

    resize(newWidth, newHeight){
        if(newWidth === this.width && newHeight === this.height){
            return;
        }
        this._texture.destroy();
        this._config.size[0] = newWidth;
        this._config.size[1] = newHeight;
        this.build();
    }

    get view(){
        if(!this._view){
            this._view = this._texture.createView(this.viewDescriptor);
        }
        return this._view;
    }

    get texture(){
        return this._texture;
    }

    set config(value){
        this._config = value;
        this.build();
    }

    get config(){
        return this._config;
    }

    get width(){
        return this._config.size[0];
    }

    get height(){
        return this._config.size[1];
    }

    get size(){
        return { width: this.width, height: this.height };
    }

    setData(data, channels, bytesPerPixel){
        const device = this._engine.device;
        const width = this.width;
        const height = this.height;

        const expectedLength = width * height * channels;
        if (data.length !== expectedLength) {
            console.log(data);
            throw new Error(`Data length (${data.length}) does not match expected size (${expectedLength}) for texture of size ${width}x${height} with ${channels} channels.`);
        }

        // const bytesPerPixel = bytesPerPixel ; // Assuming 1 byte per channel (e.g., Uint8Array)
        const bytesPerRow = width * (bytesPerPixel || channels);

        device.queue.writeTexture(
            { texture: this._texture },
            data,
            { bytesPerRow: bytesPerRow },
            { width: width, height: height, depthOrArrayLayers: 1 }
        );

        this._generateMipmaps && this.generateMipmaps();
    }
    setFromBitmap(bitmap) {
        const device = this._engine.device;
        const width = bitmap.width;
        const height = bitmap.height;

        if(width !== this.width || height !== this.height) {
            console.warn(`Bitmap size (${width}x${height}) does not match texture size (${this.width}x${this.height}). Resizing texture.`);
            this.resize(width, height);
        }

        device.queue.copyExternalImageToTexture({ source: bitmap }, { texture: this._texture }, [width, height]);

        this._generateMipmaps && this.generateMipmaps();
    }

    generateMipmaps() {
        if (!this._generateMipmaps) {
            console.warn("Mipmap generation is disabled for this texture.");
            return;
        }
        const device = this._engine.device;
        const encoder = device.createCommandEncoder();
        MipGenerator.generateMips(this._engine.device, this._texture, encoder);
        device.queue.submit([encoder.finish()]);
    }
}
