// // scatterplotRenderer.ts;
// import { Scatterplot } from "@/view";
// import type {
//   IGhostPoint,
//   IOriginalPoint,
//   IScale,
//   TEmbeddingConfig,
// } from "@/model";

// class ScatterplotRenderer {
//   public canvas: HTMLCanvasElement;

//   private scatterplot: Scatterplot;
//   private origEmb!: IOriginalPoint[];
//   private unstEmb!: IOriginalPoint[];
//   private ghostEmb!: IGhostPoint[];
//   private scales!: IScale;
//   private embeddingConfig!: TEmbeddingConfig;

//   private visibility = {
//     neighbors: false,
//     ghosts: true,
//     unstables: true,
//   };

//   private unstList: number[] = [];
//   private externalUpdateUnstList: (idList: number[]) => void = () => {};

//   constructor(canvasSize: { width: number; height: number }) {
//     this.canvas = document.createElement("canvas");
//     this.canvas.width = canvasSize.width;
//     this.canvas.height = canvasSize.height;

//     this.scatterplot = new Scatterplot(this.canvas);
//   }

//   async init(updateUnstList: (idList: number[]) => void) {
//     await this.scatterplot.init();
//     this.externalUpdateUnstList = updateUnstList;
//     this.scatterplot.setOnClick(this.onClick.bind(this));
//   }

//   update(
//     origEmb: IOriginalPoint[],
//     unstEmb: IOriginalPoint[],
//     ghostEmb: IGhostPoint[],
//     scales: IScale
//   ) {
//     this.origEmb = origEmb;
//     this.unstEmb = unstEmb;
//     this.ghostEmb = ghostEmb;
//     this.scales = scales;

//     this.rebuildEmbeddingConfig();
//     this.render();
//   }

//   updateUnstList(unstList: number[]) {
//     this.unstList = unstList;

//     this.rebuildEmbeddingConfig();
//     this.render();
//   }

//   updateVisibility(
//     property: "neighbors" | "ghosts" | "unstables",
//     value: boolean
//   ) {
//     this.visibility[property] = value;

//     this.rebuildEmbeddingConfig();
//     this.render();
//   }

//   private initializeEmbeddingConfig() {
//     this.embeddingConfig = {
//       coords: this.origEmb.map((d) => [d.x, d.y] as [number, number]),
//       color: this.origEmb.map((d) => this.scales.colorScale(d.label)),
//       size: this.origEmb.map((_) => 3),
//       symbol: this.origEmb.map((_) => "circle"),
//       opacity: this.origEmb.map((_) => 1),
//       strokeWidth: this.origEmb.map((_) => 0),
//     };
//   }

//   private rebuildEmbeddingConfig() {
//     this.initializeEmbeddingConfig();

//     if (this.visibility.neighbors) this.addNeighborEmbedding();
//     if (this.visibility.ghosts) this.addGhostEmbedding();
//     if (this.visibility.unstables) this.addUnstEmbedding();

//     this.render();
//   }

//   private addUnstEmbedding() {
//     const activatedUnstEmb = this.unstList.length
//       ? this.unstList.map((id) => this.origEmb[id])
//       : this.unstEmb;

//     console.log(activatedUnstEmb);

//     activatedUnstEmb.forEach((d) => {
//       this.embeddingConfig.size[d.id] = 0;

//       this.embeddingConfig.coords.push([d.x, d.y]);
//       this.embeddingConfig.color.push(this.scales.colorScale(d.label));
//       this.embeddingConfig.size.push(30);
//       this.embeddingConfig.symbol.push("cross");
//       this.embeddingConfig.strokeWidth.push(4);
//       this.embeddingConfig.opacity.push(1);
//     });
//   }

//   private addGhostEmbedding() {
//     if (this.unstList.length === 0) return;

