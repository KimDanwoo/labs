export const focusOnMount = (node: HTMLElement | null): void => {
  node?.focus({ preventScroll: true });
};
