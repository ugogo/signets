/** Near-invisible gate while client `beforeLoad` checks the session. */
export function AuthPending() {
  return <main aria-busy="true" className="min-h-dvh bg-background" />;
}
