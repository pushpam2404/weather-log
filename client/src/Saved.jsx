import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import QueryForm from './QueryForm.jsx';
import QueryDetail from './QueryDetail.jsx';
import ExportLinks from './ExportLinks.jsx';

export default function Saved() {
  const [records, setRecords] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const detailRef = useRef(null);

  useEffect(() => {
    api('/api/queries')
      .then(setRecords)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // On narrow screens the detail panel sits below the list, so bring it into view.
    if (selectedId && window.matchMedia('(max-width: 1023px)').matches) {
      detailRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [selectedId]);

  async function create(values) {
    const record = await api('/api/queries', { method: 'POST', body: values });
    setRecords((list) => [record, ...list]);
    setSelectedId(record.id);
  }

  async function update(id, values) {
    const record = await api(`/api/queries/${id}`, { method: 'PUT', body: values });
    setRecords((list) => list.map((r) => (r.id === id ? record : r)));
  }

  async function remove(id) {
    await api(`/api/queries/${id}`, { method: 'DELETE' });
    setRecords((list) => list.filter((r) => r.id !== id));
    setSelectedId(null);
  }

  const selected = records.find((r) => r.id === selectedId);

  return (
    <section aria-labelledby="saved-title">
      <h2 id="saved-title" className="text-xl">Saved lookups</h2>
      <p className="mt-1 text-ink-2">Save the weather for a place and a date range. Everyone using this app sees the same list.</p>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-4 text-base">New lookup</h3>
            <QueryForm submitLabel="Save lookup" onSubmit={create} clearOnSave />
          </div>

          <div className="card p-5">
            <h3 className="text-base">All lookups ({records.length})</h3>
            {loadError && <p role="alert" className="error mt-3">{loadError}</p>}
            {loading && <p className="mt-3 text-sm text-ink-2">Loading…</p>}
            {!loading && !loadError && records.length === 0 && (
              <p className="mt-3 text-sm text-ink-2">Nothing saved yet. Use the form above to save one.</p>
            )}
            <ul className="-mx-2 mt-3">
              {records.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    aria-pressed={r.id === selectedId}
                    className={`flex min-h-14 w-full flex-col justify-center rounded-lg border-l-[3px] px-3 py-2 text-left transition-colors hover:bg-paper ${
                      r.id === selectedId ? 'border-accent bg-paper' : 'border-transparent'
                    }`}
                  >
                    <span className="text-sm">{[r.city, r.country].filter(Boolean).join(', ')}</span>
                    <span className="num text-xs text-ink-3">
                      {r.start_date} to {r.end_date}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {records.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <ExportLinks label="Export all lookups" />
              </div>
            )}
          </div>
        </div>

        <div ref={detailRef} className="scroll-mt-4">
          {selected ? (
            <QueryDetail record={selected} onUpdate={update} onDelete={remove} />
          ) : (
            <p className="card px-5 py-8 text-ink-2">
              Select a lookup to see its daily weather, map, and videos.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
