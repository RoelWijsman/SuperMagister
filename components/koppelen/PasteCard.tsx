"use client";

import { ClipboardPaste, Plug } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Kbd } from "@/components/ui/Kbd";
import { completeLink, useLinkFlow } from "@/lib/koppelen/link";
import { parsePasted, type PasteParse } from "@/lib/koppelen/paste";

type PasteProblem = Extract<PasteParse, { kind: "ongeldig" }>["reason"];

const PROBLEMS: Record<PasteProblem, string> = {
  leeg: "Plak eerst je sessie in het veld.",
  onbekend:
    "Hier staat geen token in. Kopieer de hele waarde van de regel die begint met oidc.user:.",
  token: "Dit lijkt geen Magister-token. Kopieer de waarde nog een keer, helemaal.",
  "school-nodig": "We weten nog niet bij welke school dit hoort. Vul je school in.",
  school: "Dat is geen Magister-school. Je school staat in het adres: jouwschool.magister.net.",
  verlopen: "Deze sessie is al verlopen. Ververs Magister (F5) en kopieer hem opnieuw.",
};

/** Zo ziet het eruit in de ontwikkelaarstools: een nagebootst schermpje, geen echte data. */
export function DevtoolsShot() {
  return (
    <figure
      aria-label="Voorbeeld: de ontwikkelaarstools met Application, Session storage en de regel oidc.user"
      className="overflow-hidden rounded-2xl border border-line bg-[#1e1f24] font-mono text-[0.6875rem] leading-snug text-[#c8c9d0] shadow-[var(--sm-shadow)]"
    >
      <div className="flex gap-4 border-b border-white/10 px-3 py-1.5 text-[#9a9ba3]">
        <span>Elements</span>
        <span>Console</span>
        <span className="border-b-2 border-[#7aa2ff] pb-0.5 text-white">Application</span>
      </div>
      <div className="grid grid-cols-[minmax(0,9rem)_1fr]">
        <div className="space-y-1 border-r border-white/10 p-2 text-[#9a9ba3]">
          <p>Local storage</p>
          <p className="text-white">▾ Session storage</p>
          <p className="truncate rounded bg-[#2f3b5c] px-1 text-white">jouwschool.magister.net</p>
          <p>Cookies</p>
        </div>
        <div className="min-w-0 p-2">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-2 border-b border-white/10 pb-1 text-[#9a9ba3]">
            <span>Key</span>
            <span>Value</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-2 py-1 text-[#9a9ba3]">
            <span className="truncate">taal</span>
            <span className="truncate">nl</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-2 rounded bg-[#2f3b5c] py-1 ring-2 ring-[#7aa2ff]">
            <span className="truncate pl-1 text-white">oidc.user:https://accounts…</span>
            <span className="truncate text-white">{'{"id_token":"…","access_token":"eyJ…'}</span>
          </div>
        </div>
      </div>
    </figure>
  );
}

/**
 * Het plakveld: de reserve als de bladwijzer niet werkt, bijvoorbeeld op een
 * schoolcomputer die bladwijzers blokkeert. Je plakt alleen je sessie (nooit
 * een wachtwoord) en die blijft in dit tabblad.
 */
export function PasteCard() {
  const [text, setText] = useState("");
  const [school, setSchool] = useState("");
  const [problem, setProblem] = useState<PasteProblem | null>(null);
  const busy = useLinkFlow((s) => s.status === "bezig");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = parsePasted(text, { school, now: Date.now() });
    if (parsed.kind !== "ok") {
      setProblem(parsed.reason);
      return;
    }
    setProblem(null);
    // Het token hoeft niet in het veld te blijven staan.
    setText("");
    await completeLink(parsed.session, "plakken");
  };

  return (
    <GlassPanel as="section" padding="lg" aria-labelledby="plakken-titel" id="plakken">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-glass-strong text-accent-ink">
          <ClipboardPaste size={20} strokeWidth={2.2} aria-hidden />
        </span>
        <div>
          <h3
            id="plakken-titel"
            className="font-display text-lg font-semibold tracking-tight text-ink"
          >
            Plakken
          </h3>
          <p className="text-sm text-ink-2">
            Als de bladwijzer niet werkt, bijvoorbeeld op een schoolcomputer. Kost een minuut.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <ol className="space-y-2.5 text-sm text-ink-2">
          {[
            <>Open Magister op een computer en log in.</>,
            <>
              Druk op <Kbd>F12</Kbd> en kies het tabblad{" "}
              <strong className="text-ink">Application</strong> (in Firefox:{" "}
              <strong className="text-ink">Opslag</strong>).
            </>,
            <>
              Open <strong className="text-ink">Session storage</strong> en klik op je
              Magister-adres.
            </>,
            <>
              Klik op de regel die begint met <code className="text-ink">oidc.user:</code>, kopieer
              de hele waarde en plak hem hieronder.
            </>,
          ].map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-glass-strong text-xs font-bold text-ink">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <DevtoolsShot />
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3" autoComplete="off">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Je sessie</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            data-1p-ignore
            data-lpignore="true"
            placeholder='{"id_token":"…","access_token":"eyJ…","expires_at":…}'
            className="w-full resize-y rounded-2xl border border-line bg-glass px-3.5 py-2.5 font-mono text-xs text-ink placeholder:text-ink-3"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">
            Je school{" "}
            <span className="font-normal text-ink-3">(alleen nodig als we hem niet vinden)</span>
          </span>
          <input
            value={school}
            onChange={(event) => setSchool(event.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            placeholder="jouwschool, van jouwschool.magister.net"
            className="h-11 w-full rounded-2xl border border-line bg-glass px-3.5 text-sm text-ink placeholder:text-ink-3"
          />
        </label>
        {problem && (
          <p role="alert" className="text-sm font-medium text-bad">
            {PROBLEMS[problem]}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" icon={Plug} disabled={busy}>
            Koppelen
          </Button>
          <p className="text-xs text-ink-3">
            Nooit je wachtwoord plakken: daar vraagt SuperMagister nooit om. Wat je plakt, blijft in
            dit tabblad.
          </p>
        </div>
      </form>
    </GlassPanel>
  );
}
