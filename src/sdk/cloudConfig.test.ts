import { afterEach, describe, expect, it, vi } from "vitest";
import { cloudConfig } from "./cloudConfig";
import { createCloud } from "./cloud";
import { createReporter } from "../report/send";
import { analyticsTag } from "../build/analytics";

afterEach(() => vi.unstubAllEnvs());

describe("unconfigured fork", () => {
  it.each([["", ""], ["test-key", ""], ["", "test-project"]])(
    "makes no cloud requests with incomplete config (%s, %s)",
    async (key, project) => {
      vi.stubEnv("VITE_FIREBASE_API_KEY", key);
      vi.stubEnv("VITE_FIREBASE_PROJECT_ID", project);
      expect(cloudConfig()).toEqual({ apiKey: "", projectId: "" });
      const fetchImpl = vi.fn();
      // Even a persisted identity must not permit token refresh while offline.
      const store = { read: () => JSON.stringify({ uid: "old", code: "ABCD-EFGH", refreshToken: "old-token" }), write: () => true };
      const cloud = createCloud({ fetchImpl, store });
      expect(await cloud.connect()).toBeNull();
      expect(await cloud.scores()).toBeNull();
      expect(await cloud.restore("ABCD-EFGH")).toBeNull();
      const reporter = createReporter({ fetchImpl, store });
      expect(await reporter.send({ kind: "bug", reason: "froze", message: "test", ctx: {} })).toEqual({ ok: false, why: "failed" });
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );
  it("ships no GA bootstrap by default", () => {
    expect(analyticsTag("/")).toBe("");
  });
});
