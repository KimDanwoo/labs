type ChatDateSeparatorProps = {
  label: string;
};

export default function ChatDateSeparator({ label }: ChatDateSeparatorProps) {
  return (
    <div className="flex items-center justify-center py-1">
      <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-semibold text-gray-400">{label}</span>
    </div>
  );
}
