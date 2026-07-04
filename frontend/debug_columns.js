/**
 * Debug script: tests what ExcelJS ws.columnCount returns after building
 * a 3-column custom report, and shows the exact column state before/after splice.
 */

const ExcelJS = require('exceljs');

function borderStyle() {
  const thin = { style: 'thin', color: { argb: 'FF000000' } };
  return { top: thin, left: thin, bottom: thin, right: thin };
}

function applyBorder(row, numCols) {
  for (let c = 1; c <= numCols; c++) {
    row.getCell(c).border = borderStyle();
  }
}

function styledTitleRow(ws, text, numCols, fontSize) {
  const row = ws.addRow([text]);
  ws.mergeCells(row.number, 1, row.number, numCols);
  const cell = row.getCell(1);
  cell.value = text;
  cell.font = { name: 'Calibri', size: fontSize, bold: fontSize >= 20 };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  row.height = fontSize >= 20 ? 42 : 26;
  applyBorder(row, numCols);
  return row;
}

function styledMetaRow(ws, label, value, numCols) {
  const row = ws.addRow([label]);
  row.getCell(2).value = value;
  if (numCols > 1) ws.mergeCells(row.number, 2, row.number, numCols);
  row.getCell(1).font = { name: 'Calibri', size: 11, bold: true };
  row.getCell(2).font = { name: 'Calibri', size: 11 };
  row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
  applyBorder(row, numCols);
  row.height = 20;
  return row;
}

function styledHeaderRow(ws, headers) {
  const row = ws.addRow(headers);
  for (let c = 1; c <= headers.length; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = c >= 3
      ? { horizontal: 'right', vertical: 'middle' }
      : { horizontal: 'left', vertical: 'middle' };
    cell.border = borderStyle();
  }
  row.height = 24;
  return row;
}

function styledDataRow(ws, values, numCols, opts = {}) {
  const row = ws.addRow(values);
  for (let c = 1; c <= values.length; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Calibri', size: 11, bold: !!opts.bold };
    cell.border = borderStyle();
    cell.alignment = (c >= 3 && typeof cell.value === 'number')
      ? { horizontal: 'right', vertical: 'middle' }
      : { horizontal: 'left', vertical: 'middle' };
    if (opts.fill) cell.fill = opts.fill;
  }
  row.height = 18;
  return row;
}

async function runTest() {
  // Simulate a breakfast-only custom report
  const NUM_COLS = 3; // ['Batch ID', 'Member Name', 'Breakfast (idlii)']
  const headers = ['Batch ID', 'Member Name', 'Breakfast (idlii)'];

  const wb = new ExcelJS.Workbook();
  wb.creator = 'VJ Test';
  const ws = wb.addWorksheet('Orders');

  // Dynamic column widths — same as current code
  const colWidths = [16, 24, 28, 28, 28].slice(0, NUM_COLS);
  ws.columns = colWidths.map(w => ({ width: w }));

  console.log('After ws.columns set, columnCount =', ws.columnCount);

  styledTitleRow(ws, 'VJ Home Foods', NUM_COLS, 24);
  console.log('After styledTitleRow(1), columnCount =', ws.columnCount);

  styledTitleRow(ws, 'Custom Order Report', NUM_COLS, 14);
  console.log('After styledTitleRow(2), columnCount =', ws.columnCount);

  styledMetaRow(ws, 'Date of Order:', '02 Jun 2026 (Tuesday)', NUM_COLS);
  console.log('After styledMetaRow(1), columnCount =', ws.columnCount);

  styledMetaRow(ws, 'Generated:', new Date().toLocaleString('en-IN'), NUM_COLS);
  console.log('After styledMetaRow(2), columnCount =', ws.columnCount);

  ws.addRow([]); // blank separator
  console.log('After blank separator row, columnCount =', ws.columnCount);

  styledHeaderRow(ws, headers);
  console.log('After styledHeaderRow, columnCount =', ws.columnCount);

  // Sample data rows
  const data = [
    ['B001', 'AJAY', 8],
    ['B002', 'RAVI', 3],
    ['B003', 'MEENA', 2],
  ];
  data.forEach(row => {
    styledDataRow(ws, row, NUM_COLS);
  });
  console.log('After data rows, columnCount =', ws.columnCount);

  // Totals row
  styledDataRow(ws, ['TOTAL', '', 13], NUM_COLS, {
    bold: true,
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
  });
  console.log('After totals row, columnCount =', ws.columnCount);

  // Current splice logic
  const extraCols = ws.columnCount - NUM_COLS;
  console.log('\nextraColsToSplice =', extraCols);
  if (extraCols > 0) ws.spliceColumns(NUM_COLS + 1, extraCols);
  console.log('After splice, columnCount =', ws.columnCount);

  // Write to file for inspection
  const outputPath = '/Users/ruuban/.gemini/antigravity/brain/25db5690-53e1-4300-8cbc-6e8a111e5433/scratch/test_output.xlsx';
  await wb.xlsx.writeFile(outputPath);
  console.log('\nFile written to:', outputPath);

  // Verify column count in the written file by reading it back
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.readFile(outputPath);
  const ws2 = wb2.getWorksheet('Orders');
  console.log('Re-read file columnCount =', ws2.columnCount);
  console.log('Re-read file actualColumnCount =', ws2.actualColumnCount);
  
  // Print column widths to see which columns exist
  for (let c = 1; c <= (ws2.columnCount || 5); c++) {
    const col = ws2.getColumn(c);
    console.log(`  Column ${c} (${String.fromCharCode(64+c)}): width=${col.width}, defn=${JSON.stringify(col.defn)}`);
  }
}

runTest().catch(console.error);
