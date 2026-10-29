const volumeMaskShader = new PostprocessShader("volumeMaskShader",
/* glsl */ `
struct GlobalUniforms {
    viewProj: mat4x4f,
    viewProjInv: mat4x4f,
};

@group(0) @binding(0) var<uniform> globalUniforms: GlobalUniforms;
@group(0) @binding(1) var<storage, read> uniformData: array<vec4<f32>>;
// @group(1) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VertexInput {
    @location(0) position: vec3f,
    @builtin(instance_index) offset: u32
};
struct VertexOutput {
    @builtin(position) position : vec4<f32>,
};


@vertex
fn vs_main(input: VertexInput) -> VertexOutput {

    var offset : u32 = input.offset;
    let world = mat4x4<f32>(
        uniformData[offset + 0],
        uniformData[offset + 1],
        uniformData[offset + 2],
        uniformData[offset + 3],
        // vec4<f32>(0., 0., 0., 1.0)
    );
    
    var output: VertexOutput;
    output.position = globalUniforms.viewProj * world * vec4f(input.position, 1.0);
    // output.position = globalUniforms.viewProj * (vec4f(input.position, 1.0) + uniformData[offset + 3]);

    return output;
}
`);

volumeMaskShader.pipelineSettings.vertex.buffers = [
    // position
    {
        arrayStride: 3 * 4, // 3 floats, 4 bytes each
        attributes: [
            {shaderLocation: 0, offset: 0, format: 'float32x3'},
        ],
    },
];
volumeMaskShader.pipelineSettings.primitive = {
    topology: 'triangle-list',
    cullMode: 'none',
};
volumeMaskShader.pipelineSettings.depthStencil = {
    depthWriteEnabled: false,
    depthCompare: 'greater-equal',
    format: 'depth24plus-stencil8',

    stencilFront: {
      compare: 'always',
      failOp: 'keep',
      depthFailOp: 'keep', // depth test fails aka volume extends past mesh
      passOp: 'increment-wrap',
    },
    stencilBack: {
      compare: 'always',
      failOp: 'keep',
      depthFailOp: 'keep', // depth test fails aka volume extends past mesh
      passOp: 'decrement-wrap',
    },
};
if(volumeMaskShader.pipelineSettings.fragment){
    delete volumeMaskShader.pipelineSettings.fragment;
}

volumeMaskShader.onBuildPipeline = (shader, engine)=>{
    const device = engine.device;

    shader.pipelineSettings.layout = device.createPipelineLayout({
        label: "Volume Mask Pipeline Layout",
        bindGroupLayouts: [
            WebEngine.globalBindGroupLayout,     // @group(0)
        ]
    });
}

ShaderStore.addShader(volumeMaskShader);