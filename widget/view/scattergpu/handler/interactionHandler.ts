export class InteractionHandler {
  private canvas: HTMLCanvasElement;
  private onZoom: (scale: number, mousePos: { x: number; y: number }) => void;
  private onPan: (translate: { x: number; y: number }) => void;
  private onReset: () => void;
  private clickCallback:
    | ((point: [number, number], epsilon: number) => void)
    | null = null;
  // Scatterplot의 현재 transform 및 dataRange를 가져오기 위한 getter 함수들
  private getTransform: () => { scale: number; x: number; y: number };
  private getDataRange: () => {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  } | null;
  private isDragging: boolean = false;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private dragStart: { x: number; y: number } | null = null;
  private lastZoomTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    onZoom: (scale: number, mousePos: { x: number; y: number }) => void,
    onPan: (translate: { x: number; y: number }) => void,
    onReset: () => void,
    getTransform: () => { scale: number; x: number; y: number },
    getDataRange: () => {
      xMin: number;
      xMax: number;
      yMin: number;
      yMax: number;
    } | null
  ) {
    this.canvas = canvas;
    this.onZoom = onZoom;
    this.onPan = onPan;
    this.onReset = onReset;
    this.getTransform = getTransform;
    this.getDataRange = getDataRange;
    this.addEventListeners();
  }

  public setOnClick(
    callback: (point: [number, number], epsilon: number) => void
  ) {
    this.clickCallback = callback;
  }

  private addEventListeners() {
    this.canvas.addEventListener("wheel", (e) => this.handleZoom(e));
    this.canvas.addEventListener("mousedown", (e) => this.handlePanStart(e));
    window.addEventListener("mousemove", (e) => this.handlePanMove(e));
    window.addEventListener("mouseup", (e) => this.handlePanEnd(e));
    this.canvas.addEventListener("dblclick", () => this.onReset());
  }

  private handleZoom(event: WheelEvent) {
    event.preventDefault();
    const now = performance.now();
    if (now - this.lastZoomTime < 30) return;
    this.lastZoomTime = now;

    const zoomFactor = 1.1;
    const scale = event.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    requestAnimationFrame(() => {
      this.onZoom(scale, { x: mouseX, y: mouseY });
    });
  }

  private handlePanStart(event: MouseEvent) {
    this.isDragging = true;
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.lastMousePos = { x: event.clientX, y: event.clientY };
  }

  private handlePanMove(event: MouseEvent) {
    if (!this.isDragging) return;

    let dx = event.clientX - this.lastMousePos.x;
    let dy = event.clientY - this.lastMousePos.y;
    // 팬 이동 제한 (너무 급격한 이동 방지)
    dx = Math.max(-50, Math.min(50, dx));
    dy = Math.max(-50, Math.min(50, dy));

    this.lastMousePos = { x: event.clientX, y: event.clientY };

    requestAnimationFrame(() => {
      this.onPan({ x: dx, y: dy });
    });
  }

  private handlePanEnd(event: MouseEvent) {
    if (!this.isDragging) return;
    if (this.dragStart) {
      const dx = event.clientX - this.dragStart.x;
      const dy = event.clientY - this.dragStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const clickThreshold = 5; // 임계값 (픽셀 단위)
      if (distance < clickThreshold && this.clickCallback) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = rect.bottom - event.clientY;
        const clipX = (canvasX / rect.width) * 2 - 1;
        const clipY = (canvasY / rect.height) * 2 - 1;

        const transform = this.getTransform();
        const normX = (clipX - transform.x) / transform.scale;
        const normY = (clipY - transform.y) / transform.scale;

        const scaleFactor = 0.9;
        const dataRange = this.getDataRange();
        if (!dataRange) {
          console.warn("Data range is not set.");
        } else {
          const { xMin, xMax, yMin, yMax } = dataRange;
          const xRange = xMax - xMin;
          const yRange = yMax - yMin;
          const dataX = ((normX / scaleFactor + 1) / 2) * xRange + xMin;
          const dataY = ((normY / scaleFactor + 1) / 2) * yRange + yMin;
          const epsilon =
            (10 / Math.min(rect.width, rect.height)) * xRange * scaleFactor;
          this.clickCallback([dataX, dataY], epsilon);
        }
      }
    }
    this.isDragging = false;
    this.dragStart = null;
  }
}
