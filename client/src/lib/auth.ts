// Global auth modal trigger helper
export function openAuthModal() {
  const trigger = document.getElementById('auth-modal-trigger') as HTMLElement;
  if (trigger) {
    trigger.click();
  }
}