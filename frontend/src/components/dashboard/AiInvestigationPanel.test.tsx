import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INVESTIGATE_MAX_LENGTH } from "@/lib/api/agent";

import { AiInvestigationPanel } from "./AiInvestigationPanel";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A fetch that stays pending until the test resolves it. */
function deferredFetch() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((r) => {
    resolve = r;
  });
  fetchMock.mockReturnValueOnce(promise);
  return { resolve };
}

const ANSWER = {
  question: "Why did revenue drop?",
  answer: "Payment failures rose to 27% on the latest day.",
  tools_used: ["get_payments", "get_orders"],
};

function textbox() {
  return screen.getByRole("textbox", { name: /your question/i });
}

function investigateButton() {
  return screen.getByRole("button", { name: /investigat/i });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AiInvestigationPanel", () => {
  it("renders a labelled multiline input with a placeholder and an enabled Investigate button", () => {
    render(<AiInvestigationPanel />);

    expect(screen.getByRole("heading", { name: "AI Investigation" })).toBeInTheDocument();
    const input = textbox();
    expect(input.tagName).toBe("TEXTAREA");
    expect(input).toHaveAttribute("placeholder", expect.stringMatching(/revenue/i));
    expect(investigateButton()).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a trimmed question and shows the real answer and tools_used", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse(ANSWER));
    render(<AiInvestigationPanel />);

    await user.type(textbox(), "   Why did revenue drop?   ");
    await user.click(investigateButton());

    expect(await screen.findByText(ANSWER.answer)).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/agent\/investigate$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ question: "Why did revenue drop?" });

    const tools = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(tools).toEqual(["get_payments", "get_orders"]);
  });

  it("can be submitted from the keyboard", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse(ANSWER));
    render(<AiInvestigationPanel />);

    await user.tab(); // focus lands on the textarea
    expect(textbox()).toHaveFocus();
    await user.keyboard("Why did revenue drop?");
    await user.tab(); // then the Investigate button
    expect(investigateButton()).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(await screen.findByText(ANSWER.answer)).toBeInTheDocument();
  });

  it("says so when the agent used no tools", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ question: "q", answer: "Nothing.", tools_used: [] }));
    render(<AiInvestigationPanel />);

    await user.type(textbox(), "q");
    await user.click(investigateButton());

    expect(await screen.findByText("Nothing.")).toBeInTheDocument();
    expect(screen.getByText(/did not use any tools/i)).toBeInTheDocument();
  });

  it("rejects an empty or whitespace-only question without a request", async () => {
    const user = userEvent.setup();
    render(<AiInvestigationPanel />);

    await user.click(investigateButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(/enter a question/i);

    await user.type(textbox(), "    ");
    await user.click(investigateButton());
    expect(screen.getByRole("alert")).toHaveTextContent(/enter a question/i);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a question over the backend limit and shows how long it is", async () => {
    const user = userEvent.setup();
    render(<AiInvestigationPanel />);

    await user.click(textbox());
    await user.paste("x".repeat(INVESTIGATE_MAX_LENGTH + 1));
    await user.click(investigateButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(/too long/i);
    expect(textbox()).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a loading state and disables input and button while pending", async () => {
    const user = userEvent.setup();
    const pending = deferredFetch();
    render(<AiInvestigationPanel />);

    await user.type(textbox(), "Why did revenue drop?");
    await user.click(investigateButton());

    expect(await screen.findByRole("status")).toHaveTextContent(/investigating/i);
    expect(investigateButton()).toBeDisabled();
    expect(textbox()).toBeDisabled();

    pending.resolve(jsonResponse(ANSWER));
    expect(await screen.findByText(ANSWER.answer)).toBeInTheDocument();
  });

  it("does not send a duplicate request while one is pending", async () => {
    const user = userEvent.setup();
    const pending = deferredFetch();
    render(<AiInvestigationPanel />);

    await user.type(textbox(), "Why did revenue drop?");
    const button = investigateButton();
    await user.click(button);
    await user.click(button);
    await user.dblClick(button);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    pending.resolve(jsonResponse(ANSWER));
    await screen.findByText(ANSWER.answer);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows an HTTP error, keeps the question, and lets the user retry successfully", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: "LLM is not configured." }, 503))
      .mockResolvedValueOnce(jsonResponse(ANSWER));
    render(<AiInvestigationPanel />);

    await user.type(textbox(), "Why did revenue drop?");
    await user.click(investigateButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("HTTP 503");
    expect(alert).toHaveTextContent("LLM is not configured.");
    expect(textbox()).toHaveValue("Why did revenue drop?");

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText(ANSWER.answer)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      question: "Why did revenue drop?",
    });
  });

  it("shows useful feedback on a network failure and offers retry", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<AiInvestigationPanel />);

    await user.type(textbox(), "Why did revenue drop?");
    await user.click(investigateButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach/i);
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    expect(investigateButton()).toBeEnabled();
  });

  it("does not offer Retry for a 422 the user must fix by editing", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: [{ msg: "Value error, bad" }] }, 422));
    render(<AiInvestigationPanel />);

    await user.type(textbox(), "something");
    await user.click(investigateButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Value error, bad");
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("handles an invalid response body without showing any answer", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ unexpected: true }));
    render(<AiInvestigationPanel />);

    await user.type(textbox(), "Why did revenue drop?");
    await user.click(investigateButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(/unexpected response/i);
    expect(screen.queryByText("Answer")).not.toBeInTheDocument();
  });

  it("clears the previous answer as soon as a new question is submitted", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse(ANSWER));
    render(<AiInvestigationPanel />);

    await user.type(textbox(), "Why did revenue drop?");
    await user.click(investigateButton());
    await screen.findByText(ANSWER.answer);

    // Submit a second question straight from the answer view (no "Ask another").
    const pending = deferredFetch();
    await user.type(textbox(), "Anything about inventory?");
    await user.click(investigateButton());

    await screen.findByRole("status");
    expect(screen.queryByText(ANSWER.answer)).not.toBeInTheDocument();

    pending.resolve(
      jsonResponse({ question: "q", answer: "Inventory is fine.", tools_used: ["get_inventory"] }),
    );
    expect(await screen.findByText("Inventory is fine.")).toBeInTheDocument();
    expect(screen.queryByText(ANSWER.answer)).not.toBeInTheDocument();
  });

  it("lets the user ask another question after a completed request", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse(ANSWER))
      .mockResolvedValueOnce(
        jsonResponse({ question: "q", answer: "Second answer.", tools_used: ["get_complaints"] }),
      );
    render(<AiInvestigationPanel />);

    await user.type(textbox(), "First question");
    await user.click(investigateButton());
    await screen.findByText(ANSWER.answer);

    await user.click(screen.getByRole("button", { name: "Ask another question" }));
    expect(screen.queryByText(ANSWER.answer)).not.toBeInTheDocument();
    expect(textbox()).toHaveValue("");
    expect(textbox()).toHaveFocus();

    await user.type(textbox(), "Second question");
    await user.click(investigateButton());

    expect(await screen.findByText("Second answer.")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ question: "Second question" });
  });

  it("renders model output as plain text, never as HTML", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        question: "q",
        answer: '<img src=x onerror="alert(1)"> <b>bold</b>',
        tools_used: ['<script>alert("tool")</script>'],
      }),
    );
    const { container } = render(<AiInvestigationPanel />);

    await user.type(textbox(), "q");
    await user.click(investigateButton());

    expect(await screen.findByText(/<img src=x/)).toBeInTheDocument();
    expect(screen.getByText('<script>alert("tool")</script>')).toBeInTheDocument();
    expect(container.querySelector("img, script, b")).toBeNull();
  });

  it("ignores a response that arrives after the panel has unmounted", async () => {
    const user = userEvent.setup();
    const pending = deferredFetch();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = render(<AiInvestigationPanel />);

    await user.type(textbox(), "q");
    await user.click(investigateButton());
    unmount();
    pending.resolve(jsonResponse(ANSWER));

    await waitFor(() => expect(errorSpy).not.toHaveBeenCalled());
    errorSpy.mockRestore();
  });
});
