"use client";

import { GetHint } from "@features/game-controls/ui/GetHint";
import { RemoveNumber } from "@features/game-controls/ui/RemoveNumber";
import { RestartGame } from "@features/game-controls/ui/RestartGame";
import { ToggleNote } from "@features/game-controls/ui/ToggleNote";
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
