export async function configureSidePanel(): Promise<void> {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

export async function openSidePanel(windowId: number): Promise<void> {
  await chrome.sidePanel.open({ windowId });
}
