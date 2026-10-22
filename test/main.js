/**
 * @import * as glMatrix from 'gl-matrix';
 */



async function main() {
canvas = document.getElementById("renderCanvas");
engine = new WebEngine(canvas);

await engine.setup();

testShader = new Shader(engine.device, "testShader", /* wgsl */ `
  struct VSUniforms {
    worldViewProjection: mat4x4f,
    worldInverseTranspose: mat4x4f,
  };
  @group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

  struct MyVSInput {
      @location(0) position: vec4f,
      @location(1) normal: vec3f,
      @location(2) texcoord: vec2f,
  };

  struct MyVSOutput {
    @builtin(position) position: vec4f,
    @location(0) normal: vec3f,
    @location(1) texcoord: vec2f,
  };

  @vertex
  fn myVSMain(v: MyVSInput) -> MyVSOutput {
    var vsOut: MyVSOutput;
    vsOut.position = vsUniforms.worldViewProjection * v.position;
    vsOut.normal = (vsUniforms.worldInverseTranspose * vec4f(v.normal, 0.0)).xyz;
    vsOut.texcoord = v.texcoord;
    return vsOut;
  }

  struct FSUniforms {
    lightDirection: vec3f,
  };

  @group(0) @binding(1) var<uniform> fsUniforms: FSUniforms;
  @group(0) @binding(2) var diffuseSampler: sampler;
  @group(0) @binding(3) var diffuseTexture: texture_2d<f32>;

  @fragment
  fn myFSMain(v: MyVSOutput) -> @location(0) vec4f {
    var diffuseColor = textureSample(diffuseTexture, diffuseSampler, v.texcoord);
    var a_normal = normalize(v.normal);
    var l = dot(a_normal, fsUniforms.lightDirection) * 0.5 + 0.5;
    return vec4f(diffuseColor.rgb * l, diffuseColor.a);
  }`);

testShader.addUniformRequirement("VSUniforms", 0, Float32Array, 32);
testShader.addUniformRequirement("FSUniforms", 1, Float32Array, 3);
testShader.addTextureRequirement("diffuseTexture", 2);

shaderModule = testShader.module;

tex = new Texture("diffuseTexture", { width: 2, height: 2 }, "rgba8unorm", engine, "nearest", "clamp-to-edge");
texData = new Uint8Array([
    255, 0, 0, 255,   // Red
    0, 255, 0, 255,   // Green
    0, 0, 255, 255,   // Blue
    255, 255, 0, 255  // Yellow
]);
tex.setData(texData, 4);

// const material = new Material(engine, testShader);
// material.setTexture("diffuseTexture", tex);
testPipeline = engine.device.createRenderPipeline({
    label: "testPipeline",
    layout: 'auto',
    vertex: {
      module: shaderModule,
      buffers: [
        // position
        {
          arrayStride: 3 * 4, // 3 floats, 4 bytes each
          attributes: [
            {shaderLocation: 0, offset: 0, format: 'float32x3'},
          ],
        },
        // normals
        {
          arrayStride: 3 * 4, // 3 floats, 4 bytes each
          attributes: [
            {shaderLocation: 1, offset: 0, format: 'float32x3'},
          ],
        },
        // texcoords
        {
          arrayStride: 2 * 4, // 2 floats, 4 bytes each
          attributes: [
            {shaderLocation: 2, offset: 0, format: 'float32x2',},
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      targets: [
        {format: engine.presentationFormat},
      ],
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    }
});

boxMaterial = new Material(engine, testShader, testPipeline);
boxMaterial.setTexture("diffuseTexture", tex);
boxMaterial.build();

box = new Box("box", engine, 1, 1, 1, boxMaterial);

engine.addMesh(box);


function render() {
    const time = performance.now() / 1000;
    const projection = glMatrix.mat4.create();
    glMatrix.mat4.perspectiveZO(projection, 30 * Math.PI / 180, canvas.clientWidth / canvas.clientHeight, 0.1, 10);
    const eye = glMatrix.vec3.fromValues(1,4,-6);
    const target = glMatrix.vec3.fromValues(0, 0, 0);
    const up = glMatrix.vec3.fromValues(0, 1, 0);

    const view = glMatrix.mat4.create();
    const viewProjection = glMatrix.mat4.create();
    const world = glMatrix.mat4.create();
    const worldInverse = glMatrix.mat4.create();
    const worldInverseTranspose = glMatrix.mat4.create();
    const worldViewProjection = glMatrix.mat4.create();
    const lightDirection = glMatrix.vec3.fromValues(1, 8, -10);

    glMatrix.mat4.lookAt(view, eye, target, up);
    glMatrix.mat4.multiply(viewProjection, projection, view);
    // glMatrix.mat4.fromYRotation(world, time);

    const r = glMatrix.mat4.create();
    glMatrix.mat4.fromYRotation(r, time);
    const t = glMatrix.mat4.create();
    glMatrix.mat4.fromTranslation(t, [0, 0, Math.sin(time) * 1]);

    glMatrix.mat4.multiply(world, world, t);
    glMatrix.mat4.multiply(world, world, r);

    glMatrix.mat4.invert(worldInverse, world);
    glMatrix.mat4.transpose(worldInverseTranspose, worldInverse);
    
    glMatrix.mat4.multiply(worldViewProjection, viewProjection, world);

    glMatrix.vec3.normalize(lightDirection, lightDirection);

    const vsUniforms = new Float32Array(32);
    vsUniforms.set(worldViewProjection, 0);
    vsUniforms.set(worldInverseTranspose, 16);

    const fsUniforms = new Float32Array(3);
    fsUniforms.set(lightDirection, 0);

    boxMaterial.setUniform("VSUniforms", vsUniforms);
    boxMaterial.setUniform("FSUniforms", fsUniforms);


    engine.render();
    requestAnimationFrame(render);
}

requestAnimationFrame(render);
}

main().catch((error) => {
  console.error(error);
});


