import vertWGSL from "./vert.wgsl?raw";
import fragWGSL from "./frag.wgsl?raw";

export async function createPipeline(
  device: GPUDevice,
  format: GPUTextureFormat
) {
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" },
      },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  return device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: device.createShaderModule({
        code: vertWGSL,
      }),
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 8,
          stepMode: "instance",
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
        }, // position
        {
          arrayStride: 16,
          stepMode: "instance",
          attributes: [{ shaderLocation: 1, offset: 0, format: "float32x4" }],
        }, // color
        {
          arrayStride: 4,
          stepMode: "instance",
          attributes: [{ shaderLocation: 2, offset: 0, format: "float32" }],
        }, // size
        {
          arrayStride: 16,
          stepMode: "instance",
          attributes: [{ shaderLocation: 3, offset: 0, format: "float32x4" }],
        }, // stroke color
        {
          arrayStride: 4,
          stepMode: "instance",
          attributes: [{ shaderLocation: 4, offset: 0, format: "float32" }],
        }, // stroke width
        {
          arrayStride: 4,
          stepMode: "instance",
          attributes: [{ shaderLocation: 5, offset: 0, format: "uint32" }],
        }, // symbol
        {
          arrayStride: 8,
          stepMode: "vertex",
          attributes: [{ shaderLocation: 6, offset: 0, format: "float32x2" }],
        }, // offset
      ],
    },
    fragment: {
      module: device.createShaderModule({
        code: fragWGSL,
      }),
      entryPoint: "fs_main",
      targets: [
        {
          format,
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
          },
        },
      ],
    },
    primitive: {
      topology: "triangle-strip",
    },
  });
}
