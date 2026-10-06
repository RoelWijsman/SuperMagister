"use client";

import { motion } from "framer-motion";
import { Check, Trophy } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { FOIL_ORDER, FOILS, type CollectionGoal, type FoilId } from "@/lib/collection/goals";
import { cn } from "@/lib/cn";
import { FoilSwatch } from "./FoilSwatch";

interface GoalsPanelProps {
  goals: readonly CollectionGoal[];
  foils: readonly FoilId[];
  foil: FoilId;
  onFoil: (foil: FoilId) => void;
}

/** Verzameldoelen met voortgang. Elk doel speelt een folie vrij. */
export function GoalsPanel({ goals, foils, foil, onFoil }: GoalsPanelProps) {
  const done = goals.filter((goal) => goal.done).length;

  return (
    <GlassPanel as="section" aria-labelledby="doelen-titel" padding="lg">
      <h2
        id="doelen-titel"
        className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
      >
        <Trophy size={18} strokeWidth={2.4} aria-hidden className="text-accent-ink" />
        Verzameldoelen
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        {done}/{goals.length} gehaald. Elk doel speelt een nieuwe folie voor je kaarten vrij.
      </p>

      <ul className="mt-5 space-y-5">
        {goals.map((goal) => {
          const percent = Math.round((goal.current / goal.target) * 100);
          return (
            <li key={goal.id} className="flex items-center gap-4">
              <FoilSwatch foil={goal.reward} locked={!goal.done} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="flex items-center gap-1.5 font-semibold text-ink">
                    {goal.title}
                    {goal.done && (
                      <Check size={16} strokeWidth={3} aria-label="gehaald" className="text-good" />
                    )}
                  </p>
                  <span className="text-sm text-ink-2 tabular-nums">
                    {goal.current}/{goal.target}
                  </span>
                </div>
                <p className="text-sm text-ink-2">{goal.description}</p>
                <div
                  role="progressbar"
                  aria-label={goal.title}
                  aria-valuemin={0}
                  aria-valuemax={goal.target}
                  aria-valuenow={goal.current}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-glass-strong"
                >
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--sm-accent),var(--sm-accent-2))]"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ type: "spring", stiffness: 90, damping: 20 }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-3">
                  Beloning: folie {FOILS[goal.reward].name}
                  {goal.done ? " · vrijgespeeld" : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <fieldset className="mt-7">
        <legend className="font-semibold text-ink">Folie op je kaarten</legend>
        <p className="mt-0.5 text-sm text-ink-2">
          Zie je in de kaartviewer, als je een kaart kantelt.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FOIL_ORDER.map((id) => {
            const unlocked = foils.includes(id);
            const active = id === foil;
            return (
              <button
                key={id}
                type="button"
                disabled={!unlocked}
                aria-pressed={active}
                onClick={() => onFoil(id)}
                title={unlocked ? FOILS[id].description : "Nog niet vrijgespeeld"}
                className={cn(
                  "flex items-center gap-2 rounded-2xl py-1.5 pr-3.5 pl-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[color-mix(in_oklab,var(--sm-accent)_22%,transparent)] text-ink shadow-[inset_0_0_0_1.5px_var(--sm-accent)]"
                    : "glass text-ink-2 hover:text-ink",
                  !unlocked && "cursor-not-allowed opacity-55",
                )}
              >
                <FoilSwatch foil={id} locked={!unlocked} className="w-6" />
                {FOILS[id].name}
              </button>
            );
          })}
        </div>
      </fieldset>
    </GlassPanel>
  );
}
