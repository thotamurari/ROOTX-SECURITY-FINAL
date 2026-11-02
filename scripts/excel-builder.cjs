const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

    const tempDir = path.join(outputDir, 'temp_xlsx_' + Date.now() + '_' + Math.floor(Math.random() * 10000));
    fs.mkdirSync(path.join(tempDir, '_rels'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'xl', '_rels'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'xl', 'worksheets'), { recursive: true });

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
    fs.writeFileSync(path.join(tempDir, '[Content_Types].xml'), contentTypes, 'utf8');

    // 2. _rels/.rels
    const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
    fs.writeFileSync(path.join(tempDir, '_rels', '.rels'), rootRels, 'utf8');

    // 3. xl/workbook.xml
    let workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>\n`;
    sheets.forEach((sheet, idx) => {
        workbookXml += `    <sheet name="${escapeXml(sheet.name.substring(0, 31))}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>\n`;
    });
    workbookXml += `  </sheets>
</workbook>`;
    fs.writeFileSync(path.join(tempDir, 'xl', 'workbook.xml'), workbookXml, 'utf8');

    // 4. xl/_rels/workbook.xml.rels
    let wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n`;
    sheets.forEach((_, idx) => {
        wbRels += `  <Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>\n`;
    });
    wbRels += `  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
    fs.writeFileSync(path.join(tempDir, 'xl', '_rels', 'workbook.xml.rels'), wbRels, 'utf8');

    // 5. xl/styles.xml (styled headers, clean fonts)
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
    fs.writeFileSync(path.join(tempDir, 'xl', 'styles.xml'), stylesXml, 'utf8');

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
        fs.writeFileSync(path.join(tempDir, 'xl', 'worksheets', `sheet${sIdx + 1}.xml`), sheetXml, 'utf8');
    });

    const tempZip = absOutputPath.replace(/\.xlsx$/i, '.zip');
    if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);
    if (fs.existsSync(absOutputPath)) fs.unlinkSync(absOutputPath);

    execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${tempZip}' -Force; Move-Item -Path '${tempZip}' -Destination '${absOutputPath}' -Force"`);

    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`Generated: ${absOutputPath}`);
}

module.exports = { createWorkbook };
