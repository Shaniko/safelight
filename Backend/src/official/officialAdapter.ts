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

type UpstreamAlertType = "alert" | "pre-alert" | "none";

interface UpstreamAlert {
  type: UpstreamAlertType;
  cities: string[];
  instructions?: string;
}

export interface UpstreamDebugSnapshot {
  type: UpstreamAlertType;
  cities: string[];
  instructions: string | null;
  fetchedAtUtc: string;
  source: string;
}

const FETCH_TIMEOUT_MS =
  Number.parseInt(process.env.OREF_TIMEOUT_MS ?? "", 10) || 5000;
const FETCH_RETRIES =
  Number.parseInt(process.env.OREF_RETRIES ?? "", 10) || 2;

const ALERTS_URL =
  "https://www.oref.org.il/WarningMessages/alert/alerts.json";
const HISTORY_URL =
  "https://www.oref.org.il/WarningMessages/History/AlertsHistory.json";

const ALERTS_HEADERS: Record<string, string> = {
  "User-Agent":
    process.env.OREF_USER_AGENT ??
    "SafeLight/1.0 (+https://github.com/letsai/safelight)",
  Referer: "https://www.oref.org.il/12481-he/pakar.aspx",
  "X-Requested-With": "XMLHttpRequest",
  Accept: "application/json, text/javascript, */*; q=0.01",
  "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache"
};

export const OFFICIAL_DATA_SOURCE_LABEL =
  "Pikud HaOref unofficial alerts JSON";

const RELEASE_PATTERNS: string[] = [
  "ניתן לצאת מהמרחב המוגן",
  "אפשר לצאת מהמרחב המוגן",
  "ניתן לחזור לשגרה",
  "אפשר לחזור לשגרה"
];

const CITY_NAME_TO_REGION_ID: Record<string, string> = {
  "tel aviv-yafo": "tel-aviv-yafo",
  "tel aviv": "tel-aviv-yafo",
  "תל אביב - מזרח": "tel-aviv-yafo",
  "תל אביב - מרכז": "tel-aviv-yafo",
  "תל אביב - דרום": "tel-aviv-yafo",
  "תל אביב": "tel-aviv-yafo",
  "jerusalem": "jerusalem",
  "ירושלים": "jerusalem",
  "herzliya": "herzliya",
  "הרצליה": "herzliya",
  "raanana": "raanana",
  "רעננה": "raanana",
  "kfar saba": "kfar-saba",
  "כפר סבא": "kfar-saba",
  "holon": "holon",
  "חולון": "holon",
  "ramat gan": "ramat-gan",
  "רמת גן": "ramat-gan",
  "givatayim": "givatayim",
  "גבעתיים": "givatayim",
  "petah tikva": "petah-tikva",
  "petah-tikva": "petah-tikva",
  "פתח תקווה": "petah-tikva",
  "netanya": "netanya",
  "נתניה": "netanya",
  "ashdod": "ashdod",
  "אשדוד": "ashdod",
  "ashkelon": "ashkelon",
  "אשקלון": "ashkelon",
  "haifa": "haifa",
  "חיפה": "haifa",
  "beer sheva": "beer-sheva",
  "be'er sheva": "beer-sheva",
  "באר שבע": "beer-sheva"
};

const normalizeCityKey = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

const isReleaseMessage = (instructions: string | undefined): boolean => {
  if (!instructions) return false;
  return RELEASE_PATTERNS.some((pattern) => instructions.includes(pattern));
};

const PRE_ALERT_PATTERNS: string[] = [
  "הישארו בקרבת מרחב מוגן",
  "הישארו בקרבת המרחב המוגן"
];

const classifyAlertType = (
  hasAlert: boolean,
  instructions: string | null
): UpstreamAlertType => {
  if (!hasAlert) return "none";
  const text = instructions ?? "";
  if (PRE_ALERT_PATTERNS.some((pattern) => text.includes(pattern))) {
    return "pre-alert";
  }
  return "alert";
};

let lastUpstreamDebug: UpstreamDebugSnapshot | null = null;

export const getLastUpstreamDebug =
  (): UpstreamDebugSnapshot | null => lastUpstreamDebug;

