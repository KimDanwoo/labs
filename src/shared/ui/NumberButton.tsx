interface NumberButtonProps {
  value: number;
  onNumberSelect: (value: number) => void;
  onNoteToggle: (value: number) => void;
  isNoteMode: boolean;
  isDisabled: boolean;
}

export const NumberButton: React.FC<NumberButtonProps> = ({
  value,
  onNumberSelect,
  onNoteToggle,
  isNoteMode,
  isDisabled,
}) => {
  const handleClick = () => {
    if (isNoteMode) {
      onNoteToggle(value);
      return;
    }

    onNumberSelect(value);
  };

  const sizeClass = "w-6 h-6 md:w-10 md:h-10 lg:w-30 lg:h-30";
  const alignClass = "rounded-full flex items-center justify-center text-xl font-semibold";
  return (
    <button
      className={`${sizeClass} ${alignClass} ${isDisabled ? "text-gray-300" : "hover:bg-gray-300 transition-colors"}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {value}
    </button>
  );
};
