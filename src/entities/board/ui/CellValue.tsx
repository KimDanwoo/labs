import { memo } from "react";

export const CellValue = memo(function CellValue({ value }: { value: number }) {
  return (
    <span className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-tabular">
      {value}
    </span>
  );
});
