"use client";

import { Check, RotateCcw } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { useSubjectAppearance, type SubjectAppearance } from "@/lib/data/hooks";
import { SUBJECT_ICON_NAMES } from "@/lib/subjects/icons";
import { matchSubjectInfo } from "@/lib/subjects/catalog";
import { SUBJECT_PALETTE } from "@/lib/subjects/palette";
import {
  GROUP_LABELS,
  GROUP_LINE,
  NATURAL_LINE_LABELS,
  NATURAL_LINES,
  vakKey,
  type NaturalLine,
} from "@/lib/squad/players";
import { useSettings } from "@/stores/settings";

function SubjectEditor({
  subject,
  onClose,
}: {
  subject: SubjectAppearance | null;
  onClose: () => void;
}) {
  const setColor = useSettings((s) => s.setSubjectColor);
  const setIcon = useSettings((s) => s.setSubjectIcon);
  const setSquadLine = useSettings((s) => s.setSquadLine);
  const appearance = useSubjectAppearance();
  // Altijd de actuele versie tonen, ook direct na een wijziging.
  const live = subject ? appearance.get(subject.id) : null;

  return (
    <Sheet
      open={Boolean(subject)}
      onClose={onClose}
      title={live ? live.name : "Vak"}
      description="Kies een kleur, een icoon en een positie in je elftal. Kleur en icoon komen overal terug: rooster, huiswerk, cijfers en kaarten."
    >
      {live && (
        <>
          <div className="mb-6 flex items-center gap-4 rounded-3xl border border-line p-4">
            <SubjectBadge subject={live} size="lg" />
            <div>
              <p className="font-semibold text-ink">{live.name}</p>
              <p className="text-sm text-ink-3">
                {SUBJECT_PALETTE[live.paletteIndex]?.name ?? "Standaard"} · {live.icon}
              </p>
            </div>
          </div>

          <h3 className="mb-3 text-sm font-semibold text-ink-2">Kleur</h3>
          <div role="radiogroup" aria-label="Kleur" className="grid grid-cols-8 gap-2">
            {SUBJECT_PALETTE.map((color, index) => {
              const selected = live.paletteIndex === index;
              return (
                <button
                  key={color.hex}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={color.name}
                  title={color.name}
                  onClick={() => setColor(live.id, index)}
                  style={{ "--swatch": color.hex } as CSSProperties}
                  className={cn(
                    "grid aspect-square place-items-center rounded-full bg-[var(--swatch)] text-black/70 transition-transform active:scale-90",
                    selected && "ring-2 ring-ink ring-offset-2 ring-offset-[var(--sm-bg)]",
                  )}
                >
                  {selected && <Check size={15} strokeWidth={3} aria-hidden />}
                </button>
              );
            })}
          </div>

          <h3 className="mt-6 mb-3 text-sm font-semibold text-ink-2">Icoon</h3>
          <div
            role="radiogroup"
            aria-label="Icoon"
            className="grid grid-cols-7 gap-2 sm:grid-cols-9"
          >
            {SUBJECT_ICON_NAMES.map((name) => {
              const selected = live.icon === name;
              return (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={name}
                  title={name}
                  onClick={() => setIcon(live.id, name)}
                  style={{ "--subject": live.color } as CSSProperties}
                  className={cn(
                    "grid aspect-square place-items-center rounded-xl border transition-colors",
                    selected
                      ? "border-[var(--subject)] bg-[color-mix(in_oklab,var(--subject)_22%,transparent)] text-[var(--subject)]"
                      : "border-line text-ink-2 hover:text-ink",
                  )}
                >
                  <SubjectIcon name={name} size={18} strokeWidth={2.1} />
                </button>
              );
            })}
          </div>

          <SquadLinePicker name={live.name} code={live.code} />

          <Button
            variant="ghost"
            icon={RotateCcw}
            className="mt-6"
            onClick={() => {
              setColor(live.id, null);
              setIcon(live.id, null);
              setSquadLine(vakKey(live.name), null);
            }}
          >
            Standaard herstellen
          </Button>
        </>
      )}
    </Sheet>
  );
}

/**
 * Jouw Elftal: waar dit vak van nature staat. Standaard volgt het de vakgroep
 * (exact valt aan, talen op het middenveld, …), maar scholen verschillen.
 */
function SquadLinePicker({ name, code }: { name: string; code: string }) {
  const vak = vakKey(name);
  const override = useSettings((s) => s.squadLines[vak]);
  const setSquadLine = useSettings((s) => s.setSquadLine);
  const group = matchSubjectInfo(code, name).group;
  const standard = GROUP_LINE[group];
  const current: NaturalLine = override ?? standard;
  return (
    <>
      <h3 className="mt-6 mb-1 text-sm font-semibold text-ink-2">Positie in je elftal</h3>
      <p className="mb-3 text-sm text-ink-3">
        Standaard: {NATURAL_LINE_LABELS[standard].toLowerCase()} ({GROUP_LABELS[group]}).
      </p>
      <div role="radiogroup" aria-label="Positie in je elftal" className="flex flex-wrap gap-2">
        {NATURAL_LINES.map((line) => {
          const selected = current === line;
          return (
            <button
              key={line}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setSquadLine(vak, line === standard ? null : line)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                selected
                  ? "border-transparent bg-[color-mix(in_oklab,var(--sm-accent)_24%,transparent)] text-ink shadow-[inset_0_0_0_1.5px_var(--sm-accent)]"
                  : "border-line text-ink-2 hover:text-ink",
              )}
            >
              {NATURAL_LINE_LABELS[line]}
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Lijst van vakken met hun kleur en icoon, aan te passen per vak. */
export function SubjectSettings() {
  const appearance = useSubjectAppearance();
  const [editing, setEditing] = useState<SubjectAppearance | null>(null);

  if (!appearance.isReady) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <ul className="grid gap-2 sm:grid-cols-2">
        {appearance.subjects.map((subject) => {
          const look = appearance.get(subject.id);
          return (
            <li key={subject.id}>
              <button
                type="button"
                onClick={() => setEditing(look)}
                className="flex w-full items-center gap-3 rounded-2xl border border-line px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-glass"
              >
                <SubjectBadge subject={look} />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{subject.name}</span>
                <span className="text-xs text-ink-3">{subject.code}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <SubjectEditor subject={editing} onClose={() => setEditing(null)} />
    </>
  );
}
