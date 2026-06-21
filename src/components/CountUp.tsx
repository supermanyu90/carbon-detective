import { useEffect, useState } from "react";
import { fmt } from "../lib/format";

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  reduceMotion: boolean;
}

/** Animated count-up for report stats (easeOutCubic), honouring reduced motion. */
export function CountUp({ value, prefix = "", suffix = "", reduceMotion }: Props) {
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const dur = 950;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduceMotion]);

  return (
    <>
      {prefix}
      {fmt(display)}
      {suffix}
    </>
  );
}
