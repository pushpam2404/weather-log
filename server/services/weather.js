import { HttpError, isoDay, validateText } from '../validate.js';

const GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'weather-app-fullstack/1.0 (internship assessment project)';
const DAY = 86_400_000;

const coordsPattern = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

async function getJson(url, label) {
  let res;
  try {
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new HttpError(502, `The ${label} service did not respond. Try again later.`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(`${label} returned ${res.status}:`, body.reason || body.error || '');
    throw new HttpError(502, `The ${label} service returned an error. Try again later.`);
  }
  return res.json();
}

// Nominatim allows 1 request per second. Each caller reserves its own time slot.
let nextSlot = 0;
async function nominatim(path, params) {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + 1100;
  if (slot > now) await new Promise((r) => setTimeout(r, slot - now));
  const qs = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', ...params });
  return getJson(`${NOMINATIM}/${path}?${qs}`, 'map search');
}

const placeName = (a = {}) =>
  a.city || a.town || a.village || a.municipality || a.county || a.state || null;

export async function reverseName(lat, lon) {
  try {
    const r = await nominatim('reverse', { lat, lon, zoom: 10, 'accept-language': 'en' });
    return { name: placeName(r.address) || r.name || null, country: r.address?.country || null };
  } catch {
    return { name: null, country: null };
  }
}

export async function fromCoords(lat, lon) {
  if (!(lat >= -90 && lat <= 90) || !(lon >= -180 && lon <= 180)) {
    throw new HttpError(400, 'Coordinates are out of range. Latitude is -90 to 90 and longitude is -180 to 180.');
  }
  const { name, country } = await reverseName(lat, lon);
  return { name: name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`, country, lat, lon };
}

export async function resolveLocation(text) {
  const q = text.trim();

  const m = q.match(coordsPattern);
  if (m) return { query: q, ...(await fromCoords(Number(m[1]), Number(m[2]))) };

  // Open-Meteo matches names and postal codes, and tolerates typos.
  const geo = await getJson(
    `${GEOCODING}?${new URLSearchParams({ name: q, count: '1', language: 'en', format: 'json' })}`,
    'location search',
  );
  const hit = geo.results?.[0];
  if (hit) {
    return { query: q, name: hit.name, country: hit.country || null, lat: hit.latitude, lon: hit.longitude };
  }

  // Landmarks and street addresses are not in the Open-Meteo place list.
  const [r] = await nominatim('search', { q, limit: '1', 'accept-language': 'en' });
  if (!r) throw new HttpError(404, `No location found for "${q}". Check the spelling or try a nearby city.`);
  return {
    query: q,
    name: r.name || placeName(r.address) || r.display_name.split(',')[0],
    country: r.address?.country || null,
    lat: Number(r.lat),
    lon: Number(r.lon),
  };
}

// Shared by every endpoint that takes ?q=<text> or ?lat=&lon=.
export async function locationFromQuery({ q, lat, lon }) {
  if (lat === undefined && lon === undefined) {
    return resolveLocation(validateText(q, 'Query parameter q (or lat and lon)', 200));
  }
  const la = Number(lat);
  const lo = Number(lon);
  if (lat === '' || lon === '' || !Number.isFinite(la) || !Number.isFinite(lo)) {
    throw new HttpError(400, 'lat and lon must both be numbers.');
  }
  return fromCoords(la, lo);
}

const conditions = [
  [[0], 'Clear sky', 'clear'],
  [[1, 2], 'Partly cloudy', 'partly-cloudy'],
  [[3], 'Overcast', 'cloudy'],
  [[45, 48], 'Fog', 'fog'],
  [[51, 53, 55, 56, 57], 'Drizzle', 'drizzle'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'Rain', 'rain'],
  [[71, 73, 75, 77, 85, 86], 'Snow', 'snow'],
  [[95, 96, 99], 'Thunderstorm', 'thunder'],
];

export function describe(code, isDay = 1) {
  const [, condition, base] = conditions.find(([codes]) => codes.includes(code)) || [0, 'Unknown', 'cloudy'];
  const icon = base === 'clear' || base === 'partly-cloudy' ? `${base}-${isDay ? 'day' : 'night'}` : base;
  return { condition, icon };
}

export async function getForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone: 'auto',
    forecast_days: '5',
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset',
  });
  const w = await getJson(`${FORECAST}?${params}`, 'weather');
  const c = w.current;
  const d = w.daily;
  return {
    timezone: w.timezone,
    units: { temp: '°C', wind: 'km/h' },
    current: {
      time: c.time,
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      windSpeed: c.wind_speed_10m,
      code: c.weather_code,
      isDay: Boolean(c.is_day),
      ...describe(c.weather_code, c.is_day),
    },
    forecast: d.time.map((date, i) => ({
      date,
      tmax: d.temperature_2m_max[i],
      tmin: d.temperature_2m_min[i],
      rainChance: d.precipitation_probability_max[i],
      uvIndex: d.uv_index_max[i],
      sunrise: d.sunrise[i],
      sunset: d.sunset[i],
      code: d.weather_code[i],
      ...describe(d.weather_code[i]),
    })),
  };
}

async function dailyRange(base, lat, lon, start, end) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    start_date: start,
    end_date: end,
    timezone: 'auto',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum',
  });
  const d = (await getJson(`${base}?${params}`, 'weather')).daily;
  return d.time.map((date, i) => ({
    date,
    tmax: d.temperature_2m_max[i],
    tmin: d.temperature_2m_min[i],
    tmean: d.temperature_2m_mean[i],
    precip: d.precipitation_sum[i],
    ...describe(d.weather_code[i]),
  }));
}

// The archive lags real time by a few days, so recent dates come from the forecast API.
// The forecast API also covers future dates, so a range that crosses today is split in two.
export async function getRange(lat, lon, start, end) {
  const cutoff = isoDay(new Date(Date.now() - 5 * DAY));
  const afterCutoff = isoDay(new Date(Date.parse(cutoff) + DAY));
  const jobs = [];
  if (start <= cutoff) jobs.push(dailyRange(ARCHIVE, lat, lon, start, end < cutoff ? end : cutoff));
  if (end > cutoff) jobs.push(dailyRange(FORECAST, lat, lon, start > cutoff ? start : afterCutoff, end));
  return (await Promise.all(jobs)).flat();
}
