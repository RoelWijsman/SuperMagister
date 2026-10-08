import { Shield } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * De disclaimer, overal hetzelfde: op /koppelen, in de onboarding en op
 * /privacy. `newTab`: de privacylink opent in een nieuw tabblad (in de
 * onboarding, zodat je je plek niet kwijtraakt).
 */
export function Disclaimer({
  className,
  privacyLink = true,
  newTab = false,
}: {
  className?: string;
  privacyLink?: boolean;
  newTab?: boolean;
}) {
  return (
    <p className={cn("flex items-start gap-2 text-xs text-ink-3", className)}>
      <Shield size={14} aria-hidden className="mt-0.5 shrink-0" />
      <span>
        SuperMagister is onofficieel en niet verbonden aan Magister of Iddink. Het gebruikt een
        interne Magister-API die zonder aankondiging kan veranderen. Je gegevens blijven op je eigen
        apparaat.
        {privacyLink && (
          <>
            {" "}
            <Link
              href="/privacy"
              target={newTab ? "_blank" : undefined}
              className="font-semibold text-accent-ink underline-offset-2 hover:underline"
            >
              Zo gaan we om met je gegevens
            </Link>
            .
          </>
        )}
      </span>
    </p>
  );
}
