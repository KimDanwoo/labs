interface NumberButtonProps {
  value: number;
  onClick: () => void;
  isDisabled: boolean;
}

const sizeClass = "w-6 h-6 md:w-10 md:h-10 lg:w-30 lg:h-30";
const alignClass = "rounded-full flex items-center justify-center text-xl font-semibold";

export const NumberButton: React.FC<NumberButtonProps> = ({ value, onClick, isDisabled }) => (
  <button
    className={`${sizeClass} ${alignClass} ${isDisabled ? "text-gray-300" : "hover:bg-gray-300 transition-colors"}`}
    onClick={onClick}
    disabled={isDisabled}
  >
    {value}
  </button>
);
