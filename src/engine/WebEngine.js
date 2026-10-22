class WebEngine {

    static globalBindGroupLayout = null;

    constructor (canvas){
        this._canvas = canvas;
        this._adapter = undefined;
        this._device = undefined;
        this._context = undefined;

        // this._initWebGPU();
        // this._setupCanvas();

        this._camera = new Camera();

        this.pipelines = {};
        this.meshes = [];
        this.meshData = [];

        this.vertexBufferSize = 20*1024; // 20KB  // 1024 * 1024; // 1MB
        this.objectDataStorageBufferSize = 20*1024; // 20KB  // 1024 * 1024; // 1MB
        this.objectDataStorageBufferBlockSize = 24; // must be multiple of 4

        this.buffersGPU = {};
        this.buffersPackers = {};
        this.debugMemoryBuffers = {};
        this.globalUniformBuffer = null;
        this.globalUniformBufferSize = 32 * Float32Array.BYTES_PER_ELEMENT; // 32 floats for global uniforms
        // this._setupBuffers();

        this.deferredRenderTargets = [];
        this.deferredRenderTargetDescriptors = [
            {name:'diffuse', targetIndex: 0, channels: 'rgb' },
            {name:'roughness', targetIndex: 0, channels: 'a' },

            {name:'normal', targetIndex: 1, channels: 'rg' },
            {name:'displacement', targetIndex: 1, channels: 'ba' },

            {name:'emissive', targetIndex: 2, channels: 'r' },
            {name:'metallic', targetIndex: 2, channels: 'g' },
            {name:'specular', targetIndex: 2, channels: 'b' },
            {name:'depth', targetIndex: 3, channels: 'r' },
        ];
        // this.outputDepthTargetView = null; //this.outputDepthTarget.texture.createView();

        // this.objectDataStorageBuffer = null;
        // this.objectDataStorageBufferPacker = new MemoryAutopacker(this.objectDataStorageBufferSize);
        // this.objectDataStorageBufferBlockSize = 256;

        this.deferredRenderDescriptor = {
            colorAttachments: [
            { // deferredTarget0
                view: undefined,
                clearValue: [1.0, 1.0, 1.0, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
            { // deferredTarget1
                view: undefined,
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
            { // deferredTarget2
                view: undefined,
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
            ],
            depthStencilAttachment: {
                view: undefined,
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        };

        this.globalBindGroup = null;

        this.lights = [];

        this.postprocesses = [new OutputPostprocess("output",this, ShaderStore.shaders['outputPostprocessShader'])];//new DeferredCompositePostprocess("deferredComposite",this, ShaderStore.shaders['deferredCompositeShader'])];

        this._lastDrawTime = performance.now();
        this._frameTimes = [];
        this._fps = 0;

        this.resizeFreeze = false;
        this.resizeTimeout = null;
    }


    async setup(){
        await this._initWebGPU();
        this._setupCanvas();
        this._setupBuffers();

        this._canvas.width = this._canvas.clientWidth;
        this._canvas.height = this._canvas.clientHeight;

        this._setupRenderTargets();

        this._setupGlobalBindGroup();

        // this.outputDepthTargetView = this.outputDepthTarget.texture.createView();
        ShaderStore.loadAllShaders(this);
        PlaceholderTextures.buildPlaceholderTextures(this);

        this._setupLights();
        this._setupPostprocesses();


        // for(const postprocess of this.postprocesses){
        //     console.log('postprocess', postprocess.name, postprocess);
        //     postprocess.build(); // Hacky fix, need to rework setup so stuff work in the right order.
        // }
    }

    _enlargeObjectDataStorageBuffer(){
        const newSize = this.objectDataStorageBufferSize * 2;
        const newBuffer = this._device.createBuffer({
            label: `Global Object Storage Buffer`,
            size: Math.max(128, newSize),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        // Copy data from the old buffer to the new buffer
        const commandEncoder = this._device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(this.objectDataStorageBuffer, 0, newBuffer, 0, this.objectDataStorageBufferSize);
        this._device.queue.submit([commandEncoder.finish()]);

        // Update the reference to the new buffer and its size
        this.objectDataStorageBuffer.destroy();
        this.objectDataStorageBuffer = newBuffer;
        this.objectDataStorageBufferSize = newSize;

        // expand packer with the new size
        this.objectDataStorageBufferPacker.expand(newSize);
    }


    async _initWebGPU(){
        this._adapter = await navigator.gpu?.requestAdapter();
        this._device = await this._adapter?.requestDevice();
        if (!this._device) {
            throw new Error('Browser does not support WebGPU');
            return;
        }
        this._presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    }

    _setupCanvas(){
        this._context = this._canvas.getContext('webgpu');
        this._context.configure({
            device: this._device,
            format: this._presentationFormat,
        });

        this.camera.updateAspectRatio(this._canvas.clientWidth, this._canvas.clientHeight);

        window.addEventListener('resize', () => this._onCanvasResize());
    }

    _onCanvasResize(){
        if(this.resizeTimeout !== null){
            window.clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = window.setTimeout((() => {
            this._canvas.width = this._canvas.clientWidth;
            this._canvas.height = this._canvas.clientHeight;

            for(const renderTarget of this.deferredRenderTargets){
                renderTarget.resize(this._canvas.width, this._canvas.height);
            }

            this._updateRenderTargetViews();

            this.camera.updateAspectRatio(this._canvas.clientWidth, this._canvas.clientHeight);

            for(let postprocess of this.postprocesses){
                postprocess.onResize(this);
            }
            for(let light of this.lights){
                light.postprocess.onResize(this);
            }
            window.clearTimeout(this.resizeTimeout);
            window.setTimeout((() => { this.resizeFreeze = false; }).bind(this), 10);
        }).bind(this), 200);
        

        this.resizeFreeze = true;
    }

    _setupBuffers(){
        this._addBuffer('positions', this.vertexBufferSize, Float32Array, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
        this._addBuffer('normals', this.vertexBufferSize, Float32Array, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
        this._addBuffer('uvs', this.vertexBufferSize, Float32Array, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
        this._addBuffer('indices', this.vertexBufferSize, Uint16Array, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST);
        this._addBuffer('uniforms', this.objectDataStorageBufferSize, Float32Array, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);

        // this.objectDataStorageBufferBlockSize = Math.max(64, this._device.limits.minStorageBufferOffsetAlignment);
    
        this.globalUniformBuffer = this._device.createBuffer({
            label: `Global Uniform Buffer`,
            size: Math.max(128, this.globalUniformBufferSize),
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }

    _setupRenderTargets(){
        this.deferredRenderTargets = [
            new RenderTexture("deferredTarget0", {width: this._canvas.width, height: this._canvas.height}, 'rgba8unorm', this),
            new RenderTexture("deferredTarget1", {width: this._canvas.width, height: this._canvas.height}, 'rgba16float', this),
            new RenderTexture("deferredTarget2", {width: this._canvas.width, height: this._canvas.height}, 'rgba8unorm', this),
            new DepthTexture("deferredTargetD", {width: this._canvas.width, height: this._canvas.height}, this),

            new RenderTexture("renderResult", {width: this._canvas.width, height: this._canvas.height}, 'rgba16float', this),
        ]

        this._updateRenderTargetViews();
    }

    _updateRenderTargetViews(){
        this.deferredRenderDescriptor.colorAttachments[0].view = this.deferredRenderTargets[0].view;
        this.deferredRenderDescriptor.colorAttachments[1].view = this.deferredRenderTargets[1].view;
        this.deferredRenderDescriptor.colorAttachments[2].view = this.deferredRenderTargets[2].view;
        this.deferredRenderDescriptor.depthStencilAttachment.view = this.deferredRenderTargets[3].view;
    }

    _setupGlobalBindGroup(){
        if(!WebEngine.globalBindGroupLayout){
            WebEngine.globalBindGroupLayout = this._device.createBindGroupLayout({
                label: "Global Bind Group Layout",
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                        buffer: { type: "uniform" }
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                        buffer: { type: "read-only-storage" }
                    }
                ],
            });
        }

        this.globalBindGroup = this._device.createBindGroup({
            layout: WebEngine.globalBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.globalUniformBuffer }
                },
                {
                    binding: 1,
                    resource: { buffer: this.buffersGPU.uniforms }
                }
            ]
        });
    }

    _setupPostprocesses(){
        // Postprocess.buildBuffers(this);

        for(const postprocess of this.postprocesses){
            postprocess.setup();
        }
    }

    _setupLights(){
        for(const light of this.lights){
            light.setup();
        }
    }

    _addBuffer(name, size, Type, usage){
        const buffer = this._device.createBuffer({
            label: `Buffer: ${name}`,
            size: size * Type.BYTES_PER_ELEMENT,
            usage: usage,
            mappedAtCreation: false,
        });
        // const arrayBuffer = buffer.getMappedRange();
        // const typedArray = new Type(arrayBuffer);
        // buffer.unmap();
        
        this.buffersGPU[name] = buffer;
        this.buffersPackers[name] = new MemoryAutopacker(size);
        this.debugMemoryBuffers[name] = new DebugMemoryBuffer(name, size);
    }

    get presentationFormat(){
        return this._presentationFormat;
    }

    get device(){
        return this._device;
    }

    get context(){
        return this._context;
    }

    get canvas(){
        return this._canvas;
    }

    set canvas(canvas){
        this._canvas = canvas;
        this._setupCanvas();
    }

    set camera(camera){
        this._camera = camera;
    }

    get camera(){
        return this._camera;
    }

    _writeToBuffer(name, data, offset = 0){
        const buffer = this.buffersGPU[name];
        
        this._device.queue.writeBuffer(buffer, offset*data.BYTES_PER_ELEMENT, data);//, data.byteOffset, data.byteLength);
    }

    addMesh(mesh){
        this.meshes.push(mesh);
        if(!this.getMeshDataLoaded(mesh.meshData)){
            this.addMeshData(mesh.meshData);
        }

        mesh.uniformIndex = this._allocateDataBuffer(mesh.name, mesh.uniformLength);
        this._writeMeshTransformToDataBuffer(mesh);

        this.sortMeshes();
    }

    removeMesh(mesh){
        this._deallocateDataBuffer(mesh.uniformIndex, mesh.uniformLength);
        const index = this.meshes.indexOf(mesh);
        if (index > -1) {
            this.meshes.splice(index, 1);
            if(!this.meshes.some(m => m.meshData === mesh.meshData)){
                this.removeMeshData(mesh.meshData);
            }
        }
    }
    
    addLight(light){
        light.uniformIndex = this._allocateDataBuffer(light.name, light.uniformLength);
        this._writeLightTransformToDataBuffer(light);
        this.lights.push(light);
    }

    removeLight(light){
        this._deallocateDataBuffer(light.uniformIndex, light.uniformLength);
        const index = this.lights.indexOf(light);
        if (index > -1) {
            this.lights.splice(index, 1);
        }
    }

    getMeshDataLoaded(meshData){
        return this.meshData.includes(meshData);
    }

    sortMeshes(){
        this.meshes.sort(this._meshSortFunction);
    }

    _meshSortFunction(a, b){
        return a.renderPriority - b.renderPriority + (a.meshData.id - b.meshData.id) * 0.0001; // Sort by renderPriority, then by meshData id
    }

    addMeshData(meshData){
        this.meshData.push(meshData);

        const positions = meshData._positions;
        const indices = meshData._indices;
        const normals = meshData._normals;
        const uvs = meshData._uvs;

        const positionIndex = this.buffersPackers.positions.allocate(Math.max(128, positions.length));
        const normalIndex = normals ? this.buffersPackers.normals.allocate(Math.max(128, normals.length)) : null;
        const uvIndex = uvs ? this.buffersPackers.uvs.allocate(Math.max(128, uvs.length)) : null;
        const indexIndex = this.buffersPackers.indices.allocate(Math.max(128, indices.length));

        if(positionIndex == -1 || indexIndex == -1 || (normals && normalIndex == -1) || (uvs && uvIndex == -1)){
            throw new Error("Not enough space in buffer to allocate mesh data.");
        }

        console.log(`Adding mesh data: ${meshData.name}. Position index: ${positionIndex}, position Length: ${positions.length}`);
        this._writeToBuffer('positions', positions, positionIndex);
        meshData.indexes.positions = positionIndex;
        this.debugMemoryBuffers.positions.allocate(meshData.name, positionIndex, positionIndex+positions.length);

        if(normals){
            this._writeToBuffer('normals', normals, normalIndex);
            meshData.indexes.normals = normalIndex;
            this.debugMemoryBuffers.normals.allocate(meshData.name, normalIndex, normalIndex+normals.length);
        }
        if(uvs){
            this._writeToBuffer('uvs', uvs, uvIndex);
            meshData.indexes.uvs = uvIndex;
            this.debugMemoryBuffers.uvs.allocate(meshData.name, uvIndex, uvIndex+uvs.length);
        }

        this._writeToBuffer('indices', indices, indexIndex);
        meshData.indexes.indices = indexIndex;
        this.debugMemoryBuffers.indices.allocate(meshData.name, indexIndex, indexIndex+indices.length);

        console.log(`Mesh ${meshData.name} added. Position index: ${positionIndex}, Normal index: ${normalIndex}, UV index: ${uvIndex}, Index index: ${indexIndex}`);
        
    }

    removeMeshData(meshData){
        const index = this.meshData.indexOf(meshData);
        if (index > -1) {
            this.meshData.splice(index, 1);

            const positions = meshData._positions;
            const indices = meshData._indices;
            const normals = meshData._normals;
            const uvs = meshData._uvs;

            this.buffersPackers.positions.free(meshData.indexes.positions, positions.length);
            this.debugMemoryBuffers.positions.free(meshData.name);
            if(normals){
                this.buffersPackers.normals.free(meshData.indexes.normals, normals.length);
                this.debugMemoryBuffers.normals.free(meshData.name);
            }
            if(uvs){
                this.buffersPackers.uvs.free(meshData.indexes.uvs, uvs.length);
                this.debugMemoryBuffers.uvs.free(meshData.name);
            }
            this.buffersPackers.indices.free(meshData.indexes.indices, indices.length);
            this.debugMemoryBuffers.indices.free(meshData.name);
        }
    }

    updateBuffers(){
        for(const name in this.buffersGPU){
            const gpuBuffer = this.buffersGPU[name];
            const cpuBuffer = this.buffersPackers[name];

            const arrayBuffer = gpuBuffer.getMappedRange();
            const typedArray = new cpuBuffer.array.constructor(arrayBuffer);
            typedArray.set(cpuBuffer.array);
            gpuBuffer.unmap();
        }
    }

    _allocateDataBuffer(name, length=0){
        const size = length || this.objectDataStorageBufferBlockSize;
        const index = this.buffersPackers.uniforms.allocate(size);
        if(index == -1){
            this._enlargeObjectDataStorageBuffer();
            return this._allocateDataBuffer(name, length); // Retry allocation after enlarging the buffer
        }
        this.debugMemoryBuffers.uniforms.allocate(name, index, index + size);
        return index;
    }

    _deallocateDataBuffer(index, length=0){
        const size = length || this.objectDataStorageBufferBlockSize;
        this.buffersPackers.uniforms.free(index, size);
        this.debugMemoryBuffers.uniforms.freeByIndex(index);
    }

    _writeMeshTransformToDataBuffer(mesh){
        const index = mesh.uniformIndex;
        const world = mesh.getWorldMatrix();
        const worldNormal = glMatrix.mat4.create();
        glMatrix.mat4.invert(worldNormal, world);
        glMatrix.mat4.transpose(worldNormal, worldNormal);
        // last row of world matrix is always just [0,0,0,1], and normal matrix is 3x3 anyway
        // const data = new Float32Array([...world.subarray(0, 12), ...worldNormal.subarray(0, 12)]);
        const data = new Float32Array([...world, ...worldNormal.subarray(0, 12)]);
        this._writeToBuffer('uniforms', data, index);
    }

    _writeLightTransformToDataBuffer(light){
        const index = light.uniformIndex;
        const data = new Float32Array(light.getUniformBuffer());
        this._writeToBuffer('uniforms', data, index);
    }

    createPipeline(label, configuration){
        configuration.label = label;
        const pipeline = this._device.createRenderPipeline(configuration);
        this.pipelines[label] = pipeline;
        return pipeline;
    }

    getPipeline(label){
        return this.pipelines[label];
    }

    render(){
        if(this.resizeFreeze){
            return;
        }
        this._updateGlobalUniforms();
        // this._updateRenderTargetViews();

        // const colorTexture = this._context.getCurrentTexture();
        const renderPassDescriptor = this.deferredRenderDescriptor;
        // renderPassDescriptor.colorAttachments[3].view = colorTexture.createView();

        const commandEncoder = this._device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);


        this._bindGlobalData(passEncoder);
        for(const mesh of this.meshes){
            this._renderMesh(mesh, passEncoder);
        }

        passEncoder.end();

        this._renderLights(commandEncoder);

        this._postprocess(commandEncoder);

        this._device.queue.submit([commandEncoder.finish()]);

        // FPS calculation
        const now = performance.now();
        const deltaTime = now - this._lastDrawTime;
        this._lastDrawTime = now;

        this._frameTimes.push(deltaTime);
        if (this._frameTimes.length > 5) {
            this._frameTimes.shift(); // Keep only the last 5 frame times
        }

        // Calculate the average frame time
        const avgFrameTime = this._frameTimes.reduce((sum, time) => sum + time, 0) / this._frameTimes.length;
        this._fps = 1000 / avgFrameTime;

    }

    _updateGlobalUniforms(){
        const globalUniformData = new Float32Array(32); // Assuming we need 16 floats for the viewProj matrix
        const viewProj = this._camera.getViewProjectionMatrix();
        globalUniformData.set(viewProj, 0);

        const worldInverse = this._camera.getInverseViewProjectionMatrix();
        globalUniformData.set(worldInverse, 16); 

        this._device.queue.writeBuffer(this.globalUniformBuffer, 0, globalUniformData);
    }
    _bindGlobalData(passEncoder){
        // Bind the global data buffer to the pipeline
        passEncoder.setBindGroup(0, this.globalBindGroup);
    }

    _renderMesh(mesh, passEncoder){
        const material = mesh.material;
        const pipeline = material.pipeline; //this.pipelines['testPipeline'];//this.getPipeline(mesh.material.pipelineLabel);
        passEncoder.setPipeline(pipeline);

        // mesh.rotation = glMatrix.quat.fromEuler(glMatrix.quat.create(), performance.now() / 1000 * 22, performance.now() / 1000 * 30, 0);
        // mesh.scale = glMatrix.vec3.fromValues(0.2, 0.2, 0.2);
        // mesh.dirtyTransform();
        this._writeMeshTransformToDataBuffer(mesh);

        material.updateUniforms();
        // material._buildBindGroup();
        

        passEncoder.setBindGroup(1, material.bindGroup);
        // Set vertex buffers
        passEncoder.setVertexBuffer(0, this.buffersGPU.positions, mesh.meshData.indexes.positions * Float32Array.BYTES_PER_ELEMENT);
        if(mesh.meshData._normals){
            passEncoder.setVertexBuffer(1, this.buffersGPU.normals, mesh.meshData.indexes.normals * Float32Array.BYTES_PER_ELEMENT);
        }
        if(mesh.meshData._uvs){
            passEncoder.setVertexBuffer(2, this.buffersGPU.uvs, mesh.meshData.indexes.uvs * Float32Array.BYTES_PER_ELEMENT);
        }

        // Set index buffer
        passEncoder.setIndexBuffer(this.buffersGPU.indices, 'uint16', mesh.meshData.indexes.indices * Uint16Array.BYTES_PER_ELEMENT);

        // Draw the mesh
        // passEncoder.drawIndexed(mesh.meshData._indices.length);
        // passEncoder.draw(mesh.meshData._indices.length, 1, 0, mesh.uniformIndex);

        passEncoder.drawIndexed(mesh.meshData._indices.length, 1, 0, 0, mesh.uniformIndex/4); // Divide by 4 because it is indexed by blocks of vec4s
    }

    _renderLights(commandEncoder){
        const passEncoder = commandEncoder.beginRenderPass(
        {
            colorAttachments: [
            { // renderView
                view: this.deferredRenderTargets[4].view,
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            }
            ]
        }
        );
        for(const light of this.lights){
            // light.postprocess.updateUniforms();
            this._writeLightTransformToDataBuffer(light);
            light.renderWithPass(passEncoder, this, this.globalBindGroup);
        }
        passEncoder.end();
    }

    _postprocess(commandEncoder){

        for(const postprocess of this.postprocesses){
            postprocess.render(commandEncoder, this, this.globalBindGroup);
            // postprocess.onRender(this);
            
            // const passEncoder = commandEncoder.beginRenderPass(postprocess.renderDescriptor);
            // const pipeline = postprocess.pipeline;

            // passEncoder.setPipeline(pipeline);

            // passEncoder.setBindGroup(0, postprocess.bindGroup);


            // passEncoder.draw(3);

            // passEncoder.end();

        }
    }

    getFPS(){
        return this._fps;
    }

}