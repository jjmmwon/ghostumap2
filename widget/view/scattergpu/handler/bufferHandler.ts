export class BufferHandler {
  private device: GPUDevice;
  public buffers: Record<string, GPUBuffer> = {};

  constructor(device: GPUDevice) {
    this.device = device;
  }

  createBuffer(key: string, data: Float32Array, usage: GPUBufferUsageFlags) {
    this.buffers[key] = this.device.createBuffer({
      size: data.byteLength,
      usage,
    });
    this.device.queue.writeBuffer(this.buffers[key], 0, data);
  }

  updateBuffer(key: string, data: Float32Array) {
    this.device.queue.writeBuffer(this.buffers[key], 0, data);
  }
}
