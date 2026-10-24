import { describe, expect, it } from "vitest";
import { parseTags } from "@/features/library/hooks";
import { filenameFromDisposition } from "@/lib/download";
import { formatBytes, formatCompact, formatSigned, niceTicks } from "@/lib/numbers";

describe("niceTicks", () => {
  it("produces round steps that cover the max", () => {
    expect(niceTicks(87)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(1200)).toEqual([0, 500, 1000, 1500]);
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});

describe("number formatting", () => {
  it("formats compact, signed and byte values", () => {
    expect(formatCompact(1234)).toBe("1,234");
    expect(formatCompact(25_000)).toMatch(/25K/);
    expect(formatCompact(null)).toBe("—");
    expect(formatSigned(-12)).toBe("−12");
    expect(formatSigned(5)).toBe("+5");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});

describe("filenameFromDisposition", () => {
  it("reads quoted, plain and RFC 5987 filenames", () => {
    expect(filenameFromDisposition('attachment; filename="post-2026.csv"', "x")).toBe(
      "post-2026.csv",
    );
    expect(filenameFromDisposition("attachment; filename=a.pdf", "x")).toBe("a.pdf");
    expect(filenameFromDisposition("attachment; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf", "x")).toBe(
      "résumé.pdf",
    );
    expect(filenameFromDisposition(null, "fallback.csv")).toBe("fallback.csv");
  });
});

describe("parseTags", () => {
  it("splits, trims, lowercases and de-duplicates", () => {
    expect(parseTags("Launch, brand , launch,,")).toEqual(["launch", "brand"]);
  });
});
