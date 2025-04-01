// global.d.ts 또는 typings.d.ts
declare module "*.wgsl?raw" {
  const content: string;
  export default content;
}