//     this.unstList.forEach((id) => {
//       const { coords, label } = this.ghostEmb[id];
//       coords.forEach((coord) => {
//         this.embeddingConfig.coords.push([coord.x, coord.y]);
//         this.embeddingConfig.color.push(
//           this.scales.ghostColorScale(label as string)(coord.r)
//         );
//         this.embeddingConfig.size.push(25);
//         this.embeddingConfig.symbol.push("triangle");
//         this.embeddingConfig.strokeWidth.push(2.5);
//         this.embeddingConfig.opacity.push(1);
//       });
//     });
//   }

//   private addNeighborEmbedding() {
//     if (this.unstList.length === 0) return;

//     const activatedNeighborIds = new Set<number>(
//       this.unstList.flatMap((id) => this.origEmb[id].neighbors)
//     );

//     activatedNeighborIds.forEach((id) => {
//       const { x, y, label } = this.origEmb[id];
//       this.embeddingConfig.coords.push([x, y]);
//       this.embeddingConfig.color.push(this.scales.colorScale(label));
//       this.embeddingConfig.size.push(25);
//       this.embeddingConfig.symbol.push("diamond");
//       this.embeddingConfig.strokeWidth.push(2.5);
//       this.embeddingConfig.opacity.push(1);
//     });
//   }

//   private render() {
//     this.scatterplot.setData(this.embeddingConfig.coords, {
//       color: this.embeddingConfig.color,
//       size: this.embeddingConfig.size,
//       symbol: this.embeddingConfig.symbol as any,
//       strokeColor: "#000000",
//       strokeWidth: this.embeddingConfig.strokeWidth,
//       opacity: this.embeddingConfig.opacity,
//     });

//     this.scatterplot.render();
//   }

//   private onClick(points: [number, number], epsilon: number) {
//     const activatedUnstEmb = this.unstList.length
//       ? this.unstList.map((id) => this.origEmb[id])
//       : this.unstEmb;

//     const [x, y] = points;

//     let minDist = Number.MAX_VALUE;
//     let selected = null;

//     activatedUnstEmb.forEach((d) => {
//       const distance = Math.hypot(d.x - x, d.y - y);
//       if (distance < minDist) {
//         minDist = distance;
//         selected = d.id;
//       }
//     });

//     selected = minDist < 2 * epsilon ? selected : null;
//     this.externalUpdateUnstList(selected ? [selected] : []);
//   }
// }

// export default ScatterplotRenderer;

// // scatterplotRenderer.ts
// import { Scatterplot } from "@/view";
// import type {
//   IGhostPoint,
//   IOriginalPoint,
//   IScale,
//   TEmbeddingConfig,
// } from "@/model";

// class ScatterplotRenderer {
//   public canvas: HTMLCanvasElement;

//   private scatterplot: Scatterplot;
//   private origEmb!: IOriginalPoint[];
//   private unstEmb!: IOriginalPoint[];
//   private ghostEmb!: IGhostPoint[];
//   private scales!: IScale;
//   private embeddingConfig!: TEmbeddingConfig;

//   private visibility = {
//     neighbors: false,
//     ghosts: true,
//     unstables: true,
//   };

//   private unstList: number[] = [];
//   private externalUpdateUnstList: (idList: number[]) => void = () => {};

//   constructor(canvasSize: { width: number; height: number }) {
//     this.canvas = document.createElement("canvas");
//     this.canvas.width = canvasSize.width;
//     this.canvas.height = canvasSize.height;

//     this.scatterplot = new Scatterplot(this.canvas);
//   }

//   async init(updateUnstList: (idList: number[]) => void) {
//     await this.scatterplot.init();
//     this.externalUpdateUnstList = updateUnstList;
//     this.scatterplot.setOnClick(this.onClick.bind(this));
//   }

//   update(
//     origEmb: IOriginalPoint[],
//     unstEmb: IOriginalPoint[],
//     ghostEmb: IGhostPoint[],
//     scales: IScale
//   ) {
//     this.origEmb = origEmb;
//     this.unstEmb = unstEmb;
//     this.ghostEmb = ghostEmb;
//     this.scales = scales;

//     this.rebuildEmbeddingConfig();
//     this.render();
//   }

//   updateUnstList(unstList: number[]) {
//     this.unstList = unstList;

//     this.rebuildEmbeddingConfig();
//     this.render();
//   }

