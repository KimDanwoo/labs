import Image from 'next/image';

type CharacterBubbleProps = {
  imageSrc: string;
  text: string;
};

export function CharacterBubble({ imageSrc, text }: CharacterBubbleProps) {
  return (
    <div className="bg-white px-4 pt-3 pb-1">
      <div className="relative w-[80%] max-w-[320px]">
        <Image
          src={imageSrc}
          alt="청월이 말풍선"
          width={320}
          height={320}
          className="w-full h-auto block"
          draggable={false}
        />
        <div className="absolute top-[18%] left-[7%] right-[4%] bottom-[12%] flex items-center justify-center pointer-events-none">
          <p className="text-[#1a1a2e] text-base leading-relaxed whitespace-pre-line text-center font-medium">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
