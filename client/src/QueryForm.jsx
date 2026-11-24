import { useState } from 'react';

const empty = { location: '', start_date: '', end_date: '', notes: '' };

export default function QueryForm({ initial = empty, submitLabel, onSubmit, onCancel, clearOnSave = false }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(values);
      if (clearOnSave) setValues(empty);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label className="label" htmlFor={`loc-${submitLabel}`}>Location</label>
        <input
          id={`loc-${submitLabel}`}
          className="input"
          value={values.location}
          onChange={set('location')}
          placeholder="City, ZIP code, landmark, or lat,lon"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`start-${submitLabel}`}>Start date</label>
          <input id={`start-${submitLabel}`} type="date" className="input" value={values.start_date} onChange={set('start_date')} />
        </div>
        <div>
          <label className="label" htmlFor={`end-${submitLabel}`}>End date</label>
          <input id={`end-${submitLabel}`} type="date" className="input" value={values.end_date} onChange={set('end_date')} />
        </div>
      </div>
      <p className="-mt-2 text-sm text-ink-3">Up to 31 days long, and up to 16 days ahead.</p>
      <div>
        <label className="label" htmlFor={`notes-${submitLabel}`}>Notes (optional)</label>
        <textarea
          id={`notes-${submitLabel}`}
          className="input min-h-20 py-2"
          value={values.notes ?? ''}
          onChange={set('notes')}
          maxLength={500}
        />
      </div>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