//   updateVisibility(
//     property: "neighbors" | "ghosts" | "unstables",
//     value: boolean
//   ) {
//     this.visibility[property] = value;

//     this.rebuildEmbeddingConfig();
//     this.render();
//   }

//   private initializeEmbeddingConfig() {
//     this.embeddingConfig = {
//       coords: this.origEmb.map((d) => [d.x, d.y] as [number, number]),
//       color: this.origEmb.map((d) => this.scales.colorScale(d.label)),
//       size: this.origEmb.map((_) => 6),
//       symbol: this.origEmb.map((_) => "circle"),
//       opacity: this.origEmb.map((_) => 1),
//       strokeWidth: this.origEmb.map((_) => 0),
//     };
//   }

//   private rebuildEmbeddingConfig() {
//     this.initializeEmbeddingConfig();

//     if (this.visibility.neighbors) this.addNeighborEmbedding();
//     if (this.visibility.ghosts) this.addGhostEmbedding();
//     if (this.visibility.unstables) this.addUnstEmbedding();

//     this.render();
//   }

//   private addUnstEmbedding() {
//     const activatedUnstEmb = this.unstList.length
//       ? this.unstList.map((id) => this.origEmb[id])
//       : this.unstEmb;

//     activatedUnstEmb.forEach((d) => {
//       this.embeddingConfig.opacity[d.id] = 0;

//       this.embeddingConfig.coords.push([d.x, d.y]);
//       this.embeddingConfig.color.push(this.scales.colorScale(d.label));
//       this.embeddingConfig.size.push(70);
//       this.embeddingConfig.symbol.push("cross");
//       this.embeddingConfig.strokeWidth.push(6);
//       this.embeddingConfig.opacity.push(1);
//     });
//   }

//   private addGhostEmbedding() {
//     if (this.unstList.length === 0) return;

//     this.unstList.forEach((id) => {
//       const { coords, label } = this.ghostEmb[id];
//       coords.forEach((coord) => {
//         this.embeddingConfig.coords.push([coord.x, coord.y]);
//         this.embeddingConfig.color.push(
//           this.scales.ghostColorScale(label as string)(coord.r)
//         );
//         this.embeddingConfig.size.push(70);
//         this.embeddingConfig.symbol.push("triangle");
//         this.embeddingConfig.strokeWidth.push(4);
//         this.embeddingConfig.opacity.push(1);
//       });
//     });
//   }

//   private addNeighborEmbedding() {
//     if (this.unstList.length === 0) return;

//     const activatedNeighborIds = new Set<number>(
//       this.unstList.flatMap((id) => this.origEmb[id].neighbors)
//     );

//     activatedNeighborIds.forEach((id) => {
//       const { x, y, label } = this.origEmb[id];
//       this.embeddingConfig.coords.push([x, y]);
//       this.embeddingConfig.color.push(this.scales.colorScale(label));
//       this.embeddingConfig.size.push(60);
//       this.embeddingConfig.symbol.push("diamond");
//       this.embeddingConfig.strokeWidth.push(4);
//       this.embeddingConfig.opacity.push(1);
//     });
//   }

//   private render() {
//     this.scatterplot.setData(this.embeddingConfig.coords, {
//       color: this.embeddingConfig.color,
//       size: this.embeddingConfig.size,
//       symbol: this.embeddingConfig.symbol as any,
//       strokeColor: "#000000",
//       strokeWidth: this.embeddingConfig.strokeWidth,
//       opacity: this.embeddingConfig.opacity,
//     });

//     this.scatterplot.render();
//   }

//   private onClick(points: [number, number], epsilon: number) {
//     const activatedUnstEmb = this.unstList.length
//       ? this.unstList.map((id) => this.origEmb[id])
//       : this.unstEmb;

//     const [x, y] = points;

//     let minDist = Number.MAX_VALUE;
//     let selected = null;

//     activatedUnstEmb.forEach((d) => {
//       const distance = Math.hypot(d.x - x, d.y - y);
//       if (distance < minDist) {
//         minDist = distance;
//         selected = d.id;
//       }
//     });

