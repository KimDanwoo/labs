import React from 'react';

import Image from 'next/image';

type WebtoonPanelProps = {
  imageSrc: string;
  children?: React.ReactNode;
};

export function WebtoonPanel({ imageSrc, children }: WebtoonPanelProps) {
  return (
    <div className="relative w-full bg-white">
      <Image
        src={imageSrc}
        alt=""
        width={450}
        height={600}
        className="w-full h-auto block"
        draggable={false}
      />
      {children && (
        <div className="absolute inset-0 pointer-events-none">{children}</div>
      )}
    </div>
  );
}
