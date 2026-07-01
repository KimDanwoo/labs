import Image from 'next/image';

import { BubbleText } from './BubbleText';

type BubbleSlot = {
  top?: string;
  left?: string;
  right?: string;
  width?: string;
};

type StoryPanelConfig = {
  imageSrc: string;
  slots: BubbleSlot[];
};

const PANEL_CONFIGS: Record<string, StoryPanelConfig> = {
  result_1: {
    imageSrc: '/result_1.webp',
    slots: [{ top: '24%', left: '21%', width: '62%' }],
  },
  result_2: {
    imageSrc: '/result_2.webp',
    slots: [
      { top: '14%', left: '10%', width: '48%' },
      { top: '30%', right: '17%', width: '40%' },
    ],
  },
  result_3: {
    imageSrc: '/result_3.webp',
    slots: [],
  },
  result_4: {
    imageSrc: '/result_4.webp',
    slots: [
      { top: '13%', left: '12%', width: '48%' },
      { top: '29%', right: '27%', width: '40%' },
    ],
  },
  result_7: {
    imageSrc: '/result_7.webp',
    slots: [
      { top: '8%', left: '34%', width: '52%' },
      { top: '69%', right: '3%', width: '40%' },
    ],
  },
  result_8: {
    imageSrc: '/result_8.webp',
    slots: [{ top: '10%', left: '18%', width: '65%' }],
  },
  result_9: {
    imageSrc: '/result_9.webp',
    slots: [
      { top: '9%', left: '20%', width: '60%' },
      { top: '78%', right: '5%', width: '35%' },
    ],
  },
};

type StoryPanelProps = {
  variant: keyof typeof PANEL_CONFIGS;
  texts?: string[];
  isFirst?: boolean;
};

export function StoryPanel({ variant, texts = [], isFirst }: StoryPanelProps) {
  const config = PANEL_CONFIGS[variant];
  if (!config) return null;

  return (
    <div className="relative w-full bg-white">
      <Image
        src={config.imageSrc}
        alt="청월이 웹툰 컷"
        width={450}
        height={600}
        className="w-full h-auto block"
        draggable={false}
        preload={isFirst}
        sizes="(max-width: 480px) 100vw, 450px"
        unoptimized
      />
      {config.slots.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {config.slots.map((slot, i) =>
            texts[i] ? (
              <BubbleText
                key={i}
                text={texts[i]}
                top={slot.top}
                left={slot.left}
                right={slot.right}
                width={slot.width}
              />
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

export { PANEL_CONFIGS };
