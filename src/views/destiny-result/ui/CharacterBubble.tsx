import Image from 'next/image';

type CharacterBubbleProps = {
  imageSrc: string;
  text: string;
};

export function CharacterBubble({ imageSrc, text }: CharacterBubbleProps) {
  return (
    <div className="bg-white px-4 pt-3 pb-1">
      <div className="relative w-[85%] max-w-[360px]">
        <Image
          src={imageSrc}
          alt="청월이 말풍선"
          width={360}
          height={360}
          className="w-full h-auto block"
          draggable={false}
        />
        <div className="absolute top-[18%] left-[7%] right-[4%] bottom-[12%] flex items-center justify-center pointer-events-none overflow-hidden">
          <p className="text-[#1a1a2e] text-[15px] leading-snug whitespace-pre-line text-center font-medium">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
