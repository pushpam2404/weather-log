import { Router } from 'express';
import db from '../db.js';
import { HttpError } from '../validate.js';
import { formats } from '../services/export.js';

const router = Router();

router.get('/', async (req, res) => {
  const format = String(req.query.format ?? '').toLowerCase();
  const target = formats[format];
  if (!Object.hasOwn(formats, format)) {
    throw new HttpError(400, `format must be one of: ${Object.keys(formats).join(', ')}.`);
  }

  const { id } = req.query;
  let rows;
  if (id === undefined) {
    rows = db.prepare('SELECT * FROM weather_queries ORDER BY id').all();
  } else {
    const row = /^\d+$/.test(id) && db.prepare('SELECT * FROM weather_queries WHERE id = ?').get(Number(id));
    if (!row) throw new HttpError(404, `No saved query with id ${id}.`);
    rows = [row];
  }
  const records = rows.map((r) => ({ ...r, daily: JSON.parse(r.daily) }));

  const body = await target.render(records, id !== undefined);
  const name = id === undefined ? 'weather-queries' : `weather-query-${id}`;
  res.set({
    'Content-Type': target.type,
    'Content-Disposition': `attachment; filename="${name}.${target.ext}"`,
  });
  res.send(body);
});

export default router;
