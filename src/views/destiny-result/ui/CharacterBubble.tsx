'use client';

import Image from 'next/image';

const CHARACTER_IMAGES = ['/9AmX4fl8.jpeg', '/Em0NdvZ6.jpeg', '/QdK3FdLg.jpeg'];

type CharacterBubbleProps = {
  message: string;
  imageIndex?: number;
  children?: React.ReactNode;
};

export function CharacterBubble({
  message,
  imageIndex = 0,
  children,
}: CharacterBubbleProps) {
  const imageSrc = CHARACTER_IMAGES[imageIndex % CHARACTER_IMAGES.length];

  return (
    <div className="flex flex-col gap-3">
      {/* 캐릭터 + 말풍선 */}
      <div className="flex items-start gap-3">
        {/* 캐릭터 아바타 */}
        <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-gold/60 shadow-lg shadow-black/40">
          <Image
            src={imageSrc}
            alt="청연"
            width={48}
            height={48}
            className="object-cover object-top w-full h-full"
          />
        </div>

        {/* 이름 + 말풍선 */}
        <div className="flex-1 min-w-0">
          <span className="text-[11px] text-gold font-semibold mb-1 block">
            청연
          </span>
          <div className="bg-card-bg border border-card-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg shadow-black/20">
            <p className="text-[13px] leading-[1.8] text-foreground whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* 말풍선 아래 컨텐츠 (카드, 차트 등) */}
      {children && <div className="ml-15">{children}</div>}
    </div>
  );
}
