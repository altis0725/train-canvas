import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("Shotstack API Configuration", () => {
  it("has valid API key configured", () => {
    expect(ENV.shotstackApiKey).toBeTruthy();
    expect(ENV.shotstackApiKey.length).toBeGreaterThan(0);
    expect(ENV.shotstackApiKey).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("API key matches expected format", () => {
    // Shotstack API keys are typically 40 characters long
    expect(ENV.shotstackApiKey.length).toBeGreaterThanOrEqual(30);
  });
});
