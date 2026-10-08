import { idbDel, idbKeys } from "@/lib/idb";
import { isMagisterSource } from "@/lib/sources";
import { useAchievementStore } from "@/stores/achievements";
import { useCollectionStore } from "@/stores/collection";
import { useConnection } from "@/stores/connection";
import { useGradesStore } from "@/stores/grades";
import { useGuessStore } from "@/stores/guesses";
import { useHomeworkStore } from "@/stores/homework";
import { useReveal } from "@/stores/reveal";
import { useScheduleTracker, useScheduleUi } from "@/stores/schedule";

/**
 * Ontkoppelen: alles van je echte Magister-account gaat van dit apparaat af.
 * De opgehaalde data (cache), welke cijfers je al zag, je gokken, het
 * roostersnapshot, je notities, vitrine en afgevinkt huiswerk. Je
 * instellingen blijven staan. Het token wist de aanroeper (de sessie).
 */
export async function wipeMagisterData(): Promise<void> {
  // IndexedDB-sleutels zijn "soort:bron…", bijvoorbeeld "cache:magister:…|getGrades|[]".
  const keys = await idbKeys();
  await Promise.all(
    keys
      .filter((key) => isMagisterSource(key.slice(key.indexOf(":") + 1)))
      .map((key) => idbDel(key)),
  );

  const match = isMagisterSource;
  useCollectionStore.getState().forgetSources(match);
  useAchievementStore.getState().forgetSources(match);
  useHomeworkStore.getState().forgetSources(match);
  useGradesStore.getState().forgetSources(match);
  useScheduleUi.getState().forgetSources(match);

  // Wat al in het geheugen geladen is.
  if (match(useReveal.getState().sourceId ?? ""))
    useReveal.setState({ sourceId: null, revealed: null });
  if (match(useGuessStore.getState().sourceId ?? ""))
    useGuessStore.setState({ sourceId: null, guesses: null });
  if (match(useScheduleTracker.getState().sourceId ?? ""))
    useScheduleTracker.setState({ sourceId: null, tracker: null });

  useConnection.getState().unlink();
}
