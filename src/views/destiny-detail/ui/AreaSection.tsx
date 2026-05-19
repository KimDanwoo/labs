type AreaSectionProps = {
  emoji: string;
  title: string;
  godLabel?: string;
  godTitle: string;
  desc: string;
};

export function AreaSection({
  emoji,
  title,
  godLabel,
  godTitle,
  desc,
}: AreaSectionProps) {
  return (
    <div className="bg-[#faf9f7] px-5 py-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{emoji}</span>
        <h3 className="text-base font-black text-[#1a1a2e]">{title}</h3>
        {godLabel && (
          <span className="ml-auto text-[11px] text-[#8a8a9a] bg-white border border-gray-100 rounded-full px-2 py-0.5">
            {godLabel}
          </span>
        )}
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-sm font-bold text-[#1a1a2e] mb-2">{godTitle}</p>
        <p className="text-sm text-[#6b6b7b] leading-[1.8]">{desc}</p>
      </div>
    </div>
  );
}
