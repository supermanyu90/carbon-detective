/* =========================================================
   SHARE CARD — drawing the shareable "case file" image
   -----------------------------------------------------------
   The drawing routine is pure: it takes a 2D-context-like object
   and the audit data and issues draw calls. No DOM, so it can be
   unit-tested with a recording stub. The browser glue (canvas +
   blob + Web Share) lives in lib/canvasShare.ts.
   ========================================================= */
import type { ShareData } from "./share";
import { fmt } from "./audit";

/** Open-Graph-friendly 1.91:1 card. */
export const CARD_W = 1200;
export const CARD_H = 630;

const COLORS = {
  manila: "#E9DCBE",
  manilaDeep: "#D9C89D",
  paper: "#F7F2E7",
  ink: "#23201A",
  inkSoft: "#5A5346",
  line: "#C9BD9F",
  stamp: "#B5372A",
  blue: "#33566E",
  green: "#4E704E",
};

const DISPLAY = "'Courier New', monospace";
const BODY = "Georgia, 'Times New Roman', serif";

/** Minimal surface we use — keeps the function testable with a stub. */
export interface DrawCtx {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
}

/** Render the case card. Deterministic given `data` (good for tests). */
export function drawCaseCard(ctx: DrawCtx, data: ShareData): void {
  const scene = data.mode === "home" ? "THE HOME CASE" : "THE CLASSROOM / OFFICE CASE";

  // Folder background + paper panel + border.
  ctx.fillStyle = COLORS.manilaDeep;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(40, 40, CARD_W - 80, CARD_H - 80);
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, CARD_W - 80, CARD_H - 80);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Eyebrow + title.
  ctx.fillStyle = COLORS.stamp;
  ctx.font = `bold 24px ${DISPLAY}`;
  ctx.fillText("CONFIDENTIAL · ENVIRONMENTAL INVESTIGATION UNIT", 80, 110);

  ctx.fillStyle = COLORS.ink;
  ctx.font = `bold 64px ${DISPLAY}`;
  ctx.fillText("THE CARBON DETECTIVE", 80, 175);

  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = `26px ${DISPLAY}`;
  ctx.fillText(scene, 80, 215);

  // Headline figures.
  if (data.nFound > 0) {
    ctx.fillStyle = COLORS.green;
    ctx.font = `bold 92px ${BODY}`;
    ctx.fillText(`₹${fmt(data.cost)}`, 80, 360);
    ctx.fillStyle = COLORS.inkSoft;
    ctx.font = `28px ${BODY}`;
    ctx.fillText("avoidable spend / year", 84, 400);

    ctx.fillStyle = COLORS.stamp;
    ctx.font = `bold 92px ${BODY}`;
    ctx.fillText(`${fmt(data.co2)} kg`, 80, 510);
    ctx.fillStyle = COLORS.inkSoft;
    ctx.font = `28px ${BODY}`;
    ctx.fillText(`CO₂ / year across ${data.nFound} clues`, 84, 550);
  } else {
    ctx.fillStyle = COLORS.green;
    ctx.font = `bold 72px ${BODY}`;
    ctx.fillText("No waste found", 80, 380);
    ctx.fillStyle = COLORS.inkSoft;
    ctx.font = `28px ${BODY}`;
    ctx.fillText("A genuinely tight ship — or one worth a sneakier inspection.", 84, 430);
  }

  // Rotated verdict stamp (top-right).
  ctx.save();
  ctx.translate(CARD_W - 230, 150);
  ctx.rotate(-0.12);
  ctx.strokeStyle = COLORS.stamp;
  ctx.lineWidth = 5;
  ctx.strokeRect(-150, -45, 300, 90);
  ctx.fillStyle = COLORS.stamp;
  ctx.font = `bold 34px ${DISPLAY}`;
  ctx.textAlign = "center";
  ctx.fillText(data.verdict, 0, 12);
  ctx.restore();

  // Footer: rank + call to action.
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.ink;
  ctx.font = `28px ${DISPLAY}`;
  ctx.fillText(data.rank, 80, CARD_H - 70);

  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.blue;
  ctx.font = `bold 26px ${BODY}`;
  ctx.fillText("Run your own audit → The Carbon Detective", CARD_W - 80, CARD_H - 70);
}

/** Suggested filename for the downloaded card. */
export function cardFilename(data: ShareData): string {
  return `carbon-detective-${data.mode}-${fmt(data.co2)}kg.png`;
}
