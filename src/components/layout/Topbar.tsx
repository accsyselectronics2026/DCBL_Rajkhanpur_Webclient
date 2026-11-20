export default function Topbar() {
  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <span className="text-sm text-gray-600">DCBL, Raj Gangpur </span>
      <button type="button" className="h-10 px-4 rounded-md border border-gray-300 text-sm">
        Logout
      </button>
    </header>
  );
}