//     selected = minDist < 2 * epsilon ? selected : null;

//     this.externalUpdateUnstList(selected ? [selected] : []);
//   }
// }

// export default ScatterplotRenderer;

// // scatterplotRenderer.ts
// import { Scatterplot } from "@/view";
// import type {
//   IGhostPoint,
//   IOriginalPoint,
//   IScale,
//   TEmbeddingConfig,
// } from "@/model";

// class ScatterplotRenderer {
//   public canvas: HTMLCanvasElement;

//   private scatterplot: Scatterplot;
//   private origEmb!: IOriginalPoint[];
//   private unstEmb!: IOriginalPoint[];
//   private ghostEmb!: IGhostPoint[];
//   private scales!: IScale;
//   private embeddingConfig!: TEmbeddingConfig;

//   private visibility = {
//     neighbors: false,
//     ghosts: true,
//     unstables: true,
//   };

//   private unstList: number[] = [];
//   private externalUpdateUnstList: (idList: number[]) => void = () => {};

//   constructor(canvasSize: { width: number; height: number }) {
//     this.canvas = document.createElement("canvas");
//     this.canvas.width = canvasSize.width;
//     this.canvas.height = canvasSize.height;

//     this.scatterplot = new Scatterplot(this.canvas);
//   }

//   async init(updateUnstList: (idList: number[]) => void) {
//     await this.scatterplot.init();
//     this.externalUpdateUnstList = updateUnstList;
//     this.scatterplot.setOnClick(this.onClick.bind(this));
//   }

//   update(
//     origEmb: IOriginalPoint[],
//     unstEmb: IOriginalPoint[],
//     ghostEmb: IGhostPoint[],
//     scales: IScale
//   ) {
//     this.origEmb = origEmb;
//     this.unstEmb = unstEmb;
//     this.ghostEmb = ghostEmb;
//     this.scales = scales;

//     this.rebuildEmbeddingConfig();
//     this.render();
//   }

//   updateUnstList(unstList: number[]) {
//     this.unstList = unstList;

//     this.rebuildEmbeddingConfig();
//     this.render();
//   }

//   updateVisibility(
//     property: "neighbors" | "ghosts" | "unstables",
//     value: boolean
//   ) {
//     this.visibility[property] = value;

//     this.rebuildEmbeddingConfig();
//     this.render();
//   }

//   private initializeEmbeddingConfig() {
//     this.embeddingConfig = {
//       coords: this.origEmb.map((d) => [d.x, d.y] as [number, number]),
//       color: this.origEmb.map((d) => this.scales.colorScale(d.label)),
//       size: this.origEmb.map((_) => 3),
//       symbol: this.origEmb.map((_) => "circle"),
//       opacity: this.origEmb.map((_) => 1),
//       strokeWidth: this.origEmb.map((_) => 0),
//     };
//   }

//   private rebuildEmbeddingConfig() {
//     this.initializeEmbeddingConfig();

//     if (this.visibility.neighbors) this.addNeighborEmbedding();
//     if (this.visibility.ghosts) this.addGhostEmbedding();
//     if (this.visibility.unstables) this.addUnstEmbedding();

//     this.render();
//   }

//   private addUnstEmbedding() {
//     const activatedUnstEmb = this.unstList.length
//       ? this.unstList.map((id) => this.origEmb[id])
//       : this.unstEmb;

//     activatedUnstEmb.forEach((d) => {
//       this.embeddingConfig.opacity[d.id] = 0;

//       this.embeddingConfig.coords.push([d.x, d.y]);
//       this.embeddingConfig.color.push(this.scales.colorScale(d.label));
//       this.embeddingConfig.size.push(60);
//       this.embeddingConfig.symbol.push("cross");
//       this.embeddingConfig.strokeWidth.push(4);
//       this.embeddingConfig.opacity.push(1);
//     });
//   }

//   private addGhostEmbedding() {
//     if (this.unstList.length === 0) return;

