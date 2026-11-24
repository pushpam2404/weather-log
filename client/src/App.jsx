import { useRef } from 'react';
import LiveWeather from './LiveWeather.jsx';
import Saved from './Saved.jsx';
import AboutModal from './AboutModal.jsx';

export default function App() {
  const about = useRef(null);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-4 py-4 sm:px-6">
          <h1 className="text-lg">Weather log</h1>
          <p className="hidden font-mono text-xs text-ink-3 sm:block">Live forecast and saved date ranges</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-12 px-4 py-8 sm:px-6 sm:py-10">
        <LiveWeather />
        <Saved />
      </main>

      <footer className="border-t border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Built by Pushpam Raj Satyarthi</p>
          <p className="text-ink-3">Weather by Open-Meteo. Places by OpenStreetMap contributors.</p>
          <button className="btn btn-sm self-start sm:self-auto" onClick={() => about.current?.showModal()}>
            About PM Accelerator
          </button>
        </div>
      </footer>

      <AboutModal dialogRef={about} />
    </div>
  );
}
