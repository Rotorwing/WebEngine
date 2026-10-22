const deferredShader = new Shader("deferredShader",
/* glsl */ `
struct GlobalUniforms {
    viewProj: mat4x4f,
    viewProjInv: mat4x4f,
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

@group(1) @binding(3) var normalSampler: sampler;
@group(1) @binding(4) var normalTexture: texture_2d<f32>;

@group(1) @binding(5) var roughnessSampler: sampler;
@group(1) @binding(6) var roughnessTexture: texture_2d<f32>;

fn cotangent_frame(normal: vec3f, position: vec3f, uv: vec2f, tangentSpaceParams: vec2f) -> mat3x3f {
    // Compute the partial derivatives of the position and UV coordinates
    let dp1 = dpdx(position);
    let dp2 = dpdy(position);
    let duv1 = dpdx(uv);
    let duv2 = dpdy(uv);
    let dp2perp = cross(dp2, normal);
    let dp1perp = cross(normal, dp1);
    var tangent = dp2perp * duv1.x + dp1perp * duv2.x;
    var bitangent = dp2perp * duv1.y + dp1perp * duv2.y;
    tangent *= tangentSpaceParams.x;
    bitangent *= tangentSpaceParams.y;
    let det = max(dot(tangent, tangent), dot(bitangent, bitangent));
    let invMax = select(inverseSqrt(det), 0.0, det == 0.0);
    return mat3x3f(tangent * invMax, bitangent * invMax, normal);
}

fn perturbNormalBase(TBN: mat3x3f, normal: vec3f, scale: f32) -> vec3f {
    let _normal = normalize(normal * vec3f(scale, scale, 1.0));
    return normalize(TBN * _normal);
}

@fragment
fn fs_main(input: VertexOutput) -> FragmentOutput {
    let diffuseColor = textureSample(diffuseTexture, diffuseSampler, input.UV);
    let normalColor = textureSample(normalTexture, normalSampler, input.UV);
    let roughnessColor = textureSample(roughnessTexture, roughnessSampler, input.UV);

    let diffuseValue = diffuseColor.rgb;
    let normalValue = normalColor.rgb * 2.0 - 1.0;
    let roughnessValue = roughnessColor.r;
    let metalnessValue = roughnessColor.g;

    var normalW = input.normal;
    var positionW = input.position.xyz;

    var TBNUV : vec2f = input.UV;
    var TBN = cotangent_frame(normalW, positionW, TBNUV, vec2f(-1.0, 1.0));
    
    let normalStrength = 1.0; // Adjust this value to control the strength of the normal mapping
    let blendedNormal = normalValue;
    normalW = perturbNormalBase(TBN, blendedNormal, normalStrength);

    var l = dot(normalW, fragmentUniforms.lightDirection) * 0.5 + 0.5;

    var litDiffuse = diffuseValue * l;

    return FragmentOutput(
        vec4f(litDiffuse, roughnessValue),
        vec4f(normalW, 1.0),
        vec4f(0.0, metalnessValue, 0.0, 1.0)
    );
}
`);

// deferredShader.addUniformRequirement("GlobalUniforms", 0, Float32Array, 16);
// deferredShader.addUniformRequirement("uniformData", 1, Float32Array, 256 * 4); // 256 vec4s

deferredShader.addUniformRequirement("fragmentUniforms", 0, Float32Array, 3);
deferredShader.addTextureRequirement("diffuseTexture", 1);
deferredShader.addTextureRequirement("normalTexture", 3);
deferredShader.addTextureRequirement("roughnessTexture", 5);
// deferredShader.addTextureRequirement("occlusionTexture", 7);
// deferredShader.addTextureRequirement("emissiveTexture", 9);

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
            },
            {
                binding: 3, // normalSampler
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { type: "filtering" }
            },
            {
                binding: 4, // normalTexture
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: "float", viewDimension: "2d", multisampled: false }
            },
            {
                binding: 5, // roughnessSampler
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { type: "filtering" }
            },
            {
                binding: 6, // roughnessTexture
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