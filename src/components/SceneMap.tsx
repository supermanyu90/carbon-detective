import type { Mode } from "../core/clues";

export interface Room {
  zone: string;
  ico: string;
  total: number;
  done: number;
  found: number;
}

/** An illustrated cutaway of the scene. Each room is a clickable hotspot that
 *  opens and scrolls to its zone; rooms show live status (cleared / evidence)
 *  and dim under the flashlight until pointed at. */
export function SceneMap({
  mode,
  rooms,
  flashlight,
  onPick,
}: {
  mode: Mode;
  rooms: Room[];
  flashlight: boolean;
  onPick: (index: number) => void;
}) {
  return (
    <div className={"scene" + (flashlight ? " flashlight" : "")}>
      <div className="scene-roof" aria-hidden="true" />
      <p className="scene-label">
        🏠 The scene — {mode === "home" ? "your home" : "the building"}. Tap a room to investigate
        it.
      </p>
      <div className="scene-rooms">
        {rooms.map((r, i) => {
          const cleared = r.total > 0 && r.done === r.total;
          return (
            <button
              key={r.zone}
              type="button"
              className={"room" + (cleared ? " cleared" : "") + (r.found > 0 ? " hot" : "")}
              onClick={() => onPick(i)}
              aria-label={
                `${r.zone}: ${r.done} of ${r.total} clues examined` +
                (r.found > 0 ? `, ${r.found} piece${r.found === 1 ? "" : "s"} of evidence found` : "") +
                (cleared ? " (cleared)" : "")
              }
            >
              <span className="room-ico" aria-hidden="true">
                {r.ico}
              </span>
              <span className="room-name">{r.zone}</span>
              <span className="room-status">
                {cleared ? "Cleared ✓" : `${r.done}/${r.total} examined`}
              </span>
              {r.found > 0 && (
                <span className="room-evidence" aria-hidden="true">
                  🔴 {r.found}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
