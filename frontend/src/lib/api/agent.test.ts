import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INVESTIGATE_MAX_LENGTH, InvestigationError, investigate } from "./agent";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function failureOf(promise: Promise<unknown>): Promise<InvestigationError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(InvestigationError);
    return error as InvestigationError;
  }
  throw new Error("expected the call to fail");
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("investigate()", () => {
  it("POSTs the trimmed question as JSON to /api/agent/investigate", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ question: "Why?", answer: "Because.", tools_used: ["get_orders"] }),
    );

    const result = await investigate("  Why?  \n");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/agent\/investigate$/);
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ question: "Why?" });
    expect(result).toEqual({ question: "Why?", answer: "Because.", tools_used: ["get_orders"] });
  });

  it("rejects empty and whitespace-only questions without a request", async () => {
    for (const input of ["", "   ", "\n\t"]) {
      const error = await failureOf(investigate(input));
      expect(error.kind).toBe("validation");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts exactly the maximum length and rejects one more", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ question: "q", answer: "a", tools_used: [] }));
    await expect(investigate("x".repeat(INVESTIGATE_MAX_LENGTH))).resolves.toBeDefined();

    fetchMock.mockClear();
    const error = await failureOf(investigate("x".repeat(INVESTIGATE_MAX_LENGTH + 1)));
    expect(error.kind).toBe("validation");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("counts characters like the backend (code points, not UTF-16 units)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ question: "q", answer: "a", tools_used: [] }));
    // 1000 emoji = 2000 UTF-16 units but 1000 characters for Python's len().
    await expect(investigate("😀".repeat(INVESTIGATE_MAX_LENGTH))).resolves.toBeDefined();
  });

  it("turns an HTTP error with a string detail into a readable error", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "LLM is not configured." }, 503));

    const error = await failureOf(investigate("Why?"));

    expect(error.kind).toBe("http");
    expect(error.status).toBe(503);
    expect(error.message).toContain("HTTP 503");
    expect(error.message).toContain("LLM is not configured.");
    expect(error.retryable).toBe(true);
  });

  it("handles the backend's generic 500 and offers retry", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: "An unexpected error occurred during investigation." }, 500),
    );

    const error = await failureOf(investigate("Why?"));

    expect(error.status).toBe(500);
    expect(error.message).toContain("HTTP 500");
    expect(error.message).toContain("An unexpected error occurred during investigation.");
    expect(error.retryable).toBe(true);
  });

  it("reads the message from a FastAPI 422 validation body and does not offer retry", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: [{ type: "value_error", msg: "Value error, too long" }] }, 422),
    );

    const error = await failureOf(investigate("Why?"));

    expect(error.status).toBe(422);
    expect(error.message).toContain("Value error, too long");
    expect(error.retryable).toBe(false);
  });

  it("handles an error response that is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad Gateway</html>", { status: 502 }));

    const error = await failureOf(investigate("Why?"));

    expect(error.kind).toBe("http");
    expect(error.message).toBe("The investigation failed (HTTP 502).");
    expect(error.message).not.toContain("html");
  });

  it("reports a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await failureOf(investigate("Why?"));

    expect(error.kind).toBe("network");
    expect(error.retryable).toBe(true);
  });

  it.each([
    ["a non-object body", "just a string"],
    ["null", null],
    ["a missing answer", { question: "q", tools_used: [] }],
    ["an empty answer", { question: "q", answer: "  ", tools_used: [] }],
    ["a non-string answer", { question: "q", answer: 42, tools_used: [] }],
    ["missing tools_used", { question: "q", answer: "a" }],
    ["tools_used that is not a list", { question: "q", answer: "a", tools_used: "get_orders" }],
    ["non-string tool names", { question: "q", answer: "a", tools_used: ["get_orders", 7] }],
  ])("rejects a 200 response with %s", async (_label, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body));

    const error = await failureOf(investigate("Why?"));

    expect(error.kind).toBe("invalid_response");
  });

  it("rejects a 200 response whose body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("not json", { status: 200 }));

    const error = await failureOf(investigate("Why?"));

    expect(error.kind).toBe("invalid_response");
  });
});