const fetchJsonWithTimeout = async (url: string): Promise<unknown> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: ALERTS_HEADERS,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(
        `Oref JSON request failed with status ${response.status}`
      );
    }

    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch (error) {
      throw new Error("Oref JSON response is not valid JSON");
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

interface AlertsRecord {
  data?: unknown;
  title?: unknown;
  category?: unknown;
  alertDate?: unknown;
  [key: string]: unknown;
}

const extractAlertsRecords = (value: unknown): AlertsRecord[] => {
  if (Array.isArray(value)) {
    return value as AlertsRecord[];
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;

    if (Array.isArray(obj.Alerts)) {
      return obj.Alerts as AlertsRecord[];
    }

    return [obj as AlertsRecord];
  }

  return [];
};

const parseCitiesFromData = (data: unknown): string[] => {
  if (typeof data !== "string") return [];
  return data
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
};

const extractInstructionsFromRecord = (record: AlertsRecord): string | null => {
  const title = record.title;
  if (typeof title === "string" && title.trim().length > 0) {
    return title.trim();
  }
  const msg = (record as Record<string, unknown>).msg;
  if (typeof msg === "string" && msg.trim().length > 0) {
    return msg.trim();
  }
  return null;
};

const normalizeAlertsPayload = (value: unknown): UpstreamAlert => {
  const records = extractAlertsRecords(value);

  const citySet = new Set<string>();
  const instructionSnippets: string[] = [];

  for (const record of records) {
    const cities = parseCitiesFromData(record.data);
    for (const city of cities) {
      citySet.add(city);
    }

    const maybeInstructions = extractInstructionsFromRecord(record);
    if (maybeInstructions) {
      instructionSnippets.push(maybeInstructions);
    }
  }

  const cities = Array.from(citySet);
  const hasAlert = cities.length > 0;
  const instructions =
    instructionSnippets.length > 0
      ? instructionSnippets.join(" | ")
      : null;

  const type = classifyAlertType(hasAlert, instructions);

  return {
    type,
    cities,
    instructions: instructions ?? undefined
  };
};

const fetchUpstreamAlert = async (): Promise<UpstreamAlert> => {
  let lastError: unknown;
  const attempts = FETCH_RETRIES + 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const payload = await fetchJsonWithTimeout(ALERTS_URL);
      return normalizeAlertsPayload(payload);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error("Unknown Pikud HaOref upstream error");
};

const ENABLE_RELEASE_DETECTION =
  process.env.OREF_ENABLE_RELEASE === "1" ||
  process.env.OREF_ENABLE_RELEASE === "true";

const buildRegionFacts = (
  alert: UpstreamAlert,
  nowUtc: string
): OfficialRegionFacts[] => {
  const regions = getRegions();
  const activeRegionIds = new Set<string>();

  for (const city of alert.cities) {
    const normalized = normalizeCityKey(city);
    const regionId = CITY_NAME_TO_REGION_ID[normalized] ?? CITY_NAME_TO_REGION_ID[city];
    if (regionId) {
      activeRegionIds.add(regionId);
    }
  }

  const release = isReleaseMessage(alert.instructions);
  const isNone = alert.type === "none";

  return regions.map<OfficialRegionFacts>((region) => {
    const regionId = region.region_id;
    const inAlert = activeRegionIds.has(regionId);

    const currentAlertActive = !isNone && inAlert;

    const officialReleaseDetected =
      ENABLE_RELEASE_DETECTION && release && inAlert;

    const lastAlertTimestampUtc = null;

    return {
      regionId,
      currentAlertActive,
      lastAlertTimestampUtc,
      officialReleaseDetected
    };
  });
};

export const fetchOfficialSnapshot = async (): Promise<OfficialSnapshot> => {
  const nowUtc = new Date().toISOString();

  const alert = await fetchUpstreamAlert();

  lastUpstreamDebug = {
    type: alert.type,
    cities: alert.cities,
    instructions: alert.instructions ?? null,
    fetchedAtUtc: nowUtc,
    source: "alerts.json"
  };

  const regions = buildRegionFacts(alert, nowUtc);

  return {
    regions,
    fetchedAtUtc: nowUtc,
    dataSourceLabel: OFFICIAL_DATA_SOURCE_LABEL
  };
};


