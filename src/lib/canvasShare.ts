/* Browser glue for the shareable case card: render to a canvas, turn it into
   a PNG, and either share it via the Web Share API (files) or download it. */
import type { ShareData } from "../core/share";
import { drawCaseCard, cardFilename, CARD_W, CARD_H } from "../core/shareCard";

export type CardResult = "shared" | "downloaded" | "failed";

/** Render the card to a PNG Blob. Returns null if canvas is unavailable. */
async function renderCard(data: ShareData): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  drawCaseCard(ctx, data);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** Share the case card image. Prefers the native share sheet (with the image
 *  attached); falls back to downloading the PNG. */
export async function shareCaseCard(
  data: ShareData,
  text: string,
): Promise<CardResult> {
  const blob = await renderCard(data);
  if (!blob) return "failed";

  const file = new File([blob], cardFilename(data), { type: "image/png" });

  // Native share with the file attached, where supported.
  const nav = navigator as Navigator & {
    canShare?: (d: { files: File[] }) => boolean;
  };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "The Carbon Detective", text });
      return "shared";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "shared"; // user dismissed
      // otherwise fall through to download
    }
  }

  // Fallback: download the PNG.
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = cardFilename(data);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return "downloaded";
  } catch {
    return "failed";
  }
}
