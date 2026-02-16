import ExcelJS from 'exceljs'

interface ChiffrageFeature {
  name: string
  role: string
  days: number
  complexity: number
  comment: string
}

interface ChiffrageSection {
  name: string
  features: ChiffrageFeature[]
}

interface ChiffrageRole {
  name: string
  description: string
}

interface ChiffrageData {
  sections: ChiffrageSection[]
  roles: ChiffrageRole[]
}

const COLORS = {
  primary: '1B4F72',      // Bleu foncé
  primaryLight: 'D6EAF8', // Bleu clair
  header: '2C3E50',       // Gris foncé
  headerText: 'FFFFFF',   // Blanc
  subtotal: 'EBF5FB',     // Bleu très clair
  total: '1B4F72',        // Bleu foncé
  totalText: 'FFFFFF',    // Blanc
  sectionBg: 'F8F9FA',    // Gris très clair
  border: 'BDC3C7',       // Gris border
}

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.border } },
  left: { style: 'thin', color: { argb: COLORS.border } },
  bottom: { style: 'thin', color: { argb: COLORS.border } },
  right: { style: 'thin', color: { argb: COLORS.border } },
}

function styleHeaderRow(row: ExcelJS.Row, colCount: number) {
  row.height = 28
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= colCount) {
      cell.font = { bold: true, color: { argb: COLORS.headerText }, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = BORDER_THIN
    }
  })
}

function styleSubtotalRow(row: ExcelJS.Row, colCount: number) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= colCount) {
      cell.font = { bold: true, size: 10, color: { argb: COLORS.primary } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.subtotal } }
      cell.border = BORDER_THIN
    }
  })
}

function styleTotalRow(row: ExcelJS.Row, colCount: number) {
  row.height = 26
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= colCount) {
      cell.font = { bold: true, color: { argb: COLORS.totalText }, size: 12 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.total } }
      cell.alignment = { vertical: 'middle' }
      cell.border = BORDER_THIN
    }
  })
}

function styleDataRow(row: ExcelJS.Row, colCount: number, isAlt: boolean) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= colCount) {
      cell.font = { size: 10 }
      cell.border = BORDER_THIN
      cell.alignment = { vertical: 'middle', wrapText: true }
      if (isAlt) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } }
      }
    }
  })
}

function formatCurrency(cell: ExcelJS.Cell) {
  cell.numFmt = '#,##0.00 €'
  cell.alignment = { vertical: 'middle', horizontal: 'right' }
}

function formatNumber(cell: ExcelJS.Cell) {
  cell.numFmt = '#,##0.00'
  cell.alignment = { vertical: 'middle', horizontal: 'center' }
}

