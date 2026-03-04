import { POLL_INTERVAL_MS } from "./config/env";
import { applyOfficialSnapshot, markSnapshotFailure } from "./store";
import { fetchOfficialSnapshot } from "./official/officialAdapter";

const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000;

let successfulPolls = 0;
let failedPolls = 0;
let lastHeartbeatLogMs = 0;
let lastFetchedAtUtc: string | null = null;

const logHeartbeat = (now: Date): void => {
  const nowMs = now.getTime();

  if (lastHeartbeatLogMs && nowMs - lastHeartbeatLogMs < HEARTBEAT_INTERVAL_MS) {
    return;
  }

  lastHeartbeatLogMs = nowMs;

  // eslint-disable-next-line no-console
  console.info(
    `[ingestion] heartbeat success=${successfulPolls} fail=${failedPolls} lastFetchedAtUtc=${
      lastFetchedAtUtc ?? "none"
    }`
  );
};

export const startIngestionPoller = (): (() => void) => {
  let timer: NodeJS.Timeout | null = null;

  const runPoll = async (): Promise<void> => {
    const now = new Date();

    try {
      const snapshot = await fetchOfficialSnapshot();
      successfulPolls += 1;
      lastFetchedAtUtc = snapshot.fetchedAtUtc;

      const changedRegions = applyOfficialSnapshot(snapshot);

      if (changedRegions.length > 0) {
        // eslint-disable-next-line no-console
        console.info(
          `[ingestion] alert state change at ${snapshot.fetchedAtUtc} regions=${changedRegions.join(
            ","
          )}`
        );
      }
    } catch (error) {
      failedPolls += 1;
      markSnapshotFailure();
      // eslint-disable-next-line no-console
      console.error("[ingestion] upstream fetch failed", error);
    } finally {
      logHeartbeat(now);
    }
  };

  // Prime the store immediately on startup
  void runPoll();

  timer = setInterval(() => {
    void runPoll();
  }, POLL_INTERVAL_MS);

  return () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
};

