"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getExtensionBridge } from "@/lib/extensie/runtime";
import { useLinkFlow } from "@/lib/koppelen/link";
import { getSessionStore } from "@/lib/koppelen/runtime";
import { wipeMagisterData } from "@/lib/koppelen/wipe";
import { notify } from "@/lib/notify";
import { isMagisterSource } from "@/lib/sources";
import { useConnection } from "@/stores/connection";

/**
 * Ontkoppelen: token weg (in alle tabbladen en in de extensie) en al je
 * Magister-data van dit apparaat. Kwam het ontkoppelen uit de extensie, dan
 * hoeft die niet nog een keer gevraagd te worden.
 */
export function useUnlink() {
  const queryClient = useQueryClient();
  return useCallback(
    async ({ fromExtension = false }: { fromExtension?: boolean } = {}) => {
      if (fromExtension && !useConnection.getState().account) return;
      if (!fromExtension)
        await getExtensionBridge()
          ?.request("ontkoppel")
          .catch(() => undefined);
      getSessionStore().setRenewer(null);
      getSessionStore().clear();
      await wipeMagisterData();
      queryClient.removeQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" && isMagisterSource(query.queryKey[0]),
      });
      useLinkFlow.getState().reset();
      notify("toast.ontkoppeld", {}, { emoji: "🧹" });
    },
    [queryClient],
  );
}
