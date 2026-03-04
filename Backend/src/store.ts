import { STALE_AFTER_MS } from "./config/env";
import { computeState, StateInputs, StateOutput } from "./stateMachine";
import type { OfficialSnapshot, OfficialRegionFacts } from "./official/officialAdapter";

export interface RegionFacts extends OfficialRegionFacts {
  lastUpdatedUtc: string;
}

export interface RegionStatus extends StateOutput {
  timestamp_utc: string | null;
  data_source_label: string;
}

const regionFacts = new Map<string, RegionFacts>();

let lastDataSourceLabel = "unknown";

export const applyOfficialSnapshot = (snapshot: OfficialSnapshot): void => {
  const { regions, fetchedAtUtc, dataSourceLabel } = snapshot;

  lastDataSourceLabel = dataSourceLabel;

  for (const region of regions) {
    regionFacts.set(region.regionId, {
      ...region,
      lastUpdatedUtc: fetchedAtUtc
    });
  }
};

const buildInputsForRegion = (
  regionId: string,
  now: Date
): { inputs: StateInputs; timestampUtc: string | null } => {
  const facts = regionFacts.get(regionId);

  if (!facts) {
    return {
      inputs: {
        current_alert_active: false,
        last_alert_timestamp_utc: null,
        official_release_detected: false,
        data_valid: false
      },
      timestampUtc: null
    };
  }

  const lastUpdated = new Date(facts.lastUpdatedUtc);
  const ageMs = now.getTime() - lastUpdated.getTime();
  const dataValid = ageMs <= STALE_AFTER_MS;

  return {
    inputs: {
      current_alert_active: facts.currentAlertActive,
      last_alert_timestamp_utc: facts.lastAlertTimestampUtc,
      official_release_detected: facts.officialReleaseDetected,
      data_valid: dataValid
    },
    timestampUtc: facts.lastUpdatedUtc
  };
};

export const getRegionStatus = (regionId: string): RegionStatus => {
  const now = new Date();
  const { inputs, timestampUtc } = buildInputsForRegion(regionId, now);
  const state: StateOutput = computeState(inputs);

  return {
    ...state,
    timestamp_utc: timestampUtc,
    data_source_label: lastDataSourceLabel
  };
};

