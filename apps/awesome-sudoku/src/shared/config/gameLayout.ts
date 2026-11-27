export const STICKY_BELOW_HEADER =
  'lg:self-start [@media(min-width:64rem)_and_(min-height:44rem)]:sticky [@media(min-width:64rem)_and_(min-height:44rem)]:top-[5rem]';

export const GAME_LAYOUT = {
  root: 'mx-auto grid w-full max-w-[1120px] min-w-[360px] content-start gap-5 px-5 pt-2 pb-12 [grid-template-areas:"status"_"board"_"panel"] lg:grid-cols-[minmax(0,600px)_minmax(0,380px)] lg:grid-rows-[auto_auto_1fr] lg:items-start lg:justify-center lg:gap-x-12 lg:px-8 lg:pt-4 lg:[grid-template-areas:"board_heading"_"board_status"_"board_panel"] short-landscape:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] short-landscape:grid-rows-[auto_1fr] short-landscape:items-start short-landscape:gap-x-8 short-landscape:[grid-template-areas:"board_status"_"board_panel"]',
  heading: 'max-lg:sr-only lg:[grid-area:heading]',
  title: 'text-[32px] leading-[1.3] font-extrabold tracking-[-0.035em] text-text-primary',
  description: 'mt-1 text-[15px] text-text-tertiary break-keep',
  status:
    'flex flex-wrap items-center justify-center gap-2 [grid-area:status] lg:justify-start short-landscape:justify-start',
  board: `flex min-w-0 flex-col items-center gap-4 [grid-area:board] ${STICKY_BELOW_HEADER}`,
  panel:
    'mx-auto grid w-full max-w-[560px] min-w-0 content-start gap-5 [grid-area:panel] lg:max-w-none short-landscape:max-w-none',
  actions: 'grid grid-cols-[1fr_1.6fr] gap-2',
} as const;

export const GAME_BOARD_SIZE = 'w-full max-w-[600px] short-landscape:max-w-[calc(100svh-6rem)]';

export const GAME_WIDE_BOARD_SIZE = 'w-full max-w-[600px]';
