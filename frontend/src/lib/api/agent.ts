/**
 * Client for the Phase 14 AI agent endpoint: POST /api/agent/investigate.
 *
 * Contract (backend/app/api/routes/agent.py):
 *   request   { "question": string }            — trimmed server-side, 1..1000 chars
 *   response  { "question": string, "answer": string, "tools_used": string[] }
 *   errors    422 (validation), 502 (LLM provider failed), 503 (LLM not configured)
 *             with a JSON body { "detail": string | [{ "msg": string, ... }] }
 *
 * All LLM access stays on the backend; the browser only talks to this endpoint.
 */

// NEXT_PUBLIC_ values are public; this is only the backend address, not a secret.
// Same variable and default as the dashboard's data fetching.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  "",
);

export const INVESTIGATE_PATH = "/api/agent/investigate";
export const INVESTIGATE_MAX_LENGTH = 1000;

export interface InvestigationResult {
  question: string;
  answer: string;
  tools_used: string[];
}

export type InvestigationErrorKind = "validation" | "http" | "network" | "invalid_response";

export class InvestigationError extends Error {
  readonly kind: InvestigationErrorKind;
  readonly status?: number;

  constructor(kind: InvestigationErrorKind, message: string, status?: number) {
    super(message);
    this.name = "InvestigationError";
    this.kind = kind;
    this.status = status;
  }

  /** Whether sending the same question again could plausibly succeed. */
  get retryable(): boolean {
    if (this.kind === "validation") return false;
    if (this.kind === "http") return this.status === undefined || this.status >= 500;
    return true;
  }
}

/** Length as the backend counts it (Python len() = Unicode code points, not UTF-16 units). */
function codePointLength(text: string): number {
  return Array.from(text).length;
}

/** Trims and validates a question. Throws InvestigationError("validation") when it is not sendable. */
export function validateQuestion(raw: string): string {
  const question = raw.trim();
  if (!question) {
    throw new InvestigationError("validation", "Enter a question before investigating.");
  }
  const length = codePointLength(question);
  if (length > INVESTIGATE_MAX_LENGTH) {
    throw new InvestigationError(
      "validation",
      `Question is too long: ${length} of ${INVESTIGATE_MAX_LENGTH} characters allowed.`,
    );
  }
  return question;
}

const MAX_DETAIL_CHARS = 300;

/** Pulls a short human-readable message out of a FastAPI error body, if there is one. */
function extractDetail(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("detail" in body)) return null;
  const detail = (body as { detail: unknown }).detail;
  let text: string | null = null;
  if (typeof detail === "string") {
    text = detail;
  } else if (Array.isArray(detail)) {
    const first = detail[0];
    if (typeof first === "object" && first !== null && "msg" in first) {
      const msg = (first as { msg: unknown }).msg;
      if (typeof msg === "string") text = msg;
    }
  }
  text = text?.trim() ?? null;
  if (!text) return null;
  return text.length > MAX_DETAIL_CHARS ? `${text.slice(0, MAX_DETAIL_CHARS)}…` : text;
}

function parseResult(body: unknown): InvestigationResult {
  if (typeof body === "object" && body !== null) {
    const { question, answer, tools_used } = body as Record<string, unknown>;
    if (
      typeof answer === "string" &&
      answer.trim() !== "" &&
      Array.isArray(tools_used) &&
      tools_used.every((tool): tool is string => typeof tool === "string")
    ) {
      return {
        question: typeof question === "string" ? question : "",
        answer,
        tools_used,
      };
    }
  }
  throw new InvestigationError(
    "invalid_response",
    "The server returned an unexpected response, so no answer can be shown.",
  );
}

/**
 * Sends one question to the agent and returns the validated response.
 * Validates before sending: invalid input never reaches the network.
 */
export async function investigate(
  rawQuestion: string,
  options: { signal?: AbortSignal } = {},
): Promise<InvestigationResult> {
  const question = validateQuestion(rawQuestion);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${INVESTIGATE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ question }),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new InvestigationError(
      "network",
      "Could not reach the investigation service. Check that the backend is running and try again.",
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const detail = extractDetail(body);
    const prefix = `The investigation failed (HTTP ${response.status})`;
    throw new InvestigationError(
      "http",
      detail ? `${prefix}: ${detail}` : `${prefix}.`,
      response.status,
    );
  }

  return parseResult(body);
}
