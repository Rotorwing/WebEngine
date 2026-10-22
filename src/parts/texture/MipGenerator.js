class MipGenerator {
    static mipPipelines = new Map(); // cache per format
    static mipSampler;
    static shader = `
struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VSOut {
  let uv = vec2f(f32((vi << 1u) & 2u), f32(vi & 2u));
  var out: VSOut;
  out.position = vec4f(uv * 2.0 - 1.0, 0.0, 1.0);
  out.uv = vec2f(uv.x, 1.0 - uv.y);
  return out;
}

@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
  return textureSample(src, samp, in.uv);
}`;

    static getPipeline(device, format) {
        let p = MipGenerator.mipPipelines.get(format);
        if (!p) {
            const module = device.createShaderModule({ code: MipGenerator.shader });
            p = device.createRenderPipeline({
                layout: "auto",
                vertex: { module, entryPoint: "vs" },
                fragment: { module, entryPoint: "fs", targets: [{ format }] },
            });
            MipGenerator.mipPipelines.set(format, p);
        }
        return p;
    }

    static generateMips(device, texture, encoder) {
        MipGenerator.mipSampler ??= device.createSampler({ minFilter: "linear", magFilter: "linear" });
        const pipeline = MipGenerator.getPipeline(device, texture.format);
        const layers = texture.depthOrArrayLayers; // 1 for plain 2D

        for (let layer = 0; layer < layers; layer++) {
            for (let level = 1; level < texture.mipLevelCount; level++) {
            const srcView = texture.createView({
                dimension: "2d",
                baseMipLevel: level - 1, mipLevelCount: 1,
                baseArrayLayer: layer, arrayLayerCount: 1,
            });
            const dstView = texture.createView({
                dimension: "2d",
                baseMipLevel: level, mipLevelCount: 1,
                baseArrayLayer: layer, arrayLayerCount: 1,
            });
            const bindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                { binding: 0, resource: srcView },
                { binding: 1, resource: MipGenerator.mipSampler },
                ],
            });
            const pass = encoder.beginRenderPass({
                colorAttachments: [{ view: dstView, loadOp: "clear", storeOp: "store" }],
            });
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.draw(3);
            pass.end();
            }
        }
    }

}