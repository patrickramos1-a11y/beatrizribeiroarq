import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/briefing/$token/enviado")({
  component: SentPage,
});

function SentPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 px-6 py-6">
        <div className="mx-auto max-w-5xl"><Brand /></div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-32 text-center">
        <span className="eyebrow">Recebido com cuidado</span>
        <h1 className="font-display text-5xl md:text-6xl mt-4 leading-[1.05]">
          Obrigada por<br /><em className="text-accent">compartilhar.</em>
        </h1>
        <div className="rule my-10 max-w-xs mx-auto" />
        <p className="text-muted-foreground leading-relaxed">
          Suas escolhas chegaram até nós. Em breve a Beatriz entrará em contato
          com os próximos passos do seu projeto.
        </p>
        <Link to="/" className="inline-block mt-12 eyebrow text-accent hover:underline">
          ← Voltar ao início
        </Link>
      </main>
    </div>
  );
}
