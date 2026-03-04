import { getRegions } from "../regions";

export interface OfficialRegionFacts {
  regionId: string;
  currentAlertActive: boolean;
  lastAlertTimestampUtc: string | null;
  officialReleaseDetected: boolean;
}

export interface OfficialSnapshot {
  regions: OfficialRegionFacts[];
  fetchedAtUtc: string;
  dataSourceLabel: string;
}

export const OFFICIAL_DATA_SOURCE_LABEL =
  "Pikud HaOref official feed (stubbed)";

// Placeholder adapter – returns no alerts and no releases.
// Later this will be wired to the real Pikud HaOref feed.
export const fetchOfficialSnapshot = async (): Promise<OfficialSnapshot> => {
  const nowUtc = new Date().toISOString();
  const regions = getRegions().map<OfficialRegionFacts>((region) => ({
    regionId: region.region_id,
    currentAlertActive: false,
    lastAlertTimestampUtc: null,
    officialReleaseDetected: false
  }));

  return {
    regions,
    fetchedAtUtc: nowUtc,
    dataSourceLabel: OFFICIAL_DATA_SOURCE_LABEL
  };
};

