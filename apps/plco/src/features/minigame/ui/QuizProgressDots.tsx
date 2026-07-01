import { QUIZ_ROUNDS } from '../model/constants';

type QuizProgressDotsProps = {
  results: boolean[];
  currentRound: number;
};

export default function QuizProgressDots({
  results,
  currentRound,
}: QuizProgressDotsProps) {
  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: QUIZ_ROUNDS }).map((_, i) => {
        const isAnswered = i < results.length;
        const isCurrent = i === currentRound;
        const dotClass = isAnswered
          ? results[i]
            ? 'bg-emerald-400'
            : 'bg-rose-300'
          : isCurrent
            ? 'bg-violet-300 ring-2 ring-violet-200'
            : 'bg-gray-200';
        return (
          <span
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${dotClass}`}
          />
        );
      })}
    </div>
  );
}
