"use client";

import { GetHint, RemoveNumber, RestartGame, ToggleNote } from "@features/sudoku-game/ui";
import React from "react";

export const Controls: React.FC = () => (
  <div className="grid grid-cols-4 gap-2 md:gap-3 lg:gap-4 justify-items-center">
    <RestartGame />
    <RemoveNumber />
    <ToggleNote />
    <GetHint />
  </div>
);

export default Controls;
