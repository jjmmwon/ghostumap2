import { processData } from "./data";
import { TPoints, PointStyleOptions, TData } from "./types";
import { GPUHandler, BufferHandler, InteractionHandler } from "./handler";
import { processPoints } from "./data/processPoints";

export class Scatterplot {
  private canvas: HTMLCanvasElement;
  private gpu: GPUHandler;
  private buffer!: BufferHandler;
  private bufferMap!: TData;
  // private interaction!: InteractionHandler;
  private pointCount: number = 0;
  private transform: { scale: number; x: number; y: number } = {
    scale: 1.0,
    x: 0.0,
    y: 0.0,
  };
  private dataRange: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gpu = new GPUHandler(canvas);
  }

  async init() {
    await this.gpu.init();
    this.buffer = new BufferHandler(this.gpu.device);
    this.initBuffers();
    this.createBindGroup();

    new InteractionHandler(
      this.canvas,
      (scale, mousePos) => this.handleZoom(scale, mousePos),
      (translate) => this.handlePan(translate),
      () => this.handleReset()
    );
  }

  private initBuffers() {
    // Create Uniform Buffers
    this.buffer.createBuffer(
      "canvasSize",
      new Float32Array([this.canvas.width, this.canvas.height]),
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    );
    this.buffer.createBuffer(
      "transform", // for interactions (zoom, pan)
      new Float32Array([1.0, 0.0, 0.0]),
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    );
  }

  private createBindGroup() {
    if (!this.gpu.device || !this.buffer.buffers.canvasSize) return;

    this.gpu.bindGroup = this.gpu.device.createBindGroup({
      layout: this.gpu.pipeline!.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.buffer.buffers.canvasSize },
        },
        { binding: 1, resource: { buffer: this.buffer.buffers.transform } },
      ],
    });
  }

  setData(points: TPoints, pointStyle?: PointStyleOptions) {
    if (!this.gpu.device) {
      console.error("WebGPU device is not initialized.");
      return;
    }

    const data = processData(points, pointStyle);
    const { xMin, xMax, yMin, yMax } = processPoints(points);
    this.dataRange = { xMin, xMax, yMin, yMax };

    this.bufferMap = Object.freeze(data);

    Object.entries(this.bufferMap).forEach(([key, data]) => {
      this.buffer.createBuffer(
        key,
        data,
        GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      );
    });

    this.pointCount = this.bufferMap.vertex.length / 2;
  }

  private handleZoom(scale: number, mousePos: { x: number; y: number }) {
    this.transform.scale *= scale;

    this.transform.x = mousePos.x - (mousePos.x - this.transform.x) * scale;
    this.transform.y = mousePos.y - (mousePos.y - this.transform.y) * scale;
    this.updateTransformBuffer();
    this.render();
  }

  private handlePan(translate: { x: number; y: number }) {
    // const scaleFactor = this.transform.scale;

    // Normalize translation to clip space with scale factor adjustment
    this.transform.x += (translate.x / this.canvas.width) * 1.5;
    this.transform.y -= (translate.y / this.canvas.height) * 1.5;

    this.updateTransformBuffer();
    this.render();
  }

  private handleReset() {
    this.transform.scale = 1.0;
    this.transform.x = 0.0;
    this.transform.y = 0.0;

    this.updateTransformBuffer();

    this.render();
  }

  private updateTransformBuffer() {
    if (!this.gpu.device) return;

    const transformData = new Float32Array([
      this.transform.scale,
      this.transform.x,
      this.transform.y,
    ]);

    this.gpu.device.queue.writeBuffer(
      this.buffer.buffers.transform,
      0,
      transformData
    );
  }

  onClick(callback: (point: [number, number], epsilon: number) => void) {
    this.canvas.addEventListener("click", (event) => {
      const rect = this.canvas.getBoundingClientRect();

      const canvasX = event.clientX - rect.left;
      const canvasY = rect.bottom - event.clientY;

      const clipX = (canvasX / rect.width) * 2 - 1;
      const clipY = (canvasY / rect.height) * 2 - 1;

      // interactive transform(zoom/pan)을 역변환
      const normX = (clipX - this.transform.x) / this.transform.scale;
      const normY = (clipY - this.transform.y) / this.transform.scale;

      // processPoints에서 진행한 정규화의 역변환:
      // normalized = (((data - min) / range) * 2 - 1) * scaleFactor
      // 따라서, data = ((((normalized / scaleFactor) + 1) / 2) * range) + min
      const scaleFactor = 0.9; // processPoints에서 사용한 값
      if (!this.dataRange) {
        console.warn("Data range is not set.");
        return;
      }
      const { xMin, xMax, yMin, yMax } = this.dataRange;
      const xRange = xMax - xMin;
      const yRange = yMax - yMin;

      const dataX = ((normX / scaleFactor + 1) / 2) * xRange + xMin;
      const dataY = ((normY / scaleFactor + 1) / 2) * yRange + yMin;

      const epsilon =
        (10 / Math.min(rect.width, rect.height)) * xRange * scaleFactor;

      callback([dataX, dataY], epsilon);
    });
  }

  render() {
    if (!this.pointCount) {
      console.warn("No points to render.");
      return;
    }

    const commandEncoder = this.gpu.device!.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.gpu.context!.getCurrentTexture().createView(),
          clearValue: { r: 1, g: 1, b: 1, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    passEncoder.setPipeline(this.gpu.pipeline!);
    passEncoder.setBindGroup(0, this.gpu.bindGroup!);
    passEncoder.setVertexBuffer(0, this.buffer.buffers.vertex);
    passEncoder.setVertexBuffer(1, this.buffer.buffers.color);
    passEncoder.setVertexBuffer(2, this.buffer.buffers.size);
    passEncoder.setVertexBuffer(3, this.buffer.buffers.strokeColor);
    passEncoder.setVertexBuffer(4, this.buffer.buffers.strokeWidth);
    passEncoder.setVertexBuffer(5, this.buffer.buffers.symbol);
    passEncoder.setVertexBuffer(6, this.buffer.buffers.offset);

    passEncoder.draw(this.bufferMap.offset.length / 2, this.pointCount);
    passEncoder.end();

    this.gpu.device!.queue.submit([commandEncoder.finish()]);
  }
}
