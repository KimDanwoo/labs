export function BackgroundGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-800/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200/20 dark:bg-indigo-800/8 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-200/20 dark:bg-purple-800/8 rounded-full blur-3xl" />
    </div>
  );
}
