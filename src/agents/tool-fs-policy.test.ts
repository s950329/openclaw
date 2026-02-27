import { describe, expect, it } from "vitest";
import { assertNotProtectedPath, createToolFsPolicy, isProtectedPath } from "./tool-fs-policy.js";

describe("isProtectedPath", () => {
  it("returns false when no protected paths", () => {
    expect(isProtectedPath("AGENTS.md", [])).toBe(false);
  });

  it("matches exact file path", () => {
    expect(isProtectedPath("AGENTS.md", ["AGENTS.md"])).toBe(true);
  });

  it("does not match partial file name", () => {
    expect(isProtectedPath("MY_AGENTS.md", ["AGENTS.md"])).toBe(false);
  });

  it("matches directory prefix", () => {
    expect(isProtectedPath("knowledge/company/sop.md", ["knowledge/company/"])).toBe(true);
  });

  it("matches nested files under directory prefix", () => {
    expect(isProtectedPath("knowledge/company/sub/deep.md", ["knowledge/company/"])).toBe(true);
  });

  it("does not match sibling directories", () => {
    expect(isProtectedPath("knowledge/personal/notes.md", ["knowledge/company/"])).toBe(false);
  });

  it("handles multiple protected paths", () => {
    const protectedPaths = ["AGENTS.md", "SOUL.md", "knowledge/company/"];
    expect(isProtectedPath("AGENTS.md", protectedPaths)).toBe(true);
    expect(isProtectedPath("SOUL.md", protectedPaths)).toBe(true);
    expect(isProtectedPath("knowledge/company/sop.md", protectedPaths)).toBe(true);
    expect(isProtectedPath("documents/report.md", protectedPaths)).toBe(false);
  });

  it("normalizes path separators", () => {
    expect(isProtectedPath("knowledge\\company\\sop.md", ["knowledge/company/"])).toBe(true);
  });
});

describe("assertNotProtectedPath", () => {
  it("does not throw for unprotected path", () => {
    expect(() => assertNotProtectedPath("documents/report.md", ["AGENTS.md"])).not.toThrow();
  });

  it("throws for protected path with descriptive message", () => {
    expect(() => assertNotProtectedPath("AGENTS.md", ["AGENTS.md"])).toThrow(
      'Write denied: "AGENTS.md" is a protected file',
    );
  });
});

describe("createToolFsPolicy", () => {
  it("defaults protectedPaths to empty array", () => {
    const policy = createToolFsPolicy({});
    expect(policy.protectedPaths).toEqual([]);
  });

  it("passes through protectedPaths", () => {
    const policy = createToolFsPolicy({ protectedPaths: ["AGENTS.md"] });
    expect(policy.protectedPaths).toEqual(["AGENTS.md"]);
  });
});
