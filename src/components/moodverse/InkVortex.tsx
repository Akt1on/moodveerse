import { useEffect, useRef } from "react";

const GLYPHS = "АБВЖЗКЛМНОПРСЯЮЁԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎabcdefgΨΩ&«»§¶✒".split("");

type P = { a: number; r: number; z: number; s: number; g: string; v: number };

/** Canvas vortex of floating letters that reacts to microphone loudness when active. */
export const InkVortex = ({ active, size = 260 }: { active: boolean; size?: number }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = size * dpr; c.height = size * dpr; ctx.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue("--primary").trim() || "215 60% 60%";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ps: P[] = Array.from({ length: 90 }, () => ({
      a: Math.random() * Math.PI * 2, r: 30 + Math.random() * (size / 2 - 40),
      z: Math.random(), s: 9 + Math.random() * 12, g: GLYPHS[(Math.random() * GLYPHS.length) | 0],
      v: 0.002 + Math.random() * 0.006,
    }));
    let level = 0, raf = 0, t = 0;
    let analyser: AnalyserNode | null = null, stream: MediaStream | null = null, actx: AudioContext | null = null;
    const buf = new Uint8Array(256);

    const startMic = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        actx = new AudioContext();
        analyser = actx.createAnalyser(); analyser.fftSize = 512;
        actx.createMediaStreamSource(stream).connect(analyser);
      } catch { analyser = null; }
    };
    const stopMic = () => {
      stream?.getTracks().forEach((t) => t.stop()); actx?.close().catch(() => {});
      stream = null; actx = null; analyser = null;
    };
    let wasActive = false;

    const frame = () => {
      t += 1;
      const on = activeRef.current;
      if (on && !wasActive) startMic();
      if (!on && wasActive) stopMic();
      wasActive = on;
      let target = 0;
      if (on) {
        if (analyser) {
          analyser.getByteTimeDomainData(buf);
          let sum = 0; for (const b of buf) { const d = (b - 128) / 128; sum += d * d; }
          target = Math.min(1, Math.sqrt(sum / buf.length) * 6);
        } else target = 0.35 + Math.sin(t / 12) * 0.2;
      }
      level += (target - level) * 0.12;
      const cx = size / 2, cy = size / 2;
      ctx.clearRect(0, 0, size, size);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
      glow.addColorStop(0, `hsl(${primary} / ${0.35 + level * 0.4})`);
      glow.addColorStop(1, `hsl(${primary} / 0)`);
      ctx.fillStyle = glow; ctx.fillRect(0, 0, size, size);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const p of ps) {
        const speed = reduce ? 0 : p.v * (1 + (on ? 2 + level * 10 : 0));
        p.a += speed;
        const pull = on ? 1 - level * 0.45 : 1;
        const r = p.r * pull + Math.sin(t / 40 + p.z * 6) * 4;
        const x = cx + Math.cos(p.a) * r, y = cy + Math.sin(p.a) * r * 0.85;
        const alpha = 0.25 + p.z * 0.6;
        ctx.font = `${p.s * (0.8 + p.z * 0.5)}px Georgia, serif`;
        ctx.shadowColor = `hsl(${primary})`; ctx.shadowBlur = 6 + level * 14;
        ctx.fillStyle = `hsl(${primary} / ${alpha})`;
        ctx.fillText(p.g, x, y);
        if (Math.random() < 0.002) p.g = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `hsl(${primary} / ${0.3 + level * 0.5})`; ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(cx, cy, 34 + k * 10 + level * 18 * (k + 1), t / 50 + k, t / 50 + k + Math.PI * 1.3);
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stopMic(); };
  }, [size]);

  return <canvas ref={ref} style={{ width: size, height: size }} className="absolute inset-0 m-auto pointer-events-none" aria-hidden />;
};
