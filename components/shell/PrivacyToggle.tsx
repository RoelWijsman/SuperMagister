"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { haptic } from "@/lib/haptics";
import { toast } from "@/stores/toast";
import { useUi } from "@/stores/ui";

export function togglePrivacyWithFeedback() {
  const on = !useUi.getState().privacy;
  useUi.getState().setPrivacy(on);
  haptic("tap");
  toast({
    id: "privacy",
    emoji: on ? "🙈" : "👀",
    title: on ? "Privacymodus aan" : "Privacymodus uit",
    description: on ? "Je cijfers zijn vervaagd. Druk op P om ze weer te tonen." : undefined,
    duration: 2600,
  });
}

/** Oogje dat alle cijfers vervaagt, voor als iemand meekijkt. */
export function PrivacyToggle({ className }: { className?: string }) {
  const privacy = useUi((s) => s.privacy);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      icon={privacy ? EyeOff : Eye}
      aria-pressed={privacy}
      aria-label={privacy ? "Privacymodus uitzetten" : "Privacymodus aanzetten"}
      title="Privacymodus (P)"
      onClick={togglePrivacyWithFeedback}
      className={className}
    />
  );
}
