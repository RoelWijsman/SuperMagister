"use client";

/**
 * Het allerlaatste vangnet: als zelfs de layout omvalt. Zonder de rest van de
 * app (geen thema's, geen lettertypes), dus alles staat hier zelf in.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="nl">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "radial-gradient(circle at 20% 15%, #2a1f5c 0%, #070816 55%)",
          color: "#f4f2ff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>Alles viel even om.</h1>
          <p style={{ margin: "0 0 24px", color: "#b9b4d8", lineHeight: 1.5 }}>
            Zelfs het menu ligt plat. Je gegevens staan veilig op je apparaat; opnieuw laden helpt
            meestal.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: 0,
              borderRadius: 999,
              padding: "12px 22px",
              fontSize: 16,
              fontWeight: 700,
              color: "#0b0a1a",
              background: "linear-gradient(135deg, #9b7bff, #46f0c8)",
              cursor: "pointer",
            }}
          >
            Opnieuw proberen
          </button>
        </main>
      </body>
    </html>
  );
}
