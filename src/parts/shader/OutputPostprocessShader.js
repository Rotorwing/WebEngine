const outputPostprocessShader = new PostprocessShader("outputPostprocessShader",
/* glsl */ `

struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(1) uv : vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> VertexOutput {
    // vi = 0,1,2  ->  uv = (0,0), (2,0), (0,2)
    let uv = vec2f(f32((vi << 1u) & 2u), f32(vi & 2u));

    var out: VertexOutput;
    out.position = vec4f(uv * 2.0 - 1.0, 0.0, 1.0);
    out.uv = vec2f(uv.x, 1.0 - uv.y); // flip Y so uv (0,0) is top-left, matching texture space
    return out;
}

/* FRAGMENT */

// @group(0) @binding(0) var renderSampler: sampler;
@group(0) @binding(0) var renderTexture: texture_2d<f32>;

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    let size = vec2f(textureDimensions(renderTexture));
    let color = textureLoad(renderTexture, vec2i(input.uv * size), 0);

    let finalColor = color;

    return finalColor;
}
`);

// deferredCompositeShader.addUniformRequirement("GlobalUniforms", 0, Float32Array, 16);
// deferredCompositeShader.addUniformRequirement("uniformData", 1, Float32Array, 256 * 4); // 256 vec4s

outputPostprocessShader.addTextureRequirement("renderResult", 0, true);


outputPostprocessShader.pipelineSettings.fragment.targets = [
    {format: "bgra8unorm"}, // Need to get this from engine
];
outputPostprocessShader.pipelineSettings.depthStencil = undefined;

outputPostprocessShader.onBuildPipeline = (shader, engine)=>{
    const device = engine.device;

    shader.localBindGroupLayout = device.createBindGroupLayout({ // @group(0)
        label: "Local Bind Group Layout",
        entries: [
            {
                binding: 0, // renderResult
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: "float", viewDimension: "2d", multisampled: false }
            },
        ]
    });

    shader.pipelineSettings.layout = device.createPipelineLayout({
        label: "Composite Pipeline Layout",
        bindGroupLayouts: [
            shader.localBindGroupLayout          // @group(0)
        ]
    });


}

ShaderStore.addShader(outputPostprocessShader);
