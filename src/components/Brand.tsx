import { Link } from "@tanstack/react-router";

export function Brand({ to = "/", subtle = false }: { to?: string; subtle?: boolean }) {
  return (
    <Link to={to} className="inline-flex flex-col leading-none group">
      <span
        className="font-display text-[1.35rem] tracking-tight text-foreground group-hover:text-accent transition-colors"
        style={{ fontStyle: "italic", fontWeight: 500 }}
      >
        Beatriz Ribeiro
      </span>
      {!subtle && (
        <span className="eyebrow mt-1.5">Arquitetura · Interiores</span>
      )}
    </Link>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <Brand />
          <span className="eyebrow hidden sm:inline">Painel de Briefing Visual</span>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border/60 mt-24">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center">
          <span className="eyebrow">
            Beatriz Ribeiro Arquitetura e Interiores · {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
