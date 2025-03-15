export type TPoints = number[][] | { x: number[]; y: number[] };
export type TParams<T> = T | T[];
export type TSymbols = "circle" | "cross" | "diamond" | "square" | "triangle";

export interface PointStyleOptions {
  color?: TParams<string>;
  size?: TParams<number>;
  opacity?: TParams<number>;
  strokeColor?: TParams<string>;
  strokeWidth?: TParams<number>;
  symbol?: TParams<TSymbols>;
}

export interface TData {
  vertex: Float32Array;
  color: Float32Array;
  size: Float32Array;
  strokeColor: Float32Array;
  strokeWidth: Float32Array;
  offset: Float32Array;
  symbol: Uint32Array;
}
