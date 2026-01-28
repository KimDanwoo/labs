"use client";

import { GetHint, RemoveNumber, RestartGame, ToggleNote } from "@features/sudoku-game/ui";
import React from "react";

export const Controls: React.FC = () => (
  <div className="flex flex-wrap justify-center gap-3">
    <RestartGame />
    <RemoveNumber />
    <GetHint />
    <ToggleNote />
  </div>
);

export default Controls;