export async function chiffrageToXlsx(jsonContent: string, tjm: number): Promise<Buffer> {
  const data: ChiffrageData = JSON.parse(jsonContent)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'DocGen'
  wb.created = new Date()

  // ===== Sheet 1: Fonctionnalités =====
  const wsFeat = wb.addWorksheet('Fonctionnalités', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  wsFeat.columns = [
    { header: 'Section', key: 'section', width: 28 },
    { header: 'Fonctionnalité', key: 'feature', width: 40 },
    { header: 'Rôle', key: 'role', width: 20 },
    { header: 'Jours estimés', key: 'days', width: 16 },
    { header: 'Complexité', key: 'complexity', width: 14 },
    { header: 'Total Jours', key: 'totalDays', width: 14 },
    { header: 'Total Prix (€)', key: 'totalPrice', width: 18 },
    { header: 'Commentaire', key: 'comment', width: 35 },
  ]

  styleHeaderRow(wsFeat.getRow(1), 8)

  let grandTotalDays = 0
  let grandTotalPrice = 0
  let rowIndex = 1
  let sectionIndex = 0

  for (const section of data.sections) {
    let sectionTotalDays = 0
    let sectionTotalPrice = 0
    const isAltSection = sectionIndex % 2 === 1

    for (const feat of section.features) {
      const totalDays = feat.days * feat.complexity
      const totalPrice = totalDays * tjm
      sectionTotalDays += totalDays
      sectionTotalPrice += totalPrice

      const row = wsFeat.addRow({
        section: section.name,
        feature: feat.name,
        role: feat.role,
        days: feat.days,
        complexity: feat.complexity,
        totalDays: Math.round(totalDays * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
        comment: feat.comment || '',
      })
      rowIndex++
      styleDataRow(row, 8, isAltSection)
      formatNumber(row.getCell(4))
      formatNumber(row.getCell(5))
      formatNumber(row.getCell(6))
      formatCurrency(row.getCell(7))
    }

    // Sous-total section
    const subRow = wsFeat.addRow({
      section: '',
      feature: `Sous-total ${section.name}`,
      role: '',
      days: '',
      complexity: '',
      totalDays: Math.round(sectionTotalDays * 100) / 100,
      totalPrice: Math.round(sectionTotalPrice * 100) / 100,
      comment: '',
    })
    rowIndex++
    styleSubtotalRow(subRow, 8)
    formatNumber(subRow.getCell(6))
    formatCurrency(subRow.getCell(7))

    grandTotalDays += sectionTotalDays
    grandTotalPrice += sectionTotalPrice
    sectionIndex++
  }

  // Ligne vide
  wsFeat.addRow({})
  rowIndex++

  // Total général
  const totalRow = wsFeat.addRow({
    section: '',
    feature: 'TOTAL GÉNÉRAL',
    role: '',
    days: '',
    complexity: '',
    totalDays: Math.round(grandTotalDays * 100) / 100,
    totalPrice: Math.round(grandTotalPrice * 100) / 100,
    comment: '',
  })
  styleTotalRow(totalRow, 8)
  formatNumber(totalRow.getCell(6))
  formatCurrency(totalRow.getCell(7))

  // Autofilter sur les headers
  wsFeat.autoFilter = { from: 'A1', to: 'H1' }

  // ===== Sheet 2: Rôles utilisateurs =====
  const wsRoles = wb.addWorksheet('Rôles utilisateurs')

  wsRoles.columns = [
    { header: 'Rôle', key: 'role', width: 25 },
    { header: 'Description', key: 'description', width: 65 },
  ]

  styleHeaderRow(wsRoles.getRow(1), 2)

  data.roles.forEach((role, i) => {
    const row = wsRoles.addRow({ role: role.name, description: role.description })
    styleDataRow(row, 2, i % 2 === 1)
    row.getCell(1).font = { bold: true, size: 10 }
  })

  // ===== Sheet 3: Récapitulatif =====
  const wsRecap = wb.addWorksheet('Récapitulatif')

  wsRecap.columns = [
    { width: 35 },
    { width: 18 },
    { width: 20 },
  ]

  // Titre
  const titleRow = wsRecap.addRow(['RÉCAPITULATIF DU CHIFFRAGE', '', ''])
  wsRecap.mergeCells('A1:C1')
  titleRow.height = 36
  titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: COLORS.headerText } }
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } }
  titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }

  // Ligne vide
  wsRecap.addRow([])

  // TJM
  const tjmRow = wsRecap.addRow(['TJM (€/jour)', tjm, ''])
  tjmRow.getCell(1).font = { bold: true, size: 11 }
  tjmRow.getCell(2).font = { bold: true, size: 14, color: { argb: COLORS.primary } }
  tjmRow.getCell(2).numFmt = '#,##0 €'

  // Ligne vide
  wsRecap.addRow([])

  // Header sections
  const recapHeader = wsRecap.addRow(['Section', 'Total Jours', 'Total HT (€)'])
  styleHeaderRow(recapHeader, 3)

  // Sections
  data.sections.forEach((section, i) => {
    let sectionDays = 0
    for (const feat of section.features) sectionDays += feat.days * feat.complexity
    const sectionPrice = sectionDays * tjm

    const row = wsRecap.addRow([
      section.name,
      Math.round(sectionDays * 100) / 100,
      Math.round(sectionPrice * 100) / 100,
    ])
    styleDataRow(row, 3, i % 2 === 1)
    formatNumber(row.getCell(2))
    formatCurrency(row.getCell(3))
  })

  // Ligne vide
  wsRecap.addRow([])

  // Total HT
  const totalHTRow = wsRecap.addRow(['Total HT', Math.round(grandTotalDays * 100) / 100, Math.round(grandTotalPrice * 100) / 100])
  styleSubtotalRow(totalHTRow, 3)
  formatNumber(totalHTRow.getCell(2))
  formatCurrency(totalHTRow.getCell(3))

  // GDP
  const gdp = grandTotalPrice * 0.2
  const gdpRow = wsRecap.addRow(['GDP (20%)', '', Math.round(gdp * 100) / 100])
  styleDataRow(gdpRow, 3, false)
  formatCurrency(gdpRow.getCell(3))

  // Total HT + GDP
  const totalAvecGDP = grandTotalPrice + gdp
  const totalGdpRow = wsRecap.addRow(['Total HT + GDP', '', Math.round(totalAvecGDP * 100) / 100])
  styleSubtotalRow(totalGdpRow, 3)
  formatCurrency(totalGdpRow.getCell(3))

  // TVA
  const tva = totalAvecGDP * 0.2
  const tvaRow = wsRecap.addRow(['TVA (20%)', '', Math.round(tva * 100) / 100])
  styleDataRow(tvaRow, 3, false)
  formatCurrency(tvaRow.getCell(3))

  // TOTAL TTC
  const totalTTC = totalAvecGDP + tva
  const ttcRow = wsRecap.addRow(['TOTAL TTC', '', Math.round(totalTTC * 100) / 100])
  styleTotalRow(ttcRow, 3)
  formatCurrency(ttcRow.getCell(3))
  ttcRow.getCell(3).font = { bold: true, color: { argb: COLORS.totalText }, size: 14 }

  // Ligne vide
  wsRecap.addRow([])

  // Stats
  const statsData = [
    ['Total Jours-homme', Math.round(grandTotalDays * 100) / 100],
    ['Nombre de sections', data.sections.length],
    ['Nombre de fonctionnalités', data.sections.reduce((acc, s) => acc + s.features.length, 0)],
    ['Nombre de rôles', data.roles.length],
  ]
  for (const [label, value] of statsData) {
    const row = wsRecap.addRow([label, value, ''])
    row.getCell(1).font = { size: 10, color: { argb: '7F8C8D' } }
    row.getCell(2).font = { bold: true, size: 10 }
    row.getCell(2).alignment = { horizontal: 'center' }
  }

  // Générer le buffer
  const arrayBuffer = await wb.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
