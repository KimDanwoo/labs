import { useSudokuStore } from "@entities/sudoku/model/stores";
import { useEffect } from "react";

export const useKeyboardControls = () => {
  const handleKeyInput = useSudokuStore((state) => state.handleKeyInput);
  const selectedCell = useSudokuStore((state) => state.selectedCell);

  useEffect(() => {
    // 게임이 활성화되어 있고 선택된 셀이 있을 때만 키보드 이벤트 처리
    if (!selectedCell) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 게임플레이에 관련된 키만 처리
      const validKeys = [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Backspace",
        "Delete",
      ];

      if (validKeys.includes(event.key)) {
        // 이벤트 전파 방지 (페이지 스크롤 등 방지)
        event.preventDefault();

        // 키 입력 처리
        handleKeyInput(event.key);
      }
    };

    // 키보드 이벤트 리스너 등록
    window.addEventListener("keydown", handleKeyDown);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCell, handleKeyInput]);
};
