/**
 * @import * as glMatrix from 'gl-matrix';
 */



async function main() {
canvas = document.getElementById("renderCanvas");
engine = new WebEngine(canvas);
engine.camera = new OrbitCamera("orbitCamera", glMatrix.vec3.fromValues(0, 0, 0), 4, engine);
engine.camera.bindMouseEvents(canvas);

await engine.setup();

const glbNodes = await GLBLoader.loadBase64Async(window.demoMeshv2Glb, engine);
for (const node of glbNodes) {
    engine.addMesh(node);
}

engine.camera.position = glMatrix.vec3.fromValues(1, 4, 5);
engine.camera.lookAt(glMatrix.vec3.fromValues(0, 0, 0));


tex = new Texture("diffuseTexture", { width: 2, height: 2 }, "rgba8unorm", engine, "nearest", "clamp-to-edge");
texData = new Uint8Array([
    255, 0, 0, 255,   // Red
    0, 255, 0, 255,   // Green
    0, 0, 255, 255,   // Blue
    255, 255, 0, 255  // Yellow
]);
tex.setData(texData, 4);

boxMaterial = new StandardDeferredMaterial("boxMaterial", engine);
boxMaterial.setDiffuseTexture(tex);
boxMaterial.build();

box = new Box("box", engine, 1, 1, 1, boxMaterial);
// box.position = glMatrix.vec3.fromValues(-0.5, 0, -0.1);
box2 = new Box("box2", engine, 1, 1, 1, boxMaterial);
engine.addMesh(box);

// sphere = new Icosphere("sphere", engine, 1, 3, boxMaterial);
// sphere.position = glMatrix.vec3.fromValues(0.5, 1, 0.1);
// engine.addMesh(sphere);


for (let i = 0; i < 10; i++) {
  let box2 = new Mesh("box2", engine, box.meshData, boxMaterial);
  box2.position = glMatrix.vec3.fromValues(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3);
  box2.rotation = glMatrix.quat.fromEuler(glMatrix.quat.create(), Math.random() * 360, Math.random() * 360, Math.random() * 360);
  box2.scale = glMatrix.vec3.fromValues(Math.random() + 0.4, Math.random() + 0.4, Math.random() + 0.4);
  // box2.dirtyTransform();
  engine.addMesh(box2);
}

light = new PointLight("pointLight1", engine, {intensity: 5.5, color: [1.0, 1.0, 1.0], range: 3.75});
light.setup();
light.position = glMatrix.vec3.fromValues(0.5, 0.5, 0.5);
engine.addLight(light);

// light2 = new PointLight("pointLight2", engine, {intensity: 0.5, color: [1.0, 0.0, 1.0], range: 6.75});
// light2.setup();
// light2.position = glMatrix.vec3.fromValues(-0.5, 0.5, 0.5);
// engine.addLight(light2);

// light3 = new PointLight("pointLight3", engine, {intensity: 0.5, color: [0.0, 1.0, 1.0], range: 6.75});
// light3.setup();
// light3.position = glMatrix.vec3.fromValues(-0.5, -0.5, -0.5);
// engine.addLight(light3);

colored = [];
for (let i = 0; i < 5; i++) {
  let light2 = new PointLight("pointLight2", engine, {intensity: 0.5, color: [Math.random(), Math.random(), Math.random()], range: 3.0});
  light2.position = glMatrix.vec3.fromValues(1.5, 0, 1.0);
  light2.setup();
  engine.addLight(light2);
  colored.push(light2);
}

debugPanel = new DebugPanel(document.body);
performanceSection = debugPanel.addSection(new DebugSection("Performance"));
performanceSection.addItem(new DebugNumber("FPS", () => engine.getFPS().toFixed(2)));

memorySection = debugPanel.addSection(new DebugSection("Memory"));
memorySection.addItem(engine.debugMemoryBuffers.positions);
memorySection.addItem(engine.debugMemoryBuffers.normals);
memorySection.addItem(engine.debugMemoryBuffers.uvs);
memorySection.addItem(engine.debugMemoryBuffers.indices);
memorySection.addItem(engine.debugMemoryBuffers.uniforms);

function render() {
    const time = performance.now() / 1000;

    light.position = glMatrix.vec3.fromValues(Math.sin(time*0.7) * 3, Math.cos(time*1.3) * 3, Math.cos(time) * 3);

    for (let i = 0; i < colored.length; i++) {
        const light2 = colored[i];
        light2.position = glMatrix.vec3.fromValues(Math.sin(time*0.7 + i) * 3, Math.cos(time*1.3 + i) * 3, Math.cos(time + i) * 3);
    }
    

    // boxMaterial.setUniform("VSUniforms", vsUniforms);
    // boxMaterial.setUniform("FSUniforms", fsUniforms);


    engine.render();
    requestAnimationFrame(render);
}

requestAnimationFrame(render);
}

main().catch((error) => {
  console.error(error);
});


/*
'0.35180899500846863,-2.8443274402434326e-9,-0.9360717535018921,0,
-0.24061265587806702,-0.9663993120193481,-0.09043075889348984,0,
-0.9046192169189453,0.25704509019851685,-0.3399879038333893,0,
5,0,0,1'
*/