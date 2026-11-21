const fs = require('node:fs/promises');
const path = require('node:path');
const { deflateRawSync } = require('node:zlib');

const root = path.resolve(__dirname, '..');
const requirementPath = path.join(root, 'Requirements.md');
const outputPath = path.join(root, 'RTM.xlsx');

const testMappings = {
  'REQ-01': ['tests/api/meter.api.spec.ts', 'returns a healthy status'],
  'REQ-02': ['tests/api/meter.api.spec.ts', 'lists the seeded meters'],
  'REQ-03': ['tests/api/meter.api.spec.ts', 'gets one meter by ID'],
  'REQ-04': ['tests/api/meter.api.spec.ts', 'creates a meter for an existing customer'],
  'REQ-05': ['tests/api/meter.api.spec.ts', 'rejects a negative meter reading'],
  'REQ-06': ['tests/api/meter.api.spec.ts', 'returns 404 for an unknown meter'],
  'REQ-07': ['tests/ui/portal.spec.ts', 'signs in and views meter and customer details'],
  'REQ-08': ['tests/ui/portal.spec.ts', 'signs in and views meter and customer details'],
  'REQ-09': ['tests/ui/portal.spec.ts', 'signs in and views meter and customer details'],
  'REQ-10': ['tests/ui/portal.spec.ts', 'signs in and views meter and customer details'],
};

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return crc >>> 0;
});

function createZip(files) {
  const localRecords = [];
  const centralRecords = [];
  let offset = 0;
  const time = 0;
  const date = 0x21;

  for (const [fileName, content] of Object.entries(files)) {
    const name = Buffer.from(fileName, 'utf8');
    const data = Buffer.from(content, 'utf8');
    const compressed = deflateRawSync(data);
    const checksum = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    name.copy(local, 30);
    localRecords.push(local, compressed);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centralRecords.push(central);
    offset += local.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralRecords);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(centralRecords.length, 8);
  end.writeUInt16LE(centralRecords.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localRecords, centralDirectory, end]);
}

function makeWorksheet(requirements) {
  const headers = ['Requirement ID', 'Requirement', 'Test file', 'Test case', 'Coverage status'];
  const rows = [headers, ...requirements.map(({ id, text }) => [
    id,
    text,
    testMappings[id][0],
    testMappings[id][1],
    'Implemented',
  ])];
  const columnNames = ['A', 'B', 'C', 'D', 'E'];
  const rowXml = rows.map((row, rowIndex) => {
    const number = rowIndex + 1;
    const cells = row.map((value, columnIndex) => {
      const style = rowIndex === 0 ? ' s="1"' : '';
      return `<c r="${columnNames[columnIndex]}${number}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
    }).join('');
    return `<row r="${number}">${cells}</row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:E${rows.length}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="92" customWidth="1"/><col min="3" max="3" width="42" customWidth="1"/><col min="4" max="4" width="55" customWidth="1"/><col min="5" max="5" width="20" customWidth="1"/></cols>
  <sheetData>${rowXml}</sheetData>
  <autoFilter ref="A1:E${rows.length}"/>
</worksheet>`;
}

async function main() {
  const markdown = await fs.readFile(requirementPath, 'utf8');
  const requirements = [...markdown.matchAll(/^\d+\.\s+\[(REQ-\d+)\]\s+(.+)$/gm)]
    .map(([, id, text]) => ({ id, text }));

  if (requirements.length !== 10) {
    throw new Error(`Expected 10 numbered requirements, found ${requirements.length}.`);
  }

  const missingMappings = requirements
    .filter(({ id }) => !testMappings[id])
    .map(({ id }) => id);
  if (missingMappings.length > 0) {
    throw new Error(`Missing test mappings for: ${missingMappings.join(', ')}`);
  }

  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Requirements Traceability" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>
</styleSheet>`,
    'xl/worksheets/sheet1.xml': makeWorksheet(requirements),
  };

  await fs.writeFile(outputPath, createZip(files));
  console.log(`Wrote ${path.relative(root, outputPath)} with ${requirements.length} requirement mappings.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
