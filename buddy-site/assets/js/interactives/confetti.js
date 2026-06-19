// Tiny canvas confetti, no dependencies. Respects the animations toggle.
const COLORS = ["#000A4D", "#5AD3FF", "#66003C", "#F6B696"];

export function animationsEnabled() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem("buddy.anim") !== "off";
}

export function burst() {
  if (!animationsEnabled()) return;
  let canvas = document.getElementById("confetti");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "confetti";
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext("2d");
  canvas.width = innerWidth; canvas.height = innerHeight;
  const pieces = Array.from({ length: 120 }, (_, i) => ({
    x: innerWidth / 2, y: innerHeight / 3,
    vx: (i % 7 - 3) * (1 + (i % 5)), vy: -(4 + (i % 9)),
    color: COLORS[i % COLORS.length], size: 5 + (i % 4), rot: i,
  }));
  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.rot += 0.2;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    }
    if (++frames < 120) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}
