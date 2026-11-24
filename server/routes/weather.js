import { Router } from 'express';
import { locationFromQuery, getForecast } from '../services/weather.js';

const router = Router();

router.get('/', async (req, res) => {
  const { query, ...place } = await locationFromQuery(req.query);
  res.json({ location: place, ...(await getForecast(place.lat, place.lon)) });
});

export default router;
