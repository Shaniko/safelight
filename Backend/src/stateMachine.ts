export type SafetyState = "RED" | "GREEN" | "GREY";

export interface StateInputs {
  current_alert_active: boolean;
  last_alert_timestamp_utc: string | null;
  official_release_detected: boolean;
  data_valid: boolean;
}

export interface StateOutput {
  state: SafetyState;
  display_text: string;
  disclaimer: string | null;
}

export const computeState = (inputs: StateInputs): StateOutput => {
  const {
    current_alert_active,
    official_release_detected,
    data_valid
  } = inputs;

  if (!data_valid) {
    return {
      state: "GREY",
      display_text: "Information currently unavailable",
      disclaimer: null
    };
  }

  if (current_alert_active) {
    return {
      state: "RED",
      display_text: "Active instruction in this area",
      disclaimer: null
    };
  }

  if (official_release_detected) {
    return {
      state: "GREEN",
      display_text: "Official release published",
      disclaimer: null
    };
  }

  return {
    state: "GREY",
    display_text: "Information currently unavailable",
    disclaimer: null
  };
};

