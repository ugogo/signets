export const BRIDGE_SECRET = crypto.randomUUID();

const root = document.documentElement;
if (root) {
  root.dataset.signetsBridge = BRIDGE_SECRET;
}
