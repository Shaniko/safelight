import { describe, expect, it } from "vitest";
import { computeState, type StateInputs } from "./stateMachine";

const makeInputs = (overrides: Partial<StateInputs> = {}): StateInputs => ({
  current_alert_active: false,
  last_alert_timestamp_utc: null,
  official_release_detected: false,
  data_valid: true,
  ...overrides
});

describe("computeState", () => {
  it("returns GREY when data is not valid", () => {
    const result = computeState(
      makeInputs({
        data_valid: false
      })
    );

    expect(result.state).toBe("GREY");
    expect(result.display_text).toBe("Information currently unavailable");
    expect(result.disclaimer).toBeNull();
  });

  it("returns RED when current alert is active, even if official release also detected", () => {
    const result = computeState(
      makeInputs({
        current_alert_active: true,
        official_release_detected: true
      })
    );

    expect(result.state).toBe("RED");
    expect(result.display_text).toBe("Active instruction in this area");
    expect(result.disclaimer).toBeNull();
  });

  it("returns RED when only alert is active", () => {
    const result = computeState(
      makeInputs({
        current_alert_active: true
      })
    );

    expect(result.state).toBe("RED");
    expect(result.display_text).toBe("Active instruction in this area");
  });

  it("returns GREEN when official release detected and no active alert", () => {
    const result = computeState(
      makeInputs({
        official_release_detected: true
      })
    );

    expect(result.state).toBe("GREEN");
    expect(result.display_text).toBe("Official release published");
  });

  it("returns GREY when data is valid but no alert and no official release", () => {
    const result = computeState(makeInputs());

    expect(result.state).toBe("GREY");
    expect(result.display_text).toBe("Information currently unavailable");
  });
});

