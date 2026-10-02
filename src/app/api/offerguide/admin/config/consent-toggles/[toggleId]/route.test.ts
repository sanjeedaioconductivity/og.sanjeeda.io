import { describe, it, expect } from "vitest";
import { blockMasterToggleDeletion } from "./route";

describe("blockMasterToggleDeletion — 409 on retiring the master consent toggle", () => {
  it("blocks deletion of the master toggle with 409", async () => {
    const response = blockMasterToggleDeletion({ isMaster: true, toggleId: "consent_share_anonymous" });
    expect(response).not.toBeNull();
    expect(response!.status).toBe(409);

    const body = await response!.json();
    expect(body.error).toBe("conflict");
    expect(body.message).toMatch(/cannot be retired/i);
  });

  it("allows deletion of any non-master toggle", () => {
    const response = blockMasterToggleDeletion({ isMaster: false, toggleId: "consent_salary_ranges" });
    expect(response).toBeNull();
  });
});
