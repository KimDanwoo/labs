type DividerProps = {
  label?: string;
};

export function Divider({ label }: DividerProps) {
  return (
    <div className="bg-white py-6 flex flex-col items-center gap-2">
      <div className="flex items-center gap-3 w-full px-8">
        <span className="flex-1 h-px bg-gray-200" />
        {label && (
          <span className="text-gray-400 text-xs tracking-[0.3em] font-medium">
            {label}
          </span>
        )}
        <span className="flex-1 h-px bg-gray-200" />
      </div>
    </div>
  );
}
