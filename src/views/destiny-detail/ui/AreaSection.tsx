type AreaSectionProps = {
  title: string;
  godLabel?: string;
  godTitle: string;
  desc: string;
};

export function AreaSection({
  title,
  godLabel,
  godTitle,
  desc,
}: AreaSectionProps) {
  return (
    <div className="px-5 py-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-black text-[#1a1a2e]">{title}</h3>
        {godLabel && (
          <span className="ml-auto text-[11px] text-[#8a8a9a] bg-[#f0ede8] rounded-full px-2.5 py-0.5">
            {godLabel}
          </span>
        )}
      </div>
      <div className="bg-[#faf9f7] rounded-xl p-4">
        <p className="text-sm font-bold text-[#1a1a2e] mb-2">{godTitle}</p>
        <p className="text-sm text-[#555] leading-[1.8]">{desc}</p>
      </div>
    </div>
  );
}
