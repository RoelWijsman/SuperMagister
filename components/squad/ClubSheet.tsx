"use client";

import { Dices } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { createRandom } from "@/lib/random";
import {
  CLUB_NAME_MAX,
  CREST_LABELS,
  CREST_SHAPES,
  generateClubName,
  isRealClubName,
  type Club,
} from "@/lib/squad/club";
import { Crest } from "./Crest";

/** Je club: een naam (zelf of uit de generator) en de vorm van je wapen. */
export function ClubSheet({
  open,
  club,
  onClose,
  onSave,
}: {
  open: boolean;
  club: Club;
  onClose: () => void;
  onSave: (club: Partial<Club>) => void;
}) {
  const [name, setName] = useState(club.name);
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const [rolls, setRolls] = useState(0);
  const real = isRealClubName(name);

  return (
    <Sheet open={open} onClose={onClose} title="Je club" size="sm">
      <div className="flex flex-col items-center gap-3">
        <Crest name={name || club.name} shape={club.crest} size={72} />
        <label className="w-full">
          <span className="mb-1.5 block text-sm font-medium text-ink">Clubnaam</span>
          <span className="flex gap-2">
            <input
              value={name}
              maxLength={CLUB_NAME_MAX}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => !real && name.trim() && onSave({ name })}
              className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-glass-strong px-3.5 text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--sm-accent)]"
            />
            <Button
              variant="glass"
              size="icon"
              icon={Dices}
              aria-label="Verzin een clubnaam"
              onClick={() => {
                const next = generateClubName(createRandom(seed + rolls), name);
                setRolls((r) => r + 1);
                setName(next);
                onSave({ name: next });
              }}
            />
          </span>
        </label>
        {real && (
          <p role="alert" className="w-full text-sm text-warn">
            Dat is een echte club. Verzin iets eigens, of gooi de dobbelsteen.
          </p>
        )}
        <div className="w-full">
          <span className="mb-1.5 block text-sm font-medium text-ink">Vorm van het wapen</span>
          <div role="radiogroup" aria-label="Vorm van het wapen" className="grid grid-cols-4 gap-2">
            {CREST_SHAPES.map((shape) => (
              <button
                key={shape}
                type="button"
                role="radio"
                aria-checked={club.crest === shape}
                aria-label={CREST_LABELS[shape]}
                onClick={() => onSave({ crest: shape })}
                className={cn(
                  "grid place-items-center rounded-2xl border p-2 transition-colors",
                  club.crest === shape
                    ? "border-transparent bg-[color-mix(in_oklab,var(--sm-accent)_20%,transparent)] shadow-[inset_0_0_0_1.5px_var(--sm-accent)]"
                    : "border-line hover:bg-glass",
                )}
              >
                <Crest name={name || club.name} shape={shape} size={34} />
              </button>
            ))}
          </div>
        </div>
        <Button
          variant="primary"
          className="mt-2 w-full"
          disabled={real}
          onClick={() => {
            if (name.trim()) onSave({ name });
            onClose();
          }}
        >
          Klaar
        </Button>
      </div>
    </Sheet>
  );
}
