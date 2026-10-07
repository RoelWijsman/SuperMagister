"use client";

import {
  Calculator,
  Gauge,
  Gift,
  Keyboard,
  Sparkles,
  Moon,
  Palette,
  Paintbrush,
  Plug,
  Shield,
  SlidersHorizontal,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { NAV_ITEMS } from "@/components/shell/nav";
import { togglePrivacyWithFeedback } from "@/components/shell/PrivacyToggle";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { useWalkoutActions } from "@/components/walkout/useWalkoutActions";
import { parseIntent } from "@/lib/commands/intents";
import type { RankableCommand } from "@/lib/commands/rank";
import { daysRange, useHomework, useRevealState, useSubjectAppearance } from "@/lib/data/hooks";
import { addDays, formatRelativeDay, nextWeekday, parseISODate, toISODate } from "@/lib/date";
import { notify } from "@/lib/notify";
import { applyThemeVars } from "@/lib/theme/apply";
import { getPreset, THEME_PRESETS } from "@/lib/theme/themes";
import { useSettings } from "@/stores/settings";
import { useUi } from "@/stores/ui";

export type PalettePage = "root" | "themes";

export interface Command extends RankableCommand {
  subtitle?: string;
  icon: ReactNode;
  shortcut?: string[];
  /** Nog niet gebouwd: label zoals "fase 2". */
  soon?: string;
  /** Uitvoeren. Geef "stay" terug om de palette open te houden. */
  run: () => void | "stay";
  /** Live voorvertoning bij selecteren (thema's). */
  preview?: () => void;
}

function IconBox({ icon: Icon, color }: { icon: LucideIcon; color?: string }) {
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-xl bg-glass-strong text-ink-2"
      style={color ? { color } : undefined}
    >
      <Icon size={18} strokeWidth={2.2} aria-hidden />
    </span>
  );
}

function ThemeSwatch({ from, to }: { from: string; to: string }) {
  return (
    <span
      aria-hidden
      className="size-9 shrink-0 rounded-xl shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    />
  );
}

interface Options {
  page: PalettePage;
  query: string;
  close: () => void;
  goToPage: (page: PalettePage) => void;
}