//     this.unstList.forEach((id) => {
//       const { coords, label } = this.ghostEmb[id];
//       coords.forEach((coord) => {
//         this.embeddingConfig.coords.push([coord.x, coord.y]);
//         this.embeddingConfig.color.push(
//           this.scales.ghostColorScale(label as string)(coord.r)
//         );
//         this.embeddingConfig.size.push(60);
//         this.embeddingConfig.symbol.push("triangle");
//         this.embeddingConfig.strokeWidth.push(4);
//         this.embeddingConfig.opacity.push(1);
//       });
//     });
//   }

//   private addNeighborEmbedding() {
//     if (this.unstList.length === 0) return;

//     const activatedNeighborIds = new Set<number>(
//       this.unstList.flatMap((id) => this.origEmb[id].neighbors)
//     );

//     activatedNeighborIds.forEach((id) => {
//       const { x, y, label } = this.origEmb[id];
//       this.embeddingConfig.coords.push([x, y]);
//       this.embeddingConfig.color.push(this.scales.colorScale(label));
//       this.embeddingConfig.size.push(60);
//       this.embeddingConfig.symbol.push("diamond");
//       this.embeddingConfig.strokeWidth.push(4);
//       this.embeddingConfig.opacity.push(1);
//     });
//   }

//   private render() {
//     this.scatterplot.setData(this.embeddingConfig.coords, {
//       color: this.embeddingConfig.color,
//       size: this.embeddingConfig.size,
//       symbol: this.embeddingConfig.symbol as any,
//       strokeColor: "#000000",
//       strokeWidth: this.embeddingConfig.strokeWidth,
//       opacity: this.embeddingConfig.opacity,
//     });

//     this.scatterplot.render();
//   }

//   private onClick(points: [number, number], epsilon: number) {
//     const activatedUnstEmb = this.unstList.length
//       ? this.unstList.map((id) => this.origEmb[id])
//       : this.unstEmb;

//     const [x, y] = points;

//     let minDist = Number.MAX_VALUE;
//     let selected = null;

//     activatedUnstEmb.forEach((d) => {
//       const distance = Math.hypot(d.x - x, d.y - y);
//       if (distance < minDist) {
//         minDist = distance;
//         selected = d.id;
//       }
//     });

//     selected = minDist < 2 * epsilon ? selected : null;

//     this.externalUpdateUnstList(selected ? [selected] : []);
//   }
// }

// export default ScatterplotRenderer;

// scatterplotRenderer.ts
import { Scatterplot } from "@/view";
import type {
  IGhostPoint,
  IOriginalPoint,
  IScale,
  TEmbeddingConfig,
} from "@/model";

class ScatterplotRenderer {
  public canvas: HTMLCanvasElement;

  private scatterplot: Scatterplot;
  private origEmb!: IOriginalPoint[];
  private unstEmb!: IOriginalPoint[];
  private ghostEmb!: IGhostPoint[];
  private scales!: IScale;
  private embeddingConfig!: TEmbeddingConfig;

  private visibility = {
    neighbors: false,
    ghosts: true,
    unstables: true,
  };

  private unstList: number[] = [];
  private externalUpdateUnstList: (idList: number[]) => void = () => {};

  constructor(canvasSize: { width: number; height: number }) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = canvasSize.width;
    this.canvas.height = canvasSize.height;

