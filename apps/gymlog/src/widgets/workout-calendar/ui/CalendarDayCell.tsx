'use client';

type CalendarDayCellProps = {
  day: number | null;
  isToday: boolean;
  isSelected: boolean;
  hasWorkout: boolean;
  onSelect: (day: number) => void;
};

export function CalendarDayCell({ day, isToday, isSelected, hasWorkout, onSelect }: CalendarDayCellProps) {
  if (day === null) {
    return <div className="aspect-square" />;
  }

  const base = 'relative flex aspect-square flex-col items-center justify-center rounded-md text-sm transition-colors';
  const resolveTone = (): string => {
    if (isSelected) {
      return 'bg-primary text-primary-foreground font-semibold';
    }
    if (isToday) {
      return 'bg-primary-subtle text-primary font-semibold';
    }
    return 'text-foreground hover:bg-primary-subtle';
  };
  const tone = resolveTone();

  return (
    <button type="button" onClick={() => onSelect(day)} className={`${base} ${tone}`}>
      {day}
      {hasWorkout && (
        <span
          className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`}
        />
      )}
    </button>
  );
}
