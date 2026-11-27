export function trialTabId(baseId: string, slideId: string): string {
  return `${baseId}-tab-${slideId}`;
}

export function trialPanelId(baseId: string, slideId: string): string {
  return `${baseId}-panel-${slideId}`;
}
