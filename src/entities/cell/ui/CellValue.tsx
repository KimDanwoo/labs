import { memo } from "react";

export const CellValue = memo(function CellValue({ value }: { value: number }) {
  return <span className="text-sm sm:text-xl md:text-2xl lg:text-2xl">{value}</span>;
});
