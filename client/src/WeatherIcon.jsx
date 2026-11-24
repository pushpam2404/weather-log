const cloud = 'M6.5 19a4.5 4.5 0 0 1-.4-8.98 6 6 0 0 1 11.6 1.48A3.75 3.75 0 0 1 17.5 19z';
const cloudHigh = 'M6.5 15a4 4 0 0 1-.4-7.98 5.5 5.5 0 0 1 10.6 1.4A3.3 3.3 0 0 1 16.5 15z';
const cloudLow = 'M9.5 20.5a3.5 3.5 0 0 1-.3-6.98 4.75 4.75 0 0 1 9.2 1.2 3 3 0 0 1-.4 5.78z';
const moon = 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z';
const smallMoon = 'M10 3.5a4.5 4.5 0 1 0 5.5 6A4 4 0 0 1 10 3.5z';

const icons = {
  'clear-day': (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  'clear-night': <path d={moon} />,
  'partly-cloudy-day': (
    <>
      <circle cx="8" cy="8" r="2.75" />
      <path d="M8 2.5v1M2.5 8h1M4.1 4.1l.7.7M11.9 4.1l-.7.7" />
      <path d={cloudLow} />
    </>
  ),
  'partly-cloudy-night': (
    <>
      <path d={smallMoon} />
      <path d={cloudLow} />
    </>
  ),
  cloudy: <path d={cloud} />,
  fog: <path d="M3 8h18M5 12h14M3 16h18M8 20h8" />,
  drizzle: (
    <>
      <path d={cloudHigh} />
      <path d="M8 18.5v1.5M12 18.5v1.5M16 18.5v1.5" />
    </>
  ),
  rain: (
    <>
      <path d={cloudHigh} />
      <path d="M8 17.5l-1 3.5M12 17.5l-1 3.5M16 17.5l-1 3.5" />
    </>
  ),
  snow: (
    <>
      <path d={cloudHigh} />
      <path d="M8 18.5h.01M12 20.5h.01M16 18.5h.01M10 21h.01M14 18h.01" strokeWidth="2.5" />
    </>
  ),
  thunder: (
    <>
      <path d={cloudHigh} />
      <path d="M12.5 14.5L10 18.5h3L11 22" />
    </>
  ),
};

export default function WeatherIcon({ name, className = 'size-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name] || icons.cloudy}
    </svg>
  );
}
