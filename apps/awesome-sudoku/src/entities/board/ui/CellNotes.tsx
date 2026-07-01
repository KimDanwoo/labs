import { KEY_NUMBER } from "@entities/board/model/constants";
import { memo } from "react";

export const CellNotes = memo(function CellNotes({ notes }: { notes: number[] }) {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-0 w-full h-full p-0.5">
      {KEY_NUMBER.map((num) => (
        <div key={num} className="flex items-center justify-center w-full h-full">
          {notes.includes(num) && (
            <span className="text-[6px] xs:text-[8px] lg:text-[10px] text-[rgb(var(--color-accent))] font-medium">
              {num}
            </span>
          )}
        </div>
      ))}
    </div>
  );
});
