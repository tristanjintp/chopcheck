import { afterEach, describe, expect, it, vi } from "vitest";
import { requestModel } from "../../lib/analysis/model";

// Ces tests contrôlent le repli sans dépenser de crédit ni utiliser le réseau.
describe("model availability", () => {
  const previousKey = process.env.OPENAI_NEXT_API_KEY;
  const previousModel = process.env.OPENAI_NEXT_MODEL;
  const previousFallback = process.env.OPENAI_NEXT_FALLBACK_MODEL;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (previousKey === undefined) delete process.env.OPENAI_NEXT_API_KEY;
    else process.env.OPENAI_NEXT_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.OPENAI_NEXT_MODEL;
    else process.env.OPENAI_NEXT_MODEL = previousModel;
    if (previousFallback === undefined) delete process.env.OPENAI_NEXT_FALLBACK_MODEL;
    else process.env.OPENAI_NEXT_FALLBACK_MODEL = previousFallback;
  });

  it("uses the fallback model after HTTP 503", async () => {
    process.env.OPENAI_NEXT_API_KEY = "test-key";
    process.env.OPENAI_NEXT_MODEL = "claude-sonnet-4-5";
    process.env.OPENAI_NEXT_FALLBACK_MODEL = "gpt-4o-mini";
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      const model = JSON.parse(String(init.body)).model as string;
      calls.push(model);
      if (model === "claude-sonnet-4-5") return new Response("unavailable", { status: 503 });
      return Response.json({ choices: [{ message: { content: "OK" } }] });
    }));

    expect(await requestModel([{ role: "user", content: "Test" }])).toBe("OK");
    expect(calls).toEqual(["claude-sonnet-4-5", "gpt-4o-mini"]);
  });

  it("explains a missing local key before sending a request", async () => {
    delete process.env.OPENAI_NEXT_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(requestModel([{ role: "user", content: "Test" }])).rejects.toThrow(".env.local");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
