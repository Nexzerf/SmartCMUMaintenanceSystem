import "server-only";

/**
 * Logs how long a server step took. Visible in the platform's function logs,
 * which is the only way to see where a server render spends its time in production.
 */
export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    console.log(`[perf] ${label} ${Date.now() - start}ms`);
  }
}
