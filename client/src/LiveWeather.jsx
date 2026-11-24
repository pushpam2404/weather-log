import { useState } from 'react';
import { api, num, formatDay } from './api.js';
import WeatherIcon from './WeatherIcon.jsx';

const geoErrors = {
  1: 'Location access was denied. Allow it in your browser, or search for a place.',
  2: 'Your device could not find its position. Search for a place instead.',
  3: 'Finding your position took too long. Try again, or search for a place.',
};

function Fact({ label, value }) {
  return (
    <div>
      <dt className="text-sm text-ink-3">{label}</dt>
      <dd className="num whitespace-nowrap text-base">{value}</dd>
    </div>
  );
}

function Current({ data }) {
  const { location, current, forecast, units } = data;
  const today = forecast[0];
  const place = [location.name, location.country].filter(Boolean).join(', ');
  return (
    <div className="card p-5 sm:p-6">
      <h3 className="text-base text-ink-2">{place}</h3>
      <p className="num text-xs text-ink-3">
        {location.lat.toFixed(2)}, {location.lon.toFixed(2)} · {current.time.slice(11, 16)} local time
      </p>

      <div className="mt-5 flex items-center gap-4">
        <WeatherIcon name={current.icon} className="size-16 shrink-0 text-ink" />
        <div>
          <p className="num text-6xl leading-none">
            {num(current.temp)}
            <span className="text-3xl text-ink-3">{units.temp}</span>
          </p>
          <p className="mt-1 text-base">{current.condition}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-3">
        <Fact label="Feels like" value={`${num(current.feelsLike)}${units.temp}`} />
        <Fact label="Humidity" value={`${num(current.humidity)}%`} />
        <Fact label="Wind" value={`${num(current.windSpeed)} ${units.wind}`} />
        <Fact label="Rain chance" value={`${num(today.rainChance)}%`} />
        <Fact label="UV index" value={num(today.uvIndex, 1)} />
        <Fact label="Sun" value={`${today.sunrise.slice(11, 16)}–${today.sunset.slice(11, 16)}`} />
      </dl>
    </div>
  );
}

function Forecast({ data }) {
  const days = data.forecast;
  const low = Math.min(...days.map((d) => d.tmin));
  const high = Math.max(...days.map((d) => d.tmax));
  const span = high - low || 1;

  return (
    <div className="card p-5 sm:p-6">
      <h3 className="text-base text-ink-2">5-day forecast</h3>
      <ul className="mt-2">
        {days.map((d) => (
          <li
            key={d.date}
            className="grid grid-cols-[5rem_1fr_auto] items-center gap-x-3 gap-y-1 border-t border-line py-3 first:border-t-0 sm:grid-cols-[5.5rem_9rem_1fr_6.5rem]"
          >
            <span className="text-sm">{formatDay(d.date)}</span>
            <span className="flex items-center gap-2 text-sm text-ink-2 max-sm:order-3 max-sm:col-span-2 max-sm:col-start-2">
              <WeatherIcon name={d.icon} className="size-6 shrink-0 text-ink" />
              {d.condition}
              <span className="num ml-auto text-ink-3 sm:hidden">{num(d.rainChance)}% rain</span>
            </span>
            <span className="relative h-1.5 rounded-full bg-paper max-sm:order-2" aria-hidden="true">
              <span
                className="absolute inset-y-0 rounded-full bg-accent"
                style={{ left: `${((d.tmin - low) / span) * 100}%`, width: `${Math.max(((d.tmax - d.tmin) / span) * 100, 4)}%` }}
              />
            </span>
            <span className="num text-right text-sm max-sm:order-2">
              {num(d.tmin)}° <span className="text-ink-3">/</span> {num(d.tmax)}°
              <span className="hidden text-ink-3 sm:block">{num(d.rainChance)}% rain</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LiveWeather() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function load(params) {
    setStatus('loading');
    setError('');
    try {
      const result = await api(`/api/weather?${new URLSearchParams(params)}`);
      setData(result);
      setStatus('done');
      return result;
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  function search(e) {
    e.preventDefault();
    if (!text.trim()) {
      setError('Enter a place first. A city, ZIP code, landmark, or lat,lon works.');
      setStatus('error');
      return;
    }
    load({ q: text.trim() });
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('This browser cannot share your location. Search for a place instead.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const result = await load({ lat: coords.latitude.toFixed(4), lon: coords.longitude.toFixed(4) });
        if (result) setText(result.location.name);
      },
      (err) => {
        setError(geoErrors[err.code] || geoErrors[2]);
        setStatus('error');
      },
      { timeout: 10_000 },
    );
  }

  const loading = status === 'loading';

  return (
    <section aria-labelledby="live-title">
      <h2 id="live-title" className="text-xl">Current weather</h2>

      <form onSubmit={search} className="mt-4 flex flex-col gap-3 sm:flex-row" noValidate>
        <div className="flex-1">
          <label htmlFor="place" className="sr-only">Place</label>
          <input
            id="place"
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="City, ZIP code, landmark, or lat,lon"
            autoComplete="off"
          />
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary flex-1 sm:flex-none" disabled={loading}>
            {loading ? 'Loading…' : 'Search'}
          </button>
          <button type="button" className="btn flex-1 sm:flex-none" onClick={useMyLocation} disabled={loading}>
            Use my location
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="error mt-3">
          {error}
        </p>
      )}

      <div className="mt-5" aria-busy={loading}>
        {data ? (
          <div className={`grid gap-4 lg:grid-cols-[5fr_7fr] ${loading ? 'opacity-60' : ''}`}>
            <Current data={data} />
            <Forecast data={data} />
          </div>
        ) : (
          !error && (
            <p className="card px-5 py-8 text-ink-2">
              {loading ? 'Loading weather…' : 'Search for a place, or use your location, to see the weather now.'}
            </p>
          )
        )}
      </div>
    </section>
  );
}
