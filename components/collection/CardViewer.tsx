"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  RotateCw,
  Share2,
  Smartphone,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useWalkoutActions } from "@/components/walkout/useWalkoutActions";
import { CARD_RATIO } from "@/lib/cards/draw";
import { cardTierLabel, type CardData } from "@/lib/cards/model";
import { renderShareCard } from "@/lib/cards/share";
import { formatLongDate, parseISODate } from "@/lib/date";
import { haptic } from "@/lib/haptics";
import { useFocusTrap, useIsClient, useMediaQuery, useModalLock } from "@/lib/hooks";
import { notify } from "@/lib/notify";
import { useCollectionStore } from "@/stores/collection";
import { useWalkout } from "@/stores/walkout";
import { HoloCard } from "./HoloCard";
import { ShareSheet, type ShareRequest } from "./ShareSheet";
import { useCollection } from "./useCollection";

/** Zo groot mogelijk, maar met ruimte voor de knoppen eronder. */
function useCardWidth() {
  const [width, setWidth] = useState(300);
  useEffect(() => {
    const update = () =>
      setWidth(
        Math.round(
          Math.max(
            180,
            Math.min(380, window.innerWidth * 0.78, (window.innerHeight - 300) / CARD_RATIO),
          ),
        ),
      );
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

type OrientationPermission = { requestPermission?: () => Promise<"granted" | "denied"> };

interface CardViewerProps {
  cards: readonly CardData[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

/** Een kaart fullscreen: kantelen, folie, omdraaien, delen en in je vitrine zetten. */
export function CardViewer(props: CardViewerProps) {
  const isClient = useIsClient();
  const card = props.index === null ? undefined : props.cards[props.index];
  if (!isClient || !card || props.index === null) return null;
  return createPortal(<Viewer {...props} card={card} index={props.index} />, document.body);
}

function Viewer({
  cards,
  index,
  onIndexChange,
  card,
}: CardViewerProps & { card: CardData; index: number }) {
  const container = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const width = useCardWidth();
  const { foil, isInShowcase, sourceId } = useCollection();
  const toggleShowcase = useCollectionStore((s) => s.toggleShowcase);
  const { replay } = useWalkoutActions();
  const coarse = useMediaQuery("(pointer: coarse)");
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [share, setShare] = useState<ShareRequest | null>(null);
  const [gyroAllowed, setGyroAllowed] = useState<boolean | null>(null);
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  useModalLock(true);
  useFocusTrap(true, container);

  // Android en de meeste telefoons: kantelen werkt meteen. iOS vraagt eerst toestemming.
  const needsPermission =
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof (DeviceOrientationEvent as unknown as OrientationPermission).requestPermission ===
      "function";
  const gyro = coarse && (needsPermission ? gyroAllowed === true : true);

  const close = useCallback(() => onIndexChange(null), [onIndexChange]);
  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next < 0 || next >= cards.length) return;
      setDirection(delta);
      setFlipped(false);
      onIndexChange(next);
      haptic("tap");
    },
    [index, cards.length, onIndexChange],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Een sheet of walkout erbovenop handelt zijn eigen toetsen af.
      if (share || useWalkout.getState().session) return;
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "f" || event.key === "F") setFlipped((f) => !f);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [share, close, go]);

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse") return;
    swipe.current = { x: event.clientX, y: event.clientY, moved: false };
  };
  const onPointerUp = (event: PointerEvent) => {
    const start = swipe.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      start.moved = true;
      go(dx < 0 ? 1 : -1);
    }
  };
  const onCardClick = () => {
    if (swipe.current?.moved) {
      swipe.current = null;
      return;
    }
    swipe.current = null;
    setFlipped((f) => !f);
  };

  const onShowcase = () => {
    const result = toggleShowcase(sourceId, card.id);
    haptic(result === "vol" ? "tap" : "success");
    if (result === "toegevoegd") notify("toast.vitrineToegevoegd", {}, { emoji: "⭐" });
    else if (result === "weg") notify("toast.vitrineWeg", {}, { emoji: "📦" });
    else notify("toast.vitrineVol", {}, { emoji: "🧱", tone: "warning" });
  };

  const askGyro = async () => {
    const request = (DeviceOrientationEvent as unknown as OrientationPermission).requestPermission;
    if (!request) return;
    try {
      setGyroAllowed((await request()) === "granted");
    } catch {
      setGyroAllowed(false);
    }
  };

  const inShowcase = isInShowcase(card);
  const date = formatLongDate(parseISODate(card.grade.date));

  return (
    <div
      ref={container}
      role="dialog"
      aria-modal="true"
      aria-label={`Kaart: ${card.subjectName}`}
      data-mode="dark"
      data-fullscreen
      className="fixed inset-0 z-[45] flex flex-col bg-[#05060d]/85 text-white backdrop-blur-xl"
    >
      <header className="pt-safe flex items-center gap-2 p-3 sm:p-4">
        <span className="font-card text-lg tracking-[0.2em] text-white/55 tabular-nums">
          {index + 1}/{cards.length}
        </span>
        <div className="ml-auto flex gap-1.5">
          {coarse && needsPermission && gyroAllowed === null && (
            <Button
              variant="ghost"
              size="sm"
              icon={Smartphone}
              onClick={() => void askGyro()}
              className="text-white/80"
            >
              Kantelen
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            icon={X}
            aria-label="Sluiten"
            onClick={close}
            className="text-white/80 hover:bg-white/10 hover:text-white"
          />
        </div>
      </header>

      <div
        className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <Button
          variant="glass"
          size="icon"
          icon={ChevronLeft}
          aria-label="Vorige kaart"
          disabled={index === 0}
          onClick={() => go(-1)}
          className="absolute left-4 hidden text-white md:inline-flex"
        />
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.button
            key={card.id}
            type="button"
            aria-label={flipped ? "Draai terug naar de voorkant" : "Draai de kaart om"}
            onClick={onCardClick}
            className="rounded-3xl outline-offset-8"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction * 80, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction * -80, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <HoloCard card={card} width={width} foil={foil} flipped={flipped} gyro={gyro} />
          </motion.button>
        </AnimatePresence>
        <Button
          variant="glass"
          size="icon"
          icon={ChevronRight}
          aria-label="Volgende kaart"
          disabled={index === cards.length - 1}
          onClick={() => go(1)}
          className="absolute right-4 hidden text-white md:inline-flex"
        />
      </div>

      <footer className="pb-safe px-4 pt-2 pb-5 text-center">
        <p className="font-card text-2xl tracking-wider">
          {card.subjectName.toUpperCase()} ·{" "}
          <span className="sensitive">{cardTierLabel(card)}</span>
        </p>
        <p className="mt-0.5 text-sm text-white/60">
          {card.grade.description} · {date}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            variant="glass"
            size="sm"
            icon={RotateCw}
            onClick={() => setFlipped((f) => !f)}
            className="text-white"
          >
            Omdraaien
          </Button>
          <Button
            variant="glass"
            size="sm"
            icon={Clapperboard}
            onClick={() => replay(card)}
            className="text-white"
          >
            Walkout
          </Button>
          <Button
            variant={inShowcase ? "primary" : "glass"}
            size="sm"
            icon={Star}
            aria-pressed={inShowcase}
            onClick={onShowcase}
            className={inShowcase ? undefined : "text-white"}
          >
            {inShowcase ? "In je vitrine" : "Vitrine"}
          </Button>
          <Button
            variant="glass"
            size="sm"
            icon={Share2}
            onClick={() =>
              setShare({
                title: "Deel je kaart",
                filename: `supermagister-${card.subjectCode || "kaart"}-${card.grade.date}.png`,
                render: () => renderShareCard(card),
              })
            }
            className="text-white"
          >
            Delen
          </Button>
        </div>
      </footer>

      <ShareSheet request={share} onClose={() => setShare(null)} />
    </div>
  );
}
