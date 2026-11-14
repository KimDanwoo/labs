export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className = '',
  children: readonly (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.append(...children);
  return element;
}
