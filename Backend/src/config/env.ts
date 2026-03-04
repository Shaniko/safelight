export const toNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const PORT = toNumber(process.env.PORT, 3000);
export const HOST = process.env.HOST ?? "0.0.0.0";

// Polling interval for official feed (milliseconds)
export const POLL_INTERVAL_MS = toNumber(process.env.POLL_INTERVAL_MS, 15_000);

// Data is considered stale after this many milliseconds
export const STALE_AFTER_MS = toNumber(process.env.STALE_AFTER_MS, 30_000);

