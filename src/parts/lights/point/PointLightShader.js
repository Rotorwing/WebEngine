const pointLightShader = new PostprocessShader("pointLightShader",
/* glsl */ `

struct GlobalUniforms {
    viewProj: mat4x4f,
    viewProjInv: mat4x4f,
};

struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(1) uv : vec2<f32>,
    @location(2) @interpolate(flat) offset : u32,
};

@vertex
fn vs_main(@builtin(vertex_index) vi: u32, @builtin(instance_index) offset: u32) -> VertexOutput {
    // vi = 0,1,2  ->  uv = (0,0), (2,0), (0,2)
    let uv = vec2f(f32((vi << 1u) & 2u), f32(vi & 2u));

    var out: VertexOutput;
    out.position = vec4f(uv * 2.0 - 1.0, 0.0, 1.0);
    out.uv = vec2f(uv.x, 1.0 - uv.y); // flip Y so uv (0,0) is top-left, matching texture space
    out.offset = offset;
    return out;
}

/* FRAGMENT */

// struct FragmentOutput {
//     @location(0) renderOutput: vec4f,
// };
struct FragmentUniforms {
    lightDirection: vec3f,
};

@group(0) @binding(0) var<uniform> globalUniforms: GlobalUniforms;
@group(0) @binding(1) var<storage, read> uniformData: array<vec4<f32>>;

@group(1) @binding(0) var<uniform> fragmentUniforms: FragmentUniforms;

@group(1) @binding(1) var deferred0Sampler: sampler;
@group(1) @binding(2) var deferred0Texture: texture_2d<f32>;

@group(1) @binding(3) var deferred1Sampler: sampler;
@group(1) @binding(4) var deferred1Texture: texture_2d<f32>;

@group(1) @binding(5) var deferred2Sampler: sampler;
@group(1) @binding(6) var deferred2Texture: texture_2d<f32>;

@group(1) @binding(7) var deferredTargetD: texture_depth_2d;

// fn worldPosFromDepth(coord: vec2i, depth: f32) -> vec3f {
//   let size = vec2f(textureDimensions(deferredTargetD));
//   let uv = (vec2f(coord) + 0.5) / size;
//   // WebGPU NDC: x,y in [-1,1] with +Y up, z in [0,1]. Pixel Y runs down, so flip it.
//   let ndc = vec3f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth);
//   let p = globalUniforms.viewProjInv * vec4f(ndc, 1.0);
//   return p.xyz / p.w;
// }

fn worldPosFromDepth(uv: vec2f, depth: f32) -> vec3f {
  let ndc = vec3f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth);
  let p = globalUniforms.viewProjInv * vec4f(ndc, 1.0);
  return p.xyz / p.w;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    // let coord = vec2i(input.uv.xy);
    
    let deferred0Color = textureSample(deferred0Texture, deferred0Sampler, input.uv);
    let deferred1Color = textureSample(deferred1Texture, deferred1Sampler, input.uv);
    let deferred2Color = textureSample(deferred2Texture, deferred2Sampler, input.uv);
    let size = vec2f(textureDimensions(deferredTargetD));
    let depth = textureLoad(deferredTargetD, vec2i(input.uv * size), 0);

    let lightPositionW = uniformData[input.offset + 0];
    let lightColor = uniformData[input.offset + 1].xyz;
    let lightIntensity = uniformData[input.offset + 1].w;

    let positionW = worldPosFromDepth(input.uv, depth);

    let diffuseColor = deferred0Color.rgb;
    let normalColor = deferred1Color.rgb;

    let toLight = lightPositionW.xyz - positionW;
    let lightDistance = length(toLight);
    let lightDir = normalize(toLight);

    let intensity = lightIntensity / (lightDistance * lightDistance);

    var a_normal = normalize(normalColor * 2.0 - 1.0);
    var l = max(dot(a_normal, lightDir) * 0.5 + 0.8, 0.0);

    let lighting = lightColor * intensity * l;

    var finalColor = vec4f(diffuseColor * lighting, 1.0);
    
    // return vec4f(deferred0Color.rgb, 1.0);
    // return mix(vec4f(deferred0Color.rgb, 1.0), vec4f(deferred1Color.rgb, 1.0), step(0.1, input.uv.x));
    // return vec4f(vec3f(positionW), 1.0);
    return finalColor;
}
`);

// deferredCompositeShader.addUniformRequirement("GlobalUniforms", 0, Float32Array, 16);
// deferredCompositeShader.addUniformRequirement("uniformData", 1, Float32Array, 256 * 4); // 256 vec4s

pointLightShader.addUniformRequirement("FragmentUniforms", 0, Float32Array, 3);

pointLightShader.addTextureRequirement("deferredTarget0", 1);
pointLightShader.addTextureRequirement("deferredTarget1", 3);
pointLightShader.addTextureRequirement("deferredTarget2", 5);

pointLightShader.addTextureRequirement("deferredTargetD", 7, true); // depth texture doesn't need a sampler



pointLightShader.pipelineSettings.fragment.targets = [
    {
        format: "rgba16float",
        blend: {
            color: { srcFactor: "one", dstFactor: "one", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one", operation: "add" },
        },
    },
]

pointLightShader.onBuildPipeline = (shader, engine)=>{
    const device = engine.device;

    shader.localBindGroupLayout = device.createBindGroupLayout({ // @group(0)
        label: "Local Bind Group Layout",
        entries: [
            {
                binding: 0, // fragmentUniforms
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: "uniform" }
            },
            {
                binding: 1, // deferredTarget0
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { type: "filtering" }
            },
            {
                binding: 2, // deferredTarget0
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: "float", viewDimension: "2d", multisampled: false }
            },
            {
                binding: 3, // deferredTarget1
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { type: "filtering" }
            },
            {
                binding: 4, // deferredTarget1
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: "float", viewDimension: "2d", multisampled: false }
            },
            {
                binding: 5, // deferredTarget2
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { type: "filtering" }
            },
            {
                binding: 6, // deferredTarget2
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: "float", viewDimension: "2d", multisampled: false }
            },
            {
                binding: 7, // depthTexture
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: "depth", viewDimension: "2d", multisampled: false }
            },
        ]
    });

    console.log('layout', shader.pipelineSettings.layout);

    shader.pipelineSettings.layout = device.createPipelineLayout({
        label: "Composite Pipeline Layout",
        bindGroupLayouts: [
            WebEngine.globalBindGroupLayout,     // @group(0)
            shader.localBindGroupLayout          // @group(1)
        ]
    });


    console.log('layout', shader.pipelineSettings.layout);

}

ShaderStore.addShader("pointLightShader", pointLightShader);
