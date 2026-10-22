class PlaceholderTextures {
    static normalTexture = null;
    static whiteTexture = null;
    static blackTexture = null;
    static grayTexture = null;

    static buildTexture(name, color, engine) {
        const tex = new Texture(name, { width: 1, height: 1 }, "rgba8unorm", engine, "nearest", "clamp-to-edge");
        const texData = new Uint8Array([
            color[0], color[1], color[2], color[3]
        ]);
        tex.setData(texData, 4);
        return tex;
    }

    static buildPlaceholderTextures(engine) {
        if (!PlaceholderTextures.normalTexture) {
            PlaceholderTextures.normalTexture = PlaceholderTextures.buildTexture("normalTexture", [128, 128, 255, 255], engine);
        }
        if (!PlaceholderTextures.whiteTexture) {
            PlaceholderTextures.whiteTexture = PlaceholderTextures.buildTexture("whiteTexture", [255, 255, 255, 255], engine);
        }
        if (!PlaceholderTextures.blackTexture) {
            PlaceholderTextures.blackTexture = PlaceholderTextures.buildTexture("blackTexture", [0, 0, 0, 255], engine);
        }
        if (!PlaceholderTextures.grayTexture) {
            PlaceholderTextures.grayTexture = PlaceholderTextures.buildTexture("grayTexture", [128, 128, 128, 255], engine);
        }
    }
}