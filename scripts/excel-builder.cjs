const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 implementation
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
}

function calculateCrc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

function createZipBuffer(entries) {
    const localHeaders = [];
    const centralHeaders = [];
    let offset = 0;

    for (const entry of entries) {
        const nameBuf = Buffer.from(entry.name.replace(/\\/g, '/'), 'utf8');
        const rawData = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
        const uncompressedSize = rawData.length;
        const crc = calculateCrc32(rawData);

        // Compress using deflateRaw
        const compressedData = zlib.deflateRawSync(rawData, { level: 6 });
        const compressedSize = compressedData.length;

        // Local File Header (30 bytes + nameBuf.length)
        const localHeader = Buffer.alloc(30 + nameBuf.length);
        localHeader.writeUInt32LE(0x04034b50, 0); // signature
        localHeader.writeUInt16LE(20, 4);         // version needed: 2.0
        localHeader.writeUInt16LE(0, 6);          // flags
        localHeader.writeUInt16LE(8, 8);          // compression method: deflate
        localHeader.writeUInt16LE(0, 10);         // time
        localHeader.writeUInt16LE(0, 12);         // date
        localHeader.writeUInt32LE(crc, 14);       // crc32
        localHeader.writeUInt32LE(compressedSize, 18);   // comp size
        localHeader.writeUInt32LE(uncompressedSize, 22); // uncomp size
        localHeader.writeUInt16LE(nameBuf.length, 26);   // filename length
        localHeader.writeUInt16LE(0, 28);         // extra field length
        nameBuf.copy(localHeader, 30);

        localHeaders.push(localHeader, compressedData);

        // Central Directory Header (46 bytes + nameBuf.length)
        const centralHeader = Buffer.alloc(46 + nameBuf.length);
        centralHeader.writeUInt32LE(0x02014b50, 0); // signature
        centralHeader.writeUInt16LE(20, 4);          // version made by
        centralHeader.writeUInt16LE(20, 6);          // version needed
        centralHeader.writeUInt16LE(0, 8);           // flags
        centralHeader.writeUInt16LE(8, 10);          // compression: deflate
        centralHeader.writeUInt16LE(0, 12);          // time
        centralHeader.writeUInt16LE(0, 14);          // date
        centralHeader.writeUInt32LE(crc, 16);        // crc32
        centralHeader.writeUInt32LE(compressedSize, 20);
        centralHeader.writeUInt32LE(uncompressedSize, 24);
        centralHeader.writeUInt16LE(nameBuf.length, 28);
        centralHeader.writeUInt16LE(0, 30);          // extra len
        centralHeader.writeUInt16LE(0, 32);          // comment len
        centralHeader.writeUInt16LE(0, 34);          // disk num start
        centralHeader.writeUInt16LE(0, 36);          // internal attrs
        centralHeader.writeUInt32LE(0, 38);          // external attrs
        centralHeader.writeUInt32LE(offset, 42);     // relative offset of local header
        nameBuf.copy(centralHeader, 46);

        centralHeaders.push(centralHeader);
        offset += localHeader.length + compressedData.length;
    }

    const centralDirOffset = offset;
    let centralDirSize = 0;
    for (const ch of centralHeaders) centralDirSize += ch.length;

    // End of Central Directory Record (22 bytes)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);           // signature
    eocd.writeUInt16LE(0, 4);                     // disk number
    eocd.writeUInt16LE(0, 6);                     // disk with start of central dir
    eocd.writeUInt16LE(entries.length, 8);        // total entries on this disk
    eocd.writeUInt16LE(entries.length, 10);       // total entries
    eocd.writeUInt32LE(centralDirSize, 12);       // size of central dir
    eocd.writeUInt32LE(centralDirOffset, 16);     // offset of central dir
    eocd.writeUInt16LE(0, 20);                    // comment length

    return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

function escapeXml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function colName(n) {
    let s = '';
    while (n >= 0) {
        s = String.fromCharCode((n % 26) + 65) + s;
        n = Math.floor(n / 26) - 1;
    }
    return s;
}

function createWorkbook(sheets, outputPath) {
    const absOutputPath = path.resolve(outputPath);
    const outputDir = path.dirname(absOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const entries = [];

    // 1. [Content_Types].xml
    let contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>\n`;

    sheets.forEach((_, idx) => {
        contentTypes += `  <Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n`;
    });
    contentTypes += `</Types>`;
    entries.push({ name: '[Content_Types].xml', data: contentTypes });

    // 2. _rels/.rels
    const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
    entries.push({ name: '_rels/.rels', data: rootRels });

    // 3. xl/workbook.xml
    let workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>\n`;
    sheets.forEach((sheet, idx) => {
        workbookXml += `    <sheet name="${escapeXml(sheet.name.substring(0, 31))}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>\n`;
    });
    workbookXml += `  </sheets>
</workbook>`;
    entries.push({ name: 'xl/workbook.xml', data: workbookXml });

    // 4. xl/_rels/workbook.xml.rels
    let wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n`;
    sheets.forEach((_, idx) => {
        wbRels += `  <Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>\n`;
    });
    wbRels += `  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
    entries.push({ name: 'xl/_rels/workbook.xml.rels', data: wbRels });

    // 5. xl/styles.xml
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="10"/><name val="Segoe UI"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Segoe UI"/></font>
    <font><b/><sz val="11"/><name val="Segoe UI"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E293B"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`;
    entries.push({ name: 'xl/styles.xml', data: stylesXml });

    // 6. Worksheets
    sheets.forEach((sheet, sIdx) => {
        let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>\n`;

        sheet.rows.forEach((row, rIdx) => {
            const rowNum = rIdx + 1;
            const isHeader = rIdx === 0;
            const styleIdx = isHeader ? 1 : 0;
            sheetXml += `    <row r="${rowNum}">\n`;
            row.forEach((cellVal, cIdx) => {
                const cellRef = colName(cIdx) + rowNum;
                if (typeof cellVal === 'number') {
                    sheetXml += `      <c r="${cellRef}" s="${styleIdx}"><v>${cellVal}</v></c>\n`;
                } else {
                    sheetXml += `      <c r="${cellRef}" t="inlineStr" s="${styleIdx}"><is><t>${escapeXml(cellVal)}</t></is></c>\n`;
                }
            });
            sheetXml += `    </row>\n`;
        });

        sheetXml += `  </sheetData>
</worksheet>`;
        entries.push({ name: `xl/worksheets/sheet${sIdx + 1}.xml`, data: sheetXml });
    });

    const zipBuffer = createZipBuffer(entries);
    fs.writeFileSync(absOutputPath, zipBuffer);
    console.log(`Generated (Pure Node.js OpenXML): ${absOutputPath}`);
}

module.exports = { createWorkbook };
