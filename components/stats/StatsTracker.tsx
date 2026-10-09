"use client";

import { useEffect } from "react";
import { classifyError, track, trackError } from "@/lib/stats/client";

const OPENED_KEY = "sm-geopend";

/**
 * Anonieme statistieken die niet bij één knop horen: "app geopend" (één keer
 * per tabblad), een geïnstalleerde app, en onverwachte fouten. Van een fout
 * tellen we alleen de soort: geen melding, geen stacktrace, geen adres.
 */
export function StatsTracker() {
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(OPENED_KEY)) {
        sessionStorage.setItem(OPENED_KEY, "1");
        track("app-geopend");
      }
    } catch {
      // Geen sessionStorage (privévenster in sommige browsers): niet tellen.
    }

    const ours = (filename: string | undefined) =>
      !filename || filename.startsWith(window.location.origin);
    const onError = (event: ErrorEvent) => {
      // Fouten uit extensies en scripts van anderen zijn niet van ons.
      if (!ours(event.filename)) return;
      trackError(classifyError(event.error ?? event.message));
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      // Afgebroken verzoeken zijn geen fouten.
      if (event.reason instanceof DOMException && event.reason.name === "AbortError") return;
      trackError(classifyError(event.reason));
    };
    const onInstalled = () => track("pwa-geinstalleerd");

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}
