class StandardDeferredMaterial extends Material {
    constructor(name, engine) {
        super(name, engine, ShaderStore.getShader('deferredShader'));

        this._diffuseColor = [1.0, 1.0, 1.0];
        this._roughnessFactor = 1.0;
        this._metalnessFactor = 0.0;
        this._emissiveColor = [0.0, 0.0, 0.0];
        this._ambientOcclusionFactor = 1.0;

        this.setDiffuseTexture(PlaceholderTextures.whiteTexture);
        this.setRoughnessTexture(PlaceholderTextures.grayTexture);
        this.setNormalTexture(PlaceholderTextures.normalTexture);

    //     this.setAmbientOcclusionTexture(PlaceholderTextures.whiteTexture);
    //     this.setEmissiveTexture(PlaceholderTextures.blackTexture);
    }

    setDiffuseColor(color) {
        this._diffuseColor = color;
    }

    setRoughnessFactor(value) {
        this._roughnessFactor = value;
    }

    setMetalnessFactor(value) {
        this._metalnessFactor = value;
    }

    setEmissiveColor(color) {
        this._emissiveColor = color;
    }

    setAmbientOcclusionFactor(value) {
        this._ambientOcclusionFactor = value;
    }

    // setNormalScale(value) {
    //     this._uniforms['fragmentUniforms'].data.normalScale = value;
    // }

    setDiffuseTexture(texture) {
        this._textures['diffuseTexture'].texture = texture;
    }

    setRoughnessTexture(texture) {
        this._textures['roughnessTexture'].texture = texture;
    }

    // setMetalnessTexture(texture) {
    //     this._textures['metalnessTexture'].texture = texture;
    // }

    setNormalTexture(texture) {
        this._textures['normalTexture'].texture = texture;
    }

    setAmbientOcclusionTexture(texture) {
        this._textures['ambientOcclusionTexture'].texture = texture;
    }

    setEmissiveTexture(texture) {
        this._textures['emissiveTexture'].texture = texture;
    }

    updateUniforms() {
        this._uniforms['fragmentUniforms'].data.set(this._diffuseColor, 0);
        this._uniforms['fragmentUniforms'].data[3] = this._roughnessFactor;
        this._uniforms['fragmentUniforms'].data[4] = this._metalnessFactor;
        // this._uniforms['fragmentUniforms'].data.set(this._emissiveColor, 5);
        // this._uniforms['fragmentUniforms'].data[8] = this._ambientOcclusionFactor;

        super.updateUniforms();
    }
}