import { POLL_INTERVAL_MS } from "./config/env";
import { applyOfficialSnapshot } from "./store";
import { fetchOfficialSnapshot } from "./official/officialAdapter";

export const startIngestionPoller = (): (() => void) => {
  let timer: NodeJS.Timeout | null = null;

  const runPoll = async (): Promise<void> => {
    try {
      const snapshot = await fetchOfficialSnapshot();
      applyOfficialSnapshot(snapshot);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[ingestion] poll failed", error);
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

