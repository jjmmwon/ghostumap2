struct InstanceData {
  @location(0) position: vec2<f32>,   
  @location(1) color: vec4<f32>,      
  @location(2) size: f32,             
  @location(3) strokeColor: vec4<f32>, 
  @location(4) strokeWidth: f32,
  @location(5) symbol: u32

};

struct SymbolVertex {
  @location(6) offset: vec2<f32>
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) localPos: vec2<f32>,   
  @location(2) strokeColor: vec4<f32>, 
  @location(3) strokeWidth: f32, 
  @location(4) @interpolate(flat)symbol: u32,
};

struct CanvasSize {
  width: f32,
  height: f32,
};

struct Transform {
  scale: f32,
  translateX: f32,
  translateY: f32,
};

@group(0) @binding(0) var<uniform> canvas: CanvasSize;
@group(0) @binding(1) var<uniform> transform: Transform;

@vertex
fn vs_main(@builtin(vertex_index) VertexIndex: u32, instance: InstanceData, vertex: SymbolVertex) -> VertexOutput {
    var output: VertexOutput;

    // transform px to clip space 
    let size_clip = (instance.size / min(canvas.width, canvas.height)) * 2.0;
    let stroke_clip = instance.strokeWidth / instance.size;

    let scaledOffset = vertex.offset * size_clip;
    let pos = (instance.position * transform.scale) + vec2<f32>(transform.translateX, transform.translateY) + scaledOffset;

    output.position = vec4<f32>(pos, 0.0, 1.0);
    output.color = instance.color;

    // Convert local position to clip space
    output.localPos = vertex.offset * 2.0;

    output.strokeColor = instance.strokeColor;
    output.strokeWidth = stroke_clip;

    output.symbol = instance.symbol;


    return output;
}