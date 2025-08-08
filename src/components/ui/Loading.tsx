export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}