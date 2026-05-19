import React from 'react';

type WebtoonPanelProps = {
  imageSrc: string;
  children?: React.ReactNode;
};

export function WebtoonPanel({ imageSrc, children }: WebtoonPanelProps) {
  return (
    <div className="relative w-full bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt=""
        className="w-full h-auto block"
        draggable={false}
      />
      {children && (
        <div className="absolute inset-0 pointer-events-none">{children}</div>
      )}
    </div>
  );
}
