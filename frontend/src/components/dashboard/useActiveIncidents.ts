"use client";

import { useCallback, useEffect, useState } from "react";

import { IncidentsError, fetchActiveIncidents, type Incident } from "@/lib/api/incidents";

export type IncidentsState =
  | { status: "loading" }
  | { status: "error"; error: IncidentsError }
  | { status: "ready"; incidents: Incident[] };

/**
 * Loads the active incidents from the backend. Independent of the rest of the dashboard's
 * data, so a failure here never blanks the KPIs (and vice versa). `retry` refetches.
 */
export function useActiveIncidents(): { state: IncidentsState; retry: () => void } {
  const [state, setState] = useState<IncidentsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchActiveIncidents({ signal: controller.signal })
      .then((incidents) => {
        if (!controller.signal.aborted) setState({ status: "ready", incidents });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          error:
            error instanceof IncidentsError
              ? error
              : new IncidentsError("network", "Something went wrong while loading incidents."),
        });
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
