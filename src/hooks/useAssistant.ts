import { useRef, useSyncExternalStore } from "react";

export type Mood = "normal" | "excited";

export interface AssistantState {
  text: string;
  mood: Mood;
  show: boolean;
  muted: boolean;
}

export interface AssistantStore {
  say: (msg: string, mood?: Mood, priority?: boolean) => void;
  toggleMute: () => void;
  subscribe: (cb: () => void) => () => void;
  getState: () => AssistantState;
  dispose: () => void;
}

/** Inspector Hoot as an external store. The typewriter updates state ~60×/s;
 *  keeping it out of React's component state means only the subscribed owl
 *  re-renders on each tick — not the whole app (which made step transitions
 *  janky, since the assistant speaks on every navigation). */
export function createAssistantStore(getReduce: () => boolean): AssistantStore {
  let state: AssistantState = { text: "", mood: "normal", show: false, muted: false };
  const subs = new Set<() => void>();
  const emit = () => subs.forEach((s) => s());
  const set = (patch: Partial<AssistantState>) => {
    state = { ...state, ...patch };
    emit();
  };

  const queue: { msg: string; mood: Mood }[] = [];
  let busy = false;
  let lastMsg = "";
  const timers: ReturnType<typeof setTimeout>[] = [];
  const intervals: ReturnType<typeof setInterval>[] = [];

  const after = (fn: () => void, ms: number) => {
    timers.push(setTimeout(fn, ms));
  };
  const clearAll = () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    intervals.forEach(clearInterval);
    intervals.length = 0;
  };

  const done = () => {
    set({ show: false });
    after(next, 350);
  };

  function next() {
    const item = queue.shift();
    if (!item) {
      busy = false;
      return;
    }
    busy = true;
    lastMsg = item.msg;
    set({ mood: item.mood, show: true, text: getReduce() ? item.msg : "" });

    if (getReduce()) {
      after(done, 3800);
      return;
    }
    let i = 0;
    const iv = setInterval(() => {
      i++;
      set({ text: item.msg.slice(0, i) });
      if (i >= item.msg.length) {
        clearInterval(iv);
        after(done, 2400 + item.msg.length * 14);
      }
    }, 16);
    intervals.push(iv);
  }

  const say = (msg: string, mood: Mood = "normal", priority = false) => {
    if (state.muted || msg === lastMsg) return;
    if (priority) queue.length = 0;
    if (queue.length >= 2) queue.shift();
    queue.push({ msg, mood });
    if (!busy) next();
  };

  const toggleMute = () => {
    const muted = !state.muted;
    clearAll();
    queue.length = 0;
    busy = false;
    set({ muted, show: false });
    if (!muted) {
      lastMsg = "";
      say("Back on duty. Carry on, detective.", "excited", true);
    }
  };

  return {
    say,
    toggleMute,
    subscribe(cb) {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    getState: () => state,
    dispose: clearAll,
  };
}

/** Create the store once per mount. `say`/`toggleMute` keep a stable identity. */
export function useAssistantStore(reduceMotion: boolean): AssistantStore {
  const reduceRef = useRef(reduceMotion);
  reduceRef.current = reduceMotion;
  const ref = useRef<AssistantStore>();
  if (!ref.current) ref.current = createAssistantStore(() => reduceRef.current);
  return ref.current;
}

/** Subscribe to the assistant state — call this only inside the owl component. */
export function useAssistantState(store: AssistantStore): AssistantState {
  return useSyncExternalStore(store.subscribe, store.getState);
}
