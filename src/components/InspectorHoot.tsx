import type { AssistantState } from "../hooks/useAssistant";

/** Inspector Hoot — the owl assistant. Bubble lives in an aria-live region;
 *  the owl itself is a mute/unmute toggle. */
export function InspectorHoot({
  state,
  onToggleMute,
}: {
  state: AssistantState;
  onToggleMute: () => void;
}) {
  const cls = `assistant mood-${state.mood}${state.muted ? " muted" : ""}`;
  return (
    <div className={cls}>
      <div
        className={`asst-bubble${state.show ? " show" : ""}`}
        role="status"
        aria-live="polite"
      >
        <span className="asst-caret">{state.text}</span>
      </div>
      <button
        className="asst-char"
        aria-label="Inspector Hoot — tap to mute or unmute the assistant"
        aria-pressed={state.muted}
        onClick={onToggleMute}
      >
        <svg viewBox="0 0 124 132" width="92" height="98" aria-hidden="true">
          {/* body */}
          <ellipse cx="62" cy="88" rx="34" ry="36" fill="#8A6F4D" stroke="#23201A" strokeWidth="2.5" />
          <ellipse cx="62" cy="97" rx="21" ry="23" fill="#E9DCBE" stroke="#23201A" strokeWidth="2" />
          <path d="M52 90 q4 4 8 0 M62 90 q4 4 8 0 M55 100 q4 4 8 0" fill="none" stroke="#C9BD9F" strokeWidth="2" strokeLinecap="round" />
          {/* feet */}
          <path d="M50 122 l-4 6 M54 122 l0 7 M58 122 l4 6" stroke="#23201A" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M70 122 l-4 6 M74 122 l0 7 M78 122 l4 6" stroke="#23201A" strokeWidth="2.5" strokeLinecap="round" />
          {/* head */}
          <circle cx="62" cy="46" r="30" fill="#8A6F4D" stroke="#23201A" strokeWidth="2.5" />
          {/* eyes */}
          <g>
            <circle cx="49" cy="47" r="10.5" fill="#fff" stroke="#23201A" strokeWidth="2" />
            <circle cx="50.5" cy="48" r="4.6" fill="#23201A" />
            <circle cx="52" cy="46.4" r="1.5" fill="#fff" />
            <rect className="eyelid" x="38.5" y="36.5" width="21" height="21" rx="10.5" fill="#8A6F4D" />
          </g>
          <g>
            <circle cx="75" cy="47" r="10.5" fill="#fff" stroke="#23201A" strokeWidth="2" />
            <circle cx="76.5" cy="48" r="4.6" fill="#23201A" />
            <circle cx="78" cy="46.4" r="1.5" fill="#fff" />
            <rect className="eyelid" x="64.5" y="36.5" width="21" height="21" rx="10.5" fill="#8A6F4D" />
          </g>
          {/* brows */}
          <path className="brow" d="M41 33 q8 -5 16 -1" fill="none" stroke="#23201A" strokeWidth="2.5" strokeLinecap="round" />
          <path className="brow" d="M67 32 q8 -4 16 2" fill="none" stroke="#23201A" strokeWidth="2.5" strokeLinecap="round" />
          {/* beak */}
          <path d="M62 54 l-5.5 6 q5.5 4.5 11 0 z" fill="#C98A2D" stroke="#23201A" strokeWidth="2" strokeLinejoin="round" />
          {/* deerstalker hat */}
          <path d="M32 30 Q62 -2 92 30 L92 34 Q62 22 32 34 Z" fill="#6B4F33" stroke="#23201A" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M27 33 Q62 19 97 33 L94 39 Q62 28 30 39 Z" fill="#7d5e3e" stroke="#23201A" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M56 12 q6 -5 12 0 l-2 6 q-4 -3 -8 0 z" fill="#6B4F33" stroke="#23201A" strokeWidth="2" />
          {/* wing + magnifier */}
          <ellipse cx="90" cy="86" rx="9" ry="15" fill="#6B4F33" stroke="#23201A" strokeWidth="2.5" transform="rotate(-18 90 86)" />
          <g className="magnify">
            <circle cx="100" cy="68" r="12" fill="#cfe6ea" fillOpacity=".75" stroke="#23201A" strokeWidth="3" />
            <circle cx="96" cy="64" r="3.5" fill="#fff" fillOpacity=".85" />
            <line x1="106" y1="78" x2="113" y2="88" stroke="#23201A" strokeWidth="5" strokeLinecap="round" />
          </g>
        </svg>
      </button>
    </div>
  );
}
