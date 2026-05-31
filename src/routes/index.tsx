import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listBriefings, resetPlatform, createBriefing } from "@/lib/briefing-queries";
import { PageShell } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, ArrowUpRight, FileText, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel · Beatriz Ribeiro Arquitetura" },
      { name: "description", content: "Gerenciamento de briefings visuais." },
    ],
  }),
  component: AdminDashboard,
});

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  in_progress: "Em preenchimento",
  completed: "Concluído",
  archived: "Arquivado",
};

function AdminDashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: briefings = [], isLoading } = useQuery({
    queryKey: ["briefings"],
    queryFn: listBriefings,
  });

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/briefing/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado", { description: url });
  };

  const newBriefing = async () => {
    try {
      const b = await createBriefing({
        client_name: "Novo cliente",
        project_type: "Projeto residencial",
        title: "Briefing visual",
        intro: "Bem-vindo(a) a uma jornada visual para descobrirmos juntos a alma do seu projeto.",
      });
      await qc.invalidateQueries({ queryKey: ["briefings"] });
      navigate({ to: "/editor/$id", params: { id: b.id } });
    } catch (e: any) {
      toast.error("Erro", { description: e.message });
    }
  };

  const doReset = async () => {
    try {
      await resetPlatform();
      await qc.invalidateQueries({ queryKey: ["briefings"] });
      toast.success("Plataforma resetada", {
        description: "Todas as respostas e relatórios foram apagados.",
      });
    } catch (e: any) {
      toast.error("Erro ao resetar", { description: e.message });
    }
  };

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <div className="flex items-end justify-between gap-8 flex-wrap">
          <div className="max-w-2xl">
            <span className="eyebrow">Painel interno</span>
            <h1 className="font-display text-5xl md:text-6xl mt-3 leading-[1.05]">
              Briefings visuais<br/>
              <em className="text-accent">em andamento.</em>
            </h1>
            <p className="mt-5 text-muted-foreground max-w-lg leading-relaxed">
              Compartilhe um link único com cada cliente. Acompanhe respostas, gere
              relatórios interpretativos e exporte em PDF com a identidade da casa.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="lg" className="gap-2">
                <RotateCcw className="w-4 h-4" /> Resetar plataforma
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-2xl">Resetar plataforma?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apaga todas as <strong>respostas</strong> e <strong>relatórios</strong> dos
                  briefings, devolvendo-os ao estado original (perguntas e imagens permanecem).
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={doReset}>Sim, resetar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <div className="rule mx-auto max-w-6xl" />

      <section className="mx-auto max-w-6xl px-6 py-12">
        {isLoading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : (
          <div className="grid gap-px bg-border/60 border border-border/60 rounded-sm overflow-hidden">
            {briefings.map((b) => (
              <article key={b.id} className="bg-card p-7 grid grid-cols-12 gap-6 items-center hover:bg-muted/40 transition-colors">
                <div className="col-span-12 md:col-span-5">
                  <span className="eyebrow">{statusLabel[b.status] ?? b.status}</span>
                  <h2 className="font-display text-2xl mt-1.5 leading-tight">{b.client_name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{b.project_type}</p>
                </div>

                <div className="col-span-12 md:col-span-4">
                  <span className="eyebrow">Link do cliente</span>
                  <div className="mt-1.5 flex items-center gap-2 text-sm font-mono text-muted-foreground truncate">
                    /briefing/{b.public_token}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-3 flex flex-wrap gap-2 md:justify-end">
                  <Button size="sm" variant="ghost" onClick={() => copyLink(b.public_token)} className="gap-1.5">
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </Button>
                  <Link to="/briefing/$token" params={{ token: b.public_token }}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      Abrir <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Link to="/admin/$id" params={{ id: b.id }}>
                    <Button size="sm" className="gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Relatório
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
