const deferredShader = new Shader("deferredShader",
/* glsl */ `
struct GlobalUniforms {
    viewProj: mat4x4f,
    // viewProjInv: mat4x4f,
};

// struct VertexUniforms {
//     viewProj: mat4x4f,
//     // viewProjInv: mat4x4f,
// };


@group(0) @binding(0) var<uniform> globalUniforms: GlobalUniforms;
@group(0) @binding(1) var<storage, read> uniformData: array<vec4<f32>>;
// @group(1) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VertexInput {
    @location(0) position: vec4f,
    @location(1) normal: vec3f,
    @location(2) texcoord: vec2f,
    @builtin(instance_index) offset: u32
};
struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) normal: vec3f,
    @location(1) UV : vec2<f32>,
};


@vertex
fn vs_main(input: VertexInput) -> VertexOutput {

    // var offset : u32 = 16u; // This will be set based on the instance index to get rid of 256 blocks
    var offset : u32 = input.offset; // Each instance has 6 vec4s (24 floats) of uniform data
    // Manually reconstruct the matrix from 4 vec4s starting at the offset
    let world = mat4x4<f32>(
        uniformData[offset + 0],
        uniformData[offset + 1],
        uniformData[offset + 2],
        uniformData[offset + 3],
        // vec4<f32>(0., 0., 0., 1.0)
    );

    let worldNormal = mat3x3<f32>(
        uniformData[offset + 4].xyz,
        uniformData[offset + 5].xyz,
        uniformData[offset + 6].xyz,
    );
    
    // Get more uniform data if needed, for example, a color
    // let extraColor = uniformData[offset + 4]; 
    
    var output: VertexOutput;
    output.position = globalUniforms.viewProj * world * input.position;
    output.normal = worldNormal * input.normal;
    output.UV = input.texcoord;

    output.position = globalUniforms.viewProj * world* input.position;

    return output;
}

/* FRAGMENT */

struct FragmentUniforms {
    lightDirection: vec3f,
};

struct FragmentOutput {
    @location(0) deferredTarget0: vec4f,
    @location(1) deferredTarget1: vec4f,
    @location(2) deferredTarget2: vec4f,
};

@group(1) @binding(0) var<uniform> fragmentUniforms: FragmentUniforms;
@group(1) @binding(1) var diffuseSampler: sampler;
@group(1) @binding(2) var diffuseTexture: texture_2d<f32>;

@fragment
fn fs_main(input: VertexOutput) -> FragmentOutput {
    var diffuseColor = textureSample(diffuseTexture, diffuseSampler, input.UV);
    var a_normal = normalize(input.normal);
    var l = dot(a_normal, fragmentUniforms.lightDirection) * 0.5 + 0.5;

    return FragmentOutput(
        vec4f(diffuseColor.rgb * l, diffuseColor.a),
        vec4f(a_normal, 1.0),
        vec4f(0.0)
    );
}
`);

// deferredShader.addUniformRequirement("GlobalUniforms", 0, Float32Array, 16);
// deferredShader.addUniformRequirement("uniformData", 1, Float32Array, 256 * 4); // 256 vec4s

deferredShader.addUniformRequirement("FragmentUniforms", 0, Float32Array, 3);
deferredShader.addTextureRequirement("diffuseTexture", 1);

deferredShader.pipelineSettings.fragment.targets = [
    {format: "rgba8unorm"},
    {format: "rgba16float"},
    {format: "rgba8unorm"},
]

deferredShader.onBuildPipeline = (shader, engine)=>{
    const device = engine.device;

    shader.localBindGroupLayout = device.createBindGroupLayout({ // @group(1)
        label: "Local Bind Group Layout",
        entries: [
            {
                binding: 0, // fragmentUniforms
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: "uniform" }
            },
            {
                binding: 1, // diffuseSampler
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { type: "filtering" }
            },
            {
                binding: 2, // diffuseTexture
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: "float", viewDimension: "2d", multisampled: false }
            }
        ]
    });

    console.log('layout', shader.pipelineSettings.layout);

    shader.pipelineSettings.layout = device.createPipelineLayout({
        label: "Deferred Pipeline Layout",
        bindGroupLayouts: [
            WebEngine.globalBindGroupLayout,     // @group(0)
            shader.localBindGroupLayout          // @group(1)
        ]
    });


    console.log('layout', shader.pipelineSettings.layout);

}

ShaderStore.addShader("deferredShader", deferredShader);    