/** Alle commando's voor de command palette, opgebouwd uit de data van nu. */
export function useCommands({ page, query, close, goToPage }: Options): Command[] {
  const router = useRouter();
  const appearance = useSubjectAppearance();
  const today = useMemo(() => new Date(), []);
  const homework = useHomework(daysRange(addDays(today, -2), 21));
  const { pack } = useRevealState();
  const { openPack, startPractice } = useWalkoutActions();
  const colorMode = useSettings((s) => s.colorMode);
  const theme = useSettings((s) => s.theme);

  return useMemo(() => {
    const go = (href: string) => {
      router.push(href);
      close();
    };

    if (page === "themes") {
      const presets: Command[] = THEME_PRESETS.map((preset) => ({
        id: `thema-${preset.id}`,
        group: "Thema's",
        title: preset.name,
        subtitle: preset.id === theme ? `${preset.tagline} · actief` : preset.tagline,
        icon: <ThemeSwatch from={preset.accent} to={preset.accent2} />,
        preview: () => applyThemeVars(preset.id, null),
        run: () => {
          useSettings.getState().setTheme(preset.id);
          notify("toast.thema", { thema: preset.name }, { emoji: "🎨", duration: 2600 });
          close();
        },
      }));
      return [
        ...presets,
        {
          id: "thema-eigen",
          group: "Thema's",
          title: "Eigen kleur kiezen…",
          subtitle: "Met de kleurkiezer in Instellingen",
          icon: <IconBox icon={Paintbrush} />,
          run: () => go("/instellingen#thema"),
        },
      ];
    }

    const subjects = appearance.subjects;
    const commands: Command[] = [];
    const nextSchoolDay = nextWeekday(today);

    // Slimme zinnen: "wat moet ik halen voor wiskunde", "rooster morgen".
    const intent = query.trim() ? parseIntent(query, subjects, today) : null;
    if (intent?.type === "what-to-get") {
      const subject = appearance.get(intent.subjectId);
      commands.push({
        id: "intent-halen",
        group: "Snel",
        title: `Wat moet ik halen voor ${subject.name}?`,
        subtitle: "De calculator, met dit vak al ingevuld",
        keywords: [query],
        icon: <SubjectBadge subject={subject} />,
        run: () => go(`/cijfers?tool=calculator&vak=${subject.id}`),
      });
    } else if (intent) {
      const date = parseISODate(intent.date);
      const day = formatRelativeDay(date, today);
      const isSchedule = intent.type === "schedule-day";
      commands.push({
        id: "intent-dag",
        group: "Snel",
        title: isSchedule ? `Rooster van ${day}` : `Huiswerk voor ${day}`,
        keywords: [query],
        icon: <IconBox icon={isSchedule ? NAV_ITEMS[1]!.icon : NAV_ITEMS[2]!.icon} />,
        run: () => go(`${isSchedule ? "/rooster" : "/huiswerk"}?dag=${intent.date}`),
      });
    }

    if (!query.trim()) {
      commands.push({
        id: "snel-morgen",
        group: "Snel",
        title: `Rooster van ${formatRelativeDay(nextSchoolDay, today)}`,
        icon: <IconBox icon={NAV_ITEMS[1]!.icon} />,
        run: () => go(`/rooster?dag=${toISODate(nextSchoolDay)}`),
      });
      if (pack.length > 0) {
        commands.push({
          id: "snel-pack",
          group: "Snel",
          title: `Open je pack: ${pack.length} nieuwe ${pack.length === 1 ? "cijfer" : "cijfers"}`,
          icon: <IconBox icon={Gift} color="var(--sm-accent-ink)" />,
          run: () => {
            close();
            openPack();
          },
        });
      }
    }

    for (const item of NAV_ITEMS) {
      commands.push({
        id: `pagina-${item.href}`,
        group: "Pagina's",
        title: item.label,
        subtitle: item.description,
        icon: <IconBox icon={item.icon} />,
        shortcut: [item.shortcut],
        run: () => go(item.href),
      });
    }
    commands.push({
      id: "pagina-koppelen",
      group: "Pagina's",
      title: "Koppelen met Magister",
      subtitle: "Veilig je eigen account koppelen",
      keywords: ["account", "inloggen", "token"],
      icon: <IconBox icon={Plug} />,
      run: () => go("/koppelen"),
    });

    if (query.trim()) {
      for (const subject of subjects) {
        const look = appearance.get(subject.id);
        commands.push({
          id: `vak-${subject.id}`,
          group: "Vakken",
          title: subject.name,
          subtitle: subject.hasGrades ? "Cijfers en gemiddelde" : "Rooster",
          keywords: [subject.code],
          icon: <SubjectBadge subject={look} />,
          run: () => go(subject.hasGrades ? `/cijfers/${subject.id}` : "/rooster"),
        });
      }
      for (const item of homework.data ?? []) {
        if (item.dueDate < toISODate(today)) continue;
        const look = appearance.get(item.subjectId);
        commands.push({
          id: `huiswerk-${item.id}`,
          group: "Huiswerk",
          title: item.text.length > 70 ? `${item.text.slice(0, 68)}…` : item.text,
          subtitle: `${look.name} · ${formatRelativeDay(parseISODate(item.dueDate), today)}`,
          keywords: [look.name],
          icon: <SubjectBadge subject={look} />,
          run: () => go(`/huiswerk?item=${item.id}`),
        });
      }
    }

    commands.push(
      {
        id: "cijfers-calculator",
        group: "Cijfers",
        title: "Wat moet ik halen?",
        subtitle: "De calculator: kies een vak, een doel en de weging",
        keywords: ["calculator", "halen", "doel", "gemiddelde", "rekenen"],
        icon: <IconBox icon={Calculator} />,
        run: () => go("/cijfers?tool=calculator"),
      },
      {
        id: "cijfers-simulator",
        group: "Cijfers",
        title: "Simulator",
        subtitle: "Denkbeeldige cijfers, en zien wat er gebeurt",
        keywords: ["wat als", "simuleren", "proberen"],
        icon: <IconBox icon={SlidersHorizontal} />,
        run: () => go("/cijfers?tool=simulator"),
      },
      {
        id: "cijfers-overgang",
        group: "Cijfers",
        title: "Overgangsmeter",
        subtitle: "Ga je over? En welke vakken maken het verschil",
        keywords: ["overgaan", "slagen", "zakken", "bespreekgeval", "normen", "tekortpunten"],
        icon: <IconBox icon={Gauge} />,
        run: () => go("/cijfers?tool=overgang"),
      },
      {
        id: "actie-thema",
        group: "Acties",
        title: "Thema wisselen…",
        subtitle: `Nu: ${theme === "custom" ? "eigen kleur" : getPreset(theme).name}`,
        keywords: ["kleur", "uiterlijk"],
        icon: <IconBox icon={Palette} />,
        run: () => {
          goToPage("themes");
          return "stay";
        },
      },
      {
        id: "actie-modus",
        group: "Acties",
        title: colorMode === "light" ? "Donkere modus aanzetten" : "Lichte modus aanzetten",
        keywords: ["licht", "donker", "dark mode", "light mode"],
        icon: <IconBox icon={colorMode === "light" ? Moon : Sun} />,
        run: () => {
          useSettings.getState().setColorMode(colorMode === "light" ? "dark" : "light");
          close();
        },
      },
      {
        id: "actie-privacy",
        group: "Acties",
        title: useUi.getState().privacy ? "Privacymodus uitzetten" : "Privacymodus aanzetten",
        keywords: ["verbergen", "blur", "meekijken"],
        icon: <IconBox icon={Shield} />,
        shortcut: ["P"],
        run: () => {
          togglePrivacyWithFeedback();
          close();
        },
      },
      {
        id: "actie-pack",
        group: "Acties",
        title: "Open pack",
        subtitle: "Onthul nieuwe cijfers met een walkout",
        keywords: ["walkout", "kaarten", "cijfers"],
        icon: <IconBox icon={Gift} />,
        run: () => {
          close();
          openPack();
        },
      },
      {
        id: "actie-oefen",
        group: "Acties",
        title: "Oefen een walkout",
        subtitle: "Alle soorten kaarten, met nepcijfers",
        keywords: ["walkout", "kaarten", "oefenmodus", "icon", "toty"],
        icon: <IconBox icon={Sparkles} />,
        run: () => {
          close();
          startPractice();
        },
      },
      {
        id: "actie-sneltoetsen",
        group: "Acties",
        title: "Sneltoetsen bekijken",
        icon: <IconBox icon={Keyboard} />,
        shortcut: ["?"],
        run: () => {
          close();
          useUi.getState().setShortcutsOpen(true);
        },
      },
    );

    return commands;
  }, [
    page,
    query,
    close,
    goToPage,
    router,
    appearance,
    today,
    homework.data,
    pack.length,
    openPack,
    startPractice,
    colorMode,
    theme,
  ]);
}
