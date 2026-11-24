import { Router } from 'express';
import db from '../db.js';
import { HttpError, validateRange, validateText } from '../validate.js';
import { resolveLocation, getRange } from '../services/weather.js';

const router = Router();

const toRecord = (row) => ({ ...row, daily: JSON.parse(row.daily) });

function findOr404(idParam) {
  const row = /^\d+$/.test(idParam) && db.prepare('SELECT * FROM weather_queries WHERE id = ?').get(Number(idParam));
  if (!row) throw new HttpError(404, `No saved query with id ${idParam}.`);
  return row;
}

function cleanNotes(notes) {
  if (notes === undefined || notes === null || notes === '') return null;
  if (typeof notes !== 'string' || notes.length > 500) {
    throw new HttpError(400, 'notes must be text of 500 characters or fewer.');
  }
  return notes;
}

router.post('/', async (req, res) => {
  const { location, start_date, end_date } = req.body ?? {};
  const text = validateText(location, 'location', 200);
  validateRange(start_date, end_date);
  const notes = cleanNotes(req.body.notes);

  const place = await resolveLocation(text);
  const daily = await getRange(place.lat, place.lon, start_date, end_date);

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO weather_queries (query, city, country, lat, lon, start_date, end_date, daily, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(place.query, place.name, place.country, place.lat, place.lon, start_date, end_date, JSON.stringify(daily), notes);

  res.status(201).json(toRecord(findOr404(String(lastInsertRowid))));
});

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM weather_queries ORDER BY id DESC').all();
  res.json(rows.map(toRecord));
});

router.get('/:id', (req, res) => {
  res.json(toRecord(findOr404(req.params.id)));
});

router.put('/:id', async (req, res) => {
  const row = findOr404(req.params.id);
  const body = req.body ?? {};
  const fields = ['location', 'start_date', 'end_date', 'notes'];
  if (!fields.some((f) => body[f] !== undefined)) {
    throw new HttpError(400, `Send at least one of: ${fields.join(', ')}.`);
  }

  const start = body.start_date ?? row.start_date;
  const end = body.end_date ?? row.end_date;
  const text = body.location !== undefined ? validateText(body.location, 'location', 200) : row.query;
  const notes = body.notes !== undefined ? cleanNotes(body.notes) : row.notes;

  const moved = text !== row.query;
  const reshaped = start !== row.start_date || end !== row.end_date;
  let { city, country, lat, lon, daily } = row;

  if (moved || reshaped) {
    validateRange(start, end);
    if (moved) {
      const place = await resolveLocation(text);
      ({ name: city, country, lat, lon } = place);
    }
    daily = JSON.stringify(await getRange(lat, lon, start, end));
  }

  db.prepare(
    `UPDATE weather_queries
     SET query = ?, city = ?, country = ?, lat = ?, lon = ?, start_date = ?, end_date = ?,
         daily = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(text, city, country, lat, lon, start, end, daily, notes, row.id);

  res.json(toRecord(findOr404(req.params.id)));
});

router.delete('/:id', (req, res) => {
  const row = findOr404(req.params.id);
  db.prepare('DELETE FROM weather_queries WHERE id = ?').run(row.id);
  res.status(204).end();
});

export default router;
