import { useState } from "react";
import type { Mode } from "../core/clues";
import { buildShareText, shareTargets, type ShareData } from "../core/share";
import { shareCaseCard } from "../lib/canvasShare";

interface Props {
  mode: Mode;
  co2: number;
  cost: number;
  verdict: string;
  rank: string;
  nFound: number;
  nClues: number;
}

/** Share the audit result. Uses the Web Share API where available
 *  (mobile), and always offers explicit network buttons + copy-to-
 *  clipboard so every platform has a working path. No PII is shared. */
export function ShareBar(props: Props) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [imageStatus, setImageStatus] = useState<"" | "working" | "downloaded">("");

  const data: ShareData = props;
  const text = buildShareText(data);
  // The app's own URL, stripped of any query/hash, as the share link.
  const url =
    typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const targets = shareTargets(text, url);

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const nativeShare = async () => {
    setShareError(false);
    try {
      await navigator.share({ title: "The Carbon Detective", text, url });
    } catch (e) {
      // AbortError = user dismissed the sheet; not an error worth showing.
      if ((e as Error)?.name !== "AbortError") setShareError(true);
    }
  };

  const copy = async () => {
    const payload = `${text} ${url}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setShareError(true);
    }
  };

  const shareImage = async () => {
    setShareError(false);
    setImageStatus("working");
    const result = await shareCaseCard(data, text);
    setImageStatus(result === "downloaded" ? "downloaded" : "");
    if (result === "failed") setShareError(true);
  };

  const open = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="share-bar no-print" aria-labelledby="share-h">
      <h3 id="share-h" className="disp" style={{ fontSize: "1.05rem", margin: "0 0 8px" }}>
        📣 Share the verdict
      </h3>
      <p className="hint" style={{ marginTop: 0 }}>
        Nudge a friend, your class or your building to run their own audit. Only the headline
        numbers are shared — never your name or case file.
      </p>

      <div className="share-actions">
        {canNativeShare && (
          <button className="btn" onClick={nativeShare}>
            📲 Share…
          </button>
        )}
        <a className="btn secondary" href={targets.x} onClick={open(targets.x)}>
          𝕏 / Twitter
        </a>
        <a className="btn secondary" href={targets.whatsapp} onClick={open(targets.whatsapp)}>
          💬 WhatsApp
        </a>
        <a className="btn secondary" href={targets.linkedin} onClick={open(targets.linkedin)}>
          in LinkedIn
        </a>
        <button className="btn secondary" onClick={copy}>
          {copied ? "✓ Link copied" : "🔗 Copy link"}
        </button>
        <button
          className="btn secondary"
          onClick={shareImage}
          disabled={imageStatus === "working"}
        >
          {imageStatus === "working" ? "Generating…" : "🖼️ Share image card"}
        </button>
      </div>

      <p className="hint share-status" role="status" aria-live="polite">
        {copied ? "Share text and link copied to your clipboard." : ""}
        {imageStatus === "downloaded" ? "Case-card image saved to your downloads." : ""}
        {shareError
          ? "Couldn’t share automatically — copy the link and paste it anywhere."
          : ""}
      </p>
    </section>
  );
}

export type { Mode };
