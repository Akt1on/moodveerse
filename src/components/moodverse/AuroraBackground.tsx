export const AuroraBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none aurora-bg">
    <div className="absolute inset-0 bg-gradient-sky" />
    <div className="aurora-blob absolute top-[-10%] left-[20%] w-[60vw] h-[60vw] rounded-full blur-3xl opacity-40 animate-float-slow"
      style={{ background: "radial-gradient(circle, hsl(220 60% 75% / 0.4), transparent 60%)" }} />
    <div className="aurora-blob absolute bottom-[-20%] right-[10%] w-[50vw] h-[50vw] rounded-full blur-3xl opacity-30 animate-float-slow"
      style={{ background: "radial-gradient(circle, hsl(200 50% 70% / 0.4), transparent 60%)", animationDelay: "2s" }} />
    <div className="aurora-blob absolute top-[30%] right-[30%] w-[30vw] h-[30vw] rounded-full blur-3xl opacity-20 animate-shimmer"
      style={{ background: "radial-gradient(circle, hsl(215 60% 80% / 0.3), transparent 60%)" }} />
  </div>
);
