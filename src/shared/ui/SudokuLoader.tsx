"use client";

import { memo, useMemo } from "react";
import { cn } from "@shared/model/utils";

interface SudokuLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { grid: 48, cell: 14, text: "text-[8px]", gap: 1 },
  md: { grid: 72, cell: 22, text: "text-[11px]", gap: 1.5 },
  lg: { grid: 96, cell: 30, text: "text-sm", gap: 2 },
};

const SUDOKU_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const SudokuLoader = memo<SudokuLoaderProps>(({ size = "md", className }) => {
  const config = sizeConfig[size];

  const cells = useMemo(
    () =>
      SUDOKU_NUMBERS.map((num, index) => ({
        num,
        delay: index * 0.1,
      })),
    [],
  );

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className="relative grid grid-cols-3 rounded-lg overflow-hidden shadow-lg"
        style={{
          width: config.grid,
          height: config.grid,
          gap: config.gap,
          background:
            "linear-gradient(135deg," +
            " rgb(var(--color-surface-secondary)) 0%," +
            " rgb(var(--color-bg-tertiary)) 100%)",
          padding: config.gap,
        }}
      >
        {cells.map(({ num, delay }) => (
          <div
            key={num}
            className={cn(
              "flex items-center justify-center",
              "bg-[rgb(var(--color-surface-primary))] rounded-sm",
              "font-bold text-[rgb(var(--color-accent))]",
              config.text,
            )}
            style={{
              animation: "sudokuPulse 1.8s ease-in-out infinite",
              animationDelay: `${delay}s`,
            }}
          >
            {num}
          </div>
        ))}

        {/* Grid lines overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(var(--color-accent), 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(var(--color-accent), 0.3) 1px, transparent 1px)
            `,
            backgroundSize: `${config.grid / 3}px ${config.grid / 3}px`,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes sudokuPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
});

SudokuLoader.displayName = "SudokuLoader";
