type EggLoadingProps = {
  message?: string;
};

export default function EggLoading({
  message = '불러오는 중...',
}: EggLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-pink-50/40 via-white to-blue-50/40" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="text-6xl animate-bounce">🥚</div>
        <p className="text-xs text-gray-400 font-bold tracking-wider">
          {message}
        </p>
      </div>
    </div>
  );
}
