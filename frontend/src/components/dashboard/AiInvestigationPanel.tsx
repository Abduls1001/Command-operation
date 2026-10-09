"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Card } from "@/components/ui/Card";
import {
  INVESTIGATE_MAX_LENGTH,
  InvestigationError,
  investigate,
  validateQuestion,
  type InvestigationResult,
} from "@/lib/api/agent";

type PanelState =
  | { status: "idle" }
  | { status: "loading"; question: string }
  | { status: "success"; question: string; result: InvestigationResult }
  | { status: "error"; question: string; error: InvestigationError };

const PLACEHOLDER =
  "e.g. Why did revenue drop today? Are payment failures higher than usual?";

const SECONDARY_BUTTON =
  "rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

/**
 * AI Investigation (Phase 15): ask the backend agent an operational question and
 * show its evidence-based answer and the read-only tools it used.
 *
 * The answer and tool names come from an LLM and are untrusted: they are rendered
 * only as React text nodes, never as HTML.
 */
export function AiInvestigationPanel() {
  const [question, setQuestion] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [state, setState] = useState<PanelState>({ status: "idle" });

  const inputId = useId();
  const hintId = useId();
  const validationId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Set synchronously so a double click / double Enter cannot start two requests
  // before React has re-rendered the disabled state.
  const inFlightRef = useRef(false);

  useEffect(() => () => abortRef.current?.abort(), []);

  const isLoading = state.status === "loading";
  const length = Array.from(question.trim()).length;
  const overLimit = length > INVESTIGATE_MAX_LENGTH;

  async function run(rawQuestion: string) {
    if (inFlightRef.current) return;

    let trimmed: string;
    try {
      trimmed = validateQuestion(rawQuestion);
    } catch (error) {
      setValidationMessage(error instanceof Error ? error.message : "Invalid question.");
      return;
    }

    setValidationMessage(null);
    inFlightRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    // Clears any previous answer so it is never shown against the new question.
    setState({ status: "loading", question: trimmed });

    try {
      const result = await investigate(trimmed, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setState({ status: "success", question: trimmed, result });
    } catch (error) {
      if (controller.signal.aborted) return;
      const failure =
        error instanceof InvestigationError
          ? error
          : new InvestigationError("network", "Something went wrong. Please try again.");
      setState({ status: "error", question: trimmed, error: failure });
    } finally {
      if (abortRef.current === controller) {
        inFlightRef.current = false;
        abortRef.current = null;
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(question);
  }

  function askAnother() {
    setQuestion("");
    setValidationMessage(null);
    setState({ status: "idle" });
    textareaRef.current?.focus();
  }

  const describedBy = [hintId, validationMessage ? validationId : null].filter(Boolean).join(" ");

  return (
    <Card className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-foreground">AI Investigation</h3>
      <p className="mt-1 text-sm text-muted">
        Ask the AI agent an operational question. It answers from NovaCommerce data using
        read-only tools and lists the tools it used.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          Your question
        </label>
        <textarea
          ref={textareaRef}
          id={inputId}
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value);
            if (validationMessage) setValidationMessage(null);
          }}
          rows={3}
          disabled={isLoading}
          placeholder={PLACEHOLDER}
          aria-describedby={describedBy}
          aria-invalid={validationMessage ? true : undefined}
          className="mt-1 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
          <p id={hintId} className={`text-xs ${overLimit ? "text-danger" : "text-muted"}`}>
            {length} / {INVESTIGATE_MAX_LENGTH} characters
          </p>
          {validationMessage && (
            <p id={validationId} role="alert" className="text-xs font-medium text-danger">
              {validationMessage}
            </p>
          )}
        </div>

        <div className="mt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md border border-accent bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Investigating…" : "Investigate"}
          </button>
        </div>
      </form>

      <div aria-live="polite" className="mt-4">
        {state.status === "loading" && (
          <p role="status" className="text-sm text-muted">
            Investigating “{state.question}”… this can take a little while while the agent
            reads operational data.
          </p>
        )}

        {state.status === "error" && (
          <div role="alert" className="rounded-md border border-danger/30 p-3">
            <p className="text-sm font-medium text-danger">Investigation failed</p>
            <p className="mt-1 text-sm text-foreground">{state.error.message}</p>
            <div className="mt-3">
              {state.error.retryable ? (
                <button
                  type="button"
                  onClick={() => void run(state.question)}
                  className={SECONDARY_BUTTON}
                >
                  Retry
                </button>
              ) : (
                <p className="text-xs text-muted">Edit your question and try again.</p>
              )}
            </div>
          </div>
        )}

        {state.status === "success" && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Question</p>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground">
              {state.question}
            </p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
              Answer
            </p>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground">
              {state.result.answer}
            </p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
              Tools used
            </p>
            {state.result.tools_used.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-2">
                {state.result.tools_used.map((tool, index) => (
                  <li
                    key={`${index}-${tool}`}
                    className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-xs text-foreground"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-0.5 text-sm text-muted">The agent did not use any tools.</p>
            )}

            <div className="mt-4">
              <button type="button" onClick={askAnother} className={SECONDARY_BUTTON}>
                Ask another question
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
