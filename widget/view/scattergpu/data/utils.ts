export function getScale(values: number[]): {
  min: number;
  max: number;
  range: number;
} {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, range: max - min || 1 }; // 0 나누기 방지
}
