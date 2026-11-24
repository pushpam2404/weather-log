import PDFDocument from 'pdfkit';

const dayColumns = ['date', 'tmin', 'tmax', 'tmean', 'precip', 'condition'];
const dayHeadings = ['Date', 'Min °C', 'Max °C', 'Mean °C', 'Rain mm', 'Condition'];
const infoFields = ['query', 'city', 'country', 'lat', 'lon', 'start_date', 'end_date', 'notes', 'created_at', 'updated_at'];

const cell = (v) => (v === null || v === undefined ? '' : String(v));

function toJson(records, single) {
  return JSON.stringify(single ? records[0] : records, null, 2);
}

// Text that starts with = + - @ can run as a formula when the file opens in Excel.
const safeText = (v) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
const csvCell = (v) => {
  const s = cell(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function toCsv(records) {
  const textFields = new Set(['query', 'city', 'country', 'notes', 'condition']);
  const header = ['id', ...infoFields, ...dayColumns];
  const lines = [header.join(',')];
  for (const r of records) {
    for (const day of r.daily) {
      const row = { ...r, ...day };
      lines.push(
        header
          .map((h) => csvCell(textFields.has(h) ? safeText(cell(row[h])) : row[h]))
          .join(','),
      );
    }
  }
  return lines.join('\r\n') + '\r\n';
}

// XML 1.0 forbids these control characters, even escaped.
const xmlBad = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const xmlEscape = (v) =>
  cell(v)
    .replace(xmlBad, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

function toXml(records) {
  const out = ['<?xml version="1.0" encoding="UTF-8"?>', `<weather_queries count="${records.length}">`];
  for (const r of records) {
    out.push(`  <weather_query id="${r.id}">`);
    for (const f of infoFields) out.push(`    <${f}>${xmlEscape(r[f])}</${f}>`);
    out.push('    <daily>');
    for (const day of r.daily) {
      out.push(`      <day date="${xmlEscape(day.date)}">`);
      for (const f of dayColumns.slice(1)) out.push(`        <${f}>${xmlEscape(day[f])}</${f}>`);
      out.push('      </day>');
    }
    out.push('    </daily>', '  </weather_query>');
  }
  out.push('</weather_queries>');
  return out.join('\n') + '\n';
}

const mdText = (v) => cell(v).replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');

function toMarkdown(records) {
  const out = ['# Saved weather queries', '', `${records.length} record${records.length === 1 ? '' : 's'}.`, ''];
  for (const r of records) {
    const place = [r.city, r.country].filter(Boolean).join(', ');
    out.push(`## #${r.id} ${mdText(place)}`, '');
    out.push(`- Searched for: ${mdText(r.query)}`);
    out.push(`- Coordinates: ${r.lat}, ${r.lon}`);
    out.push(`- Dates: ${r.start_date} to ${r.end_date}`);
    if (r.notes) out.push(`- Notes: ${mdText(r.notes)}`);
    out.push(`- Saved: ${r.created_at} (updated ${r.updated_at})`, '');
    out.push(`| ${dayHeadings.join(' | ')} |`, `| ${dayHeadings.map(() => '---').join(' | ')} |`);
    for (const day of r.daily) out.push(`| ${dayColumns.map((c) => mdText(day[c])).join(' | ')} |`);
    out.push('');
  }
  return out.join('\n');
}

function toPdf(records) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: 'Saved weather queries' } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const bottom = () => doc.page.height - doc.page.margins.bottom;
    const colX = [0, 85, 140, 195, 255, 315].map((x) => left + x);
    const row = (cells, font) => {
      if (doc.y + 16 > bottom()) doc.addPage();
      const y = doc.y;
      doc.font(font).fontSize(9);
      cells.forEach((c, i) => doc.text(c, colX[i], y, { width: (colX[i + 1] ?? 547) - colX[i] - 4, lineBreak: false }));
      doc.y = y + 15;
      doc.x = left;
    };

    doc.font('Helvetica-Bold').fontSize(18).text('Saved weather queries');
    doc.font('Helvetica').fontSize(9).fillColor('#555').text(`${records.length} record${records.length === 1 ? '' : 's'}`);
    doc.fillColor('#000');

    if (!records.length) doc.moveDown().fontSize(11).text('No saved queries.');

    for (const r of records) {
      if (doc.y + 90 > bottom()) doc.addPage();
      const place = [r.city, r.country].filter(Boolean).join(', ');
      doc.moveDown(1.2).font('Helvetica-Bold').fontSize(13).text(`#${r.id}  ${place}`, left);
      doc.font('Helvetica').fontSize(9).fillColor('#333');
      doc.text(`Searched for: ${r.query}`);
      doc.text(`Coordinates: ${r.lat}, ${r.lon}`);
      doc.text(`Dates: ${r.start_date} to ${r.end_date}`);
      if (r.notes) doc.text(`Notes: ${r.notes}`);
      doc.text(`Saved: ${r.created_at} (updated ${r.updated_at})`);
      doc.fillColor('#000').moveDown(0.5);
      row(dayHeadings, 'Helvetica-Bold');
      for (const day of r.daily) row(dayColumns.map((c) => cell(day[c])), 'Helvetica');
    }
    doc.end();
  });
}

export const formats = {
  json: { type: 'application/json; charset=utf-8', ext: 'json', render: toJson },
  csv: { type: 'text/csv; charset=utf-8', ext: 'csv', render: toCsv },
  xml: { type: 'application/xml; charset=utf-8', ext: 'xml', render: toXml },
  md: { type: 'text/markdown; charset=utf-8', ext: 'md', render: toMarkdown },
  pdf: { type: 'application/pdf', ext: 'pdf', render: toPdf },
};
