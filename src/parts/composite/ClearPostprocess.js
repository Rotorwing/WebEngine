class ClearPostprocess extends Postprocess {
    constructor(name, engine, texture) {
        super(name, engine, null);

        this.target = null;

        this.renderDescriptor = {
            colorAttachments: [
            { // renderView
                view: undefined,
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
                depthReadOnly: true,
            }
            ],
        };

        this.setTarget(texture);
    }

    setTarget(texture){
        this.target = texture;
        this.renderDescriptor.colorAttachments[0].view = this.target.view;
    }

    setClearColor(color){
        this.renderDescriptor.colorAttachments[0].clearValue = color;
    }

    setup(){
        // no setup needed for clear postprocess
    }

    render(commandEncoder, engine){
        super.render(commandEncoder, engine, null, 0, null);
    }

    renderWithPass(passEncoder, engine, globalBindGroup=null, vertexIndex=0, alterPass=null, callOnRender=true){
        // no need to set bind groups for clear postprocess
    }

    onResize(engine){
        this.renderDescriptor.colorAttachments[0].view = this.target.view;
        this.build();
    }

    _buildUniforms(){
        // no uniforms needed for clear postprocess
    }
    _buildTextures(){
        // no textures needed for clear postprocess
    }
}


/*
Attachment state of [RenderPipeline "outputPostprocessShader_pipeline"] is not compatible with [RenderPassEncoder (unlabeled)].
[RenderPassEncoder (unlabeled)] expects an attachment state of                 { colorTargets: [0={format:TextureFormat::BGRA8Unorm}], sampleCount: 1 }.
[RenderPipeline "outputPostprocessShader_pipeline"] has an attachment state of { colorTargets: [0={format:TextureFormat::BGRA8Unorm}], depthStencilFormat: TextureFormat::Depth24PlusStencil8, sampleCount: 1 }.
 - While encoding [RenderPassEncoder (unlabeled)].SetPipeline([RenderPipeline "outputPostprocessShader_pipeline"]).
 - While finishing [CommandEncoder (unlabeled)].

 */