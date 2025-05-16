export const IconButton = ({
  icon,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}) => {
  return (
    <button className={`px-4 py-4 rounded-full hover:bg-gray-300 transition-colors ${className}`} onClick={onClick}>
      {icon}
    </button>
  );
};

export default IconButton;
