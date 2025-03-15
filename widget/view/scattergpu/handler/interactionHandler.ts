export class InteractionHandler {
  private canvas: HTMLCanvasElement;
  private onZoom: (scale: number, mousePos: { x: number; y: number }) => void;
  private onPan: (translate: { x: number; y: number }) => void;
  private onReset: () => void;
  private isDragging: boolean = false;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private lastZoomTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    onZoom: (scale: number, mousePos: { x: number; y: number }) => void,
    onPan: (translate: { x: number; y: number }) => void,
    onReset: () => void
  ) {
    this.canvas = canvas;
    this.onZoom = onZoom;
    this.onPan = onPan;
    this.onReset = onReset;
    this.addEventListeners();
  }

  private addEventListeners() {
    this.canvas.addEventListener("wheel", (e) => this.handleZoom(e));
    this.canvas.addEventListener("mousedown", (e) => this.handlePanStart(e));
    window.addEventListener("mousemove", (e) => this.handlePanMove(e));
    window.addEventListener("mouseup", () => this.handlePanEnd());
    this.canvas.addEventListener("dblclick", () => this.onReset());
  }

  private handleZoom(event: WheelEvent) {
    event.preventDefault();

    // 🎯 Wheel 이벤트 간격 조절 (100ms 이상)
    const now = performance.now();
    if (now - this.lastZoomTime < 30) return;
    this.lastZoomTime = now;

    const zoomFactor = 1.1; // 🎯 Zoom 속도 조정
    const scale = event.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

    // 🎯 마우스 위치를 캔버스 좌표로 변환
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    requestAnimationFrame(() => {
      this.onZoom(scale, { x: mouseX, y: mouseY });
    });
  }

  private handlePanStart(event: MouseEvent) {
    this.isDragging = true;
    this.lastMousePos = { x: event.clientX, y: event.clientY };
  }

  private handlePanMove(event: MouseEvent) {
    if (!this.isDragging) return;

    let dx = event.clientX - this.lastMousePos.x;
    let dy = event.clientY - this.lastMousePos.y;

    dx = Math.max(-50, Math.min(50, dx));
    dy = Math.max(-50, Math.min(50, dy));

    this.lastMousePos = { x: event.clientX, y: event.clientY };

    requestAnimationFrame(() => {
      this.onPan({ x: dx, y: dy });
    });
  }

  private handlePanEnd() {
    this.isDragging = false;
  }

  private handleClick(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();

    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    const clipX = (canvasX / rect.width) * 2 - 1;
    const clipY = (canvasY / rect.height) * 2 - 1;

    // const {};
  }
}
