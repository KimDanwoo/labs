export const styles = {
  root: 'group relative flex h-7 w-[52px] shrink-0 items-center rounded-full p-[3px] transition-shadow hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
  dayBackground: {
    base: 'absolute inset-0 rounded-full bg-gradient-to-r from-toggle-day-start to-toggle-day-end transition-opacity duration-500',
    light: 'opacity-100',
    dark: 'opacity-0',
  },
  nightBackground: {
    base: 'absolute inset-0 rounded-full bg-toggle-night transition-opacity duration-500',
    light: 'opacity-0',
    dark: 'shadow-toggle-night/50 opacity-100 shadow-inner',
  },
  stars: {
    base: 'absolute inset-0 overflow-hidden rounded-full transition-opacity duration-700',
    light: 'opacity-0',
    dark: 'opacity-100',
  },
  star: [
    'absolute top-[5px] left-[10px] size-[3px] rounded-full bg-white/70',
    'absolute top-[17px] left-[17px] size-[2px] rounded-full bg-white/40',
    'absolute top-[7px] left-[24px] size-[2px] rounded-full bg-white/50',
  ],
  thumb: {
    base: 'relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.68,-0.15,0.27,1.15)]',
    light: 'translate-x-0 bg-toggle-thumb',
    dark: 'translate-x-[24px] bg-toggle-thumb-night',
  },
  sun: {
    base: 'absolute text-toggle-sun transition-all duration-500',
    light: 'scale-100 rotate-0 opacity-100',
    dark: 'scale-0 -rotate-90 opacity-0',
  },
  moon: {
    base: 'absolute text-toggle-moon transition-all duration-500',
    light: 'scale-0 rotate-90 opacity-0',
    dark: 'scale-100 rotate-0 opacity-100',
  },
} as const;
