import { createPipeline, initWebGPU } from "@/view/scattergpu/core";

export class GPUHandler {
  public device!: GPUDevice;
  public context!: GPUCanvasContext;
  public pipeline!: GPURenderPipeline;
  private canvas: HTMLCanvasElement;
  public bindGroup: GPUBindGroup | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async init() {
    const { device, context, format } = await initWebGPU(this.canvas);
    this.device = device;
    this.context = context;
    this.pipeline = await createPipeline(device, format);
  }
}
