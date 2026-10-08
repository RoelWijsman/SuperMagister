"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useLinkFlow } from "@/lib/koppelen/link";
import { getSessionStore } from "@/lib/koppelen/runtime";
import { wipeMagisterData } from "@/lib/koppelen/wipe";
import { notify } from "@/lib/notify";
import { isMagisterSource } from "@/lib/sources";

/** Ontkoppelen: token weg (in alle tabbladen) en al je Magister-data van dit apparaat. */
export function useUnlink() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    getSessionStore().clear();
    await wipeMagisterData();
    queryClient.removeQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === "string" && isMagisterSource(query.queryKey[0]),
    });
    useLinkFlow.getState().reset();
    notify("toast.ontkoppeld", {}, { emoji: "🧹" });
  }, [queryClient]);
}
