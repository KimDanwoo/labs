"use client";

import { GetHint, RemoveNumber, RestartGame, ToggleNote } from "@features/game-controls/ui";
import React from "react";

export const Controls: React.FC = () => (
  <div className="flex flex-wrap justify-center gap-2 mt-6">
    <RestartGame />

    <RemoveNumber />

    <GetHint />

    <ToggleNote />
  </div>
);

export default Controls;
