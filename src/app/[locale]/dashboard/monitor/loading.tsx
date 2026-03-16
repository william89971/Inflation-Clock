export default function MonitorLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-bitcoin border-t-transparent" />
      <span className="sr-only">Loading Bitcoin Monitor...</span>
    </div>
  );
}
