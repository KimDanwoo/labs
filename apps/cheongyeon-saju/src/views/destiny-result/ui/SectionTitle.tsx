type SectionTitleProps = {
  title: string;
  sub?: string;
};

export function SectionTitle({ title, sub }: SectionTitleProps) {
  return (
    <div className="text-center mb-5">
      <h3 className="text-xl font-black text-[#1a1a2e]">{title}</h3>
      {sub && <p className="text-sm text-[#6b6b7b] mt-1.5">{sub}</p>}
    </div>
  );
}
