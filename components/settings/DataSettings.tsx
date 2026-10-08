"use client";

import { FlaskConical, Plug, TimerOff, Unplug } from "lucide-react";
import { useState } from "react";
import { ConnectionFacts } from "@/components/koppelen/ConnectionFacts";
import { UnlinkSheet } from "@/components/koppelen/UnlinkSheet";
import { Button, LinkButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { useEnrollments } from "@/lib/data/hooks";
import { completeLink } from "@/lib/koppelen/link";
import { getSessionStore, useSession } from "@/lib/koppelen/runtime";
import { activeView, useConnection, type DataView } from "@/stores/connection";

const capitalize = (host: string) => {
  const label = host.split(".")[0] ?? host;
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Welk schooljaar je bekijkt. "Nu" volgt vanzelf het huidige schooljaar. */
function YearPicker() {
  const enrollments = useEnrollments();
  const enrollmentId = useConnection((s) => s.enrollmentId);
  const setEnrollment = useConnection((s) => s.setEnrollment);
  const list = enrollments.data ?? [];
  if (list.length < 2) return null;

  const today = new Date().toISOString().slice(0, 10);
  const current =
    list.find((e) => e.start <= today && today <= e.end) ??
    [...list].filter((e) => e.start <= today).sort((a, b) => b.start.localeCompare(a.start))[0];
  const earlier = list
    .filter((e) => current && e.start < current.start)
    .sort((a, b) => b.start.localeCompare(a.start));
  const items = [
    { value: "nu", label: current ? `Nu (${current.label})` : "Nu" },
    ...earlier.map((e) => ({ value: String(e.id), label: e.label })),
  ];

  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="mb-2 font-medium text-ink">Schooljaar</p>
      <Tabs<string>
        id="schooljaar"
        aria-label="Welk schooljaar je bekijkt"
        size="sm"
        value={enrollmentId === null ? "nu" : String(enrollmentId)}
        onValueChange={(value) => setEnrollment(value === "nu" ? null : Number(value))}
        items={items}
        className="no-scrollbar max-w-full overflow-x-auto"
      />
      <p className="mt-2 text-sm text-ink-3">
        Een eerder jaar bekijk je alleen terug: daar komen geen packs uit. Je kaarten van vroeger
        staan sowieso in je collectie.
      </p>
    </div>
  );
}

/** Instellingen > Gegevens: demo of je eigen Magister, schooljaar en ontkoppelen. */
export function DataSettings() {
  const account = useConnection((s) => s.account);
  const view = useConnection(activeView);
  const setView = useConnection((s) => s.setView);
  const [unlinking, setUnlinking] = useState(false);

  if (!account) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Chip tone="warn">Demo</Chip>
        <p className="min-w-0 flex-1 text-ink-2">Je bekijkt verzonnen data van Daan uit 5 havo.</p>
        <LinkButton href="/koppelen" variant="glass" icon={Plug}>
          Koppelen met Magister
        </LinkButton>
      </div>
    );
  }

  const school = capitalize(account.schoolHost);
  return (
    <>
      <div className="flex flex-col gap-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-ink">Je bekijkt</span>
        <Tabs<DataView>
          id="databron"
          aria-label="Welke data je bekijkt"
          size="sm"
          value={view}
          onValueChange={setView}
          items={[
            { value: "magister", label: `Mijn Magister`, icon: Plug },
            { value: "demo", label: "Demo", icon: FlaskConical },
          ]}
        />
      </div>
      <p className="-mt-1 mb-2 text-sm text-ink-3">
        Demo en je eigen data lopen nooit door elkaar: ze hebben elk hun eigen collectie, gokken en
        notities.
      </p>

      <div className="mt-4 rounded-3xl border border-line p-4">
        <p className="font-semibold text-ink">
          Gekoppeld met {school} <span className="font-normal text-ink-2">als {account.name}</span>
        </p>
        {view === "magister" && <ConnectionFacts className="mt-3" />}
        <p className="mt-3 text-sm text-ink-3">
          Je koppeling (het token) staat alleen in dit tabblad en verloopt na ongeveer een uur. Wat
          al is opgehaald, blijft op dit apparaat staan tot je ontkoppelt.
        </p>
      </div>

      {view === "magister" && <YearPicker />}

      <div className="mt-5 flex flex-wrap gap-3">
        <LinkButton href="/koppelen" variant="glass" icon={Plug}>
          Opnieuw koppelen
        </LinkButton>
        <Button
          variant="ghost"
          icon={Unplug}
          onClick={() => setUnlinking(true)}
          className="text-bad"
        >
          Ontkoppelen
        </Button>
      </div>
      <UnlinkSheet open={unlinking} onClose={() => setUnlinking(false)} school={school} />
    </>
  );
}

const SAMPLE_TOKEN = "voorbeeld.alleen-om-te-testen.geen-echt-token";

/**
 * Alleen tijdens het bouwen: koppelen met de geanonimiseerde testbestanden,
 * en de koppeling laten verlopen om "Opnieuw koppelen" te zien.
 */
export function LinkDevTools() {
  const { session } = useSession();
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
      <p className="min-w-0 flex-1 text-ink-2">
        Koppel met de geanonimiseerde testbestanden (Daan, school &quot;voorbeeld&quot;), alsof het
        Magister is. De koppeling verloopt na 7 minuten.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="glass"
          icon={Plug}
          onClick={() =>
            completeLink(
              {
                token: SAMPLE_TOKEN,
                schoolHost: "voorbeeld.magister.net",
                expiresAt: Date.now() + 7 * 60_000,
              },
              "voorbeeld",
            )
          }
        >
          Koppel met voorbeelddata
        </Button>
        {session && (
          <Button
            variant="ghost"
            icon={TimerOff}
            onClick={() => getSessionStore().reject(session.token)}
          >
            Laat de koppeling verlopen
          </Button>
        )}
      </div>
    </div>
  );
}
