import { useRef, useState, type Dispatch, type SetStateAction } from "react";

export type Mood = "normal" | "excited";

export interface AssistantState {
  text: string;
  mood: Mood;
  show: boolean;
  muted: boolean;
}

export interface AssistantApi {
  state: AssistantState;
  say: (msg: string, mood?: Mood, priority?: boolean) => void;
  toggleMute: () => void;
}

type SetState = Dispatch<SetStateAction<AssistantState>>;

/** Imperative typewriter queue for Inspector Hoot. A single controller is
 *  created per mount so `say`/`toggleMute` keep a stable identity. */
function createController(setState: SetState, reduceRef: { current: boolean }) {
  const queue: { msg: string; mood: Mood }[] = [];
  let busy = false;
  let lastMsg = "";
  let muted = false;
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
    setState((s) => ({ ...s, show: false }));
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
    setState((s) => ({
      ...s,
      mood: item.mood,
      show: true,
      text: reduceRef.current ? item.msg : "",
    }));

    if (reduceRef.current) {
      after(done, 3800);
      return;
    }
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setState((s) => ({ ...s, text: item.msg.slice(0, i) }));
      if (i >= item.msg.length) {
        clearInterval(iv);
        after(done, 2400 + item.msg.length * 14);
      }
    }, 16);
    intervals.push(iv);
  }

  const say = (msg: string, mood: Mood = "normal", priority = false) => {
    if (muted || msg === lastMsg) return;
    if (priority) queue.length = 0;
    if (queue.length >= 2) queue.shift();
    queue.push({ msg, mood });
    if (!busy) next();
  };

  const toggleMute = () => {
    muted = !muted;
    clearAll();
    queue.length = 0;
    busy = false;
    setState((s) => ({ ...s, muted, show: false }));
    if (!muted) {
      lastMsg = "";
      say("Back on duty. Carry on, detective.", "excited", true);
    }
  };

  return { say, toggleMute, dispose: clearAll };
}

export function useAssistant(reduceMotion: boolean): AssistantApi {
  const [state, setState] = useState<AssistantState>({
    text: "",
    mood: "normal",
    show: false,
    muted: false,
  });
  const reduceRef = useRef(reduceMotion);
  reduceRef.current = reduceMotion;

  const ctrl = useRef<ReturnType<typeof createController>>();
  if (!ctrl.current) ctrl.current = createController(setState, reduceRef);

  return { state, say: ctrl.current.say, toggleMute: ctrl.current.toggleMute };
}
