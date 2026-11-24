const formats = [
  ['json', 'JSON'],
  ['csv', 'CSV'],
  ['xml', 'XML'],
  ['md', 'Markdown'],
  ['pdf', 'PDF'],
];

export default function ExportLinks({ id, label }) {
  const idPart = id ? `&id=${id}` : '';
  return (
    <div>
      <p className="mb-2 text-sm text-ink-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {formats.map(([format, name]) => (
          <a key={format} className="btn btn-sm" href={`/api/export?format=${format}${idPart}`} download>
            {name}
          </a>
        ))}
      </div>
    </div>
  );
}
