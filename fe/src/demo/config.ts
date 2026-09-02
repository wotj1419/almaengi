export function isDemoMode(
  env: Record<string, string | undefined> = import.meta.env
): boolean {
  return env.VITE_DEMO_MODE === 'true';
}
