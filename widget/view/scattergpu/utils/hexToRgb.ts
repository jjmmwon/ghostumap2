export function hexToRgb(hex: string): [number, number, number] {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [0, 0, 0];

  ctx.fillStyle = hex;
  const computed = ctx.fillStyle;
  if (computed.startsWith("#")) {
    const bigint = parseInt(computed.slice(1), 16);
    return [
      ((bigint >> 16) & 255) / 255,
      ((bigint >> 8) & 255) / 255,
      (bigint & 255) / 255,
    ];
  }
  return [0, 0, 0]; // Default to black if invalid
}
