type CharacterBubbleProps = {
  imageSrc: string;
  text: string;
};

export function CharacterBubble({ imageSrc, text }: CharacterBubbleProps) {
  return (
    <div className="bg-white px-4 pt-3 pb-1">
      <div className="relative w-[65%] max-w-[240px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          className="w-full h-auto block"
          draggable={false}
        />
        <div className="absolute top-[18%] left-[7%] right-[4%] bottom-[12%] flex items-center justify-center pointer-events-none">
          <p className="text-[#1a1a2e] text-sm leading-snug whitespace-pre-line text-center">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
