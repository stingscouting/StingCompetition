import { describe, expect, it } from "vitest";
import { normalizeProspect } from "@/lib/validation";
import { toDateKey } from "@/lib/time";

describe("normalizeProspect", () => {
  it("normalizes case and spaces for duplicate matching", () => {
    expect(normalizeProspect("  ACME   Corp ")).toBe("acme corp");
  });
});

describe("toDateKey", () => {
  it("uses competition timezone day boundaries", () => {
    const iso = "2026-02-12T04:30:00.000Z";
    expect(toDateKey(iso, "America/New_York")).toBe("2026-02-11");
    expect(toDateKey(iso, "Europe/Stockholm")).toBe("2026-02-12");
  });
});
