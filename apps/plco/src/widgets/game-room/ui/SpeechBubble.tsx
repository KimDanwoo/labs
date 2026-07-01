'use client';

type SpeechBubbleProps = {
  message: string;
};

export default function SpeechBubble({ message }: SpeechBubbleProps) {
  return (
    <div className="absolute -top-8 left-1/2 z-20 -translate-x-1/2 pointer-events-none">
      <div className="relative max-w-[180px] rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-game-md">
        <p className="truncate text-[13px] font-semibold leading-tight text-gray-900">
          {message}
        </p>
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
      </div>
    </div>
  );
}
