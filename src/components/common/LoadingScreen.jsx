export function LoadingScreen({ label = 'Loading DevPilot AI…' }) {
  return (
    <div className="min-h-[50vh] grid place-items-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
        <p className="text-muted mt-4">{label}</p>
      </div>
    </div>
  );
}
