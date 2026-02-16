// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')

export async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  const result = await pdfParse(Buffer.from(buffer))
  return result.text
}
