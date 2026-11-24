import { Router } from 'express';
import { HttpError, validateText } from '../validate.js';
import { resolveLocation, fromCoords, getForecast } from '../services/weather.js';

const router = Router();

router.get('/', async (req, res) => {
  const { q, lat, lon } = req.query;
  let location;

  if (lat !== undefined || lon !== undefined) {
    const la = Number(lat);
    const lo = Number(lon);
    if (lat === '' || lon === '' || !Number.isFinite(la) || !Number.isFinite(lo)) {
      throw new HttpError(400, 'lat and lon must both be numbers.');
    }
    location = await fromCoords(la, lo);
  } else {
    location = await resolveLocation(validateText(q, 'Query parameter q (or lat and lon)', 200));
  }

  const { query, ...place } = location;
  res.json({ location: place, ...(await getForecast(place.lat, place.lon)) });
});

export default router;
