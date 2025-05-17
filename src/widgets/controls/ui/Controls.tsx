"use client";

import { GetHint } from "@features/get-hint/ui/GetHint";
import { RemoveNumber } from "@features/remove-number/ui/RemoveNumber";
import { RestartGame } from "@features/restart-game/ui/RestartGame";
import { ToggleNote } from "@features/toggle-note/ui/ToggleNote";
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
