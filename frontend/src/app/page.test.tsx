import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirectMock(path) }));

import RootPage from "./page";

describe("root route", () => {
  beforeEach(() => redirectMock.mockClear());

  it("still redirects to /dashboard", () => {
    RootPage();
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
