export const BACKGROUNDS = [
  { id: "amber", label: "Amber", className: "bg-[radial-gradient(circle_at_15%_20%,#ffd166,#e85d04_42%,#370617)]" },
  { id: "violet", label: "Violet", className: "bg-[radial-gradient(circle_at_80%_10%,#f72585,#7209b7_45%,#10002b)]" },
  { id: "signal", label: "Signal", className: "bg-[linear-gradient(160deg,#00f5d4_0%,#0466c8_45%,#03045e_100%)]" },
  { id: "night", label: "Night", className: "bg-[radial-gradient(circle_at_50%_120%,#fb5607,#240046_40%,#03071e)]" },
  { id: "film", label: "Film", className: "bg-[linear-gradient(180deg,#edf2f4,#8d99ae_40%,#2b2d42)]" },
  { id: "paper", label: "Paper", className: "bg-[linear-gradient(135deg,#fff3b0,#f4a261_55%,#9c6644)]" },
] as const;

export type BackgroundId = (typeof BACKGROUNDS)[number]["id"];

export function backgroundClass(id: string) {
  return BACKGROUNDS.find((item) => item.id === id)?.className ?? BACKGROUNDS[0].className;
}

export function isBackground(id: string): id is BackgroundId {
  return BACKGROUNDS.some((item) => item.id === id);
}
