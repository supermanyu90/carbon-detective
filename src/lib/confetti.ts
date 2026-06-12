/** A burst of case-file paper. Imperative on purpose — short-lived,
 *  self-removing DOM nodes that never need to round-trip through React. */
export function throwConfetti(): void {
  const colors = ["#B5372A", "#2F6B4F", "#33566E", "#D9C89D", "#F7F2E7"];
  for (let i = 0; i < 46; i++) {
    const p = document.createElement("div");
    p.className = "confetti";
    p.style.left = 4 + Math.random() * 92 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 0.6 + "s";
    p.style.animationDuration = 2.1 + Math.random() * 1.6 + "s";
    p.style.rotate = Math.random() * 360 + "deg";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 4500);
  }
}
