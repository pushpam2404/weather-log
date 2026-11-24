import { useEffect, useState } from 'react';
import { api, num, formatDay } from './api.js';
import WeatherIcon from './WeatherIcon.jsx';
import QueryForm from './QueryForm.jsx';
import ExportLinks from './ExportLinks.jsx';

function Videos({ youtube }) {
  return (
    <div>
      {youtube.fallback && <p className="text-sm text-ink-2">{youtube.note}</p>}
      {youtube.videos.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {youtube.videos.map((v) => (
            <li key={v.id}>
              <a href={v.url} target="_blank" rel="noreferrer" className="group block">
                {v.thumbnail && (
                  <img src={v.thumbnail} alt="" loading="lazy" className="aspect-video w-full rounded-lg border border-line object-cover" />
                )}
                <span className="mt-2 block text-sm group-hover:underline">{v.title}</span>
                <span className="block text-sm text-ink-3">{v.channel}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <a className="btn btn-sm mt-4" href={youtube.searchUrl} target="_blank" rel="noreferrer">
        {youtube.linkLabel}
      </a>
    </div>
  );
}

export default function QueryDetail({ record, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [extras, setExtras] = useState(null);
  const [extrasError, setExtrasError] = useState('');

  useEffect(() => {
    let current = true;
    setExtras(null);
    setExtrasError('');
    api(`/api/queries/${record.id}/extras`)
      .then((d) => current && setExtras(d))
      .catch((err) => current && setExtrasError(err.message));
    return () => {
      current = false;
    };
  }, [record.id, record.lat, record.lon]);

  useEffect(() => {
    setEditing(false);
    setConfirming(false);
    setDeleteError('');
  }, [record.id]);

  async function remove() {
    try {
      await onDelete(record.id);
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  const place = [record.city, record.country].filter(Boolean).join(', ');

  if (editing) {
    return (
      <div className="card p-5 sm:p-6">
        <h3 className="mb-4 text-lg">Edit lookup #{record.id}</h3>
        <QueryForm
          submitLabel="Save changes"
          initial={{ location: record.query, start_date: record.start_date, end_date: record.end_date, notes: record.notes ?? '' }}
          onSubmit={async (values) => {
            await onUpdate(record.id, values);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="card divide-y divide-line">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg">{place}</h3>
            <p className="num mt-1 text-sm text-ink-3">
              #{record.id} · {record.start_date} to {record.end_date}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-sm" onClick={() => setConfirming(true)}>Delete</button>
          </div>
        </div>

        {confirming && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-paper px-3 py-2">
            <p className="text-sm">Delete this lookup? You cannot undo this.</p>
            <button className="btn btn-sm btn-primary" onClick={remove}>Delete</button>
            <button className="btn btn-sm" onClick={() => setConfirming(false)}>Keep it</button>
          </div>
        )}
        {deleteError && <p role="alert" className="error mt-3">{deleteError}</p>}

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-3">Searched for</dt><dd>{record.query}</dd></div>
          <div><dt className="text-ink-3">Coordinates</dt><dd className="num">{record.lat.toFixed(4)}, {record.lon.toFixed(4)}</dd></div>
          {record.notes && <div className="sm:col-span-2"><dt className="text-ink-3">Notes</dt><dd className="whitespace-pre-wrap">{record.notes}</dd></div>}
          <div><dt className="text-ink-3">Saved</dt><dd className="num">{record.created_at}</dd></div>
          <div><dt className="text-ink-3">Updated</dt><dd className="num">{record.updated_at}</dd></div>
        </dl>
      </div>

      <div className="p-5 sm:p-6">
        <h4 className="mb-3 text-base">Daily weather</h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-ink-3">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-normal">Date</th>
                <th className="px-3 py-2 text-right font-normal">Min °C</th>
                <th className="px-3 py-2 text-right font-normal">Max °C</th>
                <th className="px-3 py-2 text-right font-normal">Mean °C</th>
                <th className="px-3 py-2 text-right font-normal">Rain mm</th>
                <th className="py-2 pl-3 font-normal">Condition</th>
              </tr>
            </thead>
            <tbody>
              {record.daily.map((d) => (
                <tr key={d.date} className="border-b border-line last:border-b-0">
                  <td className="py-2 pr-3">{formatDay(d.date)}</td>
                  <td className="num px-3 py-2 text-right">{num(d.tmin, 1)}</td>
                  <td className="num px-3 py-2 text-right">{num(d.tmax, 1)}</td>
                  <td className="num px-3 py-2 text-right">{num(d.tmean, 1)}</td>
                  <td className="num px-3 py-2 text-right">{num(d.precip, 1)}</td>
                  <td className="py-2 pl-3">
                    <span className="flex items-center gap-2">
                      <WeatherIcon name={d.icon} className="size-5 shrink-0" />
                      {d.condition}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <h4 className="mb-3 text-base">Map</h4>
        {extrasError && <p role="alert" className="error">{extrasError}</p>}
        {!extras && !extrasError && <p className="text-sm text-ink-2">Loading map and videos…</p>}
        {extras && (
          <>
            <iframe
              title={`Map of ${place}`}
              src={extras.map.embedUrl}
              loading="lazy"
              className="h-72 w-full rounded-lg border border-line"
            />
            <a className="btn btn-sm mt-3" href={extras.map.link} target="_blank" rel="noreferrer">
              {extras.map.linkLabel}
            </a>
          </>
        )}
      </div>

      {extras && (
        <div className="p-5 sm:p-6">
          <h4 className="mb-3 text-base">Videos</h4>
          <Videos youtube={extras.youtube} />
        </div>
      )}

      <div className="p-5 sm:p-6">
        <ExportLinks id={record.id} label="Export this record" />
      </div>
    </div>
  );
}
