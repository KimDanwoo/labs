import React from 'react';

import Image from 'next/image';

type WebtoonPanelProps = {
  imageSrc: string;
  children?: React.ReactNode;
  isFirst?: boolean;
};

export function WebtoonPanel({
  imageSrc,
  children,
  isFirst,
}: WebtoonPanelProps) {
  return (
    <div className="relative w-full bg-white">
      <Image
        src={imageSrc}
        alt="청월이 웹툰 컷"
        width={450}
        height={600}
        className="w-full h-auto block"
        draggable={false}
        preload={isFirst}
        sizes="(max-width: 480px) 100vw, 450px"
        unoptimized
      />
      {children && (
        <div className="absolute inset-0 pointer-events-none">{children}</div>
      )}
    </div>
  );
}
