import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
} from 'docx'

interface ParsedLine {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'list' | 'code'
  content: string
  level?: number
}

function parseMarkdown(markdown: string): ParsedLine[] {
  const lines = markdown.split('\n')
  const parsed: ParsedLine[] = []

  let inCodeBlock = false

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) {
      parsed.push({ type: 'code', content: line })
      continue
    }

    if (line.startsWith('# ')) {
      parsed.push({ type: 'h1', content: line.slice(2) })
    } else if (line.startsWith('## ')) {
      parsed.push({ type: 'h2', content: line.slice(3) })
    } else if (line.startsWith('### ')) {
      parsed.push({ type: 'h3', content: line.slice(4) })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      parsed.push({ type: 'list', content: line.slice(2), level: 0 })
    } else if (line.startsWith('  - ') || line.startsWith('  * ')) {
      parsed.push({ type: 'list', content: line.slice(4), level: 1 })
    } else if (line.match(/^\d+\. /)) {
      parsed.push({ type: 'list', content: line.replace(/^\d+\. /, ''), level: 0 })
    } else if (line.trim()) {
      parsed.push({ type: 'paragraph', content: line })
    }
  }

  return parsed
}

function cleanText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\[[ x]\]/g, '•')
}

export async function markdownToDocx(markdown: string, title: string): Promise<Buffer> {
  const parsed = parseMarkdown(markdown)

  const children: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ]

  for (const line of parsed) {
    const cleanedContent = cleanText(line.content)

    switch (line.type) {
      case 'h1':
        children.push(
          new Paragraph({
            text: cleanedContent,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        )
        break

      case 'h2':
        children.push(
          new Paragraph({
            text: cleanedContent,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        )
        break

      case 'h3':
        children.push(
          new Paragraph({
            text: cleanedContent,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        )
        break

      case 'list':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${line.level ? '  ' : ''}• ${cleanedContent}`,
              }),
            ],
            spacing: { before: 50, after: 50 },
            indent: { left: (line.level || 0) * 720 },
          })
        )
        break

      case 'code':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanedContent,
                font: 'Courier New',
                size: 20,
              }),
            ],
            spacing: { before: 50, after: 50 },
            indent: { left: 360 },
          })
        )
        break

      default:
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cleanedContent })],
            spacing: { before: 100, after: 100 },
          })
        )
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer)
}