    this.scatterplot = new Scatterplot(this.canvas);
  }

  async init(updateUnstList: (idList: number[]) => void) {
    await this.scatterplot.init();
    this.externalUpdateUnstList = updateUnstList;
    this.scatterplot.setOnClick(this.onClick.bind(this));
  }

  update(
    origEmb: IOriginalPoint[],
    unstEmb: IOriginalPoint[],
    ghostEmb: IGhostPoint[],
    scales: IScale
  ) {
    this.origEmb = origEmb;
    this.unstEmb = unstEmb;
    this.ghostEmb = ghostEmb;
    this.scales = scales;

    this.rebuildEmbeddingConfig();
    this.render();
  }

  updateUnstList(unstList: number[]) {
    this.unstList = unstList;

    this.rebuildEmbeddingConfig();
    this.render();
  }

  updateVisibility(
    property: "neighbors" | "ghosts" | "unstables",
    value: boolean
  ) {
    this.visibility[property] = value;

    this.rebuildEmbeddingConfig();
    this.render();
  }

  private initializeEmbeddingConfig() {
    this.embeddingConfig = {
      coords: this.origEmb.map((d) => [d.x, d.y] as [number, number]),
      color: this.origEmb.map((d) => this.scales.colorScale(d.label)),
      size: this.origEmb.map((_) => 2),
      symbol: this.origEmb.map((_) => "circle"),
      opacity: this.origEmb.map((_) => 1),
      strokeWidth: this.origEmb.map((_) => 0),
    };
  }

  private rebuildEmbeddingConfig() {
    this.initializeEmbeddingConfig();

    if (this.visibility.neighbors) this.addNeighborEmbedding();
    if (this.visibility.ghosts) this.addGhostEmbedding();
    if (this.visibility.unstables) this.addUnstEmbedding();

    this.render();
  }

  private addUnstEmbedding() {
    const activatedUnstEmb = this.unstList.length
      ? this.unstList.map((id) => this.origEmb[id])
      : this.unstEmb;

    activatedUnstEmb.forEach((d) => {
      this.embeddingConfig.opacity[d.id] = 0;

      this.embeddingConfig.coords.push([d.x, d.y]);
      this.embeddingConfig.color.push(this.scales.colorScale(d.label));
      this.embeddingConfig.size.push(35);
      this.embeddingConfig.symbol.push("cross");
      this.embeddingConfig.strokeWidth.push(4);
      this.embeddingConfig.opacity.push(1);
    });
  }

  private addGhostEmbedding() {
    if (this.unstList.length === 0) return;

    this.unstList.forEach((id) => {
      const { coords, label } = this.ghostEmb[id];
      coords.forEach((coord) => {
        this.embeddingConfig.coords.push([coord.x, coord.y]);
        this.embeddingConfig.color.push(
          this.scales.ghostColorScale(label as string)(coord.r)
        );
        this.embeddingConfig.size.push(35);
        this.embeddingConfig.symbol.push("triangle");
        this.embeddingConfig.strokeWidth.push(3);
        this.embeddingConfig.opacity.push(1);
      });
    });
  }

  private addNeighborEmbedding() {
    if (this.unstList.length === 0) return;

    const activatedNeighborIds = new Set<number>(
      this.unstList.flatMap((id) => this.origEmb[id].neighbors)
    );

    activatedNeighborIds.forEach((id) => {
      const { x, y, label } = this.origEmb[id];
      this.embeddingConfig.coords.push([x, y]);
      this.embeddingConfig.color.push(this.scales.colorScale(label));
      this.embeddingConfig.size.push(35);
      this.embeddingConfig.symbol.push("diamond");
      this.embeddingConfig.strokeWidth.push(3);
      this.embeddingConfig.opacity.push(1);
    });
  }

  private render() {
    this.scatterplot.setData(this.embeddingConfig.coords, {
      color: this.embeddingConfig.color,
      size: this.embeddingConfig.size,
      symbol: this.embeddingConfig.symbol as any,
      strokeColor: "#000000",
      strokeWidth: this.embeddingConfig.strokeWidth,
      opacity: this.embeddingConfig.opacity,
    });

    this.scatterplot.render();
  }

  private onClick(points: [number, number], epsilon: number) {
    const activatedUnstEmb = this.unstList.length
      ? this.unstList.map((id) => this.origEmb[id])
      : this.unstEmb;

    const [x, y] = points;

    let minDist = Number.MAX_VALUE;
    let selected = null;

    activatedUnstEmb.forEach((d) => {
      const distance = Math.hypot(d.x - x, d.y - y);
      if (distance < minDist) {
        minDist = distance;
        selected = d.id;
      }
    });

    selected = minDist < 2 * epsilon ? selected : null;

    this.externalUpdateUnstList(selected ? [selected] : []);
  }
}

export default ScatterplotRenderer;
