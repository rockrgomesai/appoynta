export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403 Forbidden</h1>
      <p className="text-lg">You do not have permission to access this page.</p>
    </div>
  );
}