class GLBLoader {
    static async loadAsync(bytes, engine) {
        const startTime = performance.now();
        if(GLBLoader.bytesToString(bytes, 0, 4) !== "glTF"){
            throw new Error("Invalid GLB file");
        }

        const version = GLBLoader.bytesToUint32(bytes, 4);
        if(version !== 2){
            throw new Error("Unsupported GLB version: " + version);
        }

        const length = GLBLoader.bytesToUint32(bytes, 8);
        if(length !== bytes.length){
            throw new Error("GLB length mismatch: expected " + length + ", got " + bytes.length);
        }

        const chunks = [];
        let offset = 12;
        let jsonData = null;
        let binData = null;
        while(offset < bytes.length){
            const chunkLength = GLBLoader.bytesToUint32(bytes, offset);
            const chunkType = GLBLoader.bytesToString(bytes, offset + 4, 4);
            const chunkData = bytes.subarray(offset + 8, offset + 8 + chunkLength);

            if(chunkType === "JSON"){
                jsonData = GLBLoader.loadJSONChunk(chunkData);
            } else if(chunkType === "BIN\0"){
                binData = chunkData;
            }
            offset += 8 + chunkLength;
        }

        const endTime = performance.now();
        console.log(`GLB loaded in ${(endTime - startTime).toFixed(2)} ms`);

        const bufferViews = await GLBLoader.loadBufferViewsAsync(jsonData, binData);
        console.log("bufferViews:", bufferViews);

        const accessors = await GLBLoader.buildAccessorsAsync(jsonData, bufferViews);
        console.log("accessors:", accessors);

        const images = await GLBLoader.loadImagesAsync(jsonData, bufferViews, engine);
        console.log("images:", images);

        const materials = await GLBLoader.buildMaterialsAsync(jsonData, images, engine);
        console.log("materials:", materials);

        const mesheDatas = await GLBLoader.buildMeshDatasAsync(jsonData, accessors);
        console.log("meshDatats:", mesheDatas);

        const nodes = await GLBLoader.buildNodesAsync(jsonData, mesheDatas, materials, engine);
        console.log("nodes:", nodes);

        for (const node of nodes) {
            engine.addMesh(node);
        }
        // engine.addMesh(nodes[0]);


        // await Promise.all([
        //     GLBLoader.loadBufferViewsAsync(jsonData, binData),
        //     GLBLoader.loadImagesAsync(jsonData, bufferViews)
        // ]);


        return chunks;
    }

    static loadJSONChunk(data) {
        const jsonString = new TextDecoder("utf-8").decode(data);
        return JSON.parse(jsonString);
    }

    static async loadBufferViewsAsync(json, binData) {
        return new Promise((resolve, reject) => {
            resolve(GLBLoader.loadBufferViews(json, binData));
        });
    }

    static async buildAccessorsAsync(json, bufferViews) {
        return new Promise((resolve, reject) => {
            const accessors = [];
            for (let i = 0; i < json.accessors.length; i++) {
                const accessorJson = json.accessors[i];
                const bufferViewData = bufferViews[accessorJson.bufferView];

                const ComponentTypes = {
                    5120: Int8Array,
                    5121: Uint8Array,
                    5122: Int16Array,
                    5123: Uint16Array,
                    5125: Uint32Array,
                    5126: Float32Array
                };
                const componentType = ComponentTypes[accessorJson.componentType];
                const byteOffset = bufferViewData.byteOffset + (accessorJson.byteOffset || 0);
                const elementCount = accessorJson.count * GLBLoader.getNumComponents(accessorJson.type);
                const typedArray = new componentType(bufferViewData.buffer, byteOffset, elementCount);
                accessors.push(typedArray);
            }
            resolve(accessors);
        });
    }

    static getNumComponents(type) {
        switch (type) {
            case "SCALAR": return 1;
            case "VEC2": return 2;
            case "VEC3": return 3;
            case "VEC4": return 4;
            case "MAT2": return 4;
            case "MAT3": return 9;
            case "MAT4": return 16;
            default: throw new Error("Unknown accessor type: " + type);
        }
    }


    static async buildMaterialsAsync(json, images, engine) {
        const materials = [];
        const promises = [];
        for (let i = 0; i < json.materials.length; i++) {
            const materialJson = json.materials[i];
            promises.push(new Promise((resolve, reject) => {
                const material = GLBLoader.buildMaterial(materialJson, images, engine);
                material.build();
                resolve(material);
            }));
        }
        return Promise.all(promises).then((result) => {
            return result;
        });
    }

    static buildMaterial(json, images, engine) {
        const material = new StandardDeferredMaterial(json.name || "GLBMaterial", engine);

        json.normalTexture && material.setNormalTexture(images[json.normalTexture.index]);
        // json.occlusionTexture && material.setAmbientOcclusionTexture(images[json.occlusionTexture.index]);
        // json.emissiveTexture && material.setEmissiveTexture(images[json.emissiveTexture.index]);

        if(json.pbrMetallicRoughness) {
            const pbr = json.pbrMetallicRoughness;
            console.log(material, images[pbr.baseColorTexture.index]);
            pbr.baseColorTexture && material.setDiffuseTexture(images[pbr.baseColorTexture.index]);
            pbr.metallicRoughnessTexture && material.setRoughnessTexture(images[pbr.metallicRoughnessTexture.index]);
            pbr.baseColorFactor && material.setDiffuseFactor(pbr.baseColorFactor);
            pbr.metallicFactor !== undefined && material.setMetalnessFactor(pbr.metallicFactor);
            pbr.roughnessFactor !== undefined && material.setRoughnessFactor(pbr.roughnessFactor);
        }
        return material;
    }

