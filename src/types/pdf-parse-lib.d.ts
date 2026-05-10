// pdf-parse@1.1.1's published @types only declares the package root, but we
// import the inner lib directly to dodge a debug-block bug in index.js.
// This shim shares the same shape as @types/pdf-parse for the inner module.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfData {
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    text: string;
    version: string;
  }
  function pdfParse(dataBuffer: Buffer, options?: unknown): Promise<PdfData>;
  export default pdfParse;
}
