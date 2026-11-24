export default function AboutModal({ dialogRef }) {
  const close = () => dialogRef.current?.close();
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="about-title"
      onClick={(e) => e.target === dialogRef.current && close()}
      className="m-auto w-[min(92vw,34rem)] rounded-xl border border-line bg-card p-0 text-ink"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="about-title" className="text-lg">About PM Accelerator</h2>
          <button className="btn btn-sm" onClick={close}>Close</button>
        </div>
        <div className="mt-4 space-y-4 text-ink-2">
          <p>
            The Product Manager Accelerator Program is designed to support PM professionals through every stage of their
            careers. From students looking for entry-level jobs to Directors looking to take on a leadership role, our
            program has helped over hundreds of students fulfill their career aspirations.
          </p>
          <p>
            Our Product Manager Accelerator community are ambitious and committed. Through our program they have learnt,
            honed and developed new PM and leadership skills, giving them a strong foundation for their future endeavors.
          </p>
        </div>
      </div>
    </dialog>
  );
}
