// Placeholder login screen. Authentication is not implemented yet.
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form className="w-full max-w-sm space-y-4 rounded border border-gray-200 p-6">
        <h1 className="text-xl font-semibold">Log in</h1>
        <label className="block text-sm">
          Email
          <input type="email" name="email" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          Password
          <input type="password" name="password" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <button
          type="submit"
          disabled
          className="w-full rounded bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          Log in
        </button>
        <p className="text-xs text-gray-500">Login isn&apos;t wired up yet.</p>
      </form>
    </main>
  );
}
