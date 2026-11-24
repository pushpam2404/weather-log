import { Router } from 'express';
import { locationFromQuery } from '../services/weather.js';
import { getExtras } from '../services/extras.js';

const router = Router();

router.get('/', async (req, res) => {
  const { query, ...place } = await locationFromQuery(req.query);
  res.json({ location: place, ...(await getExtras(place)) });
});

export default router;
