"use client";

import { useHistory } from "@features/undo-redo/model/hooks/useHistory";
import { IconButton } from "@shared/ui";
import { memo, useEffect } from "react";
import { IoArrowUndo, IoArrowRedo } from "react-icons/io5";

export const UndoRedoButtons = memo(() => {
  const { undo, redo, canUndo, canRedo } = useHistory();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <>
      <IconButton
        icon={<IoArrowUndo />}
        label="취소"
        onClick={undo}
        disabled={!canUndo}
      />
      <IconButton
        icon={<IoArrowRedo />}
        label="재실행"
        onClick={redo}
        disabled={!canRedo}
      />
    </>
  );
});

UndoRedoButtons.displayName = "UndoRedoButtons";
