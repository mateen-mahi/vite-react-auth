/**
 * Races a promise against a timeout so a hung request can never leave the
 * UI stuck on a loading spinner forever — it fails visibly instead.
 */
export function withTimeout(promise, ms = 15000, label = "Request") {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out. Check your connection and try again.`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}