    static async buildMeshDatasAsync(json, accessors) {
        const meshes = [];
        const promises = [];
        for (let i = 0; i < json.meshes.length; i++) {
            const meshJson = json.meshes[i];
            promises.push(new Promise((resolve, reject) => {
                const meshData = GLBLoader.buildMeshData(meshJson, accessors);
                resolve(meshData);
            }));
        }
        return Promise.all(promises).then((result) => {
            return result;
        });
    }

    static buildMeshData(json, accessors){
        const meshData = new MeshData(json.name || "GLBMesh");
        const primitive = json.primitives[0];
        if(json.primitives.length > 1){
            console.warn("GLBLoader: Only the first primitive of a mesh is loaded. Multiple primitives are not yet supported.");
        }
        // for (const primitive of json.primitives) {
            const positionsAccessor = accessors[primitive.attributes.POSITION];
            const normalsAccessor = accessors[primitive.attributes.NORMAL];
            const uvsAccessor = accessors[primitive.attributes.TEXCOORD_0];
            const indicesAccessor = accessors[primitive.indices];

            console.log("positionsAccessor:", positionsAccessor);
            console.log("normalsAccessor:", normalsAccessor);
            console.log("uvsAccessor:", uvsAccessor);
            console.log("indicesAccessor:", indicesAccessor);

            meshData._positions = positionsAccessor;
            meshData._normals = normalsAccessor;
            meshData._uvs = uvsAccessor;
            meshData._indices = indicesAccessor;
            
            meshData.glbMaterialIndex = primitive.material;
        // }
        return meshData;
    }

    static async buildNodesAsync(json, meshDatas, materials, engine) {
        const promises = [];
        for (let i = 0; i < json.nodes.length; i++) {
            const nodeJson = json.nodes[i];
            if(nodeJson.mesh !== undefined) {
                promises.push(new Promise((resolve, reject) => {
                    const mesh = GLBLoader.buildMesh(nodeJson, meshDatas, materials, engine);
                    resolve(mesh);
                }));
            }else{
                promises.push(Promise.resolve(null));
            }

            
        }

        return Promise.all(promises).then((result) => {
            for (let i = 0; i < json.nodes.length; i++) {
                for(const childIndex of json.nodes[i].children || []) {
                    result[childIndex].parent = result[i];
                }
            }
            return result;
        });
    }

    static buildMesh(json, meshDatas, materials, engine) {
        console.log(json);
        const meshData = meshDatas[json.mesh];
        const material = materials[meshData.glbMaterialIndex];
        const mesh = new Mesh(json.name || "GLBMesh", engine, meshData, material);

        mesh.position = json.translation ? glMatrix.vec3.fromValues(...json.translation) : glMatrix.vec3.fromValues(0, 0, 0);
        mesh.rotation = json.rotation ? glMatrix.quat.fromValues(...json.rotation) : glMatrix.quat.fromValues(0, 0, 0, 1);
        mesh.scale = json.scale ? glMatrix.vec3.fromValues(...json.scale) : glMatrix.vec3.fromValues(1, 1, 1);
        
        return mesh;
    }
        

    static loadBufferViews(json, binData) {
        const bufferViewJson = json.bufferViews;
        const bufferViews = [];

        for (let i = 0; i < bufferViewJson.length; i++) {
            const view = bufferViewJson[i];
            const byteOffset = view.byteOffset || 0;
            const byteLength = view.byteLength;

            if (view.buffer !== 0) {
                throw new Error("Only single buffer GLB files are supported.");
            }

            const bufferViewData = binData.subarray(byteOffset, byteOffset + byteLength);
            bufferViews.push(bufferViewData);
        }

        return bufferViews;
    }

    static async loadImagesAsync(json, bufferViews, engine) {
        const images = json.images;
        const promises = [];

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            if (image.bufferView !== undefined) {
                const bufferViewData = bufferViews[image.bufferView];

                promises.push(FileTools.bitmapFromBytesAsync(bufferViewData, image.mimeType).then((bitmap) => {
                    const tex = new Texture(image.name || "GLBTexture", bitmap, 'rgba8unorm', engine, 'linear', 'repeat', true);
                    // tex.setData(FileTools.imageBitmapToTypedArray(bitmap), 4); //
                    tex.setFromBitmap(bitmap);
                    return tex;
                }));
                
            } else if (image.uri) {
                throw new Error("uri not yet supported");
            } else {
                throw new Error("Image must have either a bufferView or a uri.");
            }
        }

        return Promise.all(promises);
    }

    static loadBase64Async(data, engine) {
        const cut = data.indexOf(",") + 1;
        data = data.substring(cut);
        let bytes;
        try {
            bytes = Uint8Array.fromBase64(data);
        } catch (error) {
            console.warn("Base64 decoding failed, falling back to manual decoding. This may be slower.");
            const binary = atob(data);
            bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
        }
       
        return GLBLoader.loadAsync(bytes, engine);
    }

    static bytesToString(bytes, start, length) { // to string
        return String.fromCharCode.apply(null, bytes.subarray(start, start + length));

    }

    static bytesToUint32(bytes, start) { // to uint32
        return new DataView(bytes.buffer, start, 4).getUint32(0, true);
    }

}