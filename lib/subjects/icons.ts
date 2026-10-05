/**
 * Namen van de iconen die een vak kan hebben. De React-kant
 * (components/subjects/SubjectIcon) koppelt deze namen aan lucide-iconen;
 * zo blijft lib/ vrij van React en blijft de bundel klein.
 */
export const SUBJECT_ICON_NAMES = [
  "BookOpen",
  "BookText",
  "MessagesSquare",
  "Languages",
  "Croissant",
  "Castle",
  "Guitar",
  "Scroll",
  "Amphora",
  "Sigma",
  "Pi",
  "Calculator",
  "Atom",
  "FlaskConical",
  "Leaf",
  "Microscope",
  "Telescope",
  "CodeXml",
  "Wrench",
  "Lightbulb",
  "Globe",
  "Landmark",
  "TrendingUp",
  "BriefcaseBusiness",
  "Users",
  "Scale",
  "Brain",
  "HeartHandshake",
  "Theater",
  "Palette",
  "Brush",
  "Music",
  "Drama",
  "Camera",
  "Dumbbell",
  "Bike",
  "Compass",
  "NotebookPen",
  "Footprints",
  "Rocket",
  "Puzzle",
  "Star",
] as const;

export type SubjectIconName = (typeof SUBJECT_ICON_NAMES)[number];

export function isSubjectIconName(value: string): value is SubjectIconName {
  return (SUBJECT_ICON_NAMES as readonly string[]).includes(value);
}
