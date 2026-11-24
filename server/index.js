import express from 'express';
import weather from './routes/weather.js';
import queries from './routes/queries.js';
import extras from './routes/extras.js';
import exportData from './routes/export.js';

try {
  process.loadEnvFile();
} catch {
  // No .env file. Defaults apply.
}

const app = express();
app.use(express.json());

app.use('/api/weather', weather);
app.use('/api/queries', queries);
app.use('/api/extras', extras);
app.use('/api/export', exportData);
app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route.' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON.' });
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Vercel runs the exported app as a function and does not need a port.
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`API on http://localhost:${port}`));
}

export default app;
