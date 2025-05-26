import { KEY_NUMBER } from "@entities/board/model/constants";

export function CellNotes({ notes }: { notes: number[] }) {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-0 w-full h-full">
      {KEY_NUMBER.map((num) => (
        <div key={num} className="flex items-center justify-center w-full h-full">
          {notes.includes(num) && <span className="text-[8px] md:text-xs text-slate-500">{num}</span>}
        </div>
      ))}
    </div>
  );
}
