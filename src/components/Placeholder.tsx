export default function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border border-dashed border-gray-300 p-6 text-sm text-gray-500">
      {children}
    </div>
  );
}
