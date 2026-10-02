import { describe, it, expect } from "vitest";
import {
  MIN_QUICK_COMPARE_INTERESTS,
  nextScreenInMode,
  previousScreenInMode,
  progressLabelForMode,
  QUICK_COMPARE_PATH,
  screensForMode,
} from "./compareMode";
import { getScreen, TOTAL_STEPS, WIZARD_SCREENS } from "./screens";
import { SCR002_LIMITS } from "./scr002";

describe("screensForMode", () => {
  it("gives the full ten steps for full mode, in order", () => {
    expect(screensForMode("full")).toHaveLength(TOTAL_STEPS);
    expect(screensForMode("full")).toEqual(WIZARD_SCREENS);
  });

  it("gives the six quick-path steps, in order", () => {
    const quick = screensForMode("quick");
    expect(quick.map((s) => s.id)).toEqual([...QUICK_COMPARE_PATH]);
    expect(quick.map((s) => s.step)).toEqual([1, 2, 3, 4, 9, 10]);
  });

  it("resolves every quick-path id to a real, built screen", () => {
    // Guards the non-null assertion in screensForMode: a typo in the path array
    // would otherwise crash the wizard chrome at render time.
    for (const screen of screensForMode("quick")) {
      expect(screen).toBeDefined();
      expect(screen.built).toBe(true);
    }
  });
});

describe("nextScreenInMode", () => {
  it("walks one step at a time in full mode", () => {
    expect(nextScreenInMode("SCR-004", "full")?.id).toBe("SCR-005");
  });

  it("skips the four optional screens in quick mode", () => {
    // The point of the mode: Compensation goes straight to Compare.
    expect(nextScreenInMode("SCR-004", "quick")?.id).toBe("SCR-009");
  });

  it("still ends on the report in quick mode", () => {
    expect(nextScreenInMode("SCR-009", "quick")?.id).toBe("SCR-010");
  });

  it("returns null at the end of either path", () => {
    expect(nextScreenInMode("SCR-010", "full")).toBeNull();
    expect(nextScreenInMode("SCR-010", "quick")).toBeNull();
  });

  it("moves forward from an off-path screen to the next one that IS on the path", () => {
    // A candidate who switched to quick while standing on Growth (step 7), or
    // who opened a skipped screen by URL, must not be stranded there.
    expect(nextScreenInMode("SCR-007", "quick")?.id).toBe("SCR-009");
    expect(nextScreenInMode("SCR-005", "quick")?.id).toBe("SCR-009");
  });
});

describe("previousScreenInMode", () => {
  it("walks back one step at a time in full mode", () => {
    expect(previousScreenInMode("SCR-005", "full")?.id).toBe("SCR-004");
  });

  it("goes back past the skipped screens in quick mode", () => {
    expect(previousScreenInMode("SCR-009", "quick")?.id).toBe("SCR-004");
  });

  it("returns null on the first step of either path", () => {
    expect(previousScreenInMode("SCR-001", "full")).toBeNull();
    expect(previousScreenInMode("SCR-001", "quick")).toBeNull();
  });

  it("moves back from an off-path screen to the nearest earlier path screen", () => {
    expect(previousScreenInMode("SCR-006", "quick")?.id).toBe("SCR-004");
  });
});

describe("progressLabelForMode", () => {
  it("leaves the label alone in full mode", () => {
    expect(progressLabelForMode(getScreen("SCR-004"), "full")).toBeNull();
  });

  it("counts the quick path, not the ten steps", () => {
    const label = progressLabelForMode(getScreen("SCR-009"), "quick");
    expect(label?.mobile).toBe("5 of 6");
    expect(label?.desktop).toContain("step 5 of 6");
    expect(label?.desktop).toContain("Compare");
  });

  it("falls back to the standard label on a screen the quick path skips", () => {
    // "step 0 of 6" would be worse than the honest full-flow position.
    expect(progressLabelForMode(getScreen("SCR-007"), "quick")).toBeNull();
  });
});

describe("the three-interest gate", () => {
  it("matches the maximum SCR-002 allows, so 'minimum three' means all of them", () => {
    expect(MIN_QUICK_COMPARE_INTERESTS).toBe(SCR002_LIMITS.maxPriorities);
  });

  it("does not change what a FULL walk-through requires", () => {
    // CR-02 gates the shortcut, not the wizard. SCR-002 still takes one.
    expect(SCR002_LIMITS.minPriorities).toBe(1);
  });
